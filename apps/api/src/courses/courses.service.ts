import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(formateurId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: { ...dto, formateurId },
      include: {
        formateur: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.course.findMany({
      where: { published: true },
      include: {
        formateur: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMine(formateurId: string) {
    return this.prisma.course.findMany({
      where: { formateurId },
      include: {
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        formateur: { select: { id: true, firstName: true, lastName: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  async update(id: string, formateurId: string, dto: UpdateCourseDto) {
    await this.assertOwner(id, formateurId);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async remove(id: string, formateurId: string) {
    await this.assertOwner(id, formateurId);
    await this.prisma.course.delete({ where: { id } });
  }

  private async assertOwner(courseId: string, formateurId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    if (course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return course;
  }
}
