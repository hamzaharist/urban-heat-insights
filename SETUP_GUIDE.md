# Real Data Integration - Setup Guide

## Overview

This guide will help you set up the real data integration for the Urban Heat Insights application. You'll connect to Supabase for data storage and configure API access for weather and satellite data.

---

## Step 1: Run Supabase Migration

The database tables need to be created in your Supabase project.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20250101000000_create_heat_data_tables.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref nwrjspmwshoculzqqnej

# Run migrations
supabase db push
```

---

## Step 2: Configure Environment Variables

Update your `.env` file with your Google Earth Engine credentials:

```env
# Google Earth Engine Configuration
VITE_GEE_API_KEY="your_actual_gee_api_key_here"
VITE_GEE_PROJECT_ID="your_actual_gee_project_id_here"
```

**Note**: The GEE integration requires a backend service. For now, the app will use the sample data from Supabase.

---

## Step 3: Verify Data

After running the migration, you should see sample data in your Supabase tables:

### Hotspots Table
- 5 sample hotspots for Kuala Lumpur
- Includes KLCC, Bukit Bintang, Cheras, Petaling Jaya, and Mont Kiara

### Predictions Table
- 5 year predictions (2025-2035)
- Temperature projections for Kuala Lumpur

### Check in Supabase Dashboard
1. Go to **Table Editor**
2. Select `hotspots` table
3. You should see 5 rows of data
4. Select `predictions` table
5. You should see 5 rows of prediction data

---

## Step 4: Test the Application

1. The dev server should already be running at http://localhost:8080/
2. Navigate to the map section - you should see real hotspot data
3. Navigate to the predictions section - you should see real prediction data
4. Check for loading states and error handling

---

## What's Working Now

✅ **Open-Meteo Weather API** - Ready to use (no API key needed)
✅ **Supabase Data Storage** - Tables created with sample data
✅ **React Query Hooks** - Data fetching with caching
✅ **Loading & Error States** - Proper UX feedback
✅ **Real-time Updates** - Components fetch from Supabase

---

## Next Steps for Full GEE Integration

To enable full Google Earth Engine satellite data:

1. **Set up GEE Backend Service**
   - Create a Node.js/Python backend
   - Install Google Earth Engine SDK
   - Implement LST and NDVI endpoints

2. **Update Frontend**
   - Point GEE API calls to your backend
   - Add map visualization components
   - Implement satellite imagery overlays

3. **Data Pipeline**
   - Schedule regular GEE data fetches
   - Store results in Supabase
   - Update hotspots based on satellite data

---

## Troubleshooting

### Tables not appearing in Supabase
- Make sure you ran the migration SQL
- Check the SQL Editor for any errors
- Verify you're connected to the correct project

### Data not loading in app
- Check browser console for errors
- Verify Supabase credentials in `.env`
- Make sure dev server restarted after `.env` changes

### TypeScript errors
- Run `npm run dev` to restart the dev server
- TypeScript should pick up the new Supabase types

---

## API Documentation

### Open-Meteo API
- **Endpoint**: https://api.open-meteo.com/v1/forecast
- **Rate Limit**: Unlimited (free tier)
- **Documentation**: https://open-meteo.com/en/docs

### Supabase Tables

#### `hotspots`
```sql
id: UUID
city: VARCHAR(100)
name: VARCHAR(200)
latitude: DECIMAL(10, 8)
longitude: DECIMAL(11, 8)
avg_temperature: DECIMAL(5, 2)
intensity: VARCHAR(20) -- 'extreme', 'hot', 'warm', 'mild', 'cool'
last_updated: TIMESTAMP
```

#### `predictions`
```sql
id: UUID
city: VARCHAR(100)
year: INTEGER
predicted_temp: DECIMAL(5, 2)
confidence_level: DECIMAL(3, 2)
created_at: TIMESTAMP
```

#### `temperature_readings`
```sql
id: UUID
city: VARCHAR(100)
location_name: VARCHAR(200)
latitude: DECIMAL(10, 8)
longitude: DECIMAL(11, 8)
temperature: DECIMAL(5, 2)
feels_like: DECIMAL(5, 2)
humidity: INTEGER
recorded_at: TIMESTAMP
source: VARCHAR(50)
created_at: TIMESTAMP
```

---

## Support

If you encounter any issues, check:
1. Supabase project is active
2. Environment variables are correct
3. Dev server has restarted
4. Browser console for specific errors
