// Core domain types for WorkHub

export type City = 'nyc' | 'sf' | 'fortlee';

export type LayoutMode = 'map' | 'split';

export interface Spot {
  id: string;
  name: string;
  address: string;
  city: City;
  neighborhood: string | null;
  lat: number;
  lng: number;
  place_id: string | null;
  hours: Record<string, { open: string; close: string }> | null;
  website: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  spot_id: string;
  url: string;
  storage_path: string | null;
  source: 'user' | 'yelp' | 'google' | 'instagram';
  is_primary: boolean;
  uploaded_by: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface SpotTraits {
  id: string;
  spot_id: string;
  wifi_quality: number | null;
  outlet_availability: number | null;
  seating_comfort: number | null;
  noise_level: number | null;
  table_space: number | null;
  natural_light: number | null;
  coffee_quality: number | null;
  price_level: number | null;
  vote_count: number;
  updated_at: string;
}

export interface Crowdedness {
  id: string;
  spot_id: string;
  day_of_week: number;
  hour: number;
  level: number;
  sample_count: number;
}

export interface User {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  spot_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  work_session_length: number | null;
  visited_at: string | null;
  created_at: string;
}

// Joined types for UI
export interface SpotWithDetails extends Spot {
  photos: Photo[];
  traits: SpotTraits | null;
  primary_photo: Photo | null;
  review_count: number;
  average_rating: number | null;
}

// API/Filter types
export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface SpotFilters {
  city?: City;
  neighborhood?: string;
  minWifi?: number;
  minOutlets?: number;
  maxNoise?: number;
  minTableSpace?: number;
  hasPhotos?: boolean;
}

export interface MapViewport {
  center: [number, number]; // [lng, lat]
  zoom: number;
  bounds?: BoundingBox;
}

// Trait metadata for UI
export const TRAIT_INFO = {
  wifi_quality: {
    label: 'WiFi',
    icon: 'wifi',
    description: 'Internet speed and reliability',
    inverted: false,
  },
  outlet_availability: {
    label: 'Outlets',
    icon: 'plug',
    description: 'Power outlet availability',
    inverted: false,
  },
  seating_comfort: {
    label: 'Seating',
    icon: 'armchair',
    description: 'Chair and seating comfort',
    inverted: false,
  },
  noise_level: {
    label: 'Noise',
    icon: 'volume',
    description: 'Ambient noise level (lower is quieter)',
    inverted: true,
  },
  table_space: {
    label: 'Space',
    icon: 'maximize',
    description: 'Table and desk space',
    inverted: false,
  },
  natural_light: {
    label: 'Light',
    icon: 'sun',
    description: 'Natural lighting',
    inverted: false,
  },
  coffee_quality: {
    label: 'Coffee',
    icon: 'coffee',
    description: 'Coffee quality',
    inverted: false,
  },
  price_level: {
    label: 'Price',
    icon: 'dollar',
    description: 'Price range',
    inverted: false,
  },
} as const;

export type TraitKey = keyof typeof TRAIT_INFO;

// City defaults
export const CITY_DEFAULTS: Record<City, { center: [number, number]; zoom: number; label: string }> = {
  nyc: { center: [-73.985, 40.748], zoom: 12, label: 'NYC' },
  sf: { center: [-122.419, 37.775], zoom: 12, label: 'SF' },
  fortlee: { center: [-73.9712, 40.8509], zoom: 14, label: 'Fort Lee' },
};
