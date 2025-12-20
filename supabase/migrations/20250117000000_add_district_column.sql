-- Add district column to hotspots table
ALTER TABLE hotspots 
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add comment
COMMENT ON COLUMN hotspots.district IS 'District name within the city (e.g., Mont Kiara, Georgetown)';
