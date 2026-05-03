import { Test, TestingModule } from '@nestjs/testing';
import { Level, Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

const COURSE_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = 'user-uuid-1';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findMine: jest.Mock;
    findOne: jest.Mock;
    findContent: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findMine: jest.fn(),
      findOne: jest.fn(),
      findContent: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: service }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  describe('findOne', () => {
    it('delegates to coursesService.findOne with course id', () => {
      const expected = { id: COURSE_ID, title: 'Test' };
      service.findOne.mockReturnValue(expected);

      const result = controller.findOne(COURSE_ID);

      expect(service.findOne).toHaveBeenCalledWith(COURSE_ID);
      expect(result).toBe(expected);
    });

    it('is marked @Public() — accessible without authentication', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.findOne);
      expect(isPublic).toBe(true);
    });
  });

  describe('findContent', () => {
    it('delegates to coursesService.findContent with courseId and userId', () => {
      const expected = { id: COURSE_ID, modules: [] };
      service.findContent.mockReturnValue(expected);

      const result = controller.findContent(COURSE_ID, USER_ID);

      expect(service.findContent).toHaveBeenCalledWith(COURSE_ID, USER_ID);
      expect(result).toBe(expected);
    });

    it('is NOT marked @Public() — requires JWT authentication', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.findContent);
      expect(isPublic).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('delegates to coursesService.findAll with query params', () => {
      const query = { search: 'react', level: Level.DEBUTANT, page: 1, limit: 10 };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.findAll.mockReturnValue(expected);

      const result = controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it('delegates to coursesService.findAll with empty query', () => {
      const expected = { data: [{ id: COURSE_ID }], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } };
      service.findAll.mockReturnValue(expected);

      const result = controller.findAll({} as any);

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toBe(expected);
    });

    it('is marked @Public() — accessible without authentication', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.findAll);
      expect(isPublic).toBe(true);
    });

    it('passes level=INTERMEDIAIRE filter through to service', () => {
      const query = { level: Level.INTERMEDIAIRE };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes level=AVANCE filter through to service', () => {
      const query = { level: Level.AVANCE };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes category filter through to service', () => {
      const query = { category: 'programming' };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes sortBy=price sortOrder=desc through to service', () => {
      const query = { sortBy: 'price' as const, sortOrder: 'desc' as const };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes sortBy=createdAt sortOrder=asc through to service', () => {
      const query = { sortBy: 'createdAt' as const, sortOrder: 'asc' as const };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes pagination params through to service', () => {
      const query = { page: 2, limit: 5 };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes combined search and filter params through to service', () => {
      const query = { search: 'typescript', level: Level.INTERMEDIAIRE, category: 'web', sortBy: 'price' as const, sortOrder: 'desc' as const, page: 1, limit: 5 };
      service.findAll.mockReturnValue({ data: [], meta: {} });

      controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('returns the value from coursesService.findAll', () => {
      const expected = { data: [{ id: COURSE_ID, title: 'NestJS' }], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } };
      service.findAll.mockReturnValue(expected);

      const result = controller.findAll({ search: 'NestJS' } as any);

      expect(result).toBe(expected);
    });
  });

  describe('findMine', () => {
    it('delegates to coursesService.findMine with userId', () => {
      const expected = [{ id: COURSE_ID }];
      service.findMine.mockReturnValue(expected);

      const result = controller.findMine(USER_ID);

      expect(service.findMine).toHaveBeenCalledWith(USER_ID);
      expect(result).toBe(expected);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.findMine);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });

  describe('create', () => {
    it('delegates to coursesService.create with userId and dto', () => {
      const dto = { title: 'New Course', description: 'Description' };
      const expected = { id: 'new-id', ...dto };
      service.create.mockReturnValue(expected);

      const result = controller.create(USER_ID, dto as any);

      expect(service.create).toHaveBeenCalledWith(USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.create);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });
});
