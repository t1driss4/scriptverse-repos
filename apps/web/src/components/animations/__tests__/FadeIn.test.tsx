import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── framer-motion mock ─────────────────────────────────────────────────────
let mockShouldReduce = false;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      initial,
      animate,
      transition,
      ...rest
    }: React.ComponentPropsWithoutRef<'div'> & {
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

import { FadeIn } from '../FadeIn';

// ──────────────────────────────────────────────────────────────────────────

describe('FadeIn', () => {
  beforeEach(() => {
    mockShouldReduce = false;
  });

  it('renders children', () => {
    render(<FadeIn>Hello</FadeIn>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<FadeIn className="my-class">content</FadeIn>);
    // The motion.div mock renders a <div className="my-class"> wrapping children,
    // so getByText returns that element directly.
    expect(screen.getByText('content')).toHaveClass('my-class');
  });

  it('initial opacity is 0 when direction=up (default)', () => {
    render(<FadeIn>up</FadeIn>);
    const el = screen.getByText('up');
    const initial = JSON.parse(el.getAttribute('data-initial') ?? '{}');
    expect(initial.opacity).toBe(0);
    expect(initial.y).toBe(18);
    expect(initial.x).toBe(0);
  });

  it('initial sets y=-18 for direction=down', () => {
    render(<FadeIn direction="down">down</FadeIn>);
    const el = screen.getByText('down');
    const initial = JSON.parse(el.getAttribute('data-initial') ?? '{}');
    expect(initial.y).toBe(-18);
  });

  it('initial sets x=18 for direction=left', () => {
    render(<FadeIn direction="left">left</FadeIn>);
    const el = screen.getByText('left');
    const initial = JSON.parse(el.getAttribute('data-initial') ?? '{}');
    expect(initial.x).toBe(18);
    expect(initial.y).toBe(0);
  });

  it('initial sets x=-18 for direction=right', () => {
    render(<FadeIn direction="right">right</FadeIn>);
    const el = screen.getByText('right');
    const initial = JSON.parse(el.getAttribute('data-initial') ?? '{}');
    expect(initial.x).toBe(-18);
  });

  it('initial sets y=0, x=0 for direction=none', () => {
    render(<FadeIn direction="none">none</FadeIn>);
    const el = screen.getByText('none');
    const initial = JSON.parse(el.getAttribute('data-initial') ?? '{}');
    expect(initial.y).toBe(0);
    expect(initial.x).toBe(0);
    expect(initial.opacity).toBe(0);
  });

  it('animate target is always {opacity:1, y:0, x:0}', () => {
    render(<FadeIn>anim</FadeIn>);
    const el = screen.getByText('anim');
    const animate = JSON.parse(el.getAttribute('data-animate') ?? '{}');
    expect(animate).toEqual({ opacity: 1, y: 0, x: 0 });
  });

  it('transition uses provided delay and duration', () => {
    render(
      <FadeIn delay={0.3} duration={0.8}>
        timed
      </FadeIn>,
    );
    const el = screen.getByText('timed');
    const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
    expect(transition.delay).toBe(0.3);
    expect(transition.duration).toBe(0.8);
  });

  it('uses default delay=0 and duration=0.45', () => {
    render(<FadeIn>defaults</FadeIn>);
    const el = screen.getByText('defaults');
    const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
    expect(transition.delay).toBe(0);
    expect(transition.duration).toBe(0.45);
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      mockShouldReduce = true;
    });

    it('initial is fully visible (opacity 1)', () => {
      render(<FadeIn>reduced</FadeIn>);
      const el = screen.getByText('reduced');
      const initial = JSON.parse(el.getAttribute('data-initial') ?? '{}');
      expect(initial.opacity).toBe(1);
      expect(initial.y).toBe(0);
      expect(initial.x).toBe(0);
    });

    it('transition duration is 0', () => {
      render(<FadeIn>reduced-t</FadeIn>);
      const el = screen.getByText('reduced-t');
      const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
      expect(transition.duration).toBe(0);
    });
  });
});
