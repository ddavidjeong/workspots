'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SpotWithDetails } from '@/types';
import TraitBadges from './TraitBadges';

interface SpotPreviewProps {
  spot: SpotWithDetails;
  position: { x: number; y: number };
  onClose: () => void;
  onViewDetails: () => void;
}

export default function SpotPreview({
  spot,
  position,
  onClose,
  onViewDetails,
}: SpotPreviewProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
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

  useEffect(() => {
    setCurrentPhoto(0);
  }, [spot.id]);

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
      return { open: true, closeTime: todayHours.close };
    }
    return { open: false, openTime: todayHours.open };
  };

  const openStatus = isOpenNow();

  return (
    <div
      className="absolute z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: position.x + 20,
        top: position.y - 120,
        transform: 'translateY(-50%)',
      }}
    >
      {/* Photo carousel */}
      <div className="relative h-44 bg-gray-100">
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
                    className="object-cover"
                    sizes="320px"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>

            {/* Nav arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhoto(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentPhoto ? 'bg-white scale-125' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
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

        {/* Trait badges overlay */}
        <div className="absolute top-2 left-2">
          <TraitBadges traits={spot.traits} compact maxShow={2} variant="overlay" />
        </div>

        {/* Open status */}
        {openStatus && (
          <div
            className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
              openStatus.open
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800/80 text-white'
            }`}
          >
            {openStatus.open ? `Open · til ${openStatus.closeTime}` : `Closed · opens ${openStatus.openTime}`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate">{spot.name}</h3>
            <p className="text-sm text-gray-500">
              {spot.neighborhood || spot.city.toUpperCase()}
            </p>
          </div>
          {spot.average_rating && (
            <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {spot.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          View details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
