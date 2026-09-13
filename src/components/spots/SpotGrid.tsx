'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SpotWithDetails } from '@/types';
import SpotCard from './SpotCard';

interface SpotGridProps {
  spots: SpotWithDetails[];
  selectedSpotId?: string | null;
  hoveredSpotId?: string | null;
  onSpotClick?: (spotId: string) => void;
  onSpotHover?: (spotId: string | null) => void;
  loading?: boolean;
}

export default function SpotGrid({
  spots,
  selectedSpotId,
  hoveredSpotId,
  onSpotClick,
  onSpotHover,
  loading = false,
}: SpotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedSpotId && selectedSpotId !== prevSelectedRef.current && containerRef.current) {
      const card = containerRef.current.querySelector(`[data-spot-id="${selectedSpotId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    prevSelectedRef.current = selectedSpotId ?? null;
  }, [selectedSpotId]);

  // Only show skeleton if loading AND no spots (don't flash when we have data)
  if (loading && spots.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-3 p-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="rounded-xl overflow-hidden bg-white/50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="aspect-[16/9] bg-stone-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-stone-200 rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-stone-200 rounded-full w-1/2 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 bg-stone-200 rounded-full w-16 animate-pulse" />
                <div className="h-6 bg-stone-200 rounded-full w-16 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="w-16 h-16 text-stone-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-stone-900 mb-1">No spots found</h3>
        <p className="text-stone-500 max-w-xs">
          Try adjusting your filters or zooming out on the map to find more workspaces.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid gap-4 p-4 pb-8"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
      }}
    >
      {spots.map((spot) => (
        <div
          key={spot.id}
          data-spot-id={spot.id}
          className="relative"
        >
          <SpotCard
            spot={spot}
            isSelected={spot.id === selectedSpotId}
            isHovered={spot.id === hoveredSpotId}
            onClick={() => onSpotClick?.(spot.id)}
            onHover={(hovering) => onSpotHover?.(hovering ? spot.id : null)}
          />
        </div>
      ))}
    </div>
  );
}
