-- =====================================================
-- Create District Aggregates Table
-- =====================================================
-- This table stores pre-aggregated statistics for each district
-- to enable fast GeoJSON enrichment without fetching 42K+ rows

-- Drop table if exists
DROP TABLE IF EXISTS public.district_aggregates;

-- Create table
CREATE TABLE public.district_aggregates (
    id BIGSERIAL PRIMARY KEY,
    district_name TEXT NOT NULL UNIQUE,
    state_name TEXT NOT NULL,

    -- Temperature statistics
    avg_temperature FLOAT NOT NULL,
    min_temperature FLOAT,
    max_temperature FLOAT,
    temp_std FLOAT,
    temp_range FLOAT,

    -- Vegetation indices
    avg_ndvi FLOAT,
    min_ndvi FLOAT,
    max_ndvi FLOAT,

    -- Built-up index
    avg_ndbi FLOAT,

    -- Population
    total_population FLOAT,

    -- Metadata
    data_points INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for fast lookups
    CONSTRAINT district_aggregates_district_name_key UNIQUE (district_name)
);

-- Create index on district_name for fast lookups
CREATE INDEX idx_district_aggregates_district_name ON public.district_aggregates(district_name);
CREATE INDEX idx_district_aggregates_state_name ON public.district_aggregates(state_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.district_aggregates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.district_aggregates
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete (for data population)
CREATE POLICY "Allow data management" ON public.district_aggregates
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.district_aggregates TO anon, authenticated;

COMMENT ON TABLE public.district_aggregates IS 'Pre-aggregated district-level statistics for fast GeoJSON enrichment';
COMMENT ON COLUMN public.district_aggregates.district_name IS 'Unique district name';
COMMENT ON COLUMN public.district_aggregates.avg_temperature IS 'Average temperature across all pixels in district (°C)';
COMMENT ON COLUMN public.district_aggregates.total_population IS 'Total population (sum of pixel-level populations)';
COMMENT ON COLUMN public.district_aggregates.data_points IS 'Number of pixel-level data points for this district';
