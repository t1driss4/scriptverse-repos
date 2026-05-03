import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(userId: string, dto: CreateEnrollmentDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
      create: { userId, courseId: dto.courseId },
      update: {},
    });
  }

  async findMine(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            formateur: { select: { id: true, firstName: true, lastName: true } },
            modules: { select: { id: true } },
            _count: { select: { enrollments: true, modules: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const moduleProgresses = await this.prisma.moduleProgress.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const completedModuleIds = new Set(moduleProgresses.map((mp: { moduleId: string }) => mp.moduleId));

    return enrollments.map((e: {
      courseId: string;
      enrolledAt: Date;
      course: { modules: { id: string }[] } & Record<string, unknown>;
    }) => {
      const totalModules = e.course.modules.length;
      const completed = e.course.modules.filter((m) => completedModuleIds.has(m.id));
      const progress = totalModules > 0 ? Math.round((completed.length / totalModules) * 100) : 0;

      return {
        courseId: e.courseId,
        enrolledAt: e.enrolledAt,
        course: e.course,
        progress,
        completedModules: completed.map((m) => m.id),
      };
    });
  }

  async findOne(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: { include: { modules: { select: { id: true } } } },
      },
    });
    if (!enrollment) throw new NotFoundException(`Enrollment not found`);

    const moduleProgresses = await this.prisma.moduleProgress.findMany({
      where: { userId, moduleId: { in: enrollment.course.modules.map((m: { id: string }) => m.id) } },
      select: { moduleId: true },
    });
    const completedModules = moduleProgresses.map((mp: { moduleId: string }) => mp.moduleId);
    const totalModules = enrollment.course.modules.length;
    const progress = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

    return {
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt,
      progress,
      completedModules,
    };
  }
}
