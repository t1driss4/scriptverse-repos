import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

const USER_ID = 'user-uuid-1';
const COURSE_ID = 'course-uuid-1';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let service: { enroll: jest.Mock; findMine: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    service = {
      enroll: jest.fn(),
      findMine: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [{ provide: EnrollmentsService, useValue: service }],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
  });

  describe('enroll', () => {
    it('delegates to enrollmentsService.enroll with userId and dto', () => {
      const dto = { courseId: COURSE_ID };
      const expected = { courseId: COURSE_ID };
      service.enroll.mockReturnValue(expected);

      const result = controller.enroll(USER_ID, dto);

      expect(service.enroll).toHaveBeenCalledWith(USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is restricted to APPRENANT role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.enroll);
      expect(roles).toEqual([Role.APPRENANT]);
    });
  });

  describe('findMine', () => {
    it('delegates to enrollmentsService.findMine with userId', () => {
      const expected = [{ courseId: COURSE_ID, progress: 50 }];
      service.findMine.mockReturnValue(expected);

      const result = controller.findMine(USER_ID);

      expect(service.findMine).toHaveBeenCalledWith(USER_ID);
      expect(result).toBe(expected);
    });

    it('is restricted to APPRENANT role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.findMine);
      expect(roles).toEqual([Role.APPRENANT]);
    });
  });

  describe('findOne', () => {
    it('delegates to enrollmentsService.findOne with userId and courseId', () => {
      const expected = { courseId: COURSE_ID, progress: 100 };
      service.findOne.mockReturnValue(expected);

      const result = controller.findOne(USER_ID, COURSE_ID);

      expect(service.findOne).toHaveBeenCalledWith(USER_ID, COURSE_ID);
      expect(result).toBe(expected);
    });

    it('is restricted to APPRENANT role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.findOne);
      expect(roles).toEqual([Role.APPRENANT]);
    });
  });
});
