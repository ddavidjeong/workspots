'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { City, CITY_DEFAULTS, BoundingBox, SpotWithDetails, CATEGORY_INFO } from '@/types';

// This module is only ever loaded client-side (see the ssr:false dynamic import
// in page.tsx), so touching `window` via Leaflet's default-icon fix-up is safe here.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface SpotHoverEvent {
  spotId: string | null;
  position: { x: number; y: number } | null;
}

interface MapProps {
  city: City;
  spots?: SpotWithDetails[];
  selectedSpotId?: string | null;
  splitView?: boolean;
  nightModeOverride?: boolean;
  spotsRefreshKey?: number;
  animateSpots?: boolean;
  onBoundsChange?: (bounds: BoundingBox) => void;
  onSpotClick?: (spotId: string, position?: { x: number; y: number }) => void;
  onSpotHover?: (spotId: string | null) => void;
  onMapReady?: (controls: { zoomIn: () => void; zoomOut: () => void }) => void;
}

export default function Map({
  city,
  spots = [],
  selectedSpotId,
  splitView = false,
  nightModeOverride = false,
  spotsRefreshKey = 0,
  animateSpots = false,
  onBoundsChange,
  onSpotClick,
  onSpotHover,
  onMapReady,
}: MapProps) {
  const [exitingSpots, setExitingSpots] = useState<SpotWithDetails[]>([]);
  const prevSpotsRef = useRef<SpotWithDetails[]>([]);

  // Night mode based on user's local time (7pm - 6am)
  const [autoNightMode, setAutoNightMode] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  });

  // Update night mode every minute
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setAutoNightMode(hour >= 19 || hour < 6);
    };
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Use override (toggle button) as the source of truth
  const isNightMode = nightModeOverride;

  // Track exiting spots for animation
  useEffect(() => {
    const currentIds = new Set(spots.map(s => s.id));
    const exiting = prevSpotsRef.current.filter(s => !currentIds.has(s.id));

    if (exiting.length > 0) {
      setExitingSpots(prev => [...prev, ...exiting]);
      // Remove after animation
      setTimeout(() => {
        setExitingSpots(prev => prev.filter(s => !exiting.some(e => e.id === s.id)));
      }, 300);
    }

    prevSpotsRef.current = spots;
  }, [spots]);

  const { center, zoom } = CITY_DEFAULTS[city];

  return (
    <MapContainer
      center={[center[1], center[0]]} // Leaflet uses [lat, lng]
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      minZoom={10}
      maxZoom={18}
      zoomControl={false}
    >
      {/* Day tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        opacity={isNightMode ? 0 : 1}
      />
      {/* Night tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        opacity={isNightMode ? 1 : 0}
      />
      <MapEvents city={city} splitView={splitView} onBoundsChange={onBoundsChange} onMapReady={onMapReady} />
      {spots.map((spot, index) => (
        <SpotMarker
          key={`${spotsRefreshKey}-${spot.id}`}
          spot={spot}
          isSelected={spot.id === selectedSpotId}
          isExiting={false}
          entranceDelay={animateSpots ? index * 25 : 0}
          shouldAnimate={animateSpots}
          onClick={(position) => onSpotClick?.(spot.id, position)}
          onHover={(hovering) => onSpotHover?.(hovering ? spot.id : null)}
        />
      ))}
      {exitingSpots.map((spot) => (
        <SpotMarker
          key={`exit-${spot.id}`}
          spot={spot}
          isSelected={false}
          isExiting={true}
          onClick={() => {}}
          onHover={() => {}}
        />
      ))}
    </MapContainer>
  );
}

// Handle map events
function MapEvents({
  city,
  splitView,
  onBoundsChange,
  onMapReady,
}: {
  city: City;
  splitView: boolean;
  onBoundsChange?: (bounds: BoundingBox) => void;
  onMapReady?: (controls: { zoomIn: () => void; zoomOut: () => void }) => void;
}) {
  const map = useMap();

  // Expose zoom controls to parent
  useEffect(() => {
    if (onMapReady) {
      onMapReady({
        zoomIn: () => map.zoomIn(),
        zoomOut: () => map.zoomOut(),
      });
    }
  }, [map, onMapReady]);

  // Fly to city when it changes
  useEffect(() => {
    const { center, zoom } = CITY_DEFAULTS[city];
    map.flyTo([center[1], center[0]], zoom, { duration: 1.5 });
  }, [city, map]);

  // Calculate bounds with inset for visible area (matches the dotted border in split view)
  const getVisibleBounds = () => {
    if (!splitView) {
      const bounds = map.getBounds();
      return {
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
      };
    }

    const size = map.getSize();
    // Insets matching the dotted border: top-20(80px), left-20(80px), bottom-16(64px), right-[432px]
    const insetTop = 80;
    const insetLeft = 80;
    const insetBottom = 64;
    const insetRight = 432;

    const topLeft = map.containerPointToLatLng([insetLeft, insetTop]);
    const bottomRight = map.containerPointToLatLng([size.x - insetRight, size.y - insetBottom]);

    return {
      minLat: bottomRight.lat,
      minLng: topLeft.lng,
      maxLat: topLeft.lat,
      maxLng: bottomRight.lng,
    };
  };

  // Recalculate bounds when splitView changes
  useEffect(() => {
    if (onBoundsChange) {
      // Small delay to ensure map size is updated after layout shift
      const timer = setTimeout(() => {
        onBoundsChange(getVisibleBounds());
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitView]);

  // Track bounds changes
  useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        onBoundsChange(getVisibleBounds());
      }
    },
    load: () => {
      if (onBoundsChange) {
        onBoundsChange(getVisibleBounds());
      }
    },
  });

  return null;
}

// Custom spot marker - memoized to prevent unnecessary re-renders
function SpotMarker({
  spot,
  isSelected,
  isExiting,
  shouldAnimate = false,
  entranceDelay = 0,
  onClick,
  onHover,
}: {
  spot: SpotWithDetails;
  isSelected: boolean;
  isExiting: boolean;
  shouldAnimate?: boolean;
  entranceDelay?: number;
  onClick: (position: { x: number; y: number }) => void;
  onHover: (hovering: boolean) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  // Get category info with gradient colors
  const categoryInfo = spot.category ? CATEGORY_INFO[spot.category] : CATEGORY_INFO.other;
  const categoryIcon = categoryInfo.icon;
  const accentColor = categoryInfo.marker;

  // Solid gradient colors based on category
  const gradientColors: Record<string, { start: string; end: string; border: string }> = {
    cafe: { start: '#fefae0', end: '#f5e6d3', border: '#dda15e' },
    park: { start: '#f0f4e8', end: '#e2ead4', border: '#8a9a5b' },
    library: { start: '#f1faee', end: '#e4f0eb', border: '#9abdb5' },
    coworking: { start: '#f0f6fa', end: '#e3eef5', border: '#8eb8d4' },
    other: { start: '#f7f5f2', end: '#ece8e3', border: '#a69d91' },
  };

  const colors = gradientColors[spot.category || 'other'];
  const glowColor = `${accentColor}25`;

  // Capture animation state at mount time via ref - don't recreate icon when it changes
  const initialAnimateRef = useRef(shouldAnimate);
  const initialDelayRef = useRef(entranceDelay);

  const icon = useMemo(() => {
    const animationStyle = initialAnimateRef.current
      ? `animation: markerBounceIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${initialDelayRef.current}ms backwards;`
      : '';

    return L.divIcon({
      className: `custom-marker${isExiting ? ' marker-exit' : ''}`,
      html: `
        <div class="marker-inner marker-icon" style="
          --marker-bg-start: ${colors.start};
          --marker-bg-end: ${colors.end};
          --marker-border-color: ${colors.border};
          --marker-border-selected: ${accentColor};
          --marker-glow: ${glowColor};
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease-out !important;
          ${animationStyle}
        ">
          ${categoryIcon}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, [categoryIcon, colors, accentColor, glowColor, isExiting]);

  // Toggle selected class on existing DOM element for smooth CSS transition
  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      const el = marker.getElement();
      if (el) {
        if (isSelected) {
          el.classList.add('marker-selected');
        } else {
          el.classList.remove('marker-selected');
        }
      }
    }
  }, [isSelected]);


  return (
    <Marker
      ref={markerRef}
      position={[spot.lat, spot.lng]}
      icon={icon}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{
        click: (e: L.LeafletMouseEvent) => {
          const containerPoint = e.containerPoint;
          onClick({ x: containerPoint.x, y: containerPoint.y });
        },
        mouseover: () => onHover(true),
        mouseout: () => onHover(false),
      }}
    />
  );
}
