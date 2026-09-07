-- WorkHub Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- SPOTS - Cafes, libraries, coworking spaces
-- ============================================
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('nyc', 'sf')),
  neighborhood TEXT,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  place_id TEXT UNIQUE, -- Google Places ID for deduping
  hours JSONB DEFAULT '{}',
  website TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for geospatial queries
CREATE INDEX spots_location_idx ON spots USING GIST (location);
CREATE INDEX spots_city_idx ON spots (city);
CREATE INDEX spots_neighborhood_idx ON spots (neighborhood);

-- ============================================
-- USERS - Contributors
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHOTOS - Interior shots of workspaces
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT, -- Supabase Storage path
  source TEXT NOT NULL CHECK (source IN ('user', 'yelp', 'google', 'instagram')),
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX photos_spot_id_idx ON photos (spot_id);
CREATE INDEX photos_is_primary_idx ON photos (spot_id, is_primary) WHERE is_primary = TRUE;

-- ============================================
-- SPOT_TRAITS - Workspace-specific ratings
-- ============================================
CREATE TABLE spot_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID UNIQUE NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  wifi_quality SMALLINT CHECK (wifi_quality BETWEEN 1 AND 5),
  outlet_availability SMALLINT CHECK (outlet_availability BETWEEN 1 AND 5),
  seating_comfort SMALLINT CHECK (seating_comfort BETWEEN 1 AND 5),
  noise_level SMALLINT CHECK (noise_level BETWEEN 1 AND 5), -- 1=quiet, 5=loud
  table_space SMALLINT CHECK (table_space BETWEEN 1 AND 5),
  natural_light SMALLINT CHECK (natural_light BETWEEN 1 AND 5),
  coffee_quality SMALLINT CHECK (coffee_quality BETWEEN 1 AND 5),
  price_level SMALLINT CHECK (price_level BETWEEN 1 AND 4), -- $-$$$$
  vote_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CROWDEDNESS - Time-based busy levels
-- ============================================
CREATE TABLE crowdedness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  hour SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5), -- 1=empty, 5=packed
  sample_count INT DEFAULT 1,
  UNIQUE (spot_id, day_of_week, hour)
);

CREATE INDEX crowdedness_spot_id_idx ON crowdedness (spot_id);

-- ============================================
-- FAVORITES - User saved spots
-- ============================================
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, spot_id)
);

-- ============================================
-- REVIEWS - User reviews with work context
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  work_session_length INT, -- minutes worked
  visited_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX reviews_spot_id_idx ON reviews (spot_id);
CREATE INDEX reviews_user_id_idx ON reviews (user_id);

-- ============================================
-- TRAIT VOTES - Individual user votes on traits
-- ============================================
CREATE TABLE trait_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  value SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (spot_id, user_id, trait_name)
);

CREATE INDEX trait_votes_spot_id_idx ON trait_votes (spot_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update spot_traits aggregates when votes change
CREATE OR REPLACE FUNCTION update_spot_traits_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert aggregated traits
  INSERT INTO spot_traits (spot_id, vote_count, updated_at)
  VALUES (COALESCE(NEW.spot_id, OLD.spot_id), 0, NOW())
  ON CONFLICT (spot_id) DO UPDATE SET
    wifi_quality = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'wifi_quality'
    ),
    outlet_availability = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'outlet_availability'
    ),
    seating_comfort = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'seating_comfort'
    ),
    noise_level = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'noise_level'
    ),
    table_space = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'table_space'
    ),
    natural_light = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'natural_light'
    ),
    coffee_quality = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'coffee_quality'
    ),
    price_level = (
      SELECT ROUND(AVG(value)) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id) AND trait_name = 'price_level'
    ),
    vote_count = (
      SELECT COUNT(DISTINCT user_id) FROM trait_votes
      WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id)
    ),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trait_votes_aggregate_trigger
AFTER INSERT OR UPDATE OR DELETE ON trait_votes
FOR EACH ROW EXECUTE FUNCTION update_spot_traits_aggregate();

