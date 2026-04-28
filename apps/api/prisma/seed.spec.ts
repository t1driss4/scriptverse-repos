import type { PrismaClient } from '@prisma/client';

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

const mockUser = { id: 'user-id', email: 'admin@scriptverse.dev' };
const mockCourse = { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', title: 'Introduction à TypeScript' };
const mockModule = { id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' };
const mockQuiz = { id: 'quiz-id' };

function buildPrismaMock() {
  return {
    user: { upsert: jest.fn().mockResolvedValue(mockUser) },
    course: { upsert: jest.fn().mockResolvedValue(mockCourse) },
    module: { upsert: jest.fn().mockResolvedValue(mockModule) },
    lesson: { upsert: jest.fn().mockResolvedValue({}) },
    quiz: { upsert: jest.fn().mockResolvedValue(mockQuiz) },
    quizQuestion: { upsert: jest.fn().mockResolvedValue({}) },
    enrollment: { upsert: jest.fn().mockResolvedValue({}) },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

describe('seed script', () => {
  let prismaMock: ReturnType<typeof buildPrismaMock>;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    prismaMock = buildPrismaMock();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => prismaMock),
      Role: { ADMIN: 'ADMIN', FORMATEUR: 'FORMATEUR', APPRENANT: 'APPRENANT' },
      Level: { DEBUTANT: 'DEBUTANT' },
      LessonType: { VIDEO: 'VIDEO' },
    }));

    jest.doMock('bcrypt', () => ({
      hash: jest.fn().mockResolvedValue('hashed-password'),
    }));
  });

  afterEach(() => {
    exitSpy.mockRestore();
    delete process.env.SEED_ADMIN_PASSWORD;
    delete process.env.SEED_FORMATEUR_PASSWORD;
    delete process.env.SEED_APPRENANT_PASSWORD;
  });

  describe('happy path', () => {
    beforeEach(() => {
      process.env.SEED_ADMIN_PASSWORD = 'adminpass';
      process.env.SEED_FORMATEUR_PASSWORD = 'formateurpass';
      process.env.SEED_APPRENANT_PASSWORD = 'apprenantpass';
    });

    it('hashes passwords with bcrypt', async () => {
      const bcrypt = require('bcrypt');
      require('./seed');
      await flushPromises();

      expect(bcrypt.hash).toHaveBeenCalledWith('adminpass', 10);
      expect(bcrypt.hash).toHaveBeenCalledWith('formateurpass', 10);
      expect(bcrypt.hash).toHaveBeenCalledWith('apprenantpass', 10);
    });

    it('upserts 3 users', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.user.upsert).toHaveBeenCalledTimes(3);
    });

    it('upserts admin user with correct email and role', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'admin@scriptverse.dev' },
          create: expect.objectContaining({
            email: 'admin@scriptverse.dev',
            role: 'ADMIN',
          }),
        }),
      );
    });

    it('upserts formateur user with correct role', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'formateur@scriptverse.dev' },
          create: expect.objectContaining({ role: 'FORMATEUR' }),
        }),
      );
    });

    it('upserts apprenant user with correct role', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'apprenant@scriptverse.dev' },
          create: expect.objectContaining({ role: 'APPRENANT' }),
        }),
      );
    });

    it('upserts 1 course with correct id', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.course.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.course.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
        }),
      );
    });

    it('upserts 2 modules', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.module.upsert).toHaveBeenCalledTimes(2);
    });

    it('upserts 4 lessons', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.lesson.upsert).toHaveBeenCalledTimes(4);
    });

    it('upserts 1 quiz', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.quiz.upsert).toHaveBeenCalledTimes(1);
    });

    it('upserts 2 quiz questions', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.quizQuestion.upsert).toHaveBeenCalledTimes(2);
    });

    it('upserts 1 enrollment', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.enrollment.upsert).toHaveBeenCalledTimes(1);
    });

    it('calls $disconnect after completion', async () => {
      require('./seed');
      await flushPromises();

      expect(prismaMock.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('error path — missing env vars', () => {
    it('calls process.exit(1) when SEED_ADMIN_PASSWORD is missing', async () => {
      delete process.env.SEED_ADMIN_PASSWORD;
      process.env.SEED_FORMATEUR_PASSWORD = 'formateurpass';
      process.env.SEED_APPRENANT_PASSWORD = 'apprenantpass';

      require('./seed');
      await flushPromises();

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('calls process.exit(1) when SEED_FORMATEUR_PASSWORD is missing', async () => {
      process.env.SEED_ADMIN_PASSWORD = 'adminpass';
      delete process.env.SEED_FORMATEUR_PASSWORD;
      process.env.SEED_APPRENANT_PASSWORD = 'apprenantpass';

      require('./seed');
      await flushPromises();

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('calls process.exit(1) when SEED_APPRENANT_PASSWORD is missing', async () => {
      process.env.SEED_ADMIN_PASSWORD = 'adminpass';
      process.env.SEED_FORMATEUR_PASSWORD = 'formateurpass';
      delete process.env.SEED_APPRENANT_PASSWORD;

      require('./seed');
      await flushPromises();

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('still calls $disconnect on error', async () => {
      delete process.env.SEED_ADMIN_PASSWORD;

      require('./seed');
      await flushPromises();

      expect(prismaMock.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
