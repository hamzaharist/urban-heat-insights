# Integration Architecture

## Cross-Boundary Request Flow
The multi-part architecture communicates primarily over stateless REST HTTP.

1. **Frontend to Backend (Prediction / What-If):**
   - The React UI (Scenario Simulator) `POSTs` adjusted index parameters (NDVI/NDBI) to the FastAPI `api/spatial/` boundaries. 
   - Backend responds in ~100ms with JSON dict containing delta changes natively.
   
2. **Backend to Google Earth Engine (Data Extraction):**
   - Offline Python workers securely authenticate to GEE using a structured service account JSON, downloading raw EPSG:4326 geometry data in `.parquet` or `.csv`.
   
3. **Frontend to Supabase (Database):**
   - The React frontend establishes a secure PostgREST channel via `@supabase/supabase-js`. 
   - For Mapbox visuals, it queries the `district_aggregates` table to instantly pull District JSON geometries and average environmental indices.
