import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

const MODULE_ID = 'mod-uuid-1';
const QUESTION_ID = 'q-uuid-1';
const USER_ID = 'user-uuid-1';

describe('QuizController', () => {
  let controller: QuizController;
  let service: {
    createForModule: jest.Mock;
    findByModule: jest.Mock;
    updateForModule: jest.Mock;
    removeForModule: jest.Mock;
    addQuestion: jest.Mock;
    updateQuestion: jest.Mock;
    removeQuestion: jest.Mock;
    submitAttempt: jest.Mock;
    getMyAttempts: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createForModule: jest.fn(),
      findByModule: jest.fn(),
      updateForModule: jest.fn(),
      removeForModule: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      removeQuestion: jest.fn(),
      submitAttempt: jest.fn(),
      getMyAttempts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [{ provide: QuizService, useValue: service }],
    }).compile();

    controller = module.get<QuizController>(QuizController);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to quizService.createForModule with moduleId, userId, and dto', () => {
      const dto = { title: 'My Quiz' };
      const expected = { id: 'quiz-1', title: 'My Quiz' };
      service.createForModule.mockReturnValue(expected);

      const result = controller.create(MODULE_ID, USER_ID, dto);

      expect(service.createForModule).toHaveBeenCalledWith(MODULE_ID, USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.create);
      expect(roles).toEqual([Role.FORMATEUR]);
    });

    it('is NOT marked @Public()', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.create);
      expect(isPublic).toBeUndefined();
    });
  });

  // ─── findByModule ─────────────────────────────────────────────────────────

  describe('findByModule', () => {
    it('delegates to quizService.findByModule with moduleId', () => {
      const expected = { id: 'quiz-1', questions: [] };
      service.findByModule.mockReturnValue(expected);

      const result = controller.findByModule(MODULE_ID);

      expect(service.findByModule).toHaveBeenCalledWith(MODULE_ID);
      expect(result).toBe(expected);
    });

    it('is marked @Public() — accessible without authentication', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.findByModule);
      expect(isPublic).toBe(true);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('delegates to quizService.updateForModule with moduleId, userId, and dto', () => {
      const dto = { title: 'Updated Quiz' };
      const expected = { id: 'quiz-1', title: 'Updated Quiz' };
      service.updateForModule.mockReturnValue(expected);

      const result = controller.update(MODULE_ID, USER_ID, dto);

      expect(service.updateForModule).toHaveBeenCalledWith(MODULE_ID, USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.update);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('delegates to quizService.removeForModule with moduleId and userId', () => {
      service.removeForModule.mockReturnValue(undefined);

      controller.remove(MODULE_ID, USER_ID);

      expect(service.removeForModule).toHaveBeenCalledWith(MODULE_ID, USER_ID);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.remove);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });

  // ─── addQuestion ──────────────────────────────────────────────────────────

  describe('addQuestion', () => {
    it('delegates to quizService.addQuestion with moduleId, userId, and dto', () => {
      const dto = { question: 'Q?', options: ['A', 'B'], correctAnswer: 0, order: 1 };
      const expected = { id: QUESTION_ID, ...dto };
      service.addQuestion.mockReturnValue(expected);

      const result = controller.addQuestion(MODULE_ID, USER_ID, dto);

      expect(service.addQuestion).toHaveBeenCalledWith(MODULE_ID, USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.addQuestion);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });

  // ─── updateQuestion ───────────────────────────────────────────────────────

  describe('updateQuestion', () => {
    it('delegates to quizService.updateQuestion with moduleId, questionId, userId, and dto', () => {
      const dto = { question: 'Updated?' };
      const expected = { id: QUESTION_ID, question: 'Updated?' };
      service.updateQuestion.mockReturnValue(expected);

      const result = controller.updateQuestion(MODULE_ID, QUESTION_ID, USER_ID, dto);

      expect(service.updateQuestion).toHaveBeenCalledWith(MODULE_ID, QUESTION_ID, USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.updateQuestion);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });

  // ─── removeQuestion ───────────────────────────────────────────────────────

  describe('removeQuestion', () => {
    it('delegates to quizService.removeQuestion with moduleId, questionId, and userId', () => {
      service.removeQuestion.mockReturnValue(undefined);

      controller.removeQuestion(MODULE_ID, QUESTION_ID, USER_ID);

      expect(service.removeQuestion).toHaveBeenCalledWith(MODULE_ID, QUESTION_ID, USER_ID);
    });

    it('is restricted to FORMATEUR role', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.removeQuestion);
      expect(roles).toEqual([Role.FORMATEUR]);
    });
  });

  // ─── submitAttempt ────────────────────────────────────────────────────────

  describe('submitAttempt', () => {
    it('delegates to quizService.submitAttempt with moduleId, userId, and dto', () => {
      const dto = { answers: [1, 0] };
      const expected = { attemptId: 'a-1', score: 50, totalQuestions: 2, correctCount: 1, corrections: [] };
      service.submitAttempt.mockReturnValue(expected);

      const result = controller.submitAttempt(MODULE_ID, USER_ID, dto);

      expect(service.submitAttempt).toHaveBeenCalledWith(MODULE_ID, USER_ID, dto);
      expect(result).toBe(expected);
    });

    it('is NOT marked @Public() — requires authentication', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.submitAttempt);
      expect(isPublic).toBeUndefined();
    });
  });

  // ─── getMyAttempts ────────────────────────────────────────────────────────

  describe('getMyAttempts', () => {
    it('delegates to quizService.getMyAttempts with moduleId and userId', () => {
      const expected = [{ id: 'a-1', score: 100 }];
      service.getMyAttempts.mockReturnValue(expected);

      const result = controller.getMyAttempts(MODULE_ID, USER_ID);

      expect(service.getMyAttempts).toHaveBeenCalledWith(MODULE_ID, USER_ID);
      expect(result).toBe(expected);
    });

    it('is NOT marked @Public() — requires authentication', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.getMyAttempts);
      expect(isPublic).toBeUndefined();
    });
  });
});
