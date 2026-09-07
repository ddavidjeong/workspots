#!/usr/bin/env python3
"""
Seed WorkHub database from scraped data.

Usage:
    python seed_database.py --input data/spots_20240101_120000.json
    python seed_database.py --input data/spots_*.json  # Multiple files
"""

import os
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm
import glob

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for admin access


def get_supabase() -> Client:
    """Create Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def load_spots(input_path: str) -> list:
    """Load spots from JSON file(s)."""
    all_spots = []

    # Handle glob patterns
    files = glob.glob(input_path)
    if not files:
        files = [input_path]

    for file_path in files:
        print(f"Loading {file_path}...")
        with open(file_path) as f:
            spots = json.load(f)
            all_spots.extend(spots)

    # Dedupe by yelp_id
    seen = set()
    unique_spots = []
    for spot in all_spots:
        yelp_id = spot.get("yelp_id")
        if yelp_id and yelp_id not in seen:
            seen.add(yelp_id)
            unique_spots.append(spot)

    print(f"Loaded {len(unique_spots)} unique spots")
    return unique_spots


def estimate_traits_from_reviews(spot: dict) -> dict:
    """Estimate workspace traits from reviews and metadata."""
    reviews_text = " ".join([r.get("text", "").lower() for r in spot.get("sample_reviews", [])])

    traits = {
        "wifi_quality": None,
        "outlet_availability": None,
        "seating_comfort": None,
        "noise_level": None,
        "table_space": None,
        "natural_light": None,
        "coffee_quality": None,
        "price_level": None,
    }

    # WiFi signals
    wifi_good = ["fast wifi", "great wifi", "good wifi", "strong wifi", "reliable wifi"]
    wifi_bad = ["no wifi", "slow wifi", "bad wifi", "weak wifi"]
    if any(s in reviews_text for s in wifi_good):
        traits["wifi_quality"] = 4
    elif any(s in reviews_text for s in wifi_bad):
        traits["wifi_quality"] = 2
    elif "wifi" in reviews_text or "wi-fi" in reviews_text:
        traits["wifi_quality"] = 3

    # Outlets
    outlet_good = ["plenty of outlets", "lots of outlets", "outlets everywhere", "easy to find outlets"]
    outlet_bad = ["no outlets", "few outlets", "hard to find outlets"]
    if any(s in reviews_text for s in outlet_good):
        traits["outlet_availability"] = 4
    elif any(s in reviews_text for s in outlet_bad):
        traits["outlet_availability"] = 2
    elif "outlet" in reviews_text or "plug" in reviews_text or "charging" in reviews_text:
        traits["outlet_availability"] = 3

    # Noise
    quiet_signals = ["quiet", "peaceful", "calm", "silent", "library"]
    loud_signals = ["loud", "noisy", "crowded", "busy", "packed"]
    if any(s in reviews_text for s in quiet_signals):
        traits["noise_level"] = 2  # Lower is better for noise
    elif any(s in reviews_text for s in loud_signals):
        traits["noise_level"] = 4

    # Space
    spacious_signals = ["spacious", "roomy", "big tables", "spread out", "lots of space"]
    cramped_signals = ["cramped", "tiny", "small tables", "crowded"]
    if any(s in reviews_text for s in spacious_signals):
        traits["table_space"] = 4
    elif any(s in reviews_text for s in cramped_signals):
        traits["table_space"] = 2

    # Seating
    comfy_signals = ["comfortable", "comfy chairs", "cozy", "soft seats"]
    uncomfy_signals = ["hard chairs", "uncomfortable", "wooden chairs"]
    if any(s in reviews_text for s in comfy_signals):
        traits["seating_comfort"] = 4
    elif any(s in reviews_text for s in uncomfy_signals):
        traits["seating_comfort"] = 2

    # Light
    light_signals = ["natural light", "bright", "sunny", "windows", "well lit"]
    dark_signals = ["dark", "dim", "no windows"]
    if any(s in reviews_text for s in light_signals):
        traits["natural_light"] = 4
    elif any(s in reviews_text for s in dark_signals):
        traits["natural_light"] = 2

    # Coffee quality - base on rating
    if spot.get("rating", 0) >= 4.5:
        traits["coffee_quality"] = 5
    elif spot.get("rating", 0) >= 4.0:
        traits["coffee_quality"] = 4
    elif spot.get("rating", 0) >= 3.5:
        traits["coffee_quality"] = 3

    # Price level from Yelp
    price_map = {"$": 1, "$$": 2, "$$$": 3, "$$$$": 4}
    traits["price_level"] = price_map.get(spot.get("price", "$$"), 2)

    return {k: v for k, v in traits.items() if v is not None}


def seed_spot(supabase: Client, spot: dict) -> str | None:
    """Insert a spot into the database. Returns spot ID or None on failure."""
    try:
        # Insert spot
        spot_data = {
            "name": spot["name"],
            "address": spot["address"],
            "city": spot["city"],
            "neighborhood": spot.get("neighborhood"),
            "lat": spot["lat"],
            "lng": spot["lng"],
            "place_id": spot.get("yelp_id"),  # Use yelp_id as place_id
            "hours": spot.get("hours") or {},
            "website": spot.get("website"),
            "phone": spot.get("phone"),
        }

        result = supabase.table("spots").insert(spot_data).execute()
        spot_id = result.data[0]["id"]

        # Insert photos
        photos = spot.get("photos", [])
        for i, photo_url in enumerate(photos):
            photo_data = {
                "spot_id": spot_id,
                "url": photo_url,
                "source": "yelp",
                "is_primary": i == 0,
            }
            supabase.table("photos").insert(photo_data).execute()

        # Insert estimated traits
        traits = estimate_traits_from_reviews(spot)
        if traits:
            traits_data = {
                "spot_id": spot_id,
                **traits,
                "vote_count": 1,  # Estimated, not user-voted
            }
            supabase.table("spot_traits").insert(traits_data).execute()

        return spot_id

    except Exception as e:
        print(f"Error seeding {spot.get('name')}: {e}")
        return None


def clear_existing_data(supabase: Client) -> None:
    """Clear all existing data (for fresh start)."""
    print("Clearing existing data...")
    # Delete in order due to foreign keys
    supabase.table("trait_votes").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("favorites").delete().neq("user_id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("crowdedness").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("spot_traits").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("photos").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("spots").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("Done.")


def main():
    parser = argparse.ArgumentParser(description="Seed database from scraped data")
    parser.add_argument("--input", required=True, help="Input JSON file or glob pattern")
    parser.add_argument("--clear", action="store_true", help="Clear existing data first")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually insert, just validate")

    args = parser.parse_args()

    # Load spots
    spots = load_spots(args.input)
    if not spots:
        print("No spots to seed!")
        return

    if args.dry_run:
        print(f"\nDry run - would insert {len(spots)} spots")
        for spot in spots[:5]:
            print(f"  - {spot['name']} ({spot['city']})")
        return

    # Connect to Supabase
    supabase = get_supabase()

    # Optionally clear existing data
    if args.clear:
        confirm = input("Are you sure you want to clear all existing data? (yes/no): ")
        if confirm.lower() == "yes":
            clear_existing_data(supabase)

    # Seed spots
    print(f"\nSeeding {len(spots)} spots...")
    success = 0
    failed = 0

    for spot in tqdm(spots, desc="Seeding"):
        spot_id = seed_spot(supabase, spot)
        if spot_id:
            success += 1
        else:
            failed += 1

    print(f"\n=== Results ===")
    print(f"Success: {success}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
