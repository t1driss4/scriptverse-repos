'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.45,
  direction = 'up',
  className,
}: FadeInProps) {
  const initial = {
    opacity: 0,
    y: direction === 'up' ? 18 : direction === 'down' ? -18 : 0,
    x: direction === 'left' ? 18 : direction === 'right' ? -18 : 0,
  };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
