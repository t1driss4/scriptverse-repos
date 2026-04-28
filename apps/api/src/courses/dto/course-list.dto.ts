import { Level } from '@prisma/client';

export interface FormateurPreviewDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

export interface CoursePreviewDto {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: Level;
  category: string | null;
  formateur: FormateurPreviewDto;
  enrollmentCount: number;
  moduleCount: number;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseListDto {
  data: CoursePreviewDto[];
  meta: PaginationMeta;
}