-- Function to search spots within a bounding box
CREATE OR REPLACE FUNCTION spots_in_bounds(
  min_lat NUMERIC,
  min_lng NUMERIC,
  max_lat NUMERIC,
  max_lng NUMERIC,
  city_filter TEXT DEFAULT NULL
)
RETURNS SETOF spots AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM spots
  WHERE lat BETWEEN min_lat AND max_lat
    AND lng BETWEEN min_lng AND max_lng
    AND (city_filter IS NULL OR city = city_filter);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trait_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowdedness ENABLE ROW LEVEL SECURITY;

-- Public read access for spots, photos, traits
CREATE POLICY "Spots are viewable by everyone" ON spots FOR SELECT USING (true);
CREATE POLICY "Photos are viewable by everyone" ON photos FOR SELECT USING (true);
CREATE POLICY "Spot traits are viewable by everyone" ON spot_traits FOR SELECT USING (true);
CREATE POLICY "Crowdedness is viewable by everyone" ON crowdedness FOR SELECT USING (true);
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

-- Authenticated users can insert spots
CREATE POLICY "Authenticated users can add spots" ON spots
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can manage their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can add reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can vote on traits" ON trait_votes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can upload photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- ============================================
-- SEED DATA FUNCTION (for development)
-- ============================================
CREATE OR REPLACE FUNCTION seed_sample_data()
RETURNS void AS $$
BEGIN
  -- Sample NYC spots
  INSERT INTO spots (name, address, city, neighborhood, lat, lng) VALUES
  ('Think Coffee', '248 Mercer St, New York, NY 10012', 'nyc', 'Greenwich Village', 40.7291, -73.9965),
  ('Cafe Grumpy', '224 W 20th St, New York, NY 10011', 'nyc', 'Chelsea', 40.7419, -73.9978),
  ('Birch Coffee', '5 E 27th St, New York, NY 10016', 'nyc', 'Flatiron', 40.7441, -73.9876),
  ('Stumptown Coffee', '30 W 8th St, New York, NY 10011', 'nyc', 'Greenwich Village', 40.7323, -73.9967),
  ('Blue Bottle Coffee', '450 W 15th St, New York, NY 10014', 'nyc', 'Chelsea', 40.7423, -74.0057);

  -- Sample SF spots
  INSERT INTO spots (name, address, city, neighborhood, lat, lng) VALUES
  ('Sightglass Coffee', '270 7th St, San Francisco, CA 94103', 'sf', 'SoMa', 37.7774, -122.4072),
  ('Ritual Coffee', '1026 Valencia St, San Francisco, CA 94110', 'sf', 'Mission', 37.7564, -122.4212),
  ('Four Barrel Coffee', '375 Valencia St, San Francisco, CA 94103', 'sf', 'Mission', 37.7671, -122.4219),
  ('Philz Coffee', '3101 24th St, San Francisco, CA 94110', 'sf', 'Mission', 37.7523, -122.4181),
  ('Equator Coffees', '986 Market St, San Francisco, CA 94102', 'sf', 'Mid-Market', 37.7823, -122.4103);

  -- Add traits for sample spots
  INSERT INTO spot_traits (spot_id, wifi_quality, outlet_availability, seating_comfort, noise_level, table_space, natural_light, coffee_quality, price_level)
  SELECT id,
    (RANDOM() * 2 + 3)::SMALLINT, -- wifi 3-5
    (RANDOM() * 2 + 3)::SMALLINT, -- outlets 3-5
    (RANDOM() * 2 + 3)::SMALLINT, -- seating 3-5
    (RANDOM() * 2 + 2)::SMALLINT, -- noise 2-4
    (RANDOM() * 2 + 3)::SMALLINT, -- table space 3-5
    (RANDOM() * 2 + 3)::SMALLINT, -- light 3-5
    (RANDOM() * 1 + 4)::SMALLINT, -- coffee 4-5
    (RANDOM() * 1 + 2)::SMALLINT  -- price 2-3
  FROM spots;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to seed: SELECT seed_sample_data();
