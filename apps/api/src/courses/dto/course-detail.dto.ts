import { Level, LessonType } from '@prisma/client';

export interface LessonPreviewDto {
  id: string;
  title: string;
  type: LessonType;
  order: number;
}

export interface ModulePreviewDto {
  id: string;
  title: string;
  order: number;
  lessonsCount: number;
  hasQuiz: boolean;
  lessons: LessonPreviewDto[];
}

export interface CourseDetailDto {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: Level;
  category: string | null;
  published: boolean;
  enrollmentsCount: number;
  formateur: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  modules: ModulePreviewDto[];
  createdAt: string;
  updatedAt: string;
}
