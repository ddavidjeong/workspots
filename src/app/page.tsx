'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { City, BoundingBox, SpotFilters, LayoutMode } from '@/types';
import { useSpots } from '@/hooks/useSpots';
import FloatingFilters from '@/components/filters/FloatingFilters';
import SpotGrid from '@/components/spots/SpotGrid';
import SpotPreview from '@/components/spots/SpotPreview';
import { SpotHoverEvent } from '@/components/map/Map';

const Map = dynamic(() => import('@/components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

export default function Home() {
  const [city, setCity] = useState<City>('fortlee');
  const [filters, setFilters] = useState<SpotFilters>({});
  const [bounds, setBounds] = useState<BoundingBox | undefined>();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('map');

  const { spots, loading } = useSpots({ city, bounds, filters });

  const hoveredSpot = spots.find((s) => s.id === hoveredSpotId);

  const handleBoundsChange = useCallback((newBounds: BoundingBox) => {
    setBounds(newBounds);
  }, []);

  const handleSpotClick = useCallback((spotId: string) => {
    setSelectedSpotId((prev) => (prev === spotId ? null : spotId));
  }, []);

  const handleSpotHover = useCallback((spotId: string | null) => {
    setHoveredSpotId(spotId);
    if (!spotId) {
      setHoverPosition(null);
    }
  }, []);

  const handleSpotHoverWithPosition = useCallback((event: SpotHoverEvent) => {
    setHoveredSpotId(event.spotId);
    setHoverPosition(event.position);
  }, []);

  const handleCityChange = useCallback((newCity: City) => {
    setCity(newCity);
    setSelectedSpotId(null);
    setBounds(undefined);
  }, []);

  return (
    <div className="h-full relative">
      {layout === 'map' ? (
        // Map-dominant layout - full screen
        <>
          <div className="absolute inset-0">
            <Map
              city={city}
              spots={spots}
              selectedSpotId={selectedSpotId}
              onBoundsChange={handleBoundsChange}
              onSpotClick={handleSpotClick}
              onSpotHover={handleSpotHover}
              onSpotHoverWithPosition={handleSpotHoverWithPosition}
            />
          </div>

          {/* Floating logo - top center */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Floating actions - top right */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            {/* Layout toggle */}
            <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow-lg">
              <button
                onClick={() => setLayout('map')}
                className={`p-2 rounded-md transition-colors ${
                  layout === 'map' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Map view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
              <button
                onClick={() => setLayout('split')}
                className={`p-2 rounded-md transition-colors ${
                  layout === 'split' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Split view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            </div>

            {/* Add spot */}
            <button className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm text-gray-700 text-sm font-medium rounded-lg shadow-lg hover:bg-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add spot
            </button>

            {/* Sign in */}
            <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-gray-800 transition-colors">
              Sign in
            </button>
          </div>

          {/* Floating filters - top left, below zoom */}
          <div className="absolute top-4 left-14 z-40">
            <FloatingFilters
              city={city}
              filters={filters}
              onCityChange={handleCityChange}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Hover preview card */}
          {hoveredSpot && hoverPosition && (
            <SpotPreview
              spot={hoveredSpot}
              position={hoverPosition}
              onClose={() => setHoveredSpotId(null)}
              onViewDetails={() => {
                setSelectedSpotId(hoveredSpot.id);
                window.location.href = `/spot/${hoveredSpot.id}`;
              }}
            />
          )}

          {/* Spot count - bottom left */}
          <div className="absolute bottom-6 left-4 z-30">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Loading...' : `${spots.length} spots`}
              </span>
            </div>
          </div>
        </>
      ) : (
        // Split view layout - no header, list slides in
        <>
          {/* Full map behind */}
          <div className="absolute inset-0">
            <Map
              city={city}
              spots={spots}
              selectedSpotId={selectedSpotId}
              onBoundsChange={handleBoundsChange}
              onSpotClick={handleSpotClick}
              onSpotHover={handleSpotHover}
            />
          </div>

          {/* Floating logo - top center */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Floating actions - top right */}
          <div className="absolute top-4 right-[420px] z-50 flex items-center gap-2">
            <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow-lg">
              <button
                onClick={() => setLayout('map')}
                className={`p-2 rounded-md transition-colors ${
                  layout === 'map' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Map view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
              <button
                onClick={() => setLayout('split')}
                className={`p-2 rounded-md transition-colors ${
                  layout === 'split' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Split view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Floating filters - top left */}
          <div className="absolute top-4 left-14 z-40">
            <FloatingFilters
              city={city}
              filters={filters}
              onCityChange={handleCityChange}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Spot count - bottom left */}
          <div className="absolute bottom-6 left-4 z-30">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Loading...' : `${spots.length} spots`}
              </span>
            </div>
          </div>

          {/* Sliding list panel from right */}
          <div className="absolute top-0 right-0 bottom-0 w-[400px] bg-white shadow-2xl z-40 animate-in slide-in-from-right duration-300">
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    {loading ? 'Loading...' : `${spots.length} spots`}
                  </span>
                  <button
                    onClick={() => setLayout('map')}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <SpotGrid
                spots={spots}
                selectedSpotId={selectedSpotId}
                hoveredSpotId={hoveredSpotId}
                onSpotClick={handleSpotClick}
                onSpotHover={handleSpotHover}
                loading={loading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
