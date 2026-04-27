import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/lib/api', () => ({
  enrollmentsApi: {
    findOne: vi.fn(),
    enroll: vi.fn(),
  },
}));

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentsApi } from '@/lib/api';
import { AuthExpiredError, ApiError } from '@/lib/api-client';
import { useEnrollment } from '../use-enrollment';

const mockPush = vi.fn();

const loggedInUser = { id: 'u1', email: 'u@u.com', role: 'APPRENANT' as const };

const baseAuthValue = {
  user: null as ReturnType<typeof useAuth>['user'],
  isLoading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
};

const progressData = {
  courseId: 'c1',
  enrolledAt: '2024-01-01',
  progress: 0,
  completedModules: [] as string[],
};

describe('useEnrollment', () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: null });
    vi.mocked(enrollmentsApi.findOne).mockResolvedValue({ ...progressData });
    vi.mocked(enrollmentsApi.enroll).mockResolvedValue({ ...progressData });
  });

  it('returns default state before any async resolution', () => {
    const { result } = renderHook(() => useEnrollment('c1'));
    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch enrollment when user is null', async () => {
    renderHook(() => useEnrollment('c1'));
    await waitFor(() => {});
    expect(enrollmentsApi.findOne).not.toHaveBeenCalled();
  });

  it('sets isEnrolled and progress when findOne succeeds', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.findOne).mockResolvedValue({ ...progressData, progress: 75 });

    const { result } = renderHook(() => useEnrollment('c1'));

    await waitFor(() => expect(result.current.isEnrolled).toBe(true));
    expect(result.current.progress).toBe(75);
    expect(enrollmentsApi.findOne).toHaveBeenCalledWith('c1');
  });

  it('sets isEnrolled=false on ApiError 404 from findOne', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.findOne).mockRejectedValue(new ApiError(404, 'Not found'));

    const { result } = renderHook(() => useEnrollment('c1'));

    await waitFor(() => {
      expect(result.current.isEnrolled).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  it('enroll() calls enrollmentsApi.enroll then re-fetches findOne', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });

    const { result } = renderHook(() => useEnrollment('c1'));
    await waitFor(() => {});

    await act(async () => { await result.current.enroll(); });

    expect(enrollmentsApi.enroll).toHaveBeenCalledWith('c1');
    expect(enrollmentsApi.findOne).toHaveBeenCalledWith('c1');
  });

  it('redirects to /auth/login on AuthExpiredError', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll).mockRejectedValue(new AuthExpiredError());

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
    expect(result.current.error).toBeNull();
  });

  it('sets error for ApiError 404', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll).mockRejectedValue(new ApiError(404, 'Not found'));

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(result.current.error).toBe('Ce cours est introuvable.');
  });

  it('sets error for ApiError 409', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll).mockRejectedValue(new ApiError(409, 'Conflict'));

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(result.current.error).toBe('Vous êtes déjà inscrit à ce cours.');
  });

  it('sets error for ApiError 403', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll).mockRejectedValue(new ApiError(403, 'Forbidden'));

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(result.current.error).toBe('Accès refusé.');
  });

  it('sets generic error for other ApiError statuses', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll).mockRejectedValue(new ApiError(500, 'Server error'));

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(result.current.error).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  it("sets fallback error for non-ApiError", async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(result.current.error).toBe("Erreur lors de l'inscription");
  });

  it('isLoading resets to false after enroll completes', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });

    expect(result.current.isLoading).toBe(false);
  });

  it('clears error before each enroll attempt', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(enrollmentsApi.enroll)
      .mockRejectedValueOnce(new ApiError(409, 'Conflict'))
      .mockResolvedValueOnce({ ...progressData });

    const { result } = renderHook(() => useEnrollment('c1'));
    await act(async () => { await result.current.enroll(); });
    expect(result.current.error).toBe('Vous êtes déjà inscrit à ce cours.');

    await act(async () => { await result.current.enroll(); });
    expect(result.current.error).toBeNull();
  });
});
