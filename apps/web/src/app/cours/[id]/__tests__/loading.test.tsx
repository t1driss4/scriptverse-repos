import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import CourseDetailLoading from '../loading';

describe('CourseDetailLoading', () => {
  it('renders with animate-pulse class', () => {
    const { container: c } = render(<CourseDetailLoading />);
    expect(c.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders the dark hero skeleton section', () => {
    const { container: c } = render(<CourseDetailLoading />);
    const hero = c.querySelector('.bg-gray-900');
    expect(hero).toBeTruthy();
  });

  it('renders 3 module skeleton cards', () => {
    const { container: c } = render(<CourseDetailLoading />);
    const moduleCards = c.querySelectorAll('.card');
    expect(moduleCards.length).toBe(4); // 3 module cards + 1 sidebar card
  });

  it('renders without crashing and produces DOM content', () => {
    const { container: c } = render(<CourseDetailLoading />);
    expect(c.firstChild).toBeTruthy();
  });
});
