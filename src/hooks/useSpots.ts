'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SpotWithDetails, BoundingBox, SpotFilters, City } from '@/types';
import { getMockSpots, getMockSpotById } from '@/lib/mock-data';

// Check if Supabase is configured
const SUPABASE_CONFIGURED =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co';

interface UseSpotsOptions {
  city: City;
  bounds?: BoundingBox;
  filters?: SpotFilters;
}

interface UseSpotsReturn {
  spots: SpotWithDetails[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSpots({ city, bounds, filters }: UseSpotsOptions): UseSpotsReturn {
  const [spots, setSpots] = useState<SpotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!SUPABASE_CONFIGURED) {
        // Use mock data
        await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
        let mockSpots = getMockSpots(city);

        // Apply bounding box filter
        if (bounds) {
          mockSpots = mockSpots.filter(
            (spot) =>
              spot.lat >= bounds.minLat &&
              spot.lat <= bounds.maxLat &&
              spot.lng >= bounds.minLng &&
              spot.lng <= bounds.maxLng
          );
        }

        // Apply filters
        if (filters?.neighborhood) {
          mockSpots = mockSpots.filter((spot) => spot.neighborhood === filters.neighborhood);
        }
        if (filters?.minWifi) {
          mockSpots = mockSpots.filter(
            (spot) => spot.traits && (spot.traits.wifi_quality || 0) >= filters.minWifi!
          );
        }
        if (filters?.minOutlets) {
          mockSpots = mockSpots.filter(
            (spot) => spot.traits && (spot.traits.outlet_availability || 0) >= filters.minOutlets!
          );
        }
        if (filters?.maxNoise) {
          mockSpots = mockSpots.filter(
            (spot) => spot.traits && (spot.traits.noise_level || 5) <= filters.maxNoise!
          );
        }
        if (filters?.minTableSpace) {
          mockSpots = mockSpots.filter(
            (spot) => spot.traits && (spot.traits.table_space || 0) >= filters.minTableSpace!
          );
        }

        setSpots(mockSpots);
        return;
      }

      // Real Supabase query
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      let query = supabase
        .from('spots')
        .select(`
          *,
          photos (
            id,
            url,
            source,
            is_primary
          ),
          spot_traits (
            wifi_quality,
            outlet_availability,
            seating_comfort,
            noise_level,
            table_space,
            natural_light,
            coffee_quality,
            price_level,
            vote_count
          ),
          reviews (
            rating
          )
        `)
        .eq('city', city);

      if (bounds) {
        query = query
          .gte('lat', bounds.minLat)
          .lte('lat', bounds.maxLat)
          .gte('lng', bounds.minLng)
          .lte('lng', bounds.maxLng);
      }

      if (filters?.neighborhood) {
        query = query.eq('neighborhood', filters.neighborhood);
      }

      const { data, error: queryError } = await query.limit(100);

      if (queryError) throw queryError;

      const spotsWithDetails: SpotWithDetails[] = (data || [])
        .map((spot) => {
          const photos = spot.photos || [];
          const traits = spot.spot_traits?.[0] || null;
          const reviews = spot.reviews || [];

          const ratings = reviews.map((r: { rating: number }) => r.rating);
          const average_rating =
            ratings.length > 0
              ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
              : null;

          return {
            ...spot,
            photos,
            traits,
            primary_photo:
              photos.find((p: { is_primary: boolean }) => p.is_primary) || photos[0] || null,
            review_count: reviews.length,
            average_rating,
          };
        })
        .filter((spot) => {
          if (
            filters?.minWifi &&
            (!spot.traits || (spot.traits.wifi_quality || 0) < filters.minWifi)
          ) {
            return false;
          }
          if (
            filters?.minOutlets &&
            (!spot.traits || (spot.traits.outlet_availability || 0) < filters.minOutlets)
          ) {
            return false;
          }
          if (
            filters?.maxNoise &&
            spot.traits &&
            spot.traits.noise_level &&
            spot.traits.noise_level > filters.maxNoise
          ) {
            return false;
          }
          if (
            filters?.minTableSpace &&
            (!spot.traits || (spot.traits.table_space || 0) < filters.minTableSpace)
          ) {
            return false;
          }
          return true;
        });

      setSpots(spotsWithDetails);
    } catch (err) {
      console.error('Error fetching spots:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch spots'));
    } finally {
      setLoading(false);
    }
  }, [city, bounds, filters]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  return { spots, loading, error, refetch: fetchSpots };
}

// Get a single spot by ID
export async function getSpotById(id: string): Promise<SpotWithDetails | null> {
  if (!SUPABASE_CONFIGURED) {
    return getMockSpotById(id);
  }

  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('spots')
    .select(`
      *,
      photos (
        id,
        url,
        storage_path,
        source,
        is_primary,
        width,
        height
      ),
      spot_traits (
        wifi_quality,
        outlet_availability,
        seating_comfort,
        noise_level,
        table_space,
        natural_light,
        coffee_quality,
        price_level,
        vote_count
      ),
      reviews (
        id,
        rating,
        comment,
        work_session_length,
        created_at
      ),
      crowdedness (
        day_of_week,
        hour,
        level,
        sample_count
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const photos = data.photos || [];
  const traits = data.spot_traits?.[0] || null;
  const reviews = data.reviews || [];

  const ratings = reviews.map((r: { rating: number }) => r.rating);
  const average_rating =
    ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null;

  return {
    ...data,
    photos,
    traits,
    primary_photo: photos.find((p: { is_primary: boolean }) => p.is_primary) || photos[0] || null,
    review_count: reviews.length,
    average_rating,
  };
}
