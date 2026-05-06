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
    findMyOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  modulesApi: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  lessonsApi: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  quizApi: {
    findByModule: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    addQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    removeQuestion: vi.fn(),
  },
}));

vi.mock('@/lib/auth-storage', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('@/components/animations', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CourseEditorPage from '../page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, modulesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type { Level } from '@/lib/types';

const mockReplace = vi.fn();

const formateurUser = {
  id: 'u1',
  email: 'formateur@test.com',
  role: 'FORMATEUR' as const,
};

const mockModule = {
  id: 'm1',
  title: 'Module 1',
  order: 1,
  courseId: 'c1',
  lessons: [],
};

const mockCourse = {
  id: 'c1',
  title: 'Cours de TypeScript',
  description: 'Apprenez TypeScript de zéro',
  price: 0,
  level: 'DEBUTANT' as Level,
  published: false,
  formateurId: 'u1',
  category: 'Développement Web',
  modules: [mockModule],
  _count: { enrollments: 0, modules: 1 },
};

const mockCoursePublished = { ...mockCourse, published: true };

describe('CourseEditorPage', () => {
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
    vi.mocked(coursesApi.findMyOne).mockResolvedValue(mockCourse);
  });

  // ─── Auth guard ─────────────────────────────────

  it('redirects non-formateur to home', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u2', email: 'student@test.com', role: 'ETUDIANT' },
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('redirects unauthenticated user to home', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows skeleton while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    expect(screen.queryByRole('button', { name: /Sauvegarder/i })).not.toBeInTheDocument();
  });

  // ─── Creation mode (id === 'nouveau') ───────────

  it('shows "Nouveau cours" in creation mode', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'nouveau' }} />);

    expect(screen.getByText('Nouveau cours')).toBeInTheDocument();
  });

  it('does not call findMyOne in creation mode', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'nouveau' }} />);

    expect(coursesApi.findMyOne).not.toHaveBeenCalled();
  });

  it('shows tip to save basic info first in creation mode', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'nouveau' }} />);

    expect(screen.getByText(/Sauvegardez d'abord les informations de base/)).toBeInTheDocument();
  });

  it('shows validation error when saving without title or description', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'nouveau' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' }));

    expect(screen.getByText('Titre et description sont obligatoires.')).toBeInTheDocument();
  });

  it('calls coursesApi.create and redirects on successful creation', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.create).mockResolvedValue({ ...mockCourse, id: 'new-id' });

    render(<CourseEditorPage params={{ id: 'nouveau' }} />);

    fireEvent.change(screen.getByPlaceholderText('ex : JavaScript Moderne — ES2024'), {
      target: { value: 'Mon nouveau cours' },
    });
    fireEvent.change(screen.getByPlaceholderText('Décrivez votre cours en quelques phrases…'), {
      target: { value: 'Une description de cours' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' }));

    await waitFor(() => {
      expect(coursesApi.create).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          title: 'Mon nouveau cours',
          description: 'Une description de cours',
        }),
      );
      expect(mockReplace).toHaveBeenCalledWith('/formateur/cours/new-id');
    });
  });

  // ─── Edit mode (id !== 'nouveau') ───────────────

  it('calls findMyOne with token and course id on mount', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(coursesApi.findMyOne).toHaveBeenCalledWith('test-token', 'c1');
    });
  });

  it('populates form with course title and description after loading', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Cours de TypeScript')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Apprenez TypeScript de zéro')).toBeInTheDocument();
    });
  });

  it('shows error banner when findMyOne fails', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMyOne).mockRejectedValue(new Error('Erreur réseau'));

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument();
    });
  });

  it('shows "Sauvegardé" feedback after successful update', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.update).mockResolvedValue(mockCourse);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Cours de TypeScript')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' }));

    await waitFor(() => {
      expect(screen.getByText('Sauvegardé')).toBeInTheDocument();
    });
  });

  it('shows publish checklist items', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Titre renseigné')).toBeInTheDocument();
      expect(screen.getByText('Description complétée')).toBeInTheDocument();
      expect(screen.getByText('Au moins 1 module')).toBeInTheDocument();
      expect(screen.getByText('Au moins 1 leçon')).toBeInTheDocument();
    });
  });

  it('shows publish buttons for unpublished course', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Publier')).toBeInTheDocument();
      expect(screen.getByText('Publier le cours')).toBeInTheDocument();
    });
  });

  it('header publish button is disabled when course has no lessons', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Publier')).toBeInTheDocument();
    });

    expect(screen.getByText('Publier').closest('button')).toBeDisabled();
  });

  it('shows "Dépublier" for published course', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMyOne).mockResolvedValue(mockCoursePublished);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Dépublier')).toBeInTheDocument();
      expect(screen.getByText('Dépublier le cours')).toBeInTheDocument();
    });
  });

  it('calls coursesApi.update with published:false when depublishing', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.findMyOne).mockResolvedValue(mockCoursePublished);
    vi.mocked(coursesApi.update).mockResolvedValue({ ...mockCoursePublished, published: false });

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Dépublier')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dépublier'));

    await waitFor(() => {
      expect(coursesApi.update).toHaveBeenCalledWith('test-token', 'c1', { published: false });
    });
  });

  it('shows delete confirmation dialog when "Supprimer définitivement" is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Supprimer définitivement')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Supprimer définitivement'));

    expect(screen.getByText('Confirmer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('calls coursesApi.remove and redirects to /formateur on delete confirm', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(coursesApi.remove).mockResolvedValue(undefined);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Supprimer définitivement')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Supprimer définitivement'));
    fireEvent.click(screen.getByText('Confirmer'));

    await waitFor(() => {
      expect(coursesApi.remove).toHaveBeenCalledWith('test-token', 'c1');
      expect(mockReplace).toHaveBeenCalledWith('/formateur');
    });
  });

  it('cancels delete flow when "Annuler" is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Supprimer définitivement')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Supprimer définitivement'));
    expect(screen.getByText('Confirmer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Annuler'));

    expect(screen.queryByText('Confirmer')).not.toBeInTheDocument();
    expect(screen.getByText('Supprimer définitivement')).toBeInTheDocument();
  });

  it('calls modulesApi.create when "Ajouter un module" is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: formateurUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(modulesApi.create).mockResolvedValue({
      id: 'm2',
      title: 'Module 2',
      order: 2,
      courseId: 'c1',
      lessons: [],
    });

    render(<CourseEditorPage params={{ id: 'c1' }} />);

    await waitFor(() => {
      expect(screen.getByText('Ajouter un module')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ajouter un module'));

    await waitFor(() => {
      expect(modulesApi.create).toHaveBeenCalledWith(
        'test-token',
        'c1',
        expect.objectContaining({ title: 'Module 2' }),
      );
    });
  });
});
