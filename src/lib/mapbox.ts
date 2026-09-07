// Map utilities (provider-agnostic)
import { City, CITY_DEFAULTS, BoundingBox } from '@/types';

// Get default viewport for a city
export function getCityViewport(city: City) {
  return CITY_DEFAULTS[city];
}

// Check if a point is within bounds
export function isInBounds(
  lat: number,
  lng: number,
  bounds: BoundingBox
): boolean {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}
