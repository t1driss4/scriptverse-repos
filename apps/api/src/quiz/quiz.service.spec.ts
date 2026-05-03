import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { PrismaService } from '../prisma/prisma.service';

const MODULE_ID = 'mod-uuid-1';
const QUIZ_ID = 'quiz-uuid-1';
const USER_ID = 'user-uuid-1';
const FORMATEUR_ID = 'formateur-uuid-1';
const Q1_ID = 'q-uuid-1';
const Q2_ID = 'q-uuid-2';

const now = new Date('2024-01-01T00:00:00.000Z');

const mockModule = {
  id: MODULE_ID,
  course: { formateurId: FORMATEUR_ID },
};

const mockQuestion1 = {
  id: Q1_ID,
  question: 'What is 2+2?',
  options: ['3', '4', '5'],
  correctAnswer: 1,
  order: 1,
  quizId: QUIZ_ID,
  createdAt: now,
};

const mockQuestion2 = {
  id: Q2_ID,
  question: 'Capital of France?',
  options: ['Berlin', 'Paris', 'Rome'],
  correctAnswer: 1,
  order: 2,
  quizId: QUIZ_ID,
  createdAt: now,
};

const mockQuiz = {
  id: QUIZ_ID,
  title: 'Test Quiz',
  moduleId: MODULE_ID,
  createdAt: now,
  updatedAt: now,
  questions: [mockQuestion1, mockQuestion2],
};

const mockAttempt = {
  id: 'attempt-uuid-1',
  userId: USER_ID,
  quizId: QUIZ_ID,
  score: 100,
  answers: [1, 1],
  completedAt: now,
};

