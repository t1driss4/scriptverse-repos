import { Test, TestingModule } from '@nestjs/testing';
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
  });

  describe('findContent', () => {
    it('delegates to coursesService.findContent with courseId and userId', () => {
      const expected = { id: COURSE_ID, modules: [] };
      service.findContent.mockReturnValue(expected);

      const result = controller.findContent(COURSE_ID, USER_ID);

      expect(service.findContent).toHaveBeenCalledWith(COURSE_ID, USER_ID);
      expect(result).toBe(expected);
    });
  });

  describe('findAll', () => {
    it('delegates to coursesService.findAll', () => {
      const expected = [{ id: COURSE_ID }];
      service.findAll.mockReturnValue(expected);

      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
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
  });
});
