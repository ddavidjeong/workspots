'use client';

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
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-gray-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
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
        <h3 className="text-lg font-medium text-gray-900 mb-1">No spots found</h3>
        <p className="text-gray-500 max-w-xs">
          Try adjusting your filters or zooming out on the map to find more workspaces.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4 overflow-y-auto">
      {spots.map((spot) => (
        <SpotCard
          key={spot.id}
          spot={spot}
          isSelected={spot.id === selectedSpotId}
          isHovered={spot.id === hoveredSpotId}
          onClick={() => onSpotClick?.(spot.id)}
          onHover={(hovering) => onSpotHover?.(hovering ? spot.id : null)}
        />
      ))}
    </div>
  );
}
