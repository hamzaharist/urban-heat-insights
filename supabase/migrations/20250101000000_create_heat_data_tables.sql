-- Create tables for Urban Heat Insights data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Temperature readings table
CREATE TABLE IF NOT EXISTS temperature_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city VARCHAR(100) NOT NULL,
  location_name VARCHAR(200),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,
  feels_like DECIMAL(5, 2),
  humidity INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_temp_readings_city ON temperature_readings(city);
CREATE INDEX IF NOT EXISTS idx_temp_readings_recorded_at ON temperature_readings(recorded_at);

-- Hotspots table
CREATE TABLE IF NOT EXISTS hotspots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  avg_temperature DECIMAL(5, 2) NOT NULL,
  intensity VARCHAR(20) NOT NULL CHECK (intensity IN ('extreme', 'hot', 'warm', 'mild', 'cool')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hotspots_city ON hotspots(city);
CREATE INDEX IF NOT EXISTS idx_hotspots_intensity ON hotspots(intensity);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  predicted_temp DECIMAL(5, 2) NOT NULL,
  confidence_level DECIMAL(3, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city, year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_predictions_city ON predictions(city);
CREATE INDEX IF NOT EXISTS idx_predictions_year ON predictions(year);

-- Insert sample data for Kuala Lumpur hotspots
INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, intensity) VALUES
  ('Kuala Lumpur', 'KLCC', 3.1578, 101.7119, 38.2, 'extreme'),
  ('Kuala Lumpur', 'Bukit Bintang', 3.1478, 101.7108, 37.8, 'hot'),
  ('Kuala Lumpur', 'Cheras', 3.1251, 101.7454, 36.5, 'warm'),
  ('Kuala Lumpur', 'Petaling Jaya', 3.1073, 101.6067, 35.2, 'warm'),
  ('Kuala Lumpur', 'Mont Kiara', 3.1725, 101.6508, 34.1, 'mild')
ON CONFLICT DO NOTHING;

-- Insert sample prediction data for Kuala Lumpur
INSERT INTO predictions (city, year, predicted_temp, confidence_level) VALUES
  ('Kuala Lumpur', 2025, 36.2, 0.85),
  ('Kuala Lumpur', 2027, 36.8, 0.80),
  ('Kuala Lumpur', 2030, 37.5, 0.75),
  ('Kuala Lumpur', 2033, 38.1, 0.70),
  ('Kuala Lumpur', 2035, 38.6, 0.65)
ON CONFLICT (city, year) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to temperature_readings"
  ON temperature_readings FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to hotspots"
  ON hotspots FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to predictions"
  ON predictions FOR SELECT
  USING (true);
