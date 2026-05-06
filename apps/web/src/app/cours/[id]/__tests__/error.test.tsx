import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import CourseDetailError from '../error';

describe('CourseDetailError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the error heading', () => {
    const reset = vi.fn();
    render(<CourseDetailError error={new Error('test')} reset={reset} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Impossible de charger ce cours');
  });

  it('shows the error message when provided', () => {
    const reset = vi.fn();
    render(<CourseDetailError error={new Error('Cours introuvable')} reset={reset} />);
    expect(screen.getByText('Cours introuvable')).toBeInTheDocument();
  });

  it('shows fallback message when error has no message', () => {
    const reset = vi.fn();
    const error = new Error('');
    render(<CourseDetailError error={error} reset={reset} />);
    expect(
      screen.getByText("Une erreur inattendue s'est produite. Veuillez réessayer."),
    ).toBeInTheDocument();
  });

  it('calls reset when the retry button is clicked', () => {
    const reset = vi.fn();
    render(<CourseDetailError error={new Error('test')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders a link back to the catalogue', () => {
    const reset = vi.fn();
    render(<CourseDetailError error={new Error('test')} reset={reset} />);
    const link = screen.getByRole('link', { name: 'Retour au catalogue' });
    expect(link).toHaveAttribute('href', '/catalogue');
  });
});
