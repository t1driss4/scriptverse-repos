import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/layout/navbar', () => ({
  Navbar: () => <nav data-testid="navbar" />,
}));

vi.mock('@/components/ui/SkeletonCard', () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
}));

import CatalogueLoading from '../loading';

describe('CatalogueLoading', () => {
  it('renders the Navbar', () => {
    render(<CatalogueLoading />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('renders 6 SkeletonCard components', () => {
    render(<CatalogueLoading />);
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
  });

  it('renders the hero skeleton section', () => {
    const { container } = render(<CatalogueLoading />);
    const hero = container.querySelector('.bg-gradient-to-r');
    expect(hero).toBeTruthy();
  });

  it('renders without crashing and produces DOM content', () => {
    const { container } = render(<CatalogueLoading />);
    expect(container.firstChild).toBeTruthy();
  });
});
