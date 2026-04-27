'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const DURATION_DEFAULT = 0.45;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={variants}
      initial={shouldReduce ? 'visible' : 'hidden'}
      animate="visible"
      transition={{ duration: DURATION_DEFAULT, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
