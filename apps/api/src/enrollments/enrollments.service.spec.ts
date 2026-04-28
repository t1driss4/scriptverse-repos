import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-uuid-1';
const COURSE_ID = 'course-uuid-1';

const mockCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  modules: [{ id: 'mod-1' }, { id: 'mod-2' }],
};

const mockEnrollment = {
  userId: USER_ID,
  courseId: COURSE_ID,
  enrolledAt: new Date('2024-01-01'),
  course: {
    ...mockCourse,
    formateur: { id: 'fmt-1', firstName: 'Jean', lastName: 'Dupont' },
    _count: { enrollments: 5, modules: 2 },
  },
};

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let prisma: {
    course: { findUnique: jest.Mock };
    enrollment: { upsert: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
    moduleProgress: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      course: { findUnique: jest.fn() },
      enrollment: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      moduleProgress: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  describe('enroll', () => {
    it('throws NotFoundException when course does not exist', async () => {
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(service.enroll(USER_ID, { courseId: COURSE_ID })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('looks up the course by courseId', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.enrollment.upsert.mockResolvedValue(mockEnrollment);

      await service.enroll(USER_ID, { courseId: COURSE_ID });

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: COURSE_ID },
      });
    });

    it('upserts enrollment with correct userId and courseId', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.enrollment.upsert.mockResolvedValue(mockEnrollment);

      await service.enroll(USER_ID, { courseId: COURSE_ID });

      expect(prisma.enrollment.upsert).toHaveBeenCalledWith({
        where: { userId_courseId: { userId: USER_ID, courseId: COURSE_ID } },
        create: { userId: USER_ID, courseId: COURSE_ID },
        update: {},
      });
    });

    it('returns the upserted enrollment', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.enrollment.upsert.mockResolvedValue(mockEnrollment);

      const result = await service.enroll(USER_ID, { courseId: COURSE_ID });

      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findMine', () => {
    it('returns enrollments with progress=0 when no modules completed', async () => {
      prisma.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      prisma.moduleProgress.findMany.mockResolvedValue([]);

      const result = await service.findMine(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].progress).toBe(0);
    });

    it('returns 50% progress when 1 of 2 modules completed', async () => {
      prisma.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      prisma.moduleProgress.findMany.mockResolvedValue([{ moduleId: 'mod-1' }]);

      const result = await service.findMine(USER_ID);

      expect(result[0].progress).toBe(50);
    });

    it('returns 100% progress when all modules completed', async () => {
      prisma.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      prisma.moduleProgress.findMany.mockResolvedValue([
        { moduleId: 'mod-1' },
        { moduleId: 'mod-2' },
      ]);

      const result = await service.findMine(USER_ID);

      expect(result[0].progress).toBe(100);
    });

    it('returns 0% progress when course has no modules', async () => {
      const enrollmentNoModules = {
        ...mockEnrollment,
        course: { ...mockEnrollment.course, modules: [] },
      };
      prisma.enrollment.findMany.mockResolvedValue([enrollmentNoModules]);
      prisma.moduleProgress.findMany.mockResolvedValue([]);

      const result = await service.findMine(USER_ID);

      expect(result[0].progress).toBe(0);
    });

    it('includes completedModules ids in the response', async () => {
      prisma.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      prisma.moduleProgress.findMany.mockResolvedValue([{ moduleId: 'mod-1' }]);

      const result = await service.findMine(USER_ID);

      expect(result[0].completedModules).toEqual(['mod-1']);
    });

    it('queries moduleProgress for the correct userId', async () => {
      prisma.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      prisma.moduleProgress.findMany.mockResolvedValue([]);

      await service.findMine(USER_ID);

      expect(prisma.moduleProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });
  });

  describe('findOne', () => {
    const enrollmentWithModules = {
      courseId: COURSE_ID,
      enrolledAt: new Date('2024-01-01'),
      course: { modules: [{ id: 'mod-1' }, { id: 'mod-2' }] },
    };

    it('throws NotFoundException when enrollment does not exist', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(USER_ID, COURSE_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns 0% progress when no modules completed', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(enrollmentWithModules);
      prisma.moduleProgress.findMany.mockResolvedValue([]);

      const result = await service.findOne(USER_ID, COURSE_ID);

      expect(result.progress).toBe(0);
    });

    it('returns 50% progress when 1 of 2 modules completed', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(enrollmentWithModules);
      prisma.moduleProgress.findMany.mockResolvedValue([{ moduleId: 'mod-1' }]);

      const result = await service.findOne(USER_ID, COURSE_ID);

      expect(result.progress).toBe(50);
    });

    it('returns 100% progress when all modules completed', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(enrollmentWithModules);
      prisma.moduleProgress.findMany.mockResolvedValue([
        { moduleId: 'mod-1' },
        { moduleId: 'mod-2' },
      ]);

      const result = await service.findOne(USER_ID, COURSE_ID);

      expect(result.progress).toBe(100);
    });

    it('returns completedModules list', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(enrollmentWithModules);
      prisma.moduleProgress.findMany.mockResolvedValue([{ moduleId: 'mod-1' }]);

      const result = await service.findOne(USER_ID, COURSE_ID);

      expect(result.completedModules).toEqual(['mod-1']);
    });

    it('returns correct courseId and enrolledAt', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(enrollmentWithModules);
      prisma.moduleProgress.findMany.mockResolvedValue([]);

      const result = await service.findOne(USER_ID, COURSE_ID);

      expect(result.courseId).toBe(COURSE_ID);
      expect(result.enrolledAt).toEqual(enrollmentWithModules.enrolledAt);
    });
  });
});
