-- Add NDVI and NDBI columns to hotspots table
-- NDVI: Normalized Difference Vegetation Index (vegetation health, -1 to 1)
-- NDBI: Normalized Difference Built-up Index (urbanization level, -1 to 1)

ALTER TABLE hotspots 
ADD COLUMN IF NOT EXISTS avg_ndvi DECIMAL(5,3),
ADD COLUMN IF NOT EXISTS avg_ndbi DECIMAL(5,3);

-- Add comments
COMMENT ON COLUMN hotspots.avg_ndvi IS 'Average NDVI (vegetation index) from Landsat satellite data';
COMMENT ON COLUMN hotspots.avg_ndbi IS 'Average NDBI (built-up index) from Landsat satellite data';
