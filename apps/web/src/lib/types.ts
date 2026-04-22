export type Role = 'APPRENANT' | 'FORMATEUR' | 'ADMIN';
export type Level = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
export type LessonType = 'VIDEO';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  url?: string;
  order: number;
  moduleId: string;
  /** UI-only: whether the learner has completed this lesson */
  completed?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  level: Level;
  category?: string;
  published: boolean;
  formateurId: string;
  formateur?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  modules: CourseModule[];
  _count?: { enrollments: number; modules: number };
}

export interface Enrollment {
  courseId: string;
  course: Course;
  progress: number;
  completedModules: string[];
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

export interface QuizAttempt {
  quizId: string;
  score: number;
  completedAt: string;
}
