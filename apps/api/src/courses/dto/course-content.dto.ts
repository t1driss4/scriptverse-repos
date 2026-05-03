import { Level, LessonType } from '@prisma/client';

export interface LessonContentDto {
  id: string;
  title: string;
  type: LessonType;
  order: number;
  url: string | null;
}

export interface QuizContentDto {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    order: number;
  }>;
  latestAttempt: { score: number; completedAt: string } | null;
}

export interface ModuleContentDto {
  id: string;
  title: string;
  order: number;
  completedAt: string | null;
  lessons: LessonContentDto[];
  quiz: QuizContentDto | null;
}

export interface CourseContentDto {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  level: Level;
  modules: ModuleContentDto[];
  enrollment: {
    id: string;
    enrolledAt: string;
  };
}
