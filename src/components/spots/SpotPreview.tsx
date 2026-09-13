'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotWithDetails } from '@/types';
import TraitBadges from './TraitBadges';

interface SpotPreviewProps {
  spot: SpotWithDetails;
  initialPosition: { x: number; y: number };
  onClose: () => void;
  onDragStart?: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

export default function SpotPreview({
  spot,
  initialPosition,
  onClose,
  onDragStart,
  onFocus,
  zIndex = 50,
}: SpotPreviewProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasPositioned = useRef(false);

  const photos = spot.photos.length > 0 ? spot.photos : [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhoto((prev) => (prev + 1) % photos.length);
    }
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
    }
  }, [photos.length]);

  // Reset when spot changes
  useEffect(() => {
    setCurrentPhoto(0);
    setExpanded(false);
    setPosition(initialPosition);
    setHasDragged(false);
    hasPositioned.current = false;
  }, [spot.id, initialPosition]);

  // Initial viewport check - runs once
  useEffect(() => {
    if (hasPositioned.current || hasDragged) return;

    const timer = setTimeout(() => {
      if (!cardRef.current || hasPositioned.current) return;
      hasPositioned.current = true;

      const rect = cardRef.current.getBoundingClientRect();
      const padding = 20;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      if (rect.right > vw - padding) newX = vw - rect.width - padding;
      if (newX < padding) newX = padding;
      if (rect.bottom > vh - padding) newY = vh - rect.height - padding;
      if (newY < padding) newY = padding;

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [spot.id]); // Only run on spot change

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    if (!hasDragged) {
      setHasDragged(true);
      onDragStart?.();
    }

    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h >= 12 ? 'pm' : 'am';
    return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
  };

  const formatVerifiedDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOpenNow = () => {
    if (!spot.hours) return null;
    const now = new Date();
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[now.getDay()];
    const todayHours = spot.hours[today];
    if (!todayHours) return null;

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const openTime = openH * 100 + openM;
    const closeTime = closeH * 100 + closeM;

    if (currentTime >= openTime && currentTime < closeTime) {
      return { open: true, closeTime: formatTime(todayHours.close) };
    }
    return { open: false, openTime: formatTime(todayHours.open) };
  };

  const openStatus = isOpenNow();

  const openDirections = () => {
    const query = encodeURIComponent(spot.address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${query}`
      : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      ref={cardRef}
      className={`fixed bg-white rounded-2xl shadow-2xl select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: expanded ? 384 : 320,
        zIndex,
        transition: isDragging ? 'none' : 'left 0.2s ease-out, top 0.2s ease-out, width 0.25s ease-out',
      }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseDown={(e) => {
        onFocus?.();
        handleMouseDown(e);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag handle indicator */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-stone-300 rounded-full z-20 pointer-events-none" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Photo carousel */}
      <div
        className="relative bg-stone-100 overflow-hidden rounded-t-2xl transition-all duration-250 ease-out"
        style={{ height: expanded ? 224 : 176 }}
      >
        {/* Center expand button - only appears when hovering center area */}
        {hasPhotos && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <button
              className="w-20 h-20 flex items-center justify-center pointer-events-auto group/expand"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) setShowCarousel(true);
              }}
            >
              <span className="w-12 h-12 bg-black/40 group-hover/expand:bg-black/60 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover/expand:opacity-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </span>
            </button>
          </div>
        )}
        {hasPhotos ? (
          <>
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentPhoto * 100}%)` }}
            >
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative flex-shrink-0 w-full h-full">
                  <Image
                    src={photo.url}
                    alt={`${spot.name} interior ${i + 1}`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="400px"
                    priority={i === 0}
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Nav arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentPhoto ? 'bg-white scale-110' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Open status badge */}
        {openStatus && (
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
              openStatus.open
                ? 'bg-emerald-500 text-white'
                : 'bg-stone-800/80 text-white'
            }`}
          >
            {openStatus.open ? `Open til ${openStatus.closeTime}` : `Opens ${openStatus.openTime}`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 pb-5 overflow-visible">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-stone-900">{spot.name}</h3>
            <p className="text-sm text-stone-500">
              {spot.neighborhood || spot.city.toUpperCase()}
            </p>
          </div>
          {spot.average_rating && (
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg px-2 py-1">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-stone-900">
                {spot.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Trait badges */}
        <div className="mb-3">
          <TraitBadges traits={spot.traits} compact maxShow={expanded ? 6 : 3} />
        </div>

        {/* Expanded details */}
        <div
          className="overflow-hidden transition-all duration-250 ease-out"
          style={{
            maxHeight: expanded ? 300 : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="space-y-3 pt-3 border-t border-stone-100">
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

            {/* Hours - compact */}
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

        {/* Actions row - outside overflow-hidden */}
        {expanded && (
          <div className="flex gap-2 pt-3">
            <motion.button
              onClick={openDirections}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#283618' }}
              whileHover={{ scale: 1.02, backgroundColor: '#3d4f28' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Get Directions
            </motion.button>
            <motion.button
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#e8ebd8', color: '#283618' }}
              whileHover={{ scale: 1.02, backgroundColor: '#e8e5de' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Verify Info
            </motion.button>
          </div>
        )}

        {/* Expand/collapse button */}
        <motion.button
          onClick={() => {
            setExpanded(!expanded);
            if (!expanded && !hasDragged) {
              setHasDragged(true);
              onDragStart?.();
            }
          }}
          className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#f5f3ef', color: '#283618' }}
          whileHover={{ scale: 1.02, backgroundColor: '#e8e5de' }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span>{expanded ? 'Show less' : 'View details'}</span>
          <motion.svg
            className="w-4 h-4"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.button>
      </div>

      {/* Photo Carousel Overlay */}
      <AnimatePresence>
        {showCarousel && photos.length > 0 && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCarousel(false)}
          >
            <motion.div
              className="relative bg-black/95 rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: 'min(90vw, 600px)', height: 'min(70vh, 450px)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
                onClick={() => setShowCarousel(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Spot name & counter */}
              <div className="absolute top-3 left-3 text-white z-10">
                <h3 className="text-sm font-semibold">{spot.name}</h3>
                <p className="text-xs text-white/70">{currentPhoto + 1} / {photos.length}</p>
              </div>

              {/* Main image with slide animation */}
              <div className="absolute inset-0">
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
                    className="object-cover"
                    sizes="600px"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              </div>

              {/* Nav arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhoto((prev) => (prev + 1) % photos.length);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Photo dots */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhoto(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentPhoto
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
