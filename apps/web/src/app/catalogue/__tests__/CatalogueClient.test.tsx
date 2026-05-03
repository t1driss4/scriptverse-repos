import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerCards: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/mock-data', () => ({
  CATEGORIES: ['Tous', 'Dev', 'Design'],
  LEVEL_LABELS: { DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé' },
}));

vi.mock('@/components/course-card', () => ({
  CourseCard: ({ course }: { course: { id: string; title: string } }) => (
    <div data-testid="course-card" data-id={course.id}>
      {course.title}
    </div>
  ),
}));

import { CatalogueClient } from '../CatalogueClient';
import type { Course } from '@/lib/types';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    title: 'Course Title',
    description: 'A description',
    price: 0,
    level: 'DEBUTANT',
    category: 'Dev',
    published: true,
    formateurId: 'f1',
    ...overrides,
  };
}

function makeCourses(count: number): Course[] {
  return Array.from({ length: count }, (_, i) =>
    makeCourse({ id: `c${i + 1}`, title: `Course ${i + 1}` }),
  );
}

describe('CatalogueClient', () => {
  const defaultCourses = [
    makeCourse({ id: 'c1', title: 'React Basics', description: 'Learn React', price: 0, level: 'DEBUTANT', category: 'Dev' }),
    makeCourse({ id: 'c2', title: 'Vue Advanced', description: 'Advanced Vue', price: 30, level: 'INTERMEDIAIRE', category: 'Dev' }),
    makeCourse({ id: 'c3', title: 'Figma Design', description: 'Design with Figma', price: 60, level: 'AVANCE', category: 'Design' }),
  ];

  it('renders the hero banner with total course count', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    expect(screen.getByText(/3 cours disponibles/)).toBeInTheDocument();
  });

  it('renders all courses initially', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    expect(screen.getAllByTestId('course-card')).toHaveLength(3);
  });

  it('shows 3 résultats count', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('filters courses by search query matching title', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher une formation…'), {
      target: { value: 'react' },
    });
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('React Basics')).toBeInTheDocument();
  });

  it('filters courses by search query matching description', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher une formation…'), {
      target: { value: 'figma' },
    });
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('Figma Design')).toBeInTheDocument();
  });

  it('filters courses by category', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('Figma Design')).toBeInTheDocument();
  });

  it('shows all courses when Tous category is selected', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tous' }));
    expect(screen.getAllByTestId('course-card')).toHaveLength(3);
  });

  it('filters courses by level checkbox', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByLabelText('Avancé'));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('Figma Design')).toBeInTheDocument();
  });

  it('supports multi-level filtering', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByLabelText('Débutant'));
    fireEvent.click(screen.getByLabelText('Avancé'));
    expect(screen.getAllByTestId('course-card')).toHaveLength(2);
  });

  it('untoggling a level checkbox restores courses', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByLabelText('Débutant'));
    fireEvent.click(screen.getByLabelText('Débutant'));
    expect(screen.getAllByTestId('course-card')).toHaveLength(3);
  });

  it('filters by free price', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByLabelText('Gratuit'));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('React Basics')).toBeInTheDocument();
  });

  it('filters by under 50€ price', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByLabelText('Moins de 50 €'));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('Vue Advanced')).toBeInTheDocument();
  });

  it('filters by 50€–100€ price range', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.click(screen.getByLabelText('50 € – 100 €'));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
    expect(screen.getByText('Figma Design')).toBeInTheDocument();
  });

  it('shows empty state when no courses match filters', () => {
    render(<CatalogueClient initialCourses={defaultCourses} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher une formation…'), {
      target: { value: 'xxxxnotfound' },
    });
    expect(screen.queryAllByTestId('course-card')).toHaveLength(0);
    expect(screen.getByText('Aucun cours ne correspond à vos filtres')).toBeInTheDocument();
  });

  it('shows only 9 courses per page when there are more than 9', () => {
    render(<CatalogueClient initialCourses={makeCourses(10)} />);
    expect(screen.getAllByTestId('course-card')).toHaveLength(9);
  });

  it('shows pagination buttons when there are more than 9 courses', () => {
    render(<CatalogueClient initialCourses={makeCourses(10)} />);
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeInTheDocument();
  });

  it('navigates to next page showing remaining courses', () => {
    render(<CatalogueClient initialCourses={makeCourses(10)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);
  });

  it('does not show pagination when courses fit on one page', () => {
    render(<CatalogueClient initialCourses={makeCourses(5)} />);
    expect(screen.queryByRole('button', { name: 'Suivant' })).not.toBeInTheDocument();
  });

  it('resets to page 1 when search query changes', () => {
    const courses = makeCourses(10);
    render(<CatalogueClient initialCourses={courses} />);
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getAllByTestId('course-card')).toHaveLength(1);

    // 'Course' matches all 10 titles ("Course 1" … "Course 10") — real query change resets page
    fireEvent.change(screen.getByPlaceholderText('Rechercher une formation…'), {
      target: { value: 'Course' },
    });
    expect(screen.getAllByTestId('course-card')).toHaveLength(9);
  });
});
