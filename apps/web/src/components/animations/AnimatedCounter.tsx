'use client';

import { useEffect, useState } from 'react';
import {
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';

const DURATION_SLOW = 0.6;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, suffix, className }: AnimatedCounterProps) {
  const shouldReduce = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(rounded, 'change', setDisplay);

  useEffect(() => {
    if (shouldReduce) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: DURATION_SLOW, ease: EASE });
    return () => controls.stop();
  }, [value, shouldReduce, count]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
