import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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

import { AnimatedProgress } from '../AnimatedProgress';

describe('AnimatedProgress', () => {
  beforeEach(() => {
    mockShouldReduce = false;
  });

  it('renders without crashing', () => {
    const { container } = render(<AnimatedProgress value={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('forwards className', () => {
    const { container } = render(
      <AnimatedProgress value={50} className="progress-bar" />,
    );
    expect(container.querySelector('.progress-bar')).toBeInTheDocument();
  });

  it('animates to the correct width percentage', () => {
    const { container } = render(<AnimatedProgress value={75} />);
    const div = container.firstChild as HTMLElement;
    const animate = JSON.parse(div.getAttribute('data-animate') ?? '{}');
    expect(animate.width).toBe('75%');
  });

  it('animates to 0% when value is 0', () => {
    const { container } = render(<AnimatedProgress value={0} />);
    const div = container.firstChild as HTMLElement;
    const animate = JSON.parse(div.getAttribute('data-animate') ?? '{}');
    expect(animate.width).toBe('0%');
  });

  it('animates to 100% when value is 100', () => {
    const { container } = render(<AnimatedProgress value={100} />);
    const div = container.firstChild as HTMLElement;
    const animate = JSON.parse(div.getAttribute('data-animate') ?? '{}');
    expect(animate.width).toBe('100%');
  });

  it('initial is {width:"0%"} when not reduced', () => {
    const { container } = render(<AnimatedProgress value={40} />);
    const div = container.firstChild as HTMLElement;
    const initial = JSON.parse(div.getAttribute('data-initial') ?? 'null');
    expect(initial).toEqual({ width: '0%' });
  });

  it('transition has duration 0.6 when not reduced', () => {
    const { container } = render(<AnimatedProgress value={60} />);
    const div = container.firstChild as HTMLElement;
    const transition = JSON.parse(div.getAttribute('data-transition') ?? '{}');
    expect(transition.duration).toBe(0.6);
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      mockShouldReduce = true;
    });

    it('initial is false when reduced', () => {
      const { container } = render(<AnimatedProgress value={50} />);
      const div = container.firstChild as HTMLElement;
      expect(div.getAttribute('data-initial')).toBe('false');
    });

    it('transition duration is 0 when reduced', () => {
      const { container } = render(<AnimatedProgress value={50} />);
      const div = container.firstChild as HTMLElement;
      const transition = JSON.parse(div.getAttribute('data-transition') ?? '{}');
      expect(transition.duration).toBe(0);
    });
  });
});
