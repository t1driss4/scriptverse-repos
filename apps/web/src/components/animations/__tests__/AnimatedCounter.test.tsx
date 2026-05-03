import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// ── Track motion-value state across the mock ──────────────────────────────
let motionVal = 0;
let transformedVal = 0;
let changeCallback: ((v: number) => void) | null = null;
let mockShouldReduce = false;

vi.mock('framer-motion', () => {
  const mockMotionValue = {
    get: () => motionVal,
    set: (v: number) => {
      motionVal = v;
      transformedVal = Math.round(v);
      changeCallback?.(transformedVal);
    },
  };

  const mockRounded = {
    get: () => transformedVal,
  };

  return {
    useMotionValue: (_initial: number) => mockMotionValue,
    useTransform: (_mv: unknown, _fn: (v: number) => number) => mockRounded,
    animate: vi.fn(
      (
        mv: typeof mockMotionValue,
        target: number,
        _opts: unknown,
      ) => {
        // Synchronously jump to target so we can test the final displayed value
        mv.set(target);
        return { stop: vi.fn() };
      },
    ),
    useReducedMotion: () => mockShouldReduce,
    useMotionValueEvent: (_mv: unknown, _event: string, cb: (v: number) => void) => {
      changeCallback = cb;
    },
  };
});

import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    motionVal = 0;
    transformedVal = 0;
    changeCallback = null;
    mockShouldReduce = false;
  });

  it('renders without crashing', () => {
    render(<AnimatedCounter value={10} />);
    expect(document.body).toBeTruthy();
  });

  it('displays the target value after animation', async () => {
    await act(async () => {
      render(<AnimatedCounter value={42} />);
    });
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders suffix alongside the count', async () => {
    await act(async () => {
      render(<AnimatedCounter value={100} suffix="%" />);
    });
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('renders suffix when value is 0', async () => {
    await act(async () => {
      render(<AnimatedCounter value={0} suffix=" pts" />);
    });
    expect(screen.getByText(/0 pts/)).toBeInTheDocument();
  });

  it('forwards className to the span', async () => {
    await act(async () => {
      render(<AnimatedCounter value={5} className="counter-cls" />);
    });
    expect(document.querySelector('.counter-cls')).toBeInTheDocument();
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      mockShouldReduce = true;
    });

    it('immediately shows the target value', async () => {
      await act(async () => {
        render(<AnimatedCounter value={99} />);
      });
      expect(screen.getByText(/99/)).toBeInTheDocument();
    });

    it('renders suffix in reduced mode', async () => {
      await act(async () => {
        render(<AnimatedCounter value={7} suffix="x" />);
      });
      expect(screen.getByText(/7x/)).toBeInTheDocument();
    });
  });
});
