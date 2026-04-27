import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

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

import { ScaleIn } from '../ScaleIn';

describe('ScaleIn', () => {
  beforeEach(() => {
    mockShouldReduce = false;
  });

  it('renders children', () => {
    render(<ScaleIn>hello</ScaleIn>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<ScaleIn className="scale-cls">content</ScaleIn>);
    expect(document.querySelector('.scale-cls')).toBeInTheDocument();
  });

  it('initial is {opacity:0, scale:0.95} when not reduced', () => {
    render(<ScaleIn>normal</ScaleIn>);
    const el = screen.getByText('normal');
    const initial = JSON.parse(el.getAttribute('data-initial') ?? 'null');
    expect(initial).toEqual({ opacity: 0, scale: 0.95 });
  });

  it('animate target is {opacity:1, scale:1}', () => {
    render(<ScaleIn>anim</ScaleIn>);
    const el = screen.getByText('anim');
    const animate = JSON.parse(el.getAttribute('data-animate') ?? '{}');
    expect(animate).toEqual({ opacity: 1, scale: 1 });
  });

  it('transition uses default duration 0.45 and delay 0', () => {
    render(<ScaleIn>defaults</ScaleIn>);
    const el = screen.getByText('defaults');
    const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
    expect(transition.duration).toBe(0.45);
    expect(transition.delay).toBe(0);
  });

  it('transition uses provided delay', () => {
    render(<ScaleIn delay={0.5}>delayed</ScaleIn>);
    const el = screen.getByText('delayed');
    const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
    expect(transition.delay).toBe(0.5);
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      mockShouldReduce = true;
    });

    it('initial is false (skipped) when reduced', () => {
      render(<ScaleIn>reduced</ScaleIn>);
      const el = screen.getByText('reduced');
      // false serialises to null in JSON.stringify — attribute is "false"
      const raw = el.getAttribute('data-initial');
      expect(raw).toBe('false');
    });

    it('transition duration is 0 when reduced', () => {
      render(<ScaleIn>reduced-t</ScaleIn>);
      const el = screen.getByText('reduced-t');
      const transition = JSON.parse(el.getAttribute('data-transition') ?? '{}');
      expect(transition.duration).toBe(0);
    });
  });
});
