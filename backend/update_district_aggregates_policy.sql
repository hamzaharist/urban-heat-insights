-- Update RLS policy to allow INSERT operations
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.district_aggregates;

-- Create new policies
CREATE POLICY "Allow public read access" ON public.district_aggregates
    FOR SELECT USING (true);

CREATE POLICY "Allow data management" ON public.district_aggregates
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.district_aggregates TO anon, authenticated;
