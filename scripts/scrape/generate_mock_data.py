#!/usr/bin/env python3
"""
Generate TypeScript mock data from scraped Yelp data.
"""

import json

def estimate_traits(spot: dict) -> dict:
    """Estimate workspace traits from reviews and metadata."""
    reviews_text = " ".join([r.get("text", "").lower() for r in spot.get("sample_reviews", [])])

    traits = {
        "wifi_quality": 3,
        "outlet_availability": 3,
        "seating_comfort": 3,
        "noise_level": 3,
        "table_space": 3,
        "natural_light": 3,
        "coffee_quality": 4,
        "price_level": 2,
    }

    # WiFi signals
    if any(s in reviews_text for s in ["fast wifi", "great wifi", "good wifi"]):
        traits["wifi_quality"] = 4
    elif any(s in reviews_text for s in ["no wifi", "slow wifi"]):
        traits["wifi_quality"] = 2
    elif "wifi" in reviews_text:
        traits["wifi_quality"] = 4

    # Outlets
    if any(s in reviews_text for s in ["plenty of outlets", "lots of outlets"]):
        traits["outlet_availability"] = 5
    elif any(s in reviews_text for s in ["outlet", "plug", "charging"]):
        traits["outlet_availability"] = 4

    # Noise
    if any(s in reviews_text for s in ["quiet", "peaceful"]):
        traits["noise_level"] = 2
    elif any(s in reviews_text for s in ["loud", "noisy", "busy"]):
        traits["noise_level"] = 4

    # Coffee quality from rating
    if spot.get("rating", 0) >= 4.5:
        traits["coffee_quality"] = 5
    elif spot.get("rating", 0) >= 4.0:
        traits["coffee_quality"] = 4

    # Price
    price_map = {"$": 1, "$$": 2, "$$$": 3, "$$$$": 4}
    traits["price_level"] = price_map.get(spot.get("price", "$$"), 2)

    return traits


def main():
    # Load scraped data
    with open('data/spots_with_photos.json') as f:
        spots = json.load(f)

    # Filter for spots with photos and dedupe
    seen_ids = set()
    unique_spots = []
    for spot in spots:
        yelp_id = spot.get('yelp_id')
        if yelp_id and yelp_id not in seen_ids and spot.get('photos'):
            seen_ids.add(yelp_id)
            unique_spots.append(spot)

    # Split by city and take top spots
    nyc_spots = [s for s in unique_spots if s.get('city') == 'nyc'][:100]
    sf_spots = [s for s in unique_spots if s.get('city') == 'sf'][:100]

    all_spots = nyc_spots + sf_spots

    # Generate TypeScript
    ts_code = '''import { SpotWithDetails } from '@/types';

export const MOCK_SPOTS: SpotWithDetails[] = [
'''

    for i, spot in enumerate(all_spots):
        spot_id = str(i + 1)
        photo_url = spot.get('photos', [''])[0] or 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
        traits = estimate_traits(spot)

        # Escape strings
        name = spot.get('name', 'Unknown').replace("'", "\\'")
        address = spot.get('address', '').replace("'", "\\'")
        neighborhood = (spot.get('neighborhood') or 'Unknown').replace("'", "\\'")
        website = (spot.get('website') or '').replace("'", "\\'")

        ts_code += f'''  {{
    id: '{spot_id}',
    name: '{name}',
    address: '{address}',
    city: '{spot.get("city", "nyc")}',
    neighborhood: '{neighborhood}',
    lat: {spot.get('lat', 40.7)},
    lng: {spot.get('lng', -73.9)},
    place_id: '{spot.get("yelp_id", "")}',
    hours: {json.dumps(spot.get('hours') or {})},
    website: '{website}',
    phone: {json.dumps(spot.get('phone'))},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    photos: [
      {{ id: '{spot_id}a', spot_id: '{spot_id}', url: '{photo_url}', source: 'yelp', is_primary: true, storage_path: null, uploaded_by: null, width: 800, height: 600, created_at: '2024-01-01' }},
    ],
    traits: {{
      id: 't{spot_id}', spot_id: '{spot_id}', wifi_quality: {traits["wifi_quality"]}, outlet_availability: {traits["outlet_availability"]}, seating_comfort: {traits["seating_comfort"]},
      noise_level: {traits["noise_level"]}, table_space: {traits["table_space"]}, natural_light: {traits["natural_light"]}, coffee_quality: {traits["coffee_quality"]}, price_level: {traits["price_level"]}, vote_count: {spot.get("work_friendly_score", 1) * 10}, updated_at: '2024-01-01'
    }},
    primary_photo: {{ id: '{spot_id}a', spot_id: '{spot_id}', url: '{photo_url}', source: 'yelp', is_primary: true, storage_path: null, uploaded_by: null, width: 800, height: 600, created_at: '2024-01-01' }},
    review_count: {spot.get("review_count", 0)},
    average_rating: {spot.get("rating", 4.0)},
  }},
'''

    ts_code += '''];

export function getMockSpots(city: 'nyc' | 'sf'): SpotWithDetails[] {
  return MOCK_SPOTS.filter(s => s.city === city);
}

export function getMockSpotById(id: string): SpotWithDetails | null {
  return MOCK_SPOTS.find(s => s.id === id) || null;
}
'''

    # Write to file
    output_path = '/Users/David/Desktop/workhub/src/lib/mock-data.ts'
    with open(output_path, 'w') as f:
        f.write(ts_code)

    print(f'Generated mock data with {len(all_spots)} spots')
    print(f'  NYC: {len(nyc_spots)}')
    print(f'  SF: {len(sf_spots)}')
    print(f'Saved to: {output_path}')


if __name__ == '__main__':
    main()
