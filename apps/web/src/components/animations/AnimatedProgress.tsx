'use client';

import { motion, useReducedMotion } from 'framer-motion';

const DURATION_SLOW = 0.6;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface AnimatedProgressProps {
  value: number;
  className?: string;
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduce ? false : { width: '0%' }}
      animate={{ width: `${value}%` }}
      transition={
        shouldReduce ? { duration: 0 } : { duration: DURATION_SLOW, ease: EASE }
      }
    />
  );
}
