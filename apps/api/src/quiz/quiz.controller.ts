import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /** Create a quiz for a module (one quiz per module) */
  @Post('modules/:moduleId/quiz')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  create(
    @Param('moduleId') moduleId: string,
    @GetUser('sub') userId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizService.createForModule(moduleId, userId, dto);
  }

  /** Get quiz with all questions for a module */
  @Public()
  @Get('modules/:moduleId/quiz')
  findByModule(@Param('moduleId') moduleId: string) {
    return this.quizService.findByModule(moduleId);
  }

  /** Update quiz title */
  @Patch('modules/:moduleId/quiz')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  update(
    @Param('moduleId') moduleId: string,
    @GetUser('sub') userId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizService.updateForModule(moduleId, userId, dto);
  }

  /** Delete quiz and all its questions */
  @Delete('modules/:moduleId/quiz')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('moduleId') moduleId: string, @GetUser('sub') userId: string) {
    return this.quizService.removeForModule(moduleId, userId);
  }

  /** Add a question to a module's quiz */
  @Post('modules/:moduleId/quiz/questions')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  addQuestion(
    @Param('moduleId') moduleId: string,
    @GetUser('sub') userId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizService.addQuestion(moduleId, userId, dto);
  }

  /** Update a question */
  @Patch('modules/:moduleId/quiz/questions/:questionId')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  updateQuestion(
    @Param('moduleId') moduleId: string,
    @Param('questionId') questionId: string,
    @GetUser('sub') userId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizService.updateQuestion(moduleId, questionId, userId, dto);
  }

  /** Delete a question */
  @Delete('modules/:moduleId/quiz/questions/:questionId')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeQuestion(
    @Param('moduleId') moduleId: string,
    @Param('questionId') questionId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.quizService.removeQuestion(moduleId, questionId, userId);
  }

  /** Submit answers for a quiz attempt and receive score with corrections */
  @Post('modules/:moduleId/quiz/attempts')
  submitAttempt(
    @Param('moduleId') moduleId: string,
    @GetUser('sub') userId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizService.submitAttempt(moduleId, userId, dto);
  }

  /** Get the current user's attempts for a module's quiz */
  @Get('modules/:moduleId/quiz/attempts')
  getMyAttempts(
    @Param('moduleId') moduleId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.quizService.getMyAttempts(moduleId, userId);
  }
}
