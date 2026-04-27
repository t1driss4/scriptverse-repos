import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtPayload, JwtRefreshPayload } from './types/jwt-payload.type';

const MOCK_TOKENS = { accessToken: 'at', refreshToken: 'rt' };

const MOCK_PROFILE = {
  id: 'user-uuid',
  email: 'user@example.com',
  role: Role.APPRENANT,
  firstName: null,
  lastName: null,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    authService = {
      signup: jest.fn().mockResolvedValue(MOCK_TOKENS),
      login: jest.fn().mockResolvedValue(MOCK_TOKENS),
      refresh: jest.fn().mockResolvedValue(MOCK_TOKENS),
      logout: jest.fn().mockResolvedValue(undefined),
      getMe: jest.fn().mockResolvedValue(MOCK_PROFILE),
      resetPassword: jest.fn().mockResolvedValue({
        message: 'If that email is registered you will receive a reset link shortly.',
      }),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── signup ────────────────────────────────────────────────────────────────

  describe('signup', () => {
    it('delegates to authService.signup and returns tokens', async () => {
      const dto = { email: 'new@example.com', password: 'password123' };
      const result = await controller.signup(dto);
      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(MOCK_TOKENS);
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('delegates to authService.login and returns tokens', async () => {
      const dto = { email: 'user@example.com', password: 'password123' };
      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(MOCK_TOKENS);
    });
  });

  // ─── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('calls authService.refresh with userId and raw refresh token from the JWT payload', async () => {
      const user: JwtRefreshPayload = {
        sub: 'user-uuid',
        email: 'user@example.com',
        role: Role.APPRENANT,
        refreshToken: 'old-refresh-token',
      };
      const result = await controller.refresh(user);
      expect(authService.refresh).toHaveBeenCalledWith('user-uuid', 'old-refresh-token');
      expect(result).toEqual(MOCK_TOKENS);
    });

    it('returns a new access token and refresh token pair', async () => {
      const user: JwtRefreshPayload = {
        sub: 'user-uuid',
        email: 'user@example.com',
        role: Role.APPRENANT,
        refreshToken: 'rt',
      };
      const result = await controller.refresh(user);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('calls authService.logout with the authenticated user id', async () => {
      const user: JwtPayload = { sub: 'user-uuid', email: 'user@example.com', role: Role.APPRENANT };
      await controller.logout(user);
      expect(authService.logout).toHaveBeenCalledWith('user-uuid');
    });
  });

  // ─── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('calls authService.getMe with the authenticated user id', async () => {
      const user: JwtPayload = { sub: 'user-uuid', email: 'user@example.com', role: Role.APPRENANT };
      const result = await controller.getMe(user);
      expect(authService.getMe).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(MOCK_PROFILE);
    });

    it('does not return passwordHash or refreshHash fields', async () => {
      const user: JwtPayload = { sub: 'user-uuid', email: 'user@example.com', role: Role.APPRENANT };
      const result = await controller.getMe(user);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshHash');
    });
  });

  // ─── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('delegates to authService.resetPassword and returns acknowledgement', async () => {
      const dto = { email: 'user@example.com' };
      const result = await controller.resetPassword(dto);
      expect(authService.resetPassword).toHaveBeenCalledWith('user@example.com');
      expect(result).toHaveProperty('message');
    });
  });
});
