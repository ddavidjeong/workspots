#!/usr/bin/env python3
"""
Update spots with photos from Yelp API image_url.
Then fetch additional photos using Yelp API's business details.
"""

import os
import json
import time
import glob
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

YELP_API_KEY = os.getenv("YELP_API_KEY")
YELP_BASE_URL = "https://api.yelp.com/v3"


def get_headers():
    return {"Authorization": f"Bearer {YELP_API_KEY}"}


def fetch_business_photos(yelp_id: str) -> list[str]:
    """Fetch photos for a business from Yelp API."""
    url = f"{YELP_BASE_URL}/businesses/{yelp_id}"

    try:
        response = requests.get(url, headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            photos = []

            # Get image_url (main photo)
            if data.get("image_url"):
                photos.append(data["image_url"])

            # Get photos array (sometimes has more)
            for p in data.get("photos", []):
                if p not in photos:
                    photos.append(p)

            return photos
        else:
            print(f"Error {response.status_code} for {yelp_id}")
            return []
    except Exception as e:
        print(f"Error fetching {yelp_id}: {e}")
        return []


def main():
    # Load spots
    input_pattern = "data/spots_*.json"
    all_spots = []

    for file_path in glob.glob(input_pattern):
        print(f"Loading {file_path}...")
        with open(file_path) as f:
            spots = json.load(f)
            all_spots.extend(spots)

    print(f"Processing {len(all_spots)} spots...")

    success_count = 0
    total_photos = 0

    for i, spot in enumerate(all_spots):
        yelp_id = spot.get("yelp_id")
        if not yelp_id:
            continue

        # Fetch photos
        photos = fetch_business_photos(yelp_id)

        if photos:
            spot["photos"] = photos
            spot["photo_count"] = len(photos)
            success_count += 1
            total_photos += len(photos)
        else:
            spot["photos"] = []
            spot["photo_count"] = 0

        # Progress
        if (i + 1) % 50 == 0:
            print(f"  Processed {i+1}/{len(all_spots)}...")

        # Rate limiting
        time.sleep(0.3)

    # Save updated spots
    output_path = Path("data/spots_with_photos.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(all_spots, f, indent=2)

    print(f"\n=== Results ===")
    print(f"Spots processed: {len(all_spots)}")
    print(f"Spots with photos: {success_count}")
    print(f"Total photos: {total_photos}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
