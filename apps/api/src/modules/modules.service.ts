import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: string, formateurId: string, dto: CreateModuleDto) {
    await this.assertCourseOwner(courseId, formateurId);
    return this.prisma.module.create({
      data: { ...dto, courseId },
      include: { lessons: true },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.module.findMany({
      where: { courseId },
      include: { lessons: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const mod = await this.prisma.module.findUnique({
      where: { id },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
    if (!mod) throw new NotFoundException(`Module ${id} not found`);
    return mod;
  }

  async update(id: string, formateurId: string, dto: UpdateModuleDto) {
    const mod = await this.findModuleWithOwner(id);
    if (mod.course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  async remove(id: string, formateurId: string) {
    const mod = await this.findModuleWithOwner(id);
    if (mod.course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    await this.prisma.module.delete({ where: { id } });
  }

  private async assertCourseOwner(courseId: string, formateurId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    if (course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
  }

  private async findModuleWithOwner(id: string) {
    const mod = await this.prisma.module.findUnique({
      where: { id },
      include: { course: { select: { formateurId: true } } },
    });
    if (!mod) throw new NotFoundException(`Module ${id} not found`);
    return mod;
  }
}
