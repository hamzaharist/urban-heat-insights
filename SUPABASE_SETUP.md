# Quick Supabase Setup Guide

## Your Supabase Project
- **URL**: https://xntorsihhrdzjwhrohkr.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/xntorsihhrdzjwhrohkr

---

## Step 1: Create Database Tables

1. **Open SQL Editor**: https://supabase.com/dashboard/project/xntorsihhrdzjwhrohkr/sql/new

2. **Copy this SQL** (from `supabase/quick_setup.sql`):

```sql
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

-- Enable RLS
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_readings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on hotspots" ON public.hotspots;
DROP POLICY IF EXISTS "Allow public read access on predictions" ON public.predictions;
DROP POLICY IF EXISTS "Allow public read access on temperature_readings" ON public.temperature_readings;

-- Create read policies
CREATE POLICY "Allow public read access on hotspots"
    ON public.hotspots FOR SELECT USING (true);

CREATE POLICY "Allow public read access on predictions"
    ON public.predictions FOR SELECT USING (true);

CREATE POLICY "Allow public read access on temperature_readings"
    ON public.temperature_readings FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hotspots_city ON public.hotspots(city);
CREATE INDEX IF NOT EXISTS idx_predictions_city_year ON public.predictions(city, year);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_city_date ON public.temperature_readings(city, recorded_at);
```

3. **Click "Run"** - You should see "Success. No rows returned"

---

## Step 2: Upload Your Data

```bash
cd backend
python upload_to_supabase.py
```

This will upload:
- ✅ 8 years of satellite data (2016-2024)
- ✅ 8 city hotspots
- ✅ 5-year predictions (2025-2030)

---

## Step 3: Verify & Test

1. **Check Supabase Dashboard**:
   - Go to Table Editor
   - You should see data in `hotspots`, `predictions`, and `temperature_readings` tables

2. **Refresh Frontend**:
   - Go to http://localhost:8081/
   - Map should show real hotspots
   - Predictions should show real trends

---

## Troubleshooting

**"Failed to load hotspot data"**
- Make sure you ran the SQL in Step 1
- Check that tables exist in Supabase Table Editor
- Verify RLS policies are created

**Upload fails**
- Check `.env` has correct Supabase credentials
- Make sure SQL was run successfully
- Try running upload script again

---

## Success Checklist

- [ ] SQL executed in Supabase (Step 1)
- [ ] Upload script completed (Step 2)
- [ ] Data visible in Supabase dashboard
- [ ] Frontend loads hotspots successfully
- [ ] Frontend loads predictions successfully

---

**Your Project is Ready!** 🎉

You now have 8 years of real satellite data in your Supabase database!
