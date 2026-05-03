import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async createForModule(moduleId: string, formateurId: string, dto: CreateQuizDto) {
    await this.assertModuleOwner(moduleId, formateurId);
    const existing = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (existing) throw new BadRequestException('This module already has a quiz');
    return this.prisma.quiz.create({
      data: { title: dto.title, moduleId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async findByModule(moduleId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { moduleId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, question: true, options: true, order: true },
        },
      },
    });
    if (!quiz) throw new NotFoundException(`No quiz for module ${moduleId}`);
    return quiz;
  }

  async updateForModule(moduleId: string, formateurId: string, dto: UpdateQuizDto) {
    await this.assertModuleOwner(moduleId, formateurId);
    const quiz = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) throw new NotFoundException(`No quiz for module ${moduleId}`);
    return this.prisma.quiz.update({
      where: { id: quiz.id },
      data: dto,
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async removeForModule(moduleId: string, formateurId: string) {
    await this.assertModuleOwner(moduleId, formateurId);
    const quiz = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) throw new NotFoundException(`No quiz for module ${moduleId}`);
    await this.prisma.quiz.delete({ where: { id: quiz.id } });
  }

  async addQuestion(moduleId: string, formateurId: string, dto: CreateQuestionDto) {
    await this.assertModuleOwner(moduleId, formateurId);
    const quiz = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) throw new NotFoundException(`No quiz for module ${moduleId}`);
    if (dto.correctAnswer >= dto.options.length) {
      throw new BadRequestException('correctAnswer index out of bounds');
    }
    return this.prisma.quizQuestion.create({
      data: { ...dto, quizId: quiz.id },
    });
  }

  async updateQuestion(
    moduleId: string,
    questionId: string,
    formateurId: string,
    dto: UpdateQuestionDto,
  ) {
    await this.assertModuleOwner(moduleId, formateurId);
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: { select: { moduleId: true } } },
    });
    if (!question || question.quiz.moduleId !== moduleId) {
      throw new NotFoundException(`Question ${questionId} not found`);
    }
    if (
      dto.correctAnswer !== undefined &&
      dto.options &&
      dto.correctAnswer >= dto.options.length
    ) {
      throw new BadRequestException('correctAnswer index out of bounds');
    }
    return this.prisma.quizQuestion.update({ where: { id: questionId }, data: dto });
  }

  async removeQuestion(moduleId: string, questionId: string, formateurId: string) {
    await this.assertModuleOwner(moduleId, formateurId);
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: { select: { moduleId: true } } },
    });
    if (!question || question.quiz.moduleId !== moduleId) {
      throw new NotFoundException(`Question ${questionId} not found`);
    }
    await this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  async submitAttempt(moduleId: string, userId: string, dto: SubmitAttemptDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { moduleId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException(`No quiz for module ${moduleId}`);
    if (!quiz.questions.length) throw new BadRequestException('This quiz has no questions');
    if (dto.answers.length !== quiz.questions.length) {
      throw new BadRequestException(
        `Expected ${quiz.questions.length} answers, got ${dto.answers.length}`,
      );
    }
    for (let i = 0; i < dto.answers.length; i++) {
      if (dto.answers[i] >= quiz.questions[i].options.length) {
        throw new BadRequestException(`Answer index out of bounds for question ${i + 1}`);
      }
    }

    let correctCount = 0;
    const corrections = quiz.questions.map((q: { id: string; correctAnswer: number; options: string[] }, i: number) => {
      const isCorrect = q.correctAnswer === dto.answers[i];
      if (isCorrect) correctCount++;
      return { questionId: q.id, yourAnswer: dto.answers[i], correctAnswer: q.correctAnswer, isCorrect };
    });
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const attempt = await this.prisma.quizAttempt.create({
      data: { userId, quizId: quiz.id, score, answers: dto.answers },
    });

    return {
      attemptId: attempt.id,
      score,
      totalQuestions: quiz.questions.length,
      correctCount,
      completedAt: attempt.completedAt.toISOString(),
      corrections,
    };
  }

  async getMyAttempts(moduleId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) throw new NotFoundException(`No quiz for module ${moduleId}`);
    return this.prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, userId },
      orderBy: { completedAt: 'desc' },
      select: { id: true, score: true, answers: true, completedAt: true },
    });
  }

  private async assertModuleOwner(moduleId: string, formateurId: string) {
    const mod = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { formateurId: true } } },
    });
    if (!mod) throw new NotFoundException(`Module ${moduleId} not found`);
    if (mod.course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
  }
}
