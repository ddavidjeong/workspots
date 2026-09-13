'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { City, BoundingBox, SpotFilters, LayoutMode, CITY_DEFAULTS } from '@/types';
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
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const { spots, loading } = useSpots({ city, bounds, filters });

  const unpinnedCard = openCards.find(c => !c.pinned);

  const handleBoundsChange = useCallback((newBounds: BoundingBox) => {
    setBounds(newBounds);
  }, []);

  const handleSpotClick = useCallback((spotId: string, position?: { x: number; y: number }) => {
    // In split view, just select the spot (scrolls to card in list)
    if (layout === 'split') {
      setSelectedSpotId(prev => prev === spotId ? null : spotId);
      return;
    }

    // In map view, manage floating cards
    const existingCard = openCards.find(c => c.spotId === spotId);
    if (existingCard) {
      if (!existingCard.pinned) {
        setOpenCards(cards => cards.filter(c => c.spotId !== spotId));
      }
      return;
    }

    setOpenCards(cards => {
      const pinned = cards.filter(c => c.pinned);
      if (position) {
        return [...pinned, { spotId, position, pinned: false }];
      }
      return pinned;
    });
  }, [openCards, layout]);

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

  // Handle panel resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.min(Math.max(newWidth, 300), 700));
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Show floating filters: always in map view, or in split view when panel is narrow
  const showFloatingFilters = layout === 'map' || (layout === 'split' && panelWidth <= 500);

  return (
    <div className="h-full relative overflow-hidden">
      {/* City selector + filters on map */}
      <motion.div
        className="absolute top-4 left-[72px] z-50 flex flex-wrap items-start gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* City selector - always visible */}
        <div className="flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-1 overflow-hidden">
          {(Object.entries(CITY_DEFAULTS) as [City, typeof CITY_DEFAULTS[City]][]).map(([key, config]) => (
            <motion.button
              key={key}
              onClick={() => handleCityChange(key)}
              className={`h-7 px-3 rounded-full text-xs font-medium relative ${
                city === key ? 'text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
              whileHover={{ scale: city === key ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {city === key && (
                <motion.div
                  layoutId="cityBgMain"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#283618' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{config.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Other filters - show when panel is narrow or in map view */}
        <AnimatePresence>
          {showFloatingFilters && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <FloatingFilters
                city={city}
                filters={filters}
                showCitySelector={false}
                onCityChange={handleCityChange}
                onFiltersChange={setFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
            className="absolute top-4 left-4 z-50 flex flex-col gap-4"
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
              splitView={true}
              onBoundsChange={handleBoundsChange}
              onSpotClick={handleSpotClick}
              onSpotHover={handleSpotHover}
              onMapReady={setMapControls}
            />
            {/* Viewport bounds indicator */}
            <div
              className="absolute bottom-8 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none z-10 shadow-sm"
              style={{
                top: 72,
                left: 72,
                right: panelWidth + 32,
                transition: isResizing ? 'none' : 'all 0.3s ease-out'
              }}
            />
          </div>

          {/* Logo + Zoom - top left */}
          <motion.div
            className="absolute top-4 left-4 z-50 flex flex-col gap-4"
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

          {/* Spots count - top right on map, only when panel is expanded */}
          {panelWidth > 500 && (
            <motion.div
              layoutId="spotsCount"
              className="absolute top-4 z-50 flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-3 gap-1.5"
              style={{ right: panelWidth + 16, transition: isResizing ? 'none' : 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <span className="text-sm font-semibold" style={{ color: '#283618' }}>{spots.length}</span>
              <span className="text-xs text-stone-500">spots</span>
            </motion.div>
          )}

          {/* Sliding list panel from right - glass effect */}
          <motion.div
            key={`list-panel-${layout}`}
            className="absolute top-0 right-0 bottom-0 bg-gradient-to-r from-white/20 to-white/35 backdrop-blur-lg shadow-2xl z-40 border-l border-white/10 flex flex-col"
            style={{ width: panelWidth, transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 28 },
              opacity: { duration: 0.15 }
            }}
          >
            {/* Resize handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize group/resize z-50 flex items-center justify-center"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            >
              <div className="absolute inset-y-0 left-0 w-full bg-transparent hover:bg-white/20 active:bg-white/40 transition-colors" />
              <div className="relative w-1.5 h-16 bg-stone-400/60 group-hover/resize:bg-stone-500 group-hover/resize:h-24 rounded-full transition-all shadow-sm" />
            </div>
            {/* Panel controls - always top right */}
            <motion.div
              className="absolute top-4 right-4 z-50 flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-1"
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <button
                onClick={() => setPanelWidth(620)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                title="Expand"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                </svg>
              </button>
              <AnimatePresence mode="popLayout">
                {panelWidth > 500 && (
                  <motion.button
                    onClick={() => setPanelWidth(300)}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors overflow-hidden"
                    title="Minimize"
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 28, opacity: 1, marginLeft: 2 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
              <button
                onClick={() => setLayout('map')}
                className="h-7 w-7 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors ml-0.5"
                title="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>

            {/* Header */}
            <motion.div
              className="bg-white/90 backdrop-blur-md border-b border-stone-200/30 px-4 pt-4 pb-3 pr-28 z-10 flex-shrink-0 flex items-center min-h-[64px]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
            >
              {panelWidth > 500 ? (
                <FloatingFilters
                  city={city}
                  filters={filters}
                  showCitySelector={false}
                  onCityChange={handleCityChange}
                  onFiltersChange={setFilters}
                />
              ) : (
                <motion.div
                  layoutId="spotsCount"
                  className="flex items-center gap-1.5"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#283618' }}>{spots.length}</span>
                  <span className="text-xs text-stone-500">spots</span>
                </motion.div>
              )}
            </motion.div>

            <div className="flex-1 overflow-y-auto">
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
