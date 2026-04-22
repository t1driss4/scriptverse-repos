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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

/**
 * Uses an empty controller prefix so route paths are declared in full,
 * enabling both nested (/modules/:moduleId/lessons) and standalone
 * (/lessons/:id) patterns in a single controller.
 */
@Controller('')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  /** Create a lesson inside a module (FORMATEUR + course owner) */
  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  create(
    @Param('moduleId') moduleId: string,
    @GetUser('sub') userId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(moduleId, userId, dto);
  }

  /** List all lessons for a module */
  @Get('modules/:moduleId/lessons')
  findByModule(@Param('moduleId') moduleId: string) {
    return this.lessonsService.findByModule(moduleId);
  }

  /** Get a single lesson */
  @Get('lessons/:id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  /** Update a lesson (FORMATEUR + course owner) */
  @Patch('lessons/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  update(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, userId, dto);
  }

  /** Delete a lesson (FORMATEUR + course owner) */
  @Delete('lessons/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.lessonsService.remove(id, userId);
  }
}
