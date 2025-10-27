"use client";

import { motion } from 'framer-motion';

interface FloatingReactionProps {
  emoji: string;
}

export function FloatingReaction({ emoji }: FloatingReactionProps) {
  const randomX = Math.random() * 80 + 10; // 10-90% of screen width
  const randomDuration = Math.random() * 1 + 2; // 2-3 seconds

  return (
    <motion.div
      initial={{
        y: '100vh',
        x: `${randomX}vw`,
        opacity: 0,
        scale: 0,
      }}
      animate={{
        y: '-10vh',
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1.2, 0],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: randomDuration,
        ease: 'easeOut',
      }}
      className="absolute text-6xl pointer-events-none z-50"
    >
      {emoji}
    </motion.div>
  );
}
