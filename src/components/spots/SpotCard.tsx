'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SpotWithDetails } from '@/types';
import TraitBadges from './TraitBadges';

interface SpotCardProps {
  spot: SpotWithDetails;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

export default function SpotCard({
  spot,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
}: SpotCardProps) {
  const primaryPhoto = spot.primary_photo || spot.photos[0];
  const hasPhoto = !!primaryPhoto;

  return (
    <Link
      href={`/spot/${spot.id}`}
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer block
        transition-all duration-200 ease-out
        ${isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]'
          : isHovered
          ? 'ring-2 ring-gray-300 scale-[1.01]'
          : 'hover:ring-2 hover:ring-gray-200'}
      `}
      onClick={(e) => {
        // Allow cmd/ctrl click to open in new tab
        if (!e.metaKey && !e.ctrlKey) {
          onClick?.();
        }
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {hasPhoto ? (
          <Image
            src={primaryPhoto.url}
            alt={`Interior of ${spot.name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Trait badges - overlaid on photo */}
        <div className="absolute top-2 left-2 right-12">
          <TraitBadges traits={spot.traits} compact maxShow={3} />
        </div>

        {/* Crowdedness indicator */}
        <div className="absolute top-2 right-2">
          <div className="bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            Quiet now
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{spot.name}</h3>
            <p className="text-sm text-white/80 truncate">
              {spot.neighborhood || spot.city.toUpperCase()}
            </p>
          </div>

          {/* Rating */}
          {spot.average_rating && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded px-1.5 py-0.5">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium">{spot.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
