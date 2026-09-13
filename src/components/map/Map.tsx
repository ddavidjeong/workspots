'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { City, CITY_DEFAULTS, BoundingBox, SpotWithDetails, CATEGORY_INFO } from '@/types';

export interface SpotHoverEvent {
  spotId: string | null;
  position: { x: number; y: number } | null;
}

interface MapProps {
  city: City;
  spots?: SpotWithDetails[];
  selectedSpotId?: string | null;
  splitView?: boolean;
  onBoundsChange?: (bounds: BoundingBox) => void;
  onSpotClick?: (spotId: string, position?: { x: number; y: number }) => void;
  onSpotHover?: (spotId: string | null) => void;
  onMapReady?: (controls: { zoomIn: () => void; zoomOut: () => void }) => void;
}

// Leaflet requires window, so we load it dynamically
function LeafletMap({
  city,
  spots = [],
  selectedSpotId,
  splitView = false,
  onBoundsChange,
  onSpotClick,
  onSpotHover,
  onMapReady,
}: MapProps) {
  const [components, setComponents] = useState<any>(null);
  const [exitingSpots, setExitingSpots] = useState<SpotWithDetails[]>([]);
  const prevSpotsRef = useRef<SpotWithDetails[]>([]);

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

  useEffect(() => {
    // Dynamic import of react-leaflet and leaflet CSS
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([rl, L]) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setComponents({ ...rl, L });
    });
  }, []);

  if (!components) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading map...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer } = components;
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
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />
      <MapEvents city={city} splitView={splitView} onBoundsChange={onBoundsChange} onMapReady={onMapReady} components={components} />
      {spots.map((spot) => (
        <SpotMarker
          key={spot.id}
          spot={spot}
          isSelected={spot.id === selectedSpotId}
          isExiting={false}
          onClick={(position) => onSpotClick?.(spot.id, position)}
          onHover={(hovering) => onSpotHover?.(hovering ? spot.id : null)}
          components={components}
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
          components={components}
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
  components
}: {
  city: City;
  splitView: boolean;
  onBoundsChange?: (bounds: BoundingBox) => void;
  onMapReady?: (controls: { zoomIn: () => void; zoomOut: () => void }) => void;
  components: any;
}) {
  const { useMap, useMapEvents } = components;
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

  // Recalculate bounds when splitView changes
  useEffect(() => {
    if (onBoundsChange) {
      // Small delay to ensure map size is updated after layout shift
      const timer = setTimeout(() => {
        onBoundsChange(getVisibleBounds());
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [splitView]);

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
  onClick,
  onHover,
  components,
}: {
  spot: SpotWithDetails;
  isSelected: boolean;
  isExiting: boolean;
  onClick: (position: { x: number; y: number }) => void;
  onHover: (hovering: boolean) => void;
  components: any;
}) {
  const { Marker } = components;
  const L = components.L;
  const markerRef = useRef<any>(null);

  // Get category color or default
  const categoryInfo = spot.category ? CATEGORY_INFO[spot.category] : null;
  const markerColor = categoryInfo?.marker || '#1f2937';
  const selectedRingColor = markerColor + '40';

  // Create stable icon - selection handled via DOM class toggle for smooth transitions
  const icon = useMemo(() => L.divIcon({
    className: `custom-marker${isExiting ? ' marker-exit' : ''}`,
    html: `
      <div class="marker-inner" style="
        --marker-color: ${markerColor};
        --marker-ring: ${selectedRingColor};
      ">
        ${spot.average_rating ? spot.average_rating.toFixed(1) : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }), [L, spot.id, spot.average_rating, markerColor, selectedRingColor, isExiting]);

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
      eventHandlers={{
        click: (e: any) => {
          const containerPoint = e.containerPoint;
          onClick({ x: containerPoint.x, y: containerPoint.y });
        },
        mouseover: () => onHover(true),
        mouseout: () => onHover(false),
      }}
    />
  );
}

export default function Map(props: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading map...</div>
      </div>
    );
  }

  return <LeafletMap {...props} />;
}
