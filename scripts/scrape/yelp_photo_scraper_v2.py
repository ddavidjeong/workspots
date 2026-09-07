#!/usr/bin/env python3
"""
Yelp Photo Scraper v2 - Uses Playwright for browser-based scraping
Bypasses bot detection by running a real browser

Usage:
    python yelp_photo_scraper_v2.py --input data/spots_*.json --output data/spots_with_photos.json
"""

import os
import re
import json
import time
import random
import argparse
import asyncio
from pathlib import Path
from urllib.parse import urlparse
import glob

async def scrape_yelp_photos(page, biz_alias: str, max_photos: int = 10) -> list[str]:
    """Scrape photos for a Yelp business using Playwright."""
    if not biz_alias:
        return []

    photos = []

    # Try the photos page - "inside" tab has interior shots
    urls_to_try = [
        f"https://www.yelp.com/biz_photos/{biz_alias}?tab=inside",
        f"https://www.yelp.com/biz_photos/{biz_alias}",
    ]

    for url in urls_to_try:
        try:
            # Navigate with realistic timeout
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait a bit for lazy-loaded images
            await asyncio.sleep(1)

            # Get page content
            html = await page.content()

            # Extract photo URLs from HTML
            # Pattern 1: Full original URLs
            pattern = r'https://s3-media\d+\.fl\.yelpcdn\.com/bphoto/[A-Za-z0-9_-]+/o\.jpg'
            found = re.findall(pattern, html)

            # Pattern 2: Any size, convert to original
            pattern2 = r'https://s3-media\d+\.fl\.yelpcdn\.com/bphoto/([A-Za-z0-9_-]+)/[a-z0-9]+\.jpg'
            found2 = re.findall(pattern2, html)

            for photo_id in found2:
                full_url = f"https://s3-media0.fl.yelpcdn.com/bphoto/{photo_id}/o.jpg"
                if full_url not in found:
                    found.append(full_url)

            # Dedupe and collect
            seen = set()
            for photo_url in found:
                if photo_url not in seen:
                    seen.add(photo_url)
                    photos.append(photo_url)
                    if len(photos) >= max_photos:
                        return photos

            if photos:
                return photos

        except Exception as e:
            print(f"Error scraping {biz_alias}: {e}")
            continue

    return photos


def get_biz_alias_from_url(url: str) -> str:
    """Extract business alias from Yelp URL."""
    if "/biz/" in url:
        path = urlparse(url).path
        parts = path.split("/biz/")
        if len(parts) > 1:
            return parts[1].split("?")[0].split("/")[0]
    return ""


def clean_yelp_url(url: str) -> str:
    """Remove tracking params from Yelp URL."""
    if not url:
        return ""
    parsed = urlparse(url)
    clean = f"https://www.yelp.com{parsed.path}"
    return clean


async def process_spots(input_pattern: str, output_path: str, max_photos: int = 5):
    """Process spots and add scraped photos using Playwright."""
    from playwright.async_api import async_playwright

    # Load existing spots
    all_spots = []
    for file_path in glob.glob(input_pattern):
        print(f"Loading {file_path}...")
        with open(file_path) as f:
            spots = json.load(f)
            all_spots.extend(spots)

    print(f"Processing {len(all_spots)} spots...")

    async with async_playwright() as p:
        # Launch browser with stealth settings
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
            ]
        )

        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
        )

        # Add stealth scripts
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        """)

        page = await context.new_page()

        success_count = 0

        for i, spot in enumerate(all_spots):
            yelp_url = spot.get("website", "")
            clean_url = clean_yelp_url(yelp_url)
            biz_alias = get_biz_alias_from_url(clean_url)

            if not biz_alias:
                spot["photos"] = []
                continue

            print(f"[{i+1}/{len(all_spots)}] Scraping {spot.get('name', biz_alias)}...")

            # Scrape photos
            photos = await scrape_yelp_photos(page, biz_alias, max_photos=max_photos)

            if photos:
                spot["photos"] = photos
                spot["photo_count"] = len(photos)
                success_count += 1
                print(f"  Found {len(photos)} photos")
            else:
                spot["photos"] = []
                spot["photo_count"] = 0
                print(f"  No photos found")

            # Random delay between requests
            await asyncio.sleep(random.uniform(2, 4))

            # Save progress every 20 spots
            if (i + 1) % 20 == 0:
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)
                with open(output_file, "w") as f:
                    json.dump(all_spots, f, indent=2)
                print(f"  Progress saved ({i+1}/{len(all_spots)})")

        await browser.close()

    # Save final results
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
    parser = argparse.ArgumentParser(description="Scrape Yelp photos with Playwright")
    parser.add_argument("--input", required=True, help="Input JSON file or glob pattern")
    parser.add_argument("--output", required=True, help="Output JSON file")
    parser.add_argument("--max-photos", type=int, default=5, help="Max photos per spot")

    args = parser.parse_args()

    asyncio.run(process_spots(args.input, args.output, args.max_photos))


if __name__ == "__main__":
    main()
