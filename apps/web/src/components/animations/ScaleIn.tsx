'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const DURATION_DEFAULT = 0.45;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        shouldReduce
          ? { duration: 0 }
          : { duration: DURATION_DEFAULT, delay, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}
