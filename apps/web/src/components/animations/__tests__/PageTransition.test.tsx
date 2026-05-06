import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

let mockShouldReduce = false;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      variants: _variants,
      initial,
      animate,
      transition,
      ...rest
    }: React.ComponentPropsWithoutRef<'div'> & {
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => (
      <div
        className={className}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...rest}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: () => mockShouldReduce,
}));

import { PageTransition } from '../PageTransition';

describe('PageTransition', () => {
  beforeEach(() => {
    mockShouldReduce = false;
  });

  it('renders children', () => {
    render(
      <PageTransition>
        <h1>Page content</h1>
      </PageTransition>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<PageTransition className="page-cls">content</PageTransition>);
    expect(document.querySelector('.page-cls')).toBeInTheDocument();
  });

  it('initial is "hidden" when reduced motion is off', () => {
    render(<PageTransition>page</PageTransition>);
    const el = screen.getByText('page');
    expect(el.getAttribute('data-initial')).toBe('"hidden"');
  });

  it('animate is always "visible"', () => {
    render(<PageTransition>page</PageTransition>);
    const el = screen.getByText('page');
    expect(el.getAttribute('data-animate')).toBe('"visible"');
  });

  it('transition has duration 0.45', () => {
    render(<PageTransition>page</PageTransition>);
    const el = screen.getByText('page');
    const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
    expect(transition.duration).toBe(0.45);
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      mockShouldReduce = true;
    });

    it('initial is "visible" when reduced', () => {
      render(<PageTransition>reduced</PageTransition>);
      const el = screen.getByText('reduced');
      expect(el.getAttribute('data-initial')).toBe('"visible"');
    });
  });
});
