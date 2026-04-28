import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Level, LessonType } from '@prisma/client';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

const COURSE_ID = 'course-uuid-1';
const USER_ID = 'user-uuid-1';
const FORMATEUR_ID = 'formateur-uuid-1';

const now = new Date('2024-01-01T00:00:00.000Z');

const mockFormateur = {
  id: FORMATEUR_ID,
  firstName: 'Jean',
  lastName: 'Dupont',
  avatar: null,
};

const mockLesson = {
  id: 'les-1',
  title: 'Lesson 1',
  type: LessonType.VIDEO,
  order: 1,
};

const mockModule = {
  id: 'mod-1',
  title: 'Module 1',
  order: 1,
  lessons: [mockLesson],
  quiz: { id: 'quiz-1', title: 'Quiz 1' },
  _count: { lessons: 1 },
};

const mockPublishedCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  description: 'A test course',
  thumbnail: null,
  price: 0,
  level: Level.DEBUTANT,
  category: null,
  published: true,
  formateurId: FORMATEUR_ID,
  createdAt: now,
  updatedAt: now,
  formateur: mockFormateur,
  modules: [mockModule],
  _count: { enrollments: 5 },
};

const mockEnrollment = {
  id: 'enroll-1',
  userId: USER_ID,
  courseId: COURSE_ID,
  enrolledAt: now,
};

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: {
    course: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    enrollment: { findUnique: jest.Mock };
    moduleProgress: { findMany: jest.Mock };
    quizAttempt: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      course: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: { findUnique: jest.fn() },
      moduleProgress: { findMany: jest.fn() },
      quizAttempt: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException when course does not exist', async () => {
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne(COURSE_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when course is not published', async () => {
      prisma.course.findUnique.mockResolvedValue({
        ...mockPublishedCourse,
        published: false,
      });

      await expect(service.findOne(COURSE_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns mapped CourseDetailDto for a published course', async () => {
      prisma.course.findUnique.mockResolvedValue(mockPublishedCourse);

      const result = await service.findOne(COURSE_ID);

      expect(result.id).toBe(COURSE_ID);
      expect(result.title).toBe('Test Course');
      expect(result.enrollmentsCount).toBe(5);
      expect(result.createdAt).toBe(now.toISOString());
      expect(result.updatedAt).toBe(now.toISOString());
    });

    it('maps module with lessonsCount and hasQuiz=true when quiz present', async () => {
      prisma.course.findUnique.mockResolvedValue(mockPublishedCourse);

      const result = await service.findOne(COURSE_ID);

      const mod = result.modules[0];
      expect(mod.lessonsCount).toBe(1);
      expect(mod.hasQuiz).toBe(true);
    });

    it('maps module with hasQuiz=false when no quiz', async () => {
      prisma.course.findUnique.mockResolvedValue({
        ...mockPublishedCourse,
        modules: [{ ...mockModule, quiz: null }],
      });

      const result = await service.findOne(COURSE_ID);

      expect(result.modules[0].hasQuiz).toBe(false);
    });

    it('includes lesson preview fields but not url', async () => {
      prisma.course.findUnique.mockResolvedValue(mockPublishedCourse);

      const result = await service.findOne(COURSE_ID);
      const lesson = result.modules[0].lessons[0];

      expect(lesson).toHaveProperty('id');
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('type');
      expect(lesson).toHaveProperty('order');
      expect(lesson).not.toHaveProperty('url');
    });

    it('returns formateur with avatar field', async () => {
      prisma.course.findUnique.mockResolvedValue(mockPublishedCourse);

      const result = await service.findOne(COURSE_ID);

      expect(result.formateur).toEqual(mockFormateur);
      expect(result.formateur).toHaveProperty('avatar');
    });
  });

  // ─── findContent ──────────────────────────────────────────────────────────

  describe('findContent', () => {
    const mockLessonWithUrl = {
      id: 'les-1',
      title: 'Lesson 1',
      type: LessonType.VIDEO,
      order: 1,
      url: 'https://cdn.example.com/video1.mp4',
      moduleId: 'mod-1',
      createdAt: now,
      updatedAt: now,
    };

    const mockQuizWithQuestions = {
      id: 'quiz-1',
      title: 'Quiz 1',
      moduleId: 'mod-1',
      createdAt: now,
      updatedAt: now,
      questions: [
        { id: 'q-1', question: 'What is TypeScript?', options: ['A', 'B'], order: 1 },
      ],
    };

    const mockContentCourse = {
      id: COURSE_ID,
      title: 'Test Course',
      description: 'A test course',
      thumbnail: null,
      level: Level.DEBUTANT,
      modules: [
        {
          id: 'mod-1',
          title: 'Module 1',
          order: 1,
          lessons: [mockLessonWithUrl],
          quiz: mockQuizWithQuestions,
        },
      ],
    };

    it('throws ForbiddenException when user is not enrolled', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.findContent(COURSE_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException with correct message when not enrolled', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.findContent(COURSE_ID, USER_ID)).rejects.toThrow(
        'Not enrolled in this course',
      );
    });

    it('runs $transaction after enrollment check passes', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([mockContentCourse, [], []]);

      await service.findContent(COURSE_ID, USER_ID);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('returns CourseContentDto with enrollment info', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([mockContentCourse, [], []]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.enrollment.id).toBe('enroll-1');
      expect(result.enrollment.enrolledAt).toBe(now.toISOString());
    });

    it('exposes lesson url for enrolled user', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([mockContentCourse, [], []]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].lessons[0].url).toBe('https://cdn.example.com/video1.mp4');
    });

    it('sets module completedAt from progressRecords', async () => {
      const completedAt = new Date('2024-06-01T12:00:00.000Z');
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([
        mockContentCourse,
        [{ moduleId: 'mod-1', completedAt }],
        [],
      ]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].completedAt).toBe(completedAt.toISOString());
    });

    it('sets module completedAt to null when not completed', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([mockContentCourse, [], []]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].completedAt).toBeNull();
    });

    it('attaches latestAttempt to quiz when attempt exists', async () => {
      const attemptAt = new Date('2024-06-15T10:00:00.000Z');
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([
        mockContentCourse,
        [],
        [{ quizId: 'quiz-1', score: 80, completedAt: attemptAt }],
      ]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].quiz?.latestAttempt).toEqual({
        score: 80,
        completedAt: attemptAt.toISOString(),
      });
    });

    it('sets latestAttempt to null when no attempt exists', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([mockContentCourse, [], []]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].quiz?.latestAttempt).toBeNull();
    });

    it('uses only the first (most recent) attempt when multiple exist for same quiz', async () => {
      const firstAt = new Date('2024-06-15T10:00:00.000Z');
      const secondAt = new Date('2024-06-10T10:00:00.000Z');
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([
        mockContentCourse,
        [],
        [
          { quizId: 'quiz-1', score: 90, completedAt: firstAt },
          { quizId: 'quiz-1', score: 60, completedAt: secondAt },
        ],
      ]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].quiz?.latestAttempt?.score).toBe(90);
    });

    it('returns null quiz when module has no quiz', async () => {
      const courseNoQuiz = {
        ...mockContentCourse,
        modules: [{ ...mockContentCourse.modules[0], quiz: null }],
      };
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([courseNoQuiz, [], []]);

      const result = await service.findContent(COURSE_ID, USER_ID);

      expect(result.modules[0].quiz).toBeNull();
    });

    it('excludes correctAnswer from quiz questions', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      prisma.$transaction.mockResolvedValue([mockContentCourse, [], []]);

      const result = await service.findContent(COURSE_ID, USER_ID);
      const question = result.modules[0].quiz?.questions[0];

      expect(question).not.toHaveProperty('correctAnswer');
    });
  });
});
