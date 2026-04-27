import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api-client', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../api-client';
import { authApi, coursesApi, modulesApi, lessonsApi, enrollmentsApi } from '../api';

describe('api.ts', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.mocked(apiRequest).mockReset();
  });

  function mockOk(body: unknown, status = 200) {
    mockFetch.mockResolvedValue({
      ok: true,
      status,
      json: () => Promise.resolve(body),
    });
  }

  function mockNoContent() {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) });
  }

  function mockError(status: number, message: unknown) {
    mockFetch.mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    });
  }

  // ─── authApi ────────────────────────────────────────────────────────────────

  describe('authApi.login', () => {
    it('sends POST to /auth/login', async () => {
      mockOk({ accessToken: 'acc', refreshToken: 'ref' });
      await authApi.login({ email: 'a@a.com', password: 'pass' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('returns auth tokens', async () => {
      mockOk({ accessToken: 'acc', refreshToken: 'ref' });
      const result = await authApi.login({ email: 'a@a.com', password: 'pass' });
      expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' });
    });

    it('throws with string error message from server', async () => {
      mockError(401, 'Unauthorized');
      await expect(authApi.login({ email: 'x', password: 'x' })).rejects.toThrow('Unauthorized');
    });

    it('throws with first item when server returns array message', async () => {
      mockError(400, ['email must be an email']);
      await expect(authApi.login({ email: '', password: '' })).rejects.toThrow(
        'email must be an email',
      );
    });

    it('throws fallback message when server body has no message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });
      await expect(authApi.login({ email: 'x', password: 'x' })).rejects.toThrow('Erreur 500');
    });
  });

  describe('authApi.signup', () => {
    it('sends POST to /auth/signup', async () => {
      mockOk({ accessToken: 'a', refreshToken: 'r' });
      await authApi.signup({ email: 'a@a.com', password: 'pass' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signup'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('authApi.refresh', () => {
    it('sends POST to /auth/refresh with Bearer token', async () => {
      mockOk({ accessToken: 'new', refreshToken: 'new-ref' });
      await authApi.refresh('my-refresh');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer my-refresh' }),
        }),
      );
    });
  });

  describe('authApi.logout', () => {
    it('sends POST to /auth/logout with Bearer token', async () => {
      mockNoContent();
      await authApi.logout('my-access');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer my-access' }),
        }),
      );
    });

    it('returns undefined for 204 response', async () => {
      mockNoContent();
      const result = await authApi.logout('tok');
      expect(result).toBeUndefined();
    });
  });

  describe('authApi.resetPassword', () => {
    it('sends POST to /auth/reset-password', async () => {
      mockOk({ message: 'Email sent' });
      await authApi.resetPassword('user@example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // ─── coursesApi ─────────────────────────────────────────────────────────────

  describe('coursesApi.findAll', () => {
    it('fetches GET /courses', async () => {
      mockOk([{ id: 'c1' }]);
      const result = await coursesApi.findAll();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses'),
        expect.any(Object),
      );
      expect(result).toEqual([{ id: 'c1' }]);
    });
  });

  describe('coursesApi.findMine', () => {
    it('fetches /courses/mine with Authorization header', async () => {
      mockOk([]);
      await coursesApi.findMine('tok123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses/mine'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer tok123' }),
        }),
      );
    });
  });

  describe('coursesApi.findOne', () => {
    it('fetches /courses/:id', async () => {
      mockOk({ id: 'c1' });
      await coursesApi.findOne('c1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses/c1'),
        expect.any(Object),
      );
    });
  });

  describe('coursesApi.create', () => {
    it('sends POST /courses with token and body', async () => {
      mockOk({ id: 'c2' });
      await coursesApi.create('tok', { title: 'T', description: 'D' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('coursesApi.update', () => {
    it('sends PATCH /courses/:id', async () => {
      mockOk({ id: 'c1' });
      await coursesApi.update('tok', 'c1', { title: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses/c1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('coursesApi.remove', () => {
    it('sends DELETE /courses/:id and returns undefined', async () => {
      mockNoContent();
      const result = await coursesApi.remove('tok', 'c1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses/c1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(result).toBeUndefined();
    });
  });

  // ─── modulesApi ─────────────────────────────────────────────────────────────

  describe('modulesApi.findByCourse', () => {
    it('fetches /courses/:id/modules', async () => {
      mockOk([]);
      await modulesApi.findByCourse('c1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses/c1/modules'),
        expect.any(Object),
      );
    });
  });

  describe('modulesApi.findOne', () => {
    it('fetches /modules/:id', async () => {
      mockOk({ id: 'm1' });
      await modulesApi.findOne('m1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/modules/m1'),
        expect.any(Object),
      );
    });
  });

  describe('modulesApi.create', () => {
    it('sends POST /courses/:id/modules', async () => {
      mockOk({ id: 'm1' });
      await modulesApi.create('tok', 'c1', { title: 'Mod', order: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/courses/c1/modules'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('modulesApi.update', () => {
    it('sends PATCH /modules/:id', async () => {
      mockOk({ id: 'm1' });
      await modulesApi.update('tok', 'm1', { title: 'New' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/modules/m1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('modulesApi.remove', () => {
    it('sends DELETE /modules/:id', async () => {
      mockNoContent();
      await modulesApi.remove('tok', 'm1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/modules/m1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  // ─── lessonsApi ─────────────────────────────────────────────────────────────

  describe('lessonsApi.findByModule', () => {
    it('fetches /modules/:id/lessons', async () => {
      mockOk([]);
      await lessonsApi.findByModule('m1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/modules/m1/lessons'),
        expect.any(Object),
      );
    });
  });

  describe('lessonsApi.findOne', () => {
    it('fetches /lessons/:id', async () => {
      mockOk({ id: 'l1' });
      await lessonsApi.findOne('l1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/l1'),
        expect.any(Object),
      );
    });
  });

  describe('lessonsApi.create', () => {
    it('sends POST /modules/:id/lessons', async () => {
      mockOk({ id: 'l1' });
      await lessonsApi.create('tok', 'm1', { title: 'L', type: 'VIDEO', order: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/modules/m1/lessons'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('lessonsApi.update', () => {
    it('sends PATCH /lessons/:id', async () => {
      mockOk({ id: 'l1' });
      await lessonsApi.update('tok', 'l1', { title: 'New' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/l1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('lessonsApi.remove', () => {
    it('sends DELETE /lessons/:id', async () => {
      mockNoContent();
      await lessonsApi.remove('tok', 'l1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/lessons/l1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  // ─── enrollmentsApi ─────────────────────────────────────────────────────────

  describe('enrollmentsApi.enroll', () => {
    it('calls apiRequest POST /enrollments with courseId body', async () => {
      vi.mocked(apiRequest).mockResolvedValue({ courseId: 'c1', enrolledAt: '2024-01-01' });
      const result = await enrollmentsApi.enroll('c1');
      expect(apiRequest).toHaveBeenCalledWith(
        '/enrollments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ courseId: 'c1' }),
        }),
      );
      expect(result).toEqual({ courseId: 'c1', enrolledAt: '2024-01-01' });
    });
  });

  describe('enrollmentsApi.findMine', () => {
    it('calls apiRequest GET /enrollments/mine', async () => {
      vi.mocked(apiRequest).mockResolvedValue([]);
      const result = await enrollmentsApi.findMine();
      expect(apiRequest).toHaveBeenCalledWith('/enrollments/mine');
      expect(result).toEqual([]);
    });
  });

  describe('enrollmentsApi.findOne', () => {
    it('calls apiRequest GET /enrollments/mine/:courseId', async () => {
      const progress = {
        courseId: 'c1',
        enrolledAt: '2024-01-01',
        progress: 50,
        completedModules: ['m1'],
      };
      vi.mocked(apiRequest).mockResolvedValue(progress);
      const result = await enrollmentsApi.findOne('c1');
      expect(apiRequest).toHaveBeenCalledWith('/enrollments/mine/c1');
      expect(result).toEqual(progress);
    });
  });
});
