import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import CatalogueError from '../error';

describe('CatalogueError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the error heading', () => {
    const reset = vi.fn();
    render(<CatalogueError error={new Error('test')} reset={reset} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Catalogue indisponible');
  });

  it('shows the error message when provided', () => {
    const reset = vi.fn();
    render(<CatalogueError error={new Error('Service indisponible')} reset={reset} />);
    expect(screen.getByText('Service indisponible')).toBeInTheDocument();
  });

  it('shows fallback message when error has no message', () => {
    const reset = vi.fn();
    render(<CatalogueError error={new Error('')} reset={reset} />);
    expect(
      screen.getByText('Impossible de charger les cours. Veuillez réessayer.'),
    ).toBeInTheDocument();
  });

  it('calls reset when the retry button is clicked', () => {
    const reset = vi.fn();
    render(<CatalogueError error={new Error('test')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders a link to the home page', () => {
    const reset = vi.fn();
    render(<CatalogueError error={new Error('test')} reset={reset} />);
    const link = screen.getByRole('link', { name: 'Accueil' });
    expect(link).toHaveAttribute('href', '/');
  });
});
