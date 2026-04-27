import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/use-enrollment', () => ({ useEnrollment: vi.fn() }));

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollment } from '@/hooks/use-enrollment';
import { EnrollButton } from '../EnrollButton';

const mockPush = vi.fn();
const mockEnroll = vi.fn();

const baseEnrollmentState = {
  isEnrolled: false,
  progress: 0,
  enroll: mockEnroll,
  isLoading: false,
  error: null as string | null,
};

const baseAuthValue = {
  user: null as ReturnType<typeof useAuth>['user'],
  isLoading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
};

const loggedInUser = { id: 'u1', email: 'u@u.com', role: 'APPRENANT' as const };

describe('EnrollButton', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockEnroll.mockReset().mockResolvedValue(undefined);
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: loggedInUser });
    vi.mocked(useEnrollment).mockReturnValue({ ...baseEnrollmentState });
  });

  // ─── Loading state ────────────────────────────────────────────────────────────

  it('renders a disabled loading button while isLoading is true', () => {
    vi.mocked(useEnrollment).mockReturnValue({ ...baseEnrollmentState, isLoading: true });
    render(<EnrollButton courseId="c1" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Chargement');
  });

  // ─── Enrolled states ──────────────────────────────────────────────────────────

  it('renders "Continuer le cours" link when enrolled and firstLessonId is provided', () => {
    vi.mocked(useEnrollment).mockReturnValue({ ...baseEnrollmentState, isEnrolled: true });
    render(<EnrollButton courseId="c1" firstLessonId="l1" />);
    const link = screen.getByRole('link', { name: 'Continuer le cours' });
    expect(link).toHaveAttribute('href', '/cours/c1/chapitre/l1');
  });

  it('renders "Accéder au cours" link when enrolled without firstLessonId', () => {
    vi.mocked(useEnrollment).mockReturnValue({ ...baseEnrollmentState, isEnrolled: true });
    render(<EnrollButton courseId="c1" />);
    const link = screen.getByRole('link', { name: 'Accéder au cours' });
    expect(link).toHaveAttribute('href', '/cours/c1');
  });

  // ─── Not enrolled state ───────────────────────────────────────────────────────

  it('renders enroll button when not enrolled', () => {
    render(<EnrollButton courseId="c1" />);
    expect(screen.getByRole('button', { name: /inscrire/i })).toBeInTheDocument();
  });

  it('renders error message above the enroll button when error is set', () => {
    vi.mocked(useEnrollment).mockReturnValue({
      ...baseEnrollmentState,
      error: 'Vous êtes déjà inscrit à ce cours.',
    });
    render(<EnrollButton courseId="c1" />);
    expect(screen.getByText('Vous êtes déjà inscrit à ce cours.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inscrire/i })).toBeInTheDocument();
  });

  it('does not render error paragraph when error is null', () => {
    render(<EnrollButton courseId="c1" />);
    expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument();
  });

  // ─── Click behavior ───────────────────────────────────────────────────────────

  it('redirects to /auth/login when user is not logged in', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...baseAuthValue, user: null });
    render(<EnrollButton courseId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: /inscrire/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'));
    expect(mockEnroll).not.toHaveBeenCalled();
  });

  it('calls enroll() when user is logged in', async () => {
    render(<EnrollButton courseId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: /inscrire/i }));
    await waitFor(() => expect(mockEnroll).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('passes courseId to useEnrollment', () => {
    render(<EnrollButton courseId="my-course" />);
    expect(useEnrollment).toHaveBeenCalledWith('my-course');
  });
});
