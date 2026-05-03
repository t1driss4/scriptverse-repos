import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      count: jest.Mock;
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
        count: jest.fn(),
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

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    const mockCourseRow = {
      id: COURSE_ID,
      title: 'Test Course',
      description: 'A test course',
      thumbnail: null,
      price: 0,
      level: Level.DEBUTANT,
      category: 'programming',
      createdAt: now,
      formateur: { id: FORMATEUR_ID, firstName: 'Jean', lastName: 'Dupont', avatar: null },
      _count: { modules: 2, enrollments: 5 },
    };

    it('returns paginated courses with default meta', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 12, totalPages: 1 });
    });

    it('maps course row to CoursePreviewDto shape', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({});
      const item = result.data[0];

      expect(item.id).toBe(COURSE_ID);
      expect(item.moduleCount).toBe(2);
      expect(item.enrollmentCount).toBe(5);
      expect(item.createdAt).toBe(now.toISOString());
      expect(item.formateur).toEqual({ id: FORMATEUR_ID, firstName: 'Jean', lastName: 'Dupont', avatar: null });
    });

    it('formateur includes avatar field', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({});

      expect(result.data[0].formateur).toHaveProperty('avatar');
    });

    it('uses custom page and limit in meta', async () => {
      prisma.$transaction.mockResolvedValue([[], 45]);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('calls $transaction with findMany and count', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('defaults to empty result when no courses match', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('applies search query via $transaction call', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({ search: 'Test' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('applies level filter via $transaction call', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({ level: Level.DEBUTANT });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.data[0].level).toBe(Level.DEBUTANT);
    });

    it('applies category filter via $transaction call', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({ category: 'programming' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.data[0].category).toBe('programming');
    });

    it('sorts by sortBy=price when specified', async () => {
      prisma.$transaction.mockResolvedValue([[mockCourseRow], 1]);

      const result = await service.findAll({ sortBy: 'price', sortOrder: 'asc' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('computes totalPages=0 when total is 0', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.meta.totalPages).toBe(0);
    });

    it('throws BadRequestException when minPrice > maxPrice', async () => {
      await expect(service.findAll({ minPrice: 100, maxPrice: 50 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException with correct message when minPrice > maxPrice', async () => {
      await expect(service.findAll({ minPrice: 100, maxPrice: 50 })).rejects.toThrow(
        'minPrice must not be greater than maxPrice',
      );
    });

    it('does not throw when minPrice equals maxPrice', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await expect(service.findAll({ minPrice: 50, maxPrice: 50 })).resolves.toBeDefined();
    });
  });

  // ─── findAll – query construction ─────────────────────────────────────────

  describe('findAll – query construction', () => {
    beforeEach(() => {
      prisma.$transaction.mockResolvedValue([[], 0]);
    });

    it('always filters by published: true', async () => {
      await service.findAll({});

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ published: true }),
        }),
      );
    });

    it('adds OR search on title and description when search is provided', async () => {
      await service.findAll({ search: 'TypeScript' });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'TypeScript', mode: 'insensitive' } },
              { description: { contains: 'TypeScript', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('does not add OR clause when search is absent', async () => {
      await service.findAll({});

      const whereArg: Record<string, unknown> = (prisma.course.count.mock.calls[0] as [{ where: unknown }])[0].where as Record<string, unknown>;
      expect(whereArg).not.toHaveProperty('OR');
    });

    it('adds exact level filter when level is provided', async () => {
      await service.findAll({ level: Level.INTERMEDIAIRE });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: Level.INTERMEDIAIRE }),
        }),
      );
    });

    it('does not add level filter when level is absent', async () => {
      await service.findAll({});

      const whereArg: Record<string, unknown> = (prisma.course.count.mock.calls[0] as [{ where: unknown }])[0].where as Record<string, unknown>;
      expect(whereArg).not.toHaveProperty('level');
    });

    it('adds exact category match when provided', async () => {
      await service.findAll({ category: 'programming' });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'programming' }),
        }),
      );
    });

    it('does not add category filter when category is absent', async () => {
      await service.findAll({});

      const whereArg: Record<string, unknown> = (prisma.course.count.mock.calls[0] as [{ where: unknown }])[0].where as Record<string, unknown>;
      expect(whereArg).not.toHaveProperty('category');
    });

    it('adds formateurId filter when provided', async () => {
      const formateurId = '00000000-0000-0000-0000-000000000099';
      await service.findAll({ formateurId });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ formateurId }),
        }),
      );
    });

    it('does not add formateurId filter when absent', async () => {
      await service.findAll({});

      const whereArg: Record<string, unknown> = (prisma.course.count.mock.calls[0] as [{ where: unknown }])[0].where as Record<string, unknown>;
      expect(whereArg).not.toHaveProperty('formateurId');
    });

    it('adds price gte filter when minPrice is provided', async () => {
      await service.findAll({ minPrice: 10 });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: expect.objectContaining({ gte: 10 }),
          }),
        }),
      );
    });

    it('adds price lte filter when maxPrice is provided', async () => {
      await service.findAll({ maxPrice: 100 });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: expect.objectContaining({ lte: 100 }),
          }),
        }),
      );
    });

    it('adds both gte and lte when minPrice and maxPrice are provided', async () => {
      await service.findAll({ minPrice: 10, maxPrice: 100 });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 10, lte: 100 },
          }),
        }),
      );
    });

    it('does not add price filter when neither minPrice nor maxPrice is provided', async () => {
      await service.findAll({});

      const whereArg: Record<string, unknown> = (prisma.course.count.mock.calls[0] as [{ where: unknown }])[0].where as Record<string, unknown>;
      expect(whereArg).not.toHaveProperty('price');
    });

    it('applies all filters simultaneously in where clause', async () => {
      await service.findAll({ search: 'JS', level: Level.DEBUTANT, category: 'web' });

      expect(prisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            published: true,
            level: Level.DEBUTANT,
            category: 'web',
            OR: [
              { title: { contains: 'JS', mode: 'insensitive' } },
              { description: { contains: 'JS', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('uses createdAt desc orderBy by default', async () => {
      await service.findAll({});

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('uses sortBy=createdAt with sortOrder=asc', async () => {
      await service.findAll({ sortBy: 'createdAt', sortOrder: 'asc' });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });

    it('uses sortBy=price with sortOrder=desc', async () => {
      await service.findAll({ sortBy: 'price', sortOrder: 'desc' });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { price: 'desc' } }),
      );
    });

    it('uses sortBy=title with sortOrder=asc', async () => {
      await service.findAll({ sortBy: 'title', sortOrder: 'asc' });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { title: 'asc' } }),
      );
    });

    it('computes skip=(page-1)*limit', async () => {
      await service.findAll({ page: 3, limit: 10 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('uses skip=0 for page 1', async () => {
      await service.findAll({ page: 1, limit: 15 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 15 }),
      );
    });

    it('defaults to page=1 and limit=12 when not specified', async () => {
      await service.findAll({});

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 12 }),
      );
    });

    it('uses select projection (not include) in findMany', async () => {
      await service.findAll({});

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            title: true,
            formateur: expect.objectContaining({
              select: expect.objectContaining({ avatar: true }),
            }),
            _count: expect.objectContaining({ select: expect.objectContaining({ enrollments: true, modules: true }) }),
          }),
        }),
      );
    });
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
