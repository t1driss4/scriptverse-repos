import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  coursesApi: {
    findMine: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/auth-storage', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    tbody: ({
      children,
      className,
      variants: _variants,
      initial: _initial,
      animate: _animate,
    }: {
      children?: React.ReactNode;
      className?: string;
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
    }) => <tbody className={className}>{children}</tbody>,
    tr: ({
      children,
      className,
      variants: _variants,
    }: {
      children?: React.ReactNode;
      className?: string;
      variants?: unknown;
    }) => <tr className={className}>{children}</tr>,
  },
  useReducedMotion: () => false,
}));

vi.mock('@/components/layout/navbar', () => ({
  Navbar: () => <nav data-testid="navbar" />,
}));

vi.mock('@/components/animations', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerCards: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import FormateurPage from '../page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type { Level, LessonType } from '@/lib/types';

const mockReplace = vi.fn();

const formateurUser = {
  id: 'u1',
  email: 'formateur@test.com',
  role: 'FORMATEUR' as const,
};

const mockCourse1 = {
  id: 'c1',
  title: 'Introduction à TypeScript',
  description: 'Apprenez TypeScript',
  price: 0,
  level: 'DEBUTANT' as Level,
  published: true,
  formateurId: 'u1',
  modules: [
    {
      id: 'm1',
      title: 'Module 1',
      order: 1,
      courseId: 'c1',
      lessons: [{ id: 'l1', title: 'Leçon 1', type: 'VIDEO' as LessonType, order: 1, moduleId: 'm1' }],
    },
  ],
  _count: { enrollments: 42, modules: 1 },
};

const mockCourse2 = {
  id: 'c2',
  title: 'React Avancé',
  description: 'Maîtrisez React',
  price: 49,
  level: 'AVANCE' as Level,
  published: false,
  formateurId: 'u1',
  modules: [],
  _count: { enrollments: 0, modules: 0 },
};

describe('FormateurPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(getAccessToken).mockReturnValue('test-token');
    vi.mocked(coursesApi.findMine).mockResolvedValue([mockCourse1, mockCourse2]);
  });

  it('redirects non-formateur users to home', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u2', email: 'student@test.com', role: 'ETUDIANT' },
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('redirects unauthenticated users to home', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows skeleton without navbar while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
  });

  it('fetches courses on mount for formateur', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(coursesApi.findMine).toHaveBeenCalledWith('test-token');
    });
  });

  it('displays courses after loading', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
      expect(screen.getByText('React Avancé')).toBeInTheDocument();
    });
  });

  it('renders navbar after auth resolves', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });

  it('displays stat labels', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Cours créés')).toBeInTheDocument();
      expect(screen.getByText('Cours publiés')).toBeInTheDocument();
      expect(screen.getByText('Apprenants inscrits')).toBeInTheDocument();
    });
  });

  it('shows error banner when API fails', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMine).mockRejectedValue(new Error('Erreur réseau'));

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument();
    });
  });

  it('retries fetch when "Réessayer" is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMine)
      .mockRejectedValueOnce(new Error('Erreur réseau'))
      .mockResolvedValueOnce([mockCourse1]);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Réessayer'));

    await waitFor(() => {
      expect(screen.queryByText('Erreur réseau')).not.toBeInTheDocument();
      expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
    });
  });

  it('filters to published courses only', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'published' } });

    expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
    expect(screen.queryByText('React Avancé')).not.toBeInTheDocument();
  });

  it('filters to draft courses only', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('React Avancé')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'draft' } });

    expect(screen.queryByText('Introduction à TypeScript')).not.toBeInTheDocument();
    expect(screen.getByText('React Avancé')).toBeInTheDocument();
  });

  it('shows filter empty state when no courses match', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMine).mockResolvedValue([mockCourse1]);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'draft' } });

    expect(screen.getByText('Aucun cours ne correspond à ce filtre.')).toBeInTheDocument();
  });

  it('shows empty state when no courses exist', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMine).mockResolvedValue([]);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText("Vous n'avez pas encore créé de cours.")).toBeInTheDocument();
    });
  });

  it('toggles course publish status', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.update).mockResolvedValue({ ...mockCourse1, published: false });

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
    });

    // The published course shows "Dépublier"
    const depublierButtons = screen.getAllByText('Dépublier');
    fireEvent.click(depublierButtons[0]);

    await waitFor(() => {
      expect(coursesApi.update).toHaveBeenCalledWith('test-token', 'c1', { published: false });
    });
  });

  it('shows "…" indicator during publish toggle', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.update).mockImplementation(() => new Promise(() => {}));

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText('Introduction à TypeScript')).toBeInTheDocument();
    });

    const depublierButtons = screen.getAllByText('Dépublier');
    fireEvent.click(depublierButtons[0]);

    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('renders "Nouveau cours" link to create page', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /Nouveau cours/i });
    expect(link).toHaveAttribute('href', '/formateur/cours/nouveau');
  });

  it('shows course level and price info', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<FormateurPage />);

    await waitFor(() => {
      expect(screen.getByText(/Débutant · Gratuit/)).toBeInTheDocument();
      expect(screen.getByText(/Avancé · 49 €/)).toBeInTheDocument();
    });
  });
});