describe('QuizService', () => {
  let service: QuizService;
  let prisma: {
    module: { findUnique: jest.Mock };
    quiz: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    quizQuestion: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    quizAttempt: { create: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      module: { findUnique: jest.fn() },
      quiz: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      quizQuestion: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      quizAttempt: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  // ─── createForModule ───────────────────────────────────────────────────────

  describe('createForModule', () => {
    it('throws NotFoundException when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);

      await expect(service.createForModule(MODULE_ID, FORMATEUR_ID, { title: 'Q' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user does not own the module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        ...mockModule,
        course: { formateurId: 'other-formateur' },
      });

      await expect(
        service.createForModule(MODULE_ID, FORMATEUR_ID, { title: 'Q' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when quiz already exists for module', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.createForModule(MODULE_ID, FORMATEUR_ID, { title: 'Q' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates and returns quiz when module has no existing quiz', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(null);
      prisma.quiz.create.mockResolvedValue({ ...mockQuiz, questions: [] });

      const result = await service.createForModule(MODULE_ID, FORMATEUR_ID, { title: 'New Quiz' });

      expect(prisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { title: 'New Quiz', moduleId: MODULE_ID } }),
      );
      expect(result.id).toBe(QUIZ_ID);
    });
  });

  // ─── findByModule ──────────────────────────────────────────────────────────

  describe('findByModule', () => {
    it('throws NotFoundException when no quiz for the module', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.findByModule(MODULE_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns quiz with questions excluding correctAnswer', async () => {
      const quizWithPublicQuestions = {
        ...mockQuiz,
        questions: [
          { id: Q1_ID, question: 'What is 2+2?', options: ['3', '4', '5'], order: 1 },
        ],
      };
      prisma.quiz.findUnique.mockResolvedValue(quizWithPublicQuestions);

      const result = await service.findByModule(MODULE_ID);

      expect(result.id).toBe(QUIZ_ID);
      expect(result.questions[0]).not.toHaveProperty('correctAnswer');
    });
  });

  // ─── submitAttempt ─────────────────────────────────────────────────────────

  describe('submitAttempt', () => {
    it('throws NotFoundException when no quiz for the module', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAttempt(MODULE_ID, USER_ID, { answers: [1, 1] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when quiz has no questions', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ ...mockQuiz, questions: [] });

      await expect(
        service.submitAttempt(MODULE_ID, USER_ID, { answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when answer count does not match question count', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.submitAttempt(MODULE_ID, USER_ID, { answers: [1] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException with count mismatch message', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.submitAttempt(MODULE_ID, USER_ID, { answers: [1] }),
      ).rejects.toThrow('Expected 2 answers, got 1');
    });

    it('throws BadRequestException when answer index is out of bounds for a question', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.submitAttempt(MODULE_ID, USER_ID, { answers: [5, 1] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calculates 100% score when all answers are correct', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockResolvedValue({ ...mockAttempt, score: 100 });

      const result = await service.submitAttempt(MODULE_ID, USER_ID, { answers: [1, 1] });

      expect(result.score).toBe(100);
      expect(result.correctCount).toBe(2);
    });

    it('calculates 50% score when half the answers are correct', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockResolvedValue({ ...mockAttempt, score: 50, answers: [0, 1] });

      const result = await service.submitAttempt(MODULE_ID, USER_ID, { answers: [0, 1] });

      expect(result.score).toBe(50);
      expect(result.correctCount).toBe(1);
    });

    it('calculates 0% score when all answers are wrong', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockResolvedValue({ ...mockAttempt, score: 0, answers: [0, 0] });

      const result = await service.submitAttempt(MODULE_ID, USER_ID, { answers: [0, 0] });

      expect(result.score).toBe(0);
      expect(result.correctCount).toBe(0);
    });

    it('persists attempt with userId, quizId, score, and answers', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockResolvedValue(mockAttempt);

      await service.submitAttempt(MODULE_ID, USER_ID, { answers: [1, 1] });

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, quizId: QUIZ_ID, score: 100, answers: [1, 1] },
      });
    });

    it('returns corrections with isCorrect flag for each question', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockResolvedValue({ ...mockAttempt, answers: [0, 1] });

      const result = await service.submitAttempt(MODULE_ID, USER_ID, { answers: [0, 1] });

      expect(result.corrections).toHaveLength(2);
      expect(result.corrections[0].isCorrect).toBe(false);
      expect(result.corrections[0].yourAnswer).toBe(0);
      expect(result.corrections[0].correctAnswer).toBe(1);
      expect(result.corrections[1].isCorrect).toBe(true);
    });

    it('returns attemptId, totalQuestions, and completedAt', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockResolvedValue(mockAttempt);

      const result = await service.submitAttempt(MODULE_ID, USER_ID, { answers: [1, 1] });

      expect(result.attemptId).toBe('attempt-uuid-1');
      expect(result.totalQuestions).toBe(2);
      expect(result.completedAt).toBe(now.toISOString());
    });
  });

  // ─── updateForModule ───────────────────────────────────────────────────────

  describe('updateForModule', () => {
    it('throws NotFoundException when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);

      await expect(
        service.updateForModule(MODULE_ID, FORMATEUR_ID, { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        ...mockModule,
        course: { formateurId: 'other-formateur' },
      });

      await expect(
        service.updateForModule(MODULE_ID, FORMATEUR_ID, { title: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when no quiz exists for the module', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.updateForModule(MODULE_ID, FORMATEUR_ID, { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates and returns quiz with questions', async () => {
      const updatedQuiz = { ...mockQuiz, title: 'Updated' };
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quiz.update.mockResolvedValue(updatedQuiz);

      const result = await service.updateForModule(MODULE_ID, FORMATEUR_ID, { title: 'Updated' });

      expect(prisma.quiz.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: QUIZ_ID }, data: { title: 'Updated' } }),
      );
      expect(result.title).toBe('Updated');
    });
  });

  // ─── removeForModule ───────────────────────────────────────────────────────

  describe('removeForModule', () => {
    it('throws NotFoundException when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);

      await expect(service.removeForModule(MODULE_ID, FORMATEUR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user does not own the module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        ...mockModule,
        course: { formateurId: 'other-formateur' },
      });

      await expect(service.removeForModule(MODULE_ID, FORMATEUR_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when no quiz exists for the module', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.removeForModule(MODULE_ID, FORMATEUR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the quiz by its id', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quiz.delete.mockResolvedValue(mockQuiz);

      await service.removeForModule(MODULE_ID, FORMATEUR_ID);

      expect(prisma.quiz.delete).toHaveBeenCalledWith({ where: { id: QUIZ_ID } });
    });
  });

  // ─── addQuestion ───────────────────────────────────────────────────────────

  describe('addQuestion', () => {
    const questionDto = {
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: 1,
      order: 1,
    };

    it('throws NotFoundException when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);

      await expect(
        service.addQuestion(MODULE_ID, FORMATEUR_ID, questionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        ...mockModule,
        course: { formateurId: 'other-formateur' },
      });

      await expect(
        service.addQuestion(MODULE_ID, FORMATEUR_ID, questionDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when no quiz exists for the module', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.addQuestion(MODULE_ID, FORMATEUR_ID, questionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when correctAnswer is out of options bounds', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.addQuestion(MODULE_ID, FORMATEUR_ID, { ...questionDto, correctAnswer: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates and returns the new question', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizQuestion.create.mockResolvedValue(mockQuestion1);

      const result = await service.addQuestion(MODULE_ID, FORMATEUR_ID, questionDto);

      expect(prisma.quizQuestion.create).toHaveBeenCalledWith({
        data: { ...questionDto, quizId: QUIZ_ID },
      });
      expect(result.id).toBe(Q1_ID);
    });
  });

  // ─── updateQuestion ────────────────────────────────────────────────────────

  describe('updateQuestion', () => {
    const questionWithModule = {
      ...mockQuestion1,
      quiz: { moduleId: MODULE_ID },
    };

    it('throws NotFoundException when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, { question: 'Updated?' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        ...mockModule,
        course: { formateurId: 'other-formateur' },
      });

      await expect(
        service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, { question: 'Updated?' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when question does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, { question: 'Updated?' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when question belongs to a different module', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue({
        ...mockQuestion1,
        quiz: { moduleId: 'other-module-id' },
      });

      await expect(
        service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, { question: 'Updated?' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when correctAnswer is out of bounds for new options', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue(questionWithModule);

      await expect(
        service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, {
          options: ['A', 'B'],
          correctAnswer: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not check bounds when correctAnswer is undefined', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue(questionWithModule);
      prisma.quizQuestion.update.mockResolvedValue(mockQuestion1);

      await expect(
        service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, { options: ['A', 'B'] }),
      ).resolves.not.toThrow();
    });

    it('updates and returns the question', async () => {
      const updated = { ...mockQuestion1, question: 'Updated?' };
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue(questionWithModule);
      prisma.quizQuestion.update.mockResolvedValue(updated);

      const result = await service.updateQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID, {
        question: 'Updated?',
      });

      expect(prisma.quizQuestion.update).toHaveBeenCalledWith({
        where: { id: Q1_ID },
        data: { question: 'Updated?' },
      });
      expect(result.question).toBe('Updated?');
    });
  });

  // ─── removeQuestion ────────────────────────────────────────────────────────

  describe('removeQuestion', () => {
    const questionWithModule = {
      ...mockQuestion1,
      quiz: { moduleId: MODULE_ID },
    };

    it('throws NotFoundException when module does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(null);

      await expect(
        service.removeQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the module', async () => {
      prisma.module.findUnique.mockResolvedValue({
        ...mockModule,
        course: { formateurId: 'other-formateur' },
      });

      await expect(
        service.removeQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when question does not exist', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.removeQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when question belongs to a different module', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue({
        ...mockQuestion1,
        quiz: { moduleId: 'other-module-id' },
      });

      await expect(
        service.removeQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes the question by its id', async () => {
      prisma.module.findUnique.mockResolvedValue(mockModule);
      prisma.quizQuestion.findUnique.mockResolvedValue(questionWithModule);
      prisma.quizQuestion.delete.mockResolvedValue(mockQuestion1);

      await service.removeQuestion(MODULE_ID, Q1_ID, FORMATEUR_ID);

      expect(prisma.quizQuestion.delete).toHaveBeenCalledWith({ where: { id: Q1_ID } });
    });
  });

  // ─── getMyAttempts ─────────────────────────────────────────────────────────

  describe('getMyAttempts', () => {
    it('throws NotFoundException when no quiz for the module', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.getMyAttempts(MODULE_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns empty array when user has no attempts', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.findMany.mockResolvedValue([]);

      const result = await service.getMyAttempts(MODULE_ID, USER_ID);

      expect(result).toEqual([]);
    });

    it('queries only the current user attempts for the quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.findMany.mockResolvedValue([]);

      await service.getMyAttempts(MODULE_ID, USER_ID);

      expect(prisma.quizAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quizId: QUIZ_ID, userId: USER_ID },
        }),
      );
    });

    it('orders attempts by completedAt descending', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.findMany.mockResolvedValue([]);

      await service.getMyAttempts(MODULE_ID, USER_ID);

      expect(prisma.quizAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { completedAt: 'desc' } }),
      );
    });

    it('returns all attempts for the user', async () => {
      const attempts = [
        { id: 'attempt-2', score: 100, answers: [1, 1], completedAt: new Date('2024-02-01') },
        { id: 'attempt-1', score: 50, answers: [0, 1], completedAt: new Date('2024-01-01') },
      ];
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.findMany.mockResolvedValue(attempts);

      const result = await service.getMyAttempts(MODULE_ID, USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('attempt-2');
    });
  });
});
