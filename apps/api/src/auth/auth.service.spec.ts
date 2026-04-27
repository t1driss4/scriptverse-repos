import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

const MOCK_USER = {
  id: 'user-uuid',
  email: 'user@example.com',
  passwordHash: 'hashed-password',
  role: Role.APPRENANT,
  refreshHash: 'hashed-refresh',
  firstName: null,
  lastName: null,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: Record<string, jest.Mock> };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('mock-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── signup ────────────────────────────────────────────────────────────────

  describe('signup', () => {
    it('creates user and returns access + refresh tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(MOCK_USER);
      prisma.user.update.mockResolvedValue(MOCK_USER);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.signup({ email: 'user@example.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);

      await expect(
        service.signup({ email: 'user@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('stores a bcrypt hash of the refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(MOCK_USER);
      prisma.user.update.mockResolvedValue(MOCK_USER);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await service.signup({ email: 'user@example.com', password: 'password123' });

      // hash is called twice: once for the password, once for the refresh token
      expect(bcrypt.hash).toHaveBeenCalledTimes(2);
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      prisma.user.update.mockResolvedValue(MOCK_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'user@example.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('rotates tokens when refresh token matches', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      prisma.user.update.mockResolvedValue(MOCK_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.refresh('user-uuid', 'valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { refreshHash: 'new-hash' } }),
      );
    });

    it('throws ForbiddenException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('unknown', 'token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when refreshHash is null (logged out)', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...MOCK_USER, refreshHash: null });

      await expect(service.refresh('user-uuid', 'token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when token does not match hash', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('user-uuid', 'wrong-token')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('sets refreshHash to null', async () => {
      prisma.user.update.mockResolvedValue(MOCK_USER);

      await service.logout('user-uuid');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { refreshHash: null },
      });
    });
  });

  // ─── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns user profile without passwordHash or refreshHash', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);

      const result = await service.getMe('user-uuid');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshHash');
      expect(result).toHaveProperty('email', MOCK_USER.email);
      expect(result).toHaveProperty('role', MOCK_USER.role);
    });

    it('throws UnauthorizedException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('unknown')).rejects.toThrow(UnauthorizedException);
    });
  });
});
