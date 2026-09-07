'use client';

import { useEffect, useState } from 'react';
import { City, CITY_DEFAULTS, BoundingBox, SpotWithDetails } from '@/types';

export interface SpotHoverEvent {
  spotId: string | null;
  position: { x: number; y: number } | null;
}

interface MapProps {
  city: City;
  spots?: SpotWithDetails[];
  selectedSpotId?: string | null;
  onBoundsChange?: (bounds: BoundingBox) => void;
  onSpotClick?: (spotId: string) => void;
  onSpotHover?: (spotId: string | null) => void;
  onSpotHoverWithPosition?: (event: SpotHoverEvent) => void;
}

// Leaflet requires window, so we load it dynamically
function LeafletMap({
  city,
  spots = [],
  selectedSpotId,
  onBoundsChange,
  onSpotClick,
  onSpotHover,
  onSpotHoverWithPosition,
}: MapProps) {
  const [components, setComponents] = useState<any>(null);

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

  const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } = components;
  const { center, zoom } = CITY_DEFAULTS[city];

  return (
    <MapContainer
      center={[center[1], center[0]]} // Leaflet uses [lat, lng]
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      minZoom={10}
      maxZoom={18}
    >
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />
      <MapEvents city={city} onBoundsChange={onBoundsChange} components={components} />
      {spots.map((spot) => (
        <SpotMarker
          key={spot.id}
          spot={spot}
          isSelected={spot.id === selectedSpotId}
          onClick={() => onSpotClick?.(spot.id)}
          onHover={(hovering) => onSpotHover?.(hovering ? spot.id : null)}
          onHoverWithPosition={onSpotHoverWithPosition}
          components={components}
        />
      ))}
    </MapContainer>
  );
}

// Handle map events
function MapEvents({
  city,
  onBoundsChange,
  components
}: {
  city: City;
  onBoundsChange?: (bounds: BoundingBox) => void;
  components: any;
}) {
  const { useMap, useMapEvents } = components;
  const map = useMap();

  // Fly to city when it changes
  useEffect(() => {
    const { center, zoom } = CITY_DEFAULTS[city];
    map.flyTo([center[1], center[0]], zoom, { duration: 1.5 });
  }, [city, map]);

  // Track bounds changes
  useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          minLat: bounds.getSouth(),
          minLng: bounds.getWest(),
          maxLat: bounds.getNorth(),
          maxLng: bounds.getEast(),
        });
      }
    },
    load: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          minLat: bounds.getSouth(),
          minLng: bounds.getWest(),
          maxLat: bounds.getNorth(),
          maxLng: bounds.getEast(),
        });
      }
    },
  });

  return null;
}

// Custom spot marker
function SpotMarker({
  spot,
  isSelected,
  onClick,
  onHover,
  onHoverWithPosition,
  components,
}: {
  spot: SpotWithDetails;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
  onHoverWithPosition?: (event: SpotHoverEvent) => void;
  components: any;
}) {
  const { Marker, Popup } = components;
  const L = components.L;

  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 600;
        background: ${isSelected ? '#2563eb' : '#1f2937'};
        transform: scale(${isSelected ? 1.25 : 1});
        box-shadow: ${isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.2)'};
        transition: all 0.2s;
      ">
        ${spot.average_rating ? spot.average_rating.toFixed(1) : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker
      position={[spot.lat, spot.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
        mouseover: (e: any) => {
          onHover(true);
          if (onHoverWithPosition) {
            const containerPoint = e.containerPoint;
            onHoverWithPosition({
              spotId: spot.id,
              position: { x: containerPoint.x, y: containerPoint.y },
            });
          }
        },
        mouseout: () => {
          onHover(false);
          if (onHoverWithPosition) {
            onHoverWithPosition({ spotId: null, position: null });
          }
        },
      }}
    >
      <Popup>
        <div className="text-sm">
          <strong>{spot.name}</strong>
          <br />
          {spot.neighborhood}
        </div>
      </Popup>
    </Marker>
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
