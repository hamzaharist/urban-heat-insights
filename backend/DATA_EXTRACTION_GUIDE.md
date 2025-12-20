# GEE Data Extraction & Upload Guide

## Overview

This guide explains how to extract 8 years of satellite data from Google Earth Engine and upload it to Supabase.

---

## Step 1: Install Additional Dependencies

```bash
cd backend
pip install pandas pyarrow supabase
```

---

## Step 2: Extract Data from GEE

```bash
python extract_gee_data.py
```

**What it does:**
- Extracts LST (Land Surface Temperature) from Landsat 8/9
- Calculates NDVI (vegetation index)
- Covers 2016-2024 (8 years)
- 3 cities: Kuala Lumpur, Johor Bahru, Penang
- 15 locations total (5 per city)
- ~180 dates per location (16-day Landsat cycle)
- Saves to `data/` folder as Parquet files

**Expected output:**
- `malaysia_cities_2016_2024_complete.parquet` (~2-5 MB)
- Individual city files
- Summary statistics CSV

**Time:** 30-60 minutes depending on connection

---

## Step 3: Upload to Supabase

```bash
python upload_to_supabase.py
```

**What it does:**
- Uploads temperature readings to `temperature_readings` table
- Creates hotspots based on average temperatures
- Generates predictions for 2025-2030
- Uploads in batches (1000 records at a time)

**Expected records:**
- Temperature readings: ~10,000-15,000 rows
- Hotspots: 15 locations
- Predictions: 15 predictions (3 cities × 5 years)

---

## Data Structure

### Extracted Data Columns

```
city              - City name
location_name     - Specific location
latitude          - Latitude
longitude         - Longitude
date              - Date of observation
temperature       - LST in Celsius
ndvi              - Vegetation index
year              - Year
month             - Month
day               - Day
source            - Data source (Landsat 8/9)
```

### Cities & Locations

**Kuala Lumpur:**
- KLCC
- Bukit Bintang
- Cheras
- Petaling Jaya
- Mont Kiara

**Johor Bahru:**
- JB City Centre
- Skudai
- Tebrau
- Pasir Gudang
- Nusajaya

**Penang:**
- Georgetown
- Bayan Lepas
- Butterworth
- Bukit Mertajam
- Tanjung Bungah

---

## Troubleshooting

### No data extracted

**Issue:** GEE returns no data for certain dates

**Solution:**
- Cloud cover affects satellite data availability
- Landsat passes every 16 days
- Some dates will have no data (normal)
- Script automatically skips missing dates

### Upload fails

**Issue:** Supabase connection error

**Solution:**
- Check `.env` has correct Supabase credentials
- Verify tables exist (run migration first)
- Check internet connection

### Memory issues

**Issue:** Script runs out of memory

**Solution:**
- Reduce date range (e.g., 2020-2024 instead of 2016-2024)
- Process one city at a time
- Increase system RAM allocation

---

## Verification

After upload, check Supabase dashboard:

1. **Temperature Readings Table:**
   - Should have 10,000+ rows
   - Check dates range from 2016-2024
   - Verify all 3 cities present

2. **Hotspots Table:**
   - Should have 15 rows (5 per city)
   - Check intensity values (extreme/hot/warm/mild/cool)
   - Verify coordinates are correct

3. **Predictions Table:**
   - Should have 15 rows
   - Years 2025-2030
   - Confidence levels decrease over time

---

## Next Steps

1. ✅ Extract data: `python extract_gee_data.py`
2. ✅ Upload to Supabase: `python upload_to_supabase.py`
3. ✅ Verify in Supabase dashboard
4. ✅ Refresh frontend - data loads automatically!
5. ✅ Remove sample data from migration (optional)

---

## Performance Benefits

**Before (Live GEE):**
- 5-10 seconds per request
- API rate limits
- Requires backend running
- Can fail during demos

**After (Parquet + Supabase):**
- < 100ms response time
- No API limits
- Works offline
- Reliable for demos ✅

---

## File Sizes

Expected file sizes:
- Complete Parquet: 2-5 MB
- Per city Parquet: 700 KB - 1.5 MB each
- Total storage: ~10 MB

Supabase storage:
- Free tier: 500 MB (plenty of space)
- Your data: ~15 MB in database
