-- Quick Setup: Create tables for Urban Heat Insights
-- Run this in Supabase SQL Editor

-- Create hotspots table
CREATE TABLE IF NOT EXISTS public.hotspots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    avg_temperature DECIMAL(5, 2),
    intensity VARCHAR(20),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    predicted_temp DECIMAL(5, 2) NOT NULL,
    confidence_level DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create temperature_readings table
CREATE TABLE IF NOT EXISTS public.temperature_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    location_name VARCHAR(200),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    temperature DECIMAL(5, 2),
    feels_like DECIMAL(5, 2),
    humidity INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_readings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access on hotspots"
    ON public.hotspots FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on predictions"
    ON public.predictions FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on temperature_readings"
    ON public.temperature_readings FOR SELECT
    USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotspots_city ON public.hotspots(city);
CREATE INDEX IF NOT EXISTS idx_predictions_city_year ON public.predictions(city, year);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_city_date ON public.temperature_readings(city, recorded_at);

-- Success message
SELECT 'Tables created successfully! Now run: python upload_to_supabase.py' AS message;
