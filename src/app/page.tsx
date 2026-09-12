'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { City, BoundingBox, SpotFilters, LayoutMode } from '@/types';
import { useSpots } from '@/hooks/useSpots';
import FloatingFilters from '@/components/filters/FloatingFilters';
import SpotGrid from '@/components/spots/SpotGrid';
import SpotPreview from '@/components/spots/SpotPreview';
import AddSpotModal, { NewSpotData } from '@/components/spots/AddSpotModal';

const Map = dynamic(() => import('@/components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-stone-500">Loading map...</span>
    </div>
  ),
});

export default function Home() {
  const [city, setCity] = useState<City>('fortlee');
  const [filters, setFilters] = useState<SpotFilters>({});
  const [bounds, setBounds] = useState<BoundingBox | undefined>();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Array<{
    spotId: string;
    position: { x: number; y: number };
    pinned: boolean; // true = dragged or expanded, can't click-outside to close
  }>>([]);
  const [layout, setLayout] = useState<LayoutMode>('map');
  const [mapControls, setMapControls] = useState<{ zoomIn: () => void; zoomOut: () => void } | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);

  const { spots, loading } = useSpots({ city, bounds, filters });

  const unpinnedCard = openCards.find(c => !c.pinned);

  const handleBoundsChange = useCallback((newBounds: BoundingBox) => {
    setBounds(newBounds);
  }, []);

  const handleSpotClick = useCallback((spotId: string, position?: { x: number; y: number }) => {
    // Check if this spot already has an open card
    const existingCard = openCards.find(c => c.spotId === spotId);
    if (existingCard) {
      // If unpinned, close it. If pinned, do nothing (need to use X)
      if (!existingCard.pinned) {
        setOpenCards(cards => cards.filter(c => c.spotId !== spotId));
      }
      return;
    }

    // Close any unpinned card first
    setOpenCards(cards => {
      const pinned = cards.filter(c => c.pinned);
      if (position) {
        return [...pinned, { spotId, position, pinned: false }];
      }
      return pinned;
    });
  }, [openCards]);

  const handleSpotHover = useCallback((spotId: string | null) => {
    setHoveredSpotId(spotId);
  }, []);

  const handleCityChange = useCallback((newCity: City) => {
    setCity(newCity);
    setSelectedSpotId(null);
    setBounds(undefined);
  }, []);

  const handleAddSpot = useCallback((data: NewSpotData) => {
    console.log('New spot submitted:', data);
    // TODO: Save to Supabase and geocode address
    alert(`Spot "${data.name}" added! (Demo mode - not saved to database)`);
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
              selectedSpotId={openCards.length > 0 ? openCards[openCards.length - 1].spotId : null}
              onBoundsChange={handleBoundsChange}
              onSpotClick={handleSpotClick}
              onSpotHover={handleSpotHover}
              onMapReady={setMapControls}
            />
          </div>

          {/* Logo + Zoom - top left */}
          <motion.div
            className="absolute top-4 left-4 z-50 flex flex-col gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
              style={{ backgroundColor: '#283618' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* Laptop/desk icon */}
              <svg className="w-5 h-5" style={{ color: '#fefae0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            {/* Zoom controls */}
            <motion.div
              className="flex flex-col bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.button
                onClick={() => mapControls?.zoomIn()}
                className="w-10 h-9 flex items-center justify-center text-stone-600 border-b border-stone-200"
                whileHover={{ backgroundColor: '#f5f5f4', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
              <motion.button
                onClick={() => mapControls?.zoomOut()}
                className="w-10 h-9 flex items-center justify-center text-stone-600"
                whileHover={{ backgroundColor: '#f5f5f4', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Floating actions - top right */}
          <motion.div
            className="absolute top-4 right-4 z-50 flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Layout toggle - h-9 to match */}
            <div className="flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-1 overflow-hidden relative">
              <motion.div
                className="absolute inset-y-1 rounded-full"
                style={{ backgroundColor: '#283618' }}
                animate={{
                  x: layout === 'map' ? 4 : 'calc(100% - 4px)',
                  width: 'calc(50% - 4px)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
              <motion.button
                onClick={() => setLayout('map')}
                className={`h-7 px-3 rounded-full relative z-10 ${
                  layout === 'map' ? 'text-white' : 'text-stone-500'
                }`}
                title="Map view"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </motion.button>
              <motion.button
                onClick={() => setLayout('split')}
                className={`h-7 px-3 rounded-full relative z-10 ${
                  layout !== 'map' ? 'text-white' : 'text-stone-500'
                }`}
                title="Split view"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </motion.button>
            </div>

            {/* Add spot - h-9 */}
            <motion.button
              onClick={() => setShowAddSpot(true)}
              className="flex items-center gap-2 h-9 px-4 bg-white/95 backdrop-blur-sm text-stone-700 text-xs font-medium rounded-full shadow-md border border-stone-200"
              whileHover={{ scale: 1.05, backgroundColor: '#ffffff' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ rotate: 90 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </motion.svg>
              Add spot
            </motion.button>

            {/* Sign in - h-9 */}
            <motion.button
              className="h-9 px-4 text-xs font-medium rounded-full shadow-md"
              style={{ backgroundColor: '#283618', color: '#fefae0' }}
              whileHover={{ scale: 1.05, backgroundColor: '#3d4f28' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Sign in
            </motion.button>
          </motion.div>

          {/* Floating filters - next to logo/zoom stack */}
          <motion.div
            className="absolute top-4 left-[72px] z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <FloatingFilters
              city={city}
              filters={filters}
              onCityChange={handleCityChange}
              onFiltersChange={setFilters}
            />
          </motion.div>

          {/* Backdrop for unpinned cards */}
          <AnimatePresence>
            {unpinnedCard && (
              <motion.div
                className="absolute inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setOpenCards(cards => cards.filter(c => c.pinned));
                }}
              />
            )}
          </AnimatePresence>

          {/* Open cards */}
          {openCards.map((card, index) => {
            const cardSpot = spots.find(s => s.id === card.spotId);
            if (!cardSpot) return null;
            return (
              <SpotPreview
                key={card.spotId}
                spot={cardSpot}
                initialPosition={card.position}
                zIndex={50 + index}
                onClose={() => {
                  setOpenCards(cards => cards.filter(c => c.spotId !== card.spotId));
                }}
                onDragStart={() => {
                  setOpenCards(cards =>
                    cards.map(c =>
                      c.spotId === card.spotId ? { ...c, pinned: true } : c
                    )
                  );
                }}
                onFocus={() => {
                  setOpenCards(cards => {
                    const withoutThis = cards.filter(c => c.spotId !== card.spotId);
                    const thisCard = cards.find(c => c.spotId === card.spotId);
                    return thisCard ? [...withoutThis, thisCard] : cards;
                  });
                }}
              />
            );
          })}

          {/* Spot count - bottom left */}
          <motion.div
            className="absolute bottom-6 left-4 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-4"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                className="text-xs font-medium text-stone-700"
                key={spots.length}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loading ? 'Loading...' : `${spots.length} spots`}
              </motion.span>
            </motion.div>
          </motion.div>
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
              onMapReady={setMapControls}
            />
          </div>

          {/* Logo + Zoom - top left */}
          <motion.div
            className="absolute top-4 left-4 z-50 flex flex-col gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
              style={{ backgroundColor: '#283618' }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" style={{ color: '#fefae0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            {/* Zoom controls */}
            <motion.div
              className="flex flex-col bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.button
                onClick={() => mapControls?.zoomIn()}
                className="w-10 h-9 flex items-center justify-center text-stone-600 border-b border-stone-200"
                whileHover={{ backgroundColor: '#f5f5f4', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
              <motion.button
                onClick={() => mapControls?.zoomOut()}
                className="w-10 h-9 flex items-center justify-center text-stone-600"
                whileHover={{ backgroundColor: '#f5f5f4', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Floating filters - next to logo/zoom stack */}
          <motion.div
            className="absolute top-4 left-[72px] z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <FloatingFilters
              city={city}
              filters={filters}
              onCityChange={handleCityChange}
              onFiltersChange={setFilters}
            />
          </motion.div>

          {/* Spot count - bottom left */}
          <motion.div
            className="absolute bottom-6 left-4 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="flex items-center h-9 bg-white/80 backdrop-blur-md rounded-full shadow-md border border-stone-200/50 px-4"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                className="text-xs font-medium text-stone-700"
                key={spots.length}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loading ? 'Loading...' : `${spots.length} spots`}
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Sliding list panel from right - glass effect */}
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-[400px] bg-gradient-to-r from-white/20 to-white/35 backdrop-blur-lg shadow-2xl z-40 border-l border-white/10"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="h-full overflow-y-auto">
              <motion.div
                className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-stone-200/30 px-4 py-3 z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="flex items-center justify-between">
                  <motion.span
                    className="text-sm font-semibold text-stone-900"
                    key={spots.length}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {loading ? 'Loading...' : `${spots.length} spots`}
                  </motion.span>
                  <motion.button
                    onClick={() => setLayout('map')}
                    className="p-1.5 rounded-md"
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(214, 211, 209, 0.5)', rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
              <SpotGrid
                spots={spots}
                selectedSpotId={selectedSpotId}
                hoveredSpotId={hoveredSpotId}
                onSpotClick={handleSpotClick}
                onSpotHover={handleSpotHover}
                loading={loading}
              />
            </div>
          </motion.div>
        </>
      )}

      {/* Add Spot Modal */}
      <AddSpotModal
        isOpen={showAddSpot}
        onClose={() => setShowAddSpot(false)}
        onSubmit={handleAddSpot}
      />
    </div>
  );
}
