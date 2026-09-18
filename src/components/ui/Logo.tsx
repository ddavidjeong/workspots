'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <motion.div
      className={`flex items-center justify-center rounded-xl font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #3d5a1f 0%, #283618 100%)',
        color: '#fefae0',
        fontSize: size * 0.4,
        letterSpacing: '-0.03em',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      W
    </motion.div>
  );
}
