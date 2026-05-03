import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { CourseContentDto } from './dto/course-content.dto';
import { CourseListQueryDto } from './dto/course-list-query.dto';
import { CourseListDto } from './dto/course-list.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(formateurId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: { ...dto, formateurId },
      include: {
        formateur: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(query: CourseListQueryDto = {}): Promise<CourseListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice must not be greater than maxPrice');
    }

    const where: Prisma.CourseWhereInput = {
      published: true,
      ...(query.level && { level: query.level }),
      ...(query.category && { category: query.category }),
      ...(query.formateurId && { formateurId: query.formateurId }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          price: true,
          level: true,
          category: true,
          createdAt: true,
          formateur: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          _count: { select: { enrollments: true, modules: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        price: c.price,
        level: c.level,
        category: c.category,
        formateur: c.formateur,
        enrollmentCount: c._count.enrollments,
        moduleCount: c._count.modules,
        createdAt: c.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async findMyOne(id: string, formateurId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) throw new NotFoundException();
    if (course.formateurId !== formateurId) throw new ForbiddenException();

    return course;
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
    const courseExists = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!courseExists) throw new NotFoundException();

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    const [course, progressRecords, attempts] = await this.prisma
      .$transaction([
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
      ])
      .catch((e: unknown) => {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
          throw new NotFoundException();
        }
        throw e;
      });

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
    if (!course) throw new NotFoundException();
    if (course.formateurId !== formateurId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return course;
  }
}
