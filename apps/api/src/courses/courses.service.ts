import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { CourseContentDto } from './dto/course-content.dto';

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

  async findOne(id: string): Promise<CourseDetailDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        formateur: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, type: true, order: true },
            },
            quiz: { select: { id: true, title: true } },
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course || !course.published) throw new NotFoundException();

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      level: course.level,
      category: course.category,
      published: course.published,
      enrollmentsCount: course._count.enrollments,
      formateur: course.formateur,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessonsCount: m._count.lessons,
        hasQuiz: m.quiz !== null,
        lessons: m.lessons,
      })),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }

  async findContent(courseId: string, userId: string): Promise<CourseContentDto> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    const [course, progressRecords, attempts] = await this.prisma.$transaction([
      this.prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: { orderBy: { order: 'asc' } },
              quiz: {
                include: {
                  questions: {
                    orderBy: { order: 'asc' },
                    select: {
                      id: true,
                      question: true,
                      options: true,
                      order: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.moduleProgress.findMany({
        where: { userId, module: { courseId } },
        select: { moduleId: true, completedAt: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId, quiz: { module: { courseId } } },
        orderBy: { completedAt: 'desc' },
        select: { quizId: true, score: true, completedAt: true },
      }),
    ]);

    const progressMap = new Map(
      progressRecords.map((p) => [p.moduleId, p.completedAt] as [string, Date]),
    );

    // attempts are ordered desc — first occurrence per quizId is the latest
    const latestAttemptByQuizId = new Map<string, { score: number; completedAt: string }>();
    for (const a of attempts) {
      if (!latestAttemptByQuizId.has(a.quizId)) {
        latestAttemptByQuizId.set(a.quizId, {
          score: a.score,
          completedAt: a.completedAt.toISOString(),
        });
      }
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      level: course.level,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        completedAt: progressMap.has(m.id) ? progressMap.get(m.id)!.toISOString() : null,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          order: l.order,
          url: l.url ?? null,
        })),
        quiz: m.quiz
          ? {
              id: m.quiz.id,
              title: m.quiz.title,
              questions: m.quiz.questions,
              latestAttempt: latestAttemptByQuizId.get(m.quiz.id) ?? null,
            }
          : null,
      })),
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      },
    };
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
