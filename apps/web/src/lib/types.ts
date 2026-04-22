export type Role = 'APPRENANT' | 'FORMATEUR' | 'ADMIN';
export type Level = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  courseId: string;
  quiz?: Quiz;
  completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  level: Level;
  category: string;
  status: CourseStatus;
  formateur: User;
  chapters: Chapter[];
  studentsCount: number;
  rating: number;
  duration: number;
}

export interface Enrollment {
  courseId: string;
  course: Course;
  progress: number;
  completedChapters: string[];
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  completedAt: string;
}
