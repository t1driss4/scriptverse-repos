import { apiRequest } from './api-client';
import type { Course, CourseModule, Lesson, Enrollment, EnrollmentProgress } from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw = body?.message;
    const msg = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(msg || `Erreur ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  signup(data: { email: string; password: string; role?: string }) {
    return request<AuthTokens>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }) {
    return request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  },

  logout(accessToken: string) {
    return request<void>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  resetPassword(email: string) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function bearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ─────────────────────────────────────────────
// Payload types
// ─────────────────────────────────────────────

export interface CoursePayload {
  title: string;
  description: string;
  published?: boolean;
  thumbnail?: string;
  price?: number;
  level?: string;
  category?: string;
}

export interface ModulePayload {
  title: string;
  order: number;
}

export interface LessonPayload {
  title: string;
  type: string;
  url?: string;
  order: number;
}

// ─────────────────────────────────────────────
// Courses API
// ─────────────────────────────────────────────

export const coursesApi = {
  findAll() {
    return request<Course[]>('/courses');
  },

  findMine(token: string) {
    return request<Course[]>('/courses/mine', { headers: bearer(token) });
  },

  findOne(id: string) {
    return request<Course>(`/courses/${id}`);
  },

  create(token: string, data: CoursePayload) {
    return request<Course>('/courses', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  update(token: string, id: string, data: Partial<CoursePayload>) {
    return request<Course>(`/courses/${id}`, {
      method: 'PATCH',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  remove(token: string, id: string) {
    return request<void>(`/courses/${id}`, {
      method: 'DELETE',
      headers: bearer(token),
    });
  },
};

// ─────────────────────────────────────────────
// Modules API
// ─────────────────────────────────────────────

export const modulesApi = {
  findByCourse(courseId: string) {
    return request<CourseModule[]>(`/courses/${courseId}/modules`);
  },

  findOne(id: string) {
    return request<CourseModule>(`/modules/${id}`);
  },

  create(token: string, courseId: string, data: ModulePayload) {
    return request<CourseModule>(`/courses/${courseId}/modules`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  update(token: string, id: string, data: Partial<ModulePayload>) {
    return request<CourseModule>(`/modules/${id}`, {
      method: 'PATCH',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  remove(token: string, id: string) {
    return request<void>(`/modules/${id}`, {
      method: 'DELETE',
      headers: bearer(token),
    });
  },
};

// ─────────────────────────────────────────────
// Lessons API
// ─────────────────────────────────────────────

export const lessonsApi = {
  findByModule(moduleId: string) {
    return request<Lesson[]>(`/modules/${moduleId}/lessons`);
  },

  findOne(id: string) {
    return request<Lesson>(`/lessons/${id}`);
  },

  create(token: string, moduleId: string, data: LessonPayload) {
    return request<Lesson>(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  update(token: string, id: string, data: Partial<LessonPayload>) {
    return request<Lesson>(`/lessons/${id}`, {
      method: 'PATCH',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  remove(token: string, id: string) {
    return request<void>(`/lessons/${id}`, {
      method: 'DELETE',
      headers: bearer(token),
    });
  },
};

// ─────────────────────────────────────────────
// Enrollments API
// ─────────────────────────────────────────────

export const enrollmentsApi = {
  enroll(courseId: string) {
    return apiRequest<{ courseId: string; enrolledAt: string }>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  findMine() {
    return apiRequest<Enrollment[]>('/enrollments/mine');
  },

  findOne(courseId: string) {
    return apiRequest<EnrollmentProgress>(`/enrollments/mine/${courseId}`);
  },
};
