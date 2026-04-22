import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(moduleId: string, formateurId: string, dto: CreateLessonDto) {
    await this.assertModuleOwner(moduleId, formateurId);
    return this.prisma.lesson.create({
      data: { ...dto, moduleId },
    });
  }

  async findByModule(moduleId: string) {
    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException(`Lesson ${id} not found`);
    return lesson;
  }

  async update(id: string, formateurId: string, dto: UpdateLessonDto) {
    const lesson = await this.findLessonWithOwner(id);
    if (lesson.module.course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async remove(id: string, formateurId: string) {
    const lesson = await this.findLessonWithOwner(id);
    if (lesson.module.course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    await this.prisma.lesson.delete({ where: { id } });
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

  private async findLessonWithOwner(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: { select: { formateurId: true } } },
        },
      },
    });
    if (!lesson) throw new NotFoundException(`Lesson ${id} not found`);
    return lesson;
  }
}
