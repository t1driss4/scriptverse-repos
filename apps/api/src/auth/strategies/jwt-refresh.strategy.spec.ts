import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtPayload } from '../types/jwt-payload.type';

function mockRequest(authHeader: string): Request {
  return {
    get: (header: string) => (header === 'Authorization' ? authHeader : undefined),
  } as unknown as Request;
}

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeAll(() => {
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  beforeEach(() => {
    strategy = new JwtRefreshStrategy();
  });

  describe('constructor', () => {
    it('throws when JWT_REFRESH_SECRET is not set', () => {
      const original = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => new JwtRefreshStrategy()).toThrow('JWT_REFRESH_SECRET is not set');
      process.env.JWT_REFRESH_SECRET = original;
    });
  });

  const BASE_PAYLOAD: JwtPayload = {
    sub: 'user-uuid',
    email: 'user@example.com',
    role: Role.APPRENANT,
  };

  describe('validate', () => {
    it('extracts the raw refresh token from the Authorization header', () => {
      const req = mockRequest('Bearer my-raw-refresh-token');
      const result = strategy.validate(req, BASE_PAYLOAD);
      expect(result.refreshToken).toBe('my-raw-refresh-token');
    });

    it('appends refreshToken to the JWT payload', () => {
      const req = mockRequest('Bearer rt-value');
      const result = strategy.validate(req, BASE_PAYLOAD);
      expect(result).toMatchObject({ ...BASE_PAYLOAD, refreshToken: 'rt-value' });
    });

    it('handles a Bearer prefix with mixed casing', () => {
      const req = mockRequest('BEARER some-token');
      const result = strategy.validate(req, BASE_PAYLOAD);
      expect(result.refreshToken).toBe('some-token');
    });

    it('throws UnauthorizedException when Authorization header is absent', () => {
      const req = mockRequest('');
      expect(() => strategy.validate(req, BASE_PAYLOAD)).toThrow('Refresh token missing');
    });

    it('preserves all original payload fields', () => {
      const req = mockRequest('Bearer rt');
      const result = strategy.validate(req, BASE_PAYLOAD);
      expect(result.sub).toBe(BASE_PAYLOAD.sub);
      expect(result.email).toBe(BASE_PAYLOAD.email);
      expect(result.role).toBe(BASE_PAYLOAD.role);
    });
  });
});
