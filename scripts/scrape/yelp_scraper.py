#!/usr/bin/env python3
"""
Yelp Scraper for WorkHub
Pulls cafes from NYC and SF, filters for work-friendly spots, downloads photos.

Usage:
    python yelp_scraper.py --city nyc --limit 100
    python yelp_scraper.py --city sf --limit 100
    python yelp_scraper.py --all --limit 200
"""

import os
import json
import time
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

YELP_API_KEY = os.getenv("YELP_API_KEY")
YELP_BASE_URL = "https://api.yelp.com/v3"

# Search areas - multiple neighborhoods per city for better coverage
CITIES = {
    "nyc": {
        "name": "New York City",
        "neighborhoods": [
            {"name": "Greenwich Village", "lat": 40.7336, "lng": -73.9945},
            {"name": "Chelsea", "lat": 40.7465, "lng": -74.0014},
            {"name": "Flatiron", "lat": 40.7410, "lng": -73.9896},
            {"name": "SoHo", "lat": 40.7233, "lng": -73.9961},
            {"name": "Williamsburg", "lat": 40.7081, "lng": -73.9571},
            {"name": "DUMBO", "lat": 40.7033, "lng": -73.9881},
            {"name": "Lower East Side", "lat": 40.7150, "lng": -73.9843},
            {"name": "East Village", "lat": 40.7265, "lng": -73.9815},
            {"name": "Midtown", "lat": 40.7549, "lng": -73.9840},
            {"name": "Upper West Side", "lat": 40.7870, "lng": -73.9754},
            {"name": "Tribeca", "lat": 40.7163, "lng": -74.0086},
            {"name": "West Village", "lat": 40.7358, "lng": -74.0036},
        ]
    },
    "sf": {
        "name": "San Francisco",
        "neighborhoods": [
            {"name": "SoMa", "lat": 37.7785, "lng": -122.3950},
            {"name": "Mission", "lat": 37.7599, "lng": -122.4148},
            {"name": "Hayes Valley", "lat": 37.7759, "lng": -122.4245},
            {"name": "North Beach", "lat": 37.8060, "lng": -122.4103},
            {"name": "Marina", "lat": 37.8037, "lng": -122.4368},
            {"name": "Potrero Hill", "lat": 37.7562, "lng": -122.3926},
            {"name": "Noe Valley", "lat": 37.7502, "lng": -122.4337},
            {"name": "Castro", "lat": 37.7609, "lng": -122.4350},
            {"name": "Financial District", "lat": 37.7946, "lng": -122.3999},
            {"name": "Pacific Heights", "lat": 37.7925, "lng": -122.4382},
            {"name": "Russian Hill", "lat": 37.8011, "lng": -122.4194},
            {"name": "Inner Sunset", "lat": 37.7600, "lng": -122.4662},
        ]
    }
}

# Keywords that suggest a cafe is good for working
WORK_FRIENDLY_KEYWORDS = [
    "wifi", "wi-fi", "laptop", "laptops", "work", "working", "study", "studying",
    "outlet", "outlets", "plug", "plugs", "power", "charging", "remote",
    "coworking", "co-working", "workspace", "quiet", "spacious", "tables",
    "students", "freelance", "meeting", "productive"
]

def get_headers():
    return {"Authorization": f"Bearer {YELP_API_KEY}"}


