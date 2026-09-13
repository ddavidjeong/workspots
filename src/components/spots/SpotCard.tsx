'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotWithDetails, CATEGORY_INFO } from '@/types';
import TraitBadges from './TraitBadges';
import { formatTime, getOpenStatus, openDirections } from '@/lib/spot-format';

interface SpotCardProps {
  spot: SpotWithDetails;
  isSelected?: boolean;
  isHovered?: boolean;
  isTransitioning?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

const SpotCard = memo(function SpotCard({
  spot,
  isSelected = false,
  isHovered = false,
  isTransitioning = false,
  onClick,
  onHover,
}: SpotCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const photos = spot.photos || [];
  const primaryPhoto = spot.primary_photo || photos[0];
  const hasPhoto = !!primaryPhoto;
  const categoryInfo = spot.category ? CATEGORY_INFO[spot.category] : null;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded]);

  const formatVerifiedDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return d.toLocaleDateString();
  };

  const openStatus = getOpenStatus(spot.hours);

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhoto((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const ringColor = categoryInfo?.marker || '#bc6c25';

  return (
    <div
      className={`
        group relative rounded-xl bg-white transition-all duration-200 select-none
        ${isSelected
          ? 'ring-2 ring-offset-2 shadow-lg'
          : 'ring-1 ring-stone-200/50 hover:shadow-lg'}
      `}
      style={isSelected ? { '--tw-ring-color': ringColor } as React.CSSProperties : undefined}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Photo section */}
      <div
        className="relative bg-stone-100 overflow-hidden rounded-t-xl transition-all duration-250 ease-out"
        style={{ height: expanded ? 200 : 180 }}
      >
        {/* Center expand button - only appears when hovering center area */}
        {hasPhoto && photos.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <button
              className="w-16 h-16 flex items-center justify-center pointer-events-auto group/expand"
              onClick={(e) => {
                e.stopPropagation();
                setShowCarousel(true);
              }}
            >
              <span className="w-10 h-10 bg-black/40 group-hover/expand:bg-black/60 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover/expand:opacity-100 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </span>
            </button>
          </div>
        )}
        {hasPhoto ? (
          <>
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentPhoto * 100}%)` }}
            >
              {(expanded ? photos : [primaryPhoto]).map((photo, i) => (
                <div key={photo?.id || i} className="relative flex-shrink-0 w-full h-full">
                  <Image
                    src={photo?.url || ''}
                    alt={`Interior of ${spot.name}`}
                    fill
                    className={`object-cover transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              ))}
            </div>

            {/* Nav arrows */}
            {photos.length > 1 && (
              <div className={`transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Photo dots */}
            {photos.length > 1 && expanded && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentPhoto(i); }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      i === currentPhoto ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        {categoryInfo && (
          <div
            className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-base backdrop-blur-md shadow-sm"
            style={{ backgroundColor: `${categoryInfo.bg}40` }}
            title={categoryInfo.label}
          >
            {categoryInfo.icon}
          </div>
        )}

        {/* Open status badge */}
        {openStatus && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
              openStatus.open
                ? 'bg-emerald-500 text-white'
                : 'bg-stone-800/80 text-white'
            }`}
          >
            {openStatus.open ? `Open til ${openStatus.closeTime}` : 'Closed'}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-5 pb-8">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-stone-900 text-base leading-tight">
              {spot.name}
            </h3>
            <p className="text-sm text-stone-500 mt-0.5">
              {spot.neighborhood || spot.city.toUpperCase()}
            </p>
          </div>
          {spot.average_rating && (
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg px-2 py-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold">{spot.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Trait badges */}
        <div className="mb-3">
          <TraitBadges traits={spot.traits} compact maxShow={expanded ? 6 : 3} />
        </div>

        {/* Expandable content - CSS transition */}
        <div
          className="overflow-hidden transition-all duration-250 ease-out"
          style={{
            maxHeight: expanded ? contentHeight + 20 : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          <div ref={contentRef} className="space-y-3 pt-3 border-t border-stone-100">
            {/* Last verified */}
            {spot.last_verified_at && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified {formatVerifiedDate(spot.last_verified_at)}</span>
                {(spot.verification_count ?? 0) > 1 && (
                  <span className="text-stone-400">· {spot.verification_count} checks</span>
                )}
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-2 text-sm">
              <svg className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-stone-600">{spot.address}</span>
            </div>

            {/* Hours */}
            {spot.hours && (
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-stone-600 text-xs flex flex-wrap gap-x-3 gap-y-1">
                  {Object.entries(spot.hours).map(([day, hours]) => (
                    <span key={day}>
                      <span className="capitalize font-medium">{day}</span> {formatTime(hours.open)}-{formatTime(hours.close)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            </div>
        </div>

        {/* Actions row - outside overflow-hidden so scale works */}
        {expanded && (
          <div className="flex gap-2 pt-3">
            <button
              onClick={(e) => { e.stopPropagation(); openDirections(spot.address); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#283618' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Get Directions
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#e8ebd8', color: '#283618' }}
            >
              Verify Info
            </button>
          </div>
        )}

        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
            if (!expanded) setCurrentPhoto(0);
            onClick?.();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium mt-3 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: '#f5f3ef', color: '#283618' }}
        >
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Show less' : 'View details'}
        </button>
      </div>

      {/* Photo Carousel Overlay */}
      <AnimatePresence>
        {showCarousel && photos.length > 0 && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCarousel(false)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              onClick={() => setShowCarousel(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Spot name */}
            <div className="absolute top-4 left-4 text-white">
              <h3 className="text-lg font-semibold">{spot.name}</h3>
              <p className="text-sm text-white/70">{currentPhoto + 1} / {photos.length}</p>
            </div>

            {/* Main image with slide animation */}
            <div
              className="relative w-full max-w-4xl h-[70vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhoto}
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Image
                    src={photos[currentPhoto]?.url || ''}
                    alt={`${spot.name} photo ${currentPhoto + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav arrows */}
            {photos.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhoto((prev) => (prev + 1) % photos.length);
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((photo, i) => (
                  <button
                    key={photo?.id || i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhoto(i);
                    }}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all ${
                      i === currentPhoto
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <Image
                      src={photo?.url || ''}
                      alt={`Thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SpotCard;
