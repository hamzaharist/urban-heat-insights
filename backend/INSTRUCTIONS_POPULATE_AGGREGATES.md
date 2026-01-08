# Instructions: Populate District Aggregates Table

## Problem
The `district_aggregates` table exists but has Row Level Security (RLS) that prevents INSERT operations using the anon key.

## Solution: Two Options

### Option A: Disable RLS Temporarily (Quickest)

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Temporarily disable RLS
ALTER TABLE public.district_aggregates DISABLE ROW LEVEL SECURITY;
```

3. Run the population script:
```bash
cd backend
python populate_district_aggregates.py
```

4. Re-enable RLS after population:
```sql
-- Re-enable RLS
ALTER TABLE public.district_aggregates ENABLE ROW LEVEL SECURITY;
```

### Option B: Update RLS Policy (Better Long-term)

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `backend/update_district_aggregates_policy.sql`:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.district_aggregates;

-- Create new policies
CREATE POLICY "Allow public read access" ON public.district_aggregates
    FOR SELECT USING (true);

CREATE POLICY "Allow data management" ON public.district_aggregates
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.district_aggregates TO anon, authenticated;
```

3. Run the population script:
```bash
cd backend
python populate_district_aggregates.py
```

## Expected Output

When successful, you should see:
- Fetching all 42,706 hotspot rows in batches
- Aggregating to 131 districts
- Uploading all 131 districts successfully
- Verification showing sample districts with temperatures

## Next Step After Population

Once the `district_aggregates` table is populated, we need to update `backend/api/geojson.py` to use this table instead of fetching 42K rows from the hotspots table.
