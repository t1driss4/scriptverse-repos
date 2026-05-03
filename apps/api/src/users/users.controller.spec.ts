import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue([MOCK_USER]),
      updateRole: jest.fn().mockResolvedValue({ ...MOCK_USER, role: Role.FORMATEUR }),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delegates to usersService.findAll and returns user list', async () => {
      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([MOCK_USER]);
    });
  });

  // ─── updateRole ────────────────────────────────────────────────────────────

  describe('updateRole', () => {
    it('delegates to usersService.updateRole with id and role', async () => {
      const result = await controller.updateRole('user-uuid', { role: Role.FORMATEUR });

      expect(usersService.updateRole).toHaveBeenCalledWith('user-uuid', Role.FORMATEUR);
      expect(result).toHaveProperty('role', Role.FORMATEUR);
    });

    it('propagates NotFoundException when user does not exist', async () => {
      usersService.updateRole.mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        controller.updateRole('unknown-uuid', { role: Role.FORMATEUR }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
