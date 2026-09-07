# WorkHub Data Scraping Pipeline

## Quick Start

### 1. Setup

```bash
cd scripts/scrape
pip install -r requirements.txt
cp .env.example .env
```

### 2. Get API Keys

**Yelp API (required, free):**
1. Go to https://www.yelp.com/developers/v3/manage_app
2. Create an app (takes 30 seconds)
3. Copy the API Key to `.env`

**Supabase (for seeding):**
1. Go to your Supabase project → Settings → API
2. Copy the URL and **service_role** key (not anon key) to `.env`

### 3. Scrape Data

```bash
# Scrape NYC cafes (takes ~10-15 min)
python yelp_scraper.py --city nyc --limit 25

# Scrape SF cafes
python yelp_scraper.py --city sf --limit 25

# Scrape both cities
python yelp_scraper.py --all --limit 25

# Also download photos locally
python yelp_scraper.py --all --limit 25 --download-photos
```

Output goes to `data/spots_TIMESTAMP.json`

### 4. Seed Database

```bash
# Preview what would be inserted
python seed_database.py --input "data/spots_*.json" --dry-run

# Actually seed (add --clear to wipe existing data first)
python seed_database.py --input "data/spots_*.json"
```

## What Gets Scraped

For each cafe, we collect:
- Name, address, coordinates
- Hours of operation
- Photos (up to 3 from Yelp)
- Rating and review count
- Sample reviews (used to estimate workspace traits)

## Work-Friendly Scoring

Cafes are scored based on review mentions of:
- wifi, outlets, power, charging
- laptop, work, study, remote
- quiet, spacious, tables

Score of 2+ = included in results.

## Trait Estimation

We automatically estimate workspace traits from review text:
- WiFi quality (mentions of fast/slow wifi)
- Outlet availability (mentions of outlets/plugs)
- Noise level (quiet vs loud/busy)
- Table space (spacious vs cramped)
- Seating comfort (comfortable vs hard chairs)
- Natural light (bright/sunny vs dark/dim)
- Coffee quality (based on overall rating)
- Price level (from Yelp price indicator)

These are estimates - users can vote to improve accuracy.

## Rate Limits

- Yelp API: 5,000 calls/day (free tier)
- We use ~3 calls per cafe (search + details + reviews)
- Default settings scrape ~300 cafes = ~900 API calls
- Scraping both cities fully takes ~1,800 calls

## Expanding the Dataset

To get more data:

1. **More neighborhoods**: Add to `CITIES` dict in `yelp_scraper.py`
2. **More photos**: Yelp API only returns 3 photos. For more:
   - Scrape Yelp website (against ToS but possible)
   - Use Google Places API (costs $17/1k requests)
   - Let users upload
3. **Better trait data**: After launch, user votes improve estimates
