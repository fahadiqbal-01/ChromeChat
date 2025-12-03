
'use client';

import { motion } from 'framer-motion';

const bounceTransition = {
  y: {
    duration: 0.4,
    yoyo: Infinity,
    ease: 'easeOut',
  },
};

export function TypingIndicator() {
  return (
    <div className="flex items-center justify-center gap-1">
      <motion.span
        className="h-2 w-2 rounded-full bg-muted-foreground"
        transition={{ ...bounceTransition, delay: 0 }}
        animate={{ y: ['-25%', '25%'] }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-muted-foreground"
        transition={{ ...bounceTransition, delay: 0.2 }}
         animate={{ y: ['-25%', '25%'] }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-muted-foreground"
        transition={{ ...bounceTransition, delay: 0.4 }}
         animate={{ y: ['-25%', '25%'] }}
      />
    </div>
  );
}

    