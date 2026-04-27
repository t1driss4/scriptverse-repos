import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

let mockShouldReduce = false;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      variants,
      initial,
      animate,
      ...rest
    }: React.ComponentPropsWithoutRef<'div'> & {
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
    }) => (
      <div
        className={className}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        {...rest}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: () => mockShouldReduce,
}));

import { StaggerCards, StaggerItem } from '../StaggerCards';

describe('StaggerCards', () => {
  beforeEach(() => {
    mockShouldReduce = false;
  });

  it('renders children', () => {
    render(
      <StaggerCards>
        <span>card</span>
      </StaggerCards>,
    );
    expect(screen.getByText('card')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<StaggerCards className="grid">child</StaggerCards>);
    // The motion.div gets className="grid"
    expect(document.querySelector('.grid')).toBeInTheDocument();
  });

  it('initial is "hidden" when reduced motion is off', () => {
    render(<StaggerCards>x</StaggerCards>);
    const el = screen.getByText('x');
    const initial = el.getAttribute('data-initial');
    expect(initial).toBe('"hidden"');
  });

  it('initial is "visible" when reduced motion is on', () => {
    mockShouldReduce = true;
    render(<StaggerCards>y</StaggerCards>);
    const el = screen.getByText('y');
    const initial = el.getAttribute('data-initial');
    expect(initial).toBe('"visible"');
  });

  it('animate is always "visible"', () => {
    render(<StaggerCards>z</StaggerCards>);
    const el = screen.getByText('z');
    expect(el.getAttribute('data-animate')).toBe('"visible"');
  });
});

describe('StaggerItem', () => {
  beforeEach(() => {
    mockShouldReduce = false;
  });

  it('renders children', () => {
    render(
      <StaggerItem>
        <p>item content</p>
      </StaggerItem>,
    );
    expect(screen.getByText('item content')).toBeInTheDocument();
  });

  it('forwards className', () => {
    render(<StaggerItem className="item-cls">item</StaggerItem>);
    expect(document.querySelector('.item-cls')).toBeInTheDocument();
  });

  it('renders inside StaggerCards', () => {
    render(
      <StaggerCards>
        <StaggerItem>first</StaggerItem>
        <StaggerItem>second</StaggerItem>
      </StaggerCards>,
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});
