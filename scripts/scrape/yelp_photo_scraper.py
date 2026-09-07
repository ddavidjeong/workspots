#!/usr/bin/env python3
"""
Yelp Photo Scraper - Gets ALL photos from Yelp business pages
Uses clean URLs and browser-like behavior

Usage:
    python yelp_photo_scraper.py --input data/spots_*.json --output data/spots_with_photos.json
"""

import os
import re
import json
import time
import random
import argparse
import requests
from pathlib import Path
from urllib.parse import urlparse, urljoin
from dotenv import load_dotenv
from tqdm import tqdm
import glob

load_dotenv()

# Rotate user agents
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def clean_yelp_url(url: str) -> str:
    """Remove tracking params from Yelp URL."""
    if not url:
        return ""
    # Parse and rebuild without query params
    parsed = urlparse(url)
    # Just keep the path
    clean = f"https://www.yelp.com{parsed.path}"
    return clean


def get_biz_alias_from_url(url: str) -> str:
    """Extract business alias from Yelp URL."""
    # https://www.yelp.com/biz/cafe-name-city -> cafe-name-city
    if "/biz/" in url:
        path = urlparse(url).path
        parts = path.split("/biz/")
        if len(parts) > 1:
            return parts[1].split("?")[0].split("/")[0]
    return ""


def scrape_yelp_photos(biz_alias: str, max_photos: int = 10) -> list[str]:
    """Scrape photos for a Yelp business."""
    if not biz_alias:
        return []

    photos = []
    session = requests.Session()

    # Try the photos page with "inside" tab first
    urls_to_try = [
        f"https://www.yelp.com/biz_photos/{biz_alias}?tab=inside",
        f"https://www.yelp.com/biz_photos/{biz_alias}",
    ]

    for url in urls_to_try:
        try:
            time.sleep(random.uniform(0.5, 1.5))
            response = session.get(url, headers=get_headers(), timeout=15)

            if response.status_code == 200:
                html = response.text

                # Extract photo URLs from HTML
                # Yelp CDN pattern: https://s3-media0.fl.yelpcdn.com/bphoto/XXX/o.jpg
                pattern = r'https://s3-media\d+\.fl\.yelpcdn\.com/bphoto/[A-Za-z0-9_-]+/o\.jpg'
                found = re.findall(pattern, html)

                # Also try other size patterns and convert to original
                pattern2 = r'https://s3-media\d+\.fl\.yelpcdn\.com/bphoto/([A-Za-z0-9_-]+)/[a-z]+\.jpg'
                found2 = re.findall(pattern2, html)

                # Convert to original size URLs
                for photo_id in found2:
                    full_url = f"https://s3-media0.fl.yelpcdn.com/bphoto/{photo_id}/o.jpg"
                    if full_url not in found:
                        found.append(full_url)

                # Dedupe
                seen = set()
                for photo_url in found:
                    if photo_url not in seen:
                        seen.add(photo_url)
                        photos.append(photo_url)
                        if len(photos) >= max_photos:
                            return photos

            elif response.status_code == 403:
                # Rate limited, wait longer
                time.sleep(random.uniform(3, 6))

        except Exception as e:
            pass

    return photos


def process_spots(input_pattern: str, output_path: str, max_photos: int = 5):
    """Process spots and add scraped photos."""
    # Load existing spots
    all_spots = []
    for file_path in glob.glob(input_pattern):
        print(f"Loading {file_path}...")
        with open(file_path) as f:
            spots = json.load(f)
            all_spots.extend(spots)

    print(f"Processing {len(all_spots)} spots...")

    success_count = 0

    for spot in tqdm(all_spots, desc="Scraping photos"):
        yelp_url = spot.get("website", "")

        # Clean the URL and get alias
        clean_url = clean_yelp_url(yelp_url)
        biz_alias = get_biz_alias_from_url(clean_url)

        if not biz_alias:
            spot["photos"] = []
            continue

        # Scrape photos
        photos = scrape_yelp_photos(biz_alias, max_photos=max_photos)

        if photos:
            spot["photos"] = photos
            spot["photo_count"] = len(photos)
            success_count += 1
        else:
            spot["photos"] = []
            spot["photo_count"] = 0

        # Random delay
        time.sleep(random.uniform(1.5, 3.0))

    # Save results
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w") as f:
        json.dump(all_spots, f, indent=2)

    # Stats
    total_photos = sum(len(s.get("photos", [])) for s in all_spots)

    print(f"\n=== Results ===")
    print(f"Spots processed: {len(all_spots)}")
    print(f"Spots with photos: {success_count}")
    print(f"Total photos: {total_photos}")
    print(f"Saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Scrape Yelp photos")
    parser.add_argument("--input", required=True, help="Input JSON file or glob pattern")
    parser.add_argument("--output", required=True, help="Output JSON file")
    parser.add_argument("--max-photos", type=int, default=5, help="Max photos per spot")

    args = parser.parse_args()

    process_spots(args.input, args.output, args.max_photos)


if __name__ == "__main__":
    main()
