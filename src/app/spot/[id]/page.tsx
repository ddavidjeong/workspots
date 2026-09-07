'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SpotWithDetails, TRAIT_INFO, TraitKey } from '@/types';
import { getSpotById } from '@/hooks/useSpots';
import TraitBadges from '@/components/spots/TraitBadges';

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [spot, setSpot] = useState<SpotWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    async function loadSpot() {
      if (!params.id) return;
      setLoading(true);
      const data = await getSpotById(params.id as string);
      setSpot(data);
      setLoading(false);
    }
    loadSpot();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading spot...</div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Spot not found</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          Back to home
        </Link>
      </div>
    );
  }

  const photos = spot.photos.length > 0 ? spot.photos : [{ id: 'placeholder', url: '', spot_id: spot.id, source: 'user' as const, is_primary: true, storage_path: null, uploaded_by: null, width: null, height: null, created_at: '' }];
  const currentPhoto = photos[selectedPhotoIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{spot.name}</h1>
            <p className="text-sm text-gray-500">{spot.neighborhood}, {spot.city.toUpperCase()}</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Photo Gallery */}
        <div className="bg-black">
          <div className="relative aspect-[16/9] max-h-[500px]">
            {currentPhoto.url ? (
              <Image
                src={currentPhoto.url}
                alt={`${spot.name} interior`}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-1 p-2 overflow-x-auto bg-gray-900">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden ${
                    index === selectedPhotoIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Rating & Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              {spot.average_rating && (
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold text-lg">{spot.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500">({spot.review_count} reviews)</span>
                </div>
              )}
              {spot.traits?.vote_count && (
                <span className="text-sm text-gray-500">
                  {spot.traits.vote_count} workspace ratings
                </span>
              )}
            </div>

            {/* Workspace Traits */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Workspace Traits</h2>
              {spot.traits ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(Object.keys(TRAIT_INFO) as TraitKey[]).map((key) => {
                    const value = spot.traits?.[key];
                    if (value === null || value === undefined) return null;
                    const info = TRAIT_INFO[key];
                    return (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                        <div className="text-sm text-gray-500">{info.label}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No ratings yet. Be the first to rate!</p>
              )}
            </div>

            {/* About */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600">
                {spot.name} is a popular workspace located in {spot.neighborhood}, {spot.city === 'nyc' ? 'New York City' : 'San Francisco'}.
                Great for remote workers looking for a productive environment.
              </p>
            </div>

            {/* Current Crowdedness */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Busy Times</h2>
              <div className="space-y-2">
                {['Morning (6-11am)', 'Midday (11am-2pm)', 'Afternoon (2-5pm)', 'Evening (5-9pm)'].map((time, i) => {
                  const levels = [2, 4, 3, 2];
                  const level = levels[i];
                  return (
                    <div key={time} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-32">{time}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            level <= 2 ? 'bg-green-500' : level <= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${level * 20}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16">
                        {level <= 2 ? 'Quiet' : level <= 3 ? 'Moderate' : 'Busy'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Location Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
              <p className="text-gray-600 text-sm mb-3">{spot.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Open in Google Maps
              </a>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Hours</h3>
              {spot.hours ? (
                <div className="text-sm text-gray-600">
                  {Object.entries(spot.hours).map(([day, times]) => (
                    <div key={day} className="flex justify-between py-1">
                      <span className="capitalize">{day}</span>
                      <span>{times.open} - {times.close}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Hours not available</p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors">
                Rate this workspace
              </button>
              <button className="w-full py-3 bg-white text-gray-900 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                Add photos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
