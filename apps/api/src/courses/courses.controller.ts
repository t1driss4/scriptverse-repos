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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /** Create a new course (FORMATEUR only) */
  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  create(@GetUser('sub') userId: string, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(userId, dto);
  }

  /** List all published courses (public) */
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  /** List courses belonging to the authenticated formateur */
  @Get('mine')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  findMine(@GetUser('sub') userId: string) {
    return this.coursesService.findMine(userId);
  }

  /** Get a single course with its modules and lessons */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  /** Update a course (FORMATEUR + owner only) */
  @Patch(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  update(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, userId, dto);
  }

  /** Delete a course (FORMATEUR + owner only) */
  @Delete(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.coursesService.remove(id, userId);
  }
}
