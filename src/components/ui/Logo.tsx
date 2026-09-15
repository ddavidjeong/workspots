'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export default function Logo({ size = 40, animate = true, className = '' }: LogoProps) {
  const scale = size / 40;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      whileHover={animate ? { scale: 1.05 } : undefined}
      whileTap={animate ? { scale: 0.95 } : undefined}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d5a1f" />
            <stop offset="100%" stopColor="#283618" />
          </linearGradient>
          <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fefae0" />
            <stop offset="100%" stopColor="#dda15e" />
          </linearGradient>
          <linearGradient id="steamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fefae0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fefae0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main background */}
        <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#logoGradient)" />

        {/* Location pin outline - cozy rounded shape */}
        <path
          d="M20 6C14.5 6 10 10.2 10 15.5C10 22 20 34 20 34C20 34 30 22 30 15.5C30 10.2 25.5 6 20 6Z"
          fill="none"
          stroke="url(#pinGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cozy coffee cup inside the pin */}
        <g transform="translate(14, 11)">
          {/* Cup body */}
          <path
            d="M1 4C1 3.5 1.5 3 2 3H9C9.5 3 10 3.5 10 4V8C10 10 8.5 11 6 11H5C2.5 11 1 10 1 8V4Z"
            fill="#fefae0"
            opacity="0.9"
          />
          {/* Cup handle */}
          <path
            d="M10 4.5C11.5 4.5 12 5.5 12 6.5C12 7.5 11.5 8.5 10 8.5"
            fill="none"
            stroke="#fefae0"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Steam lines */}
          <motion.path
            d="M3 1.5C3 0.5 4 0 4 0"
            fill="none"
            stroke="url(#steamGradient)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0.4, y: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4], y: [-1, 0, -1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M6 1C6 0 7 -0.5 7 -0.5"
            fill="none"
            stroke="url(#steamGradient)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0.3, y: 0 }}
            animate={{ opacity: [0.3, 0.7, 0.3], y: [-0.5, 0.5, -0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          <motion.path
            d="M8.5 1.5C8.5 0.5 9.5 0 9.5 0"
            fill="none"
            stroke="url(#steamGradient)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0.5, y: 0 }}
            animate={{ opacity: [0.5, 0.9, 0.5], y: [-0.5, 0.5, -0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
        </g>

        {/* Small book/page accent */}
        <g transform="translate(23, 22)">
          <rect x="0" y="0" width="5" height="6" rx="0.5" fill="#fefae0" opacity="0.7" />
          <line x1="1" y1="1.5" x2="4" y2="1.5" stroke="#283618" strokeWidth="0.5" opacity="0.5" />
          <line x1="1" y1="3" x2="4" y2="3" stroke="#283618" strokeWidth="0.5" opacity="0.5" />
          <line x1="1" y1="4.5" x2="3" y2="4.5" stroke="#283618" strokeWidth="0.5" opacity="0.5" />
        </g>
      </svg>
    </motion.div>
  );
}