def search_cafes(lat: float, lng: float, radius: int = 1500, limit: int = 50) -> list:
    """Search for cafes near a location."""
    url = f"{YELP_BASE_URL}/businesses/search"
    params = {
        "latitude": lat,
        "longitude": lng,
        "radius": radius,  # meters
        "categories": "coffee,coffeeroasteries,coffeeshops,cafes",
        "limit": min(limit, 50),  # Yelp max is 50 per request
        "sort_by": "rating",
    }

    try:
        response = requests.get(url, headers=get_headers(), params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("businesses", [])
    except Exception as e:
        print(f"Error searching cafes: {e}")
        return []


def get_business_details(business_id: str) -> dict:
    """Get detailed info for a business including photos and hours."""
    url = f"{YELP_BASE_URL}/businesses/{business_id}"

    try:
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error getting details for {business_id}: {e}")
        return {}


def get_business_reviews(business_id: str) -> list:
    """Get reviews for a business to check for work-friendly signals."""
    url = f"{YELP_BASE_URL}/businesses/{business_id}/reviews"
    params = {"limit": 20, "sort_by": "yelp_sort"}

    try:
        response = requests.get(url, headers=get_headers(), params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("reviews", [])
    except Exception as e:
        print(f"Error getting reviews for {business_id}: {e}")
        return []


def is_work_friendly(reviews: list, details: dict) -> tuple[bool, int]:
    """
    Check if a cafe seems work-friendly based on reviews.
    Returns (is_work_friendly, score)
    """
    text = " ".join([r.get("text", "").lower() for r in reviews])

    # Also check business name and categories
    name = details.get("name", "").lower()
    categories = " ".join([c.get("title", "").lower() for c in details.get("categories", [])])

    full_text = f"{text} {name} {categories}"

    score = sum(1 for keyword in WORK_FRIENDLY_KEYWORDS if keyword in full_text)

    # Consider it work-friendly if it has 2+ keyword matches
    return score >= 2, score


def extract_photos(details: dict, search_result: dict = None) -> list:
    """Extract photo URLs from business details."""
    photos = []

    # Get photos from details endpoint (up to 3)
    if details.get("photos"):
        photos.extend(details["photos"])

    # Get main image_url from details or search result
    if details.get("image_url") and details["image_url"] not in photos:
        photos.insert(0, details["image_url"])

    if search_result and search_result.get("image_url"):
        if search_result["image_url"] not in photos:
            photos.append(search_result["image_url"])

    return photos


def download_photo(url: str, save_path: Path) -> bool:
    """Download a photo to disk."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path.write_bytes(response.content)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False


def parse_hours(hours_data: list) -> dict:
    """Parse Yelp hours format to our format."""
    if not hours_data:
        return {}

    days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    result = {}

    for hour_block in hours_data:
        if hour_block.get("hours_type") != "REGULAR":
            continue
        for entry in hour_block.get("open", []):
            day_idx = entry.get("day", 0)
            if day_idx < len(days):
                day = days[day_idx]
                start = entry.get("start", "")
                end = entry.get("end", "")
                if start and end:
                    # Convert "0900" to "9:00"
                    start_fmt = f"{int(start[:2])}:{start[2:]}"
                    end_fmt = f"{int(end[:2])}:{end[2:]}"
                    result[day] = {"open": start_fmt, "close": end_fmt}

    return result


def process_business(business: dict, city: str, neighborhood: str) -> dict | None:
    """Process a single business and return structured data."""
    business_id = business.get("id")

    # Get detailed info
    details = get_business_details(business_id)
    if not details:
        return None

    # Get reviews
    reviews = get_business_reviews(business_id)

    # Check if work-friendly
    work_friendly, score = is_work_friendly(reviews, details)

    # Skip if not work-friendly and low rating
    rating = details.get("rating", 0)
    if not work_friendly and rating < 4.0:
        return None

    # Extract location
    location = details.get("location", {})
    coordinates = details.get("coordinates", {})

    # Build structured data
    spot = {
        "yelp_id": business_id,
        "name": details.get("name"),
        "address": ", ".join(filter(None, [
            location.get("address1"),
            location.get("city"),
            location.get("state"),
            location.get("zip_code")
        ])),
        "city": city,
        "neighborhood": neighborhood,
        "lat": coordinates.get("latitude"),
        "lng": coordinates.get("longitude"),
        "phone": details.get("phone"),
        "website": details.get("url"),  # Yelp page, not actual website
        "hours": parse_hours(details.get("hours", [])),
        "rating": rating,
        "review_count": details.get("review_count", 0),
        "price": details.get("price", ""),
        "work_friendly_score": score,
        "photos": extract_photos(details, business),  # Pass search result for image_url
        "categories": [c.get("title") for c in details.get("categories", [])],
        "sample_reviews": [
            {"text": r.get("text", "")[:500], "rating": r.get("rating")}
            for r in reviews[:3]
        ]
    }

    return spot


def scrape_city(city_key: str, limit_per_neighborhood: int = 20) -> list:
    """Scrape all cafes for a city."""
    city_data = CITIES.get(city_key)
    if not city_data:
        print(f"Unknown city: {city_key}")
        return []

    all_spots = []
    seen_ids = set()

    print(f"\nScraping {city_data['name']}...")

    for neighborhood in tqdm(city_data["neighborhoods"], desc="Neighborhoods"):
        # Search for cafes in this neighborhood
        cafes = search_cafes(
            neighborhood["lat"],
            neighborhood["lng"],
            radius=1200,
            limit=limit_per_neighborhood
        )

        for cafe in tqdm(cafes, desc=f"  {neighborhood['name']}", leave=False):
            cafe_id = cafe.get("id")

            # Skip duplicates
            if cafe_id in seen_ids:
                continue
            seen_ids.add(cafe_id)

            # Process the business
            spot = process_business(cafe, city_key, neighborhood["name"])
            if spot:
                all_spots.append(spot)

            # Rate limiting - Yelp allows 5000/day, be conservative
            time.sleep(0.5)

    return all_spots


def download_all_photos(spots: list, output_dir: Path) -> None:
    """Download all photos for scraped spots."""
    photos_dir = output_dir / "photos"
    photos_dir.mkdir(parents=True, exist_ok=True)

    print("\nDownloading photos...")

    for spot in tqdm(spots, desc="Spots"):
        spot_id = spot["yelp_id"]
        spot_photos_dir = photos_dir / spot_id

        downloaded = []
        for i, photo_url in enumerate(spot.get("photos", [])):
            photo_path = spot_photos_dir / f"{i}.jpg"
            if download_photo(photo_url, photo_path):
                downloaded.append(str(photo_path.relative_to(output_dir)))
            time.sleep(0.2)

        # Update spot with local paths
        spot["local_photos"] = downloaded


def save_results(spots: list, output_path: Path) -> None:
    """Save scraped data to JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(spots, f, indent=2)

    print(f"\nSaved {len(spots)} spots to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Scrape cafes from Yelp")
    parser.add_argument("--city", choices=["nyc", "sf"], help="City to scrape")
    parser.add_argument("--all", action="store_true", help="Scrape all cities")
    parser.add_argument("--limit", type=int, default=20, help="Limit per neighborhood")
    parser.add_argument("--output", type=str, default="data", help="Output directory")
    parser.add_argument("--download-photos", action="store_true", help="Download photos locally")

    args = parser.parse_args()

    if not YELP_API_KEY:
        print("Error: YELP_API_KEY not set in environment")
        print("Get a free API key at: https://www.yelp.com/developers/v3/manage_app")
        return

    output_dir = Path(args.output)
    all_spots = []

    if args.all:
        for city_key in CITIES:
            spots = scrape_city(city_key, args.limit)
            all_spots.extend(spots)
    elif args.city:
        all_spots = scrape_city(args.city, args.limit)
    else:
        print("Specify --city or --all")
        return

    if not all_spots:
        print("No spots found!")
        return

    # Download photos if requested
    if args.download_photos:
        download_all_photos(all_spots, output_dir)

    # Save results
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f"spots_{timestamp}.json"
    save_results(all_spots, output_file)

    # Print summary
    print(f"\n=== Summary ===")
    print(f"Total spots: {len(all_spots)}")
    for city_key in CITIES:
        city_spots = [s for s in all_spots if s["city"] == city_key]
        print(f"  {city_key.upper()}: {len(city_spots)}")

    avg_score = sum(s["work_friendly_score"] for s in all_spots) / len(all_spots)
    print(f"Avg work-friendly score: {avg_score:.1f}")


if __name__ == "__main__":
    main()
