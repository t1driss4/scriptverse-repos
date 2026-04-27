import { describe, it, expect, vi } from 'vitest';

// Mock framer-motion before importing barrel
vi.mock('framer-motion', () => ({
  motion: { div: () => null },
  useReducedMotion: () => false,
  useMotionValue: () => ({ get: () => 0, set: () => {} }),
  useTransform: () => ({ get: () => 0 }),
  animate: vi.fn(() => ({ stop: vi.fn() })),
  useMotionValueEvent: vi.fn(),
}));

import * as animations from '../index';

describe('animations barrel', () => {
  it('exports FadeIn', () => {
    expect(animations.FadeIn).toBeDefined();
    expect(typeof animations.FadeIn).toBe('function');
  });

  it('exports StaggerCards', () => {
    expect(animations.StaggerCards).toBeDefined();
    expect(typeof animations.StaggerCards).toBe('function');
  });

  it('exports StaggerItem', () => {
    expect(animations.StaggerItem).toBeDefined();
    expect(typeof animations.StaggerItem).toBe('function');
  });

  it('exports ScaleIn', () => {
    expect(animations.ScaleIn).toBeDefined();
    expect(typeof animations.ScaleIn).toBe('function');
  });

  it('exports AnimatedCounter', () => {
    expect(animations.AnimatedCounter).toBeDefined();
    expect(typeof animations.AnimatedCounter).toBe('function');
  });

  it('exports AnimatedProgress', () => {
    expect(animations.AnimatedProgress).toBeDefined();
    expect(typeof animations.AnimatedProgress).toBe('function');
  });

  it('exports PageTransition', () => {
    expect(animations.PageTransition).toBeDefined();
    expect(typeof animations.PageTransition).toBe('function');
  });
});
