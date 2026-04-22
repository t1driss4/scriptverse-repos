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
  /** List all published courses */
  findAll() {
    return request<unknown[]>('/courses');
  },

  /** List courses belonging to the authenticated formateur */
  findMine(token: string) {
    return request<unknown[]>('/courses/mine', { headers: bearer(token) });
  },

  /** Get a course with its modules and lessons */
  findOne(id: string) {
    return request<unknown>(`/courses/${id}`);
  },

  /** Create a new course */
  create(token: string, data: CoursePayload) {
    return request<unknown>('/courses', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  /** Update a course */
  update(token: string, id: string, data: Partial<CoursePayload>) {
    return request<unknown>(`/courses/${id}`, {
      method: 'PATCH',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  /** Delete a course */
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
  /** List all modules for a course */
  findByCourse(courseId: string) {
    return request<unknown[]>(`/courses/${courseId}/modules`);
  },

  /** Get a module with its lessons */
  findOne(id: string) {
    return request<unknown>(`/modules/${id}`);
  },

  /** Create a module inside a course */
  create(token: string, courseId: string, data: ModulePayload) {
    return request<unknown>(`/courses/${courseId}/modules`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  /** Update a module */
  update(token: string, id: string, data: Partial<ModulePayload>) {
    return request<unknown>(`/modules/${id}`, {
      method: 'PATCH',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  /** Delete a module */
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
  /** List all lessons for a module */
  findByModule(moduleId: string) {
    return request<unknown[]>(`/modules/${moduleId}/lessons`);
  },

  /** Get a single lesson */
  findOne(id: string) {
    return request<unknown>(`/lessons/${id}`);
  },

  /** Create a lesson inside a module */
  create(token: string, moduleId: string, data: LessonPayload) {
    return request<unknown>(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  /** Update a lesson */
  update(token: string, id: string, data: Partial<LessonPayload>) {
    return request<unknown>(`/lessons/${id}`, {
      method: 'PATCH',
      headers: bearer(token),
      body: JSON.stringify(data),
    });
  },

  /** Delete a lesson */
  remove(token: string, id: string) {
    return request<void>(`/lessons/${id}`, {
      method: 'DELETE',
      headers: bearer(token),
    });
  },
};
