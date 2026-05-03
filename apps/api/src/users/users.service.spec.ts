import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_USER = {
  id: 'user-uuid',
  email: 'user@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  avatar: null,
  role: Role.APPRENANT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all users without sensitive fields', async () => {
      prisma.user.findMany.mockResolvedValue([MOCK_USER]);

      const result = await service.findAll();

      expect(result).toEqual([MOCK_USER]);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: expect.any(Object) }),
      );
    });

    it('returns an empty array when there are no users', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── updateRole ────────────────────────────────────────────────────────────

  describe('updateRole', () => {
    it('updates and returns the user with the new role', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      prisma.user.update.mockResolvedValue({ ...MOCK_USER, role: Role.FORMATEUR });

      const result = await service.updateRole('user-uuid', Role.FORMATEUR);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid' },
          data: { role: Role.FORMATEUR },
        }),
      );
      expect(result).toHaveProperty('role', Role.FORMATEUR);
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateRole('unknown-uuid', Role.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('can promote a user to ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      prisma.user.update.mockResolvedValue({ ...MOCK_USER, role: Role.ADMIN });

      const result = await service.updateRole('user-uuid', Role.ADMIN);

      expect(result).toHaveProperty('role', Role.ADMIN);
    });
  });
});
