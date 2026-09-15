'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export default function Logo({ size = 40, animate = true, className = '' }: LogoProps) {
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
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d5a1f" />
            <stop offset="100%" stopColor="#283618" />
          </linearGradient>
          <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fefae0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fefae0" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#logoGradient)" />

        {/* Mug */}
        <g transform="translate(6, 14)">
          {/* Mug body */}
          <path
            d="M3 6 L3 18 Q3 20 5 20 L17 20 Q19 20 19 18 L19 6 Z"
            fill="#fefae0"
          />

          {/* Rim */}
          <ellipse
            cx="11"
            cy="6"
            rx="8"
            ry="3"
            fill="#fefae0"
          />

          {/* Coffee inside */}
          <ellipse
            cx="11"
            cy="6"
            rx="6"
            ry="2"
            fill="#283618"
          />

          {/* Handle */}
          <path
            d="M19 8 C23 8 25 11 25 14 C25 17 23 20 19 20"
            stroke="#fefae0"
            strokeWidth="3"
            strokeLinecap="square"
            fill="none"
          />
        </g>

        {/* Smoke that morphs into lightbulb */}
        <g transform="translate(17, 4)">
          <motion.path
            stroke="url(#steamGrad)"
            strokeWidth="1.5"
            strokeLinecap="square"
            fill="none"
            animate={{
              d: [
                // Smoke wisp
                "M0 8 L0 6 L0 4 L0 2",
                // Starting to curve
                "M0 8 C-2 6 2 4 0 2",
                // Bulb forming
                "M0 8 C-3 6 -3 3 0 1 C3 3 3 6 0 8",
                // Full lightbulb shape
                "M0 10 L0 8 C-4 6 -4 2 0 0 C4 2 4 6 0 8 L0 10 M-1.5 10 L1.5 10 M-1 11 L1 11",
                // Hold
                "M0 10 L0 8 C-4 6 -4 2 0 0 C4 2 4 6 0 8 L0 10 M-1.5 10 L1.5 10 M-1 11 L1 11",
                // Fade back to smoke
                "M0 8 C-2 6 2 4 0 2",
                // Back to wisp
                "M0 8 L0 6 L0 4 L0 2",
              ],
              opacity: [0.6, 0.7, 0.8, 1, 1, 0.7, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.15, 0.3, 0.45, 0.65, 0.8, 1],
            }}
          />
        </g>
      </svg>
    </motion.div>
  );
}
