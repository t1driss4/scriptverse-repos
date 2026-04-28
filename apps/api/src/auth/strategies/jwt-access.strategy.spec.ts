import { Role } from '@prisma/client';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { JwtPayload } from '../types/jwt-payload.type';

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  });

  beforeEach(() => {
    strategy = new JwtAccessStrategy();
  });

  describe('constructor', () => {
    it('throws when JWT_ACCESS_SECRET is not set', () => {
      const original = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;
      expect(() => new JwtAccessStrategy()).toThrow('JWT_ACCESS_SECRET is not set');
      process.env.JWT_ACCESS_SECRET = original;
    });
  });

  describe('validate', () => {
    it('returns the JWT payload unchanged', () => {
      const payload: JwtPayload = {
        sub: 'user-uuid',
        email: 'user@example.com',
        role: Role.APPRENANT,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual(payload);
    });

    it('preserves all payload fields including role', () => {
      const payload: JwtPayload = {
        sub: 'admin-uuid',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      const result = strategy.validate(payload);

      expect(result.sub).toBe('admin-uuid');
      expect(result.email).toBe('admin@example.com');
      expect(result.role).toBe(Role.ADMIN);
    });

    it('works for each role value', () => {
      for (const role of [Role.APPRENANT, Role.FORMATEUR, Role.ADMIN]) {
        const payload: JwtPayload = { sub: 'id', email: 'e@x.com', role };
        expect(strategy.validate(payload)).toEqual({ sub: 'id', email: 'e@x.com', role });
      }
    });
  });
});
