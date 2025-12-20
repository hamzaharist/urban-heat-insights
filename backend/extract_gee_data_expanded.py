"""
Expanded GEE Data Extraction Script
Includes more Malaysian cities and districts for comprehensive UHI analysis
"""

import ee
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time

load_dotenv()

def initialize_gee():
    """Initialize GEE with service account"""
    try:
        project_id = os.getenv("GEE_PROJECT_ID")
        key_file = os.getenv("GEE_PRIVATE_KEY_PATH")
        
        if key_file and os.path.exists(key_file):
            credentials = ee.ServiceAccountCredentials(email=None, key_file=key_file)
            ee.Initialize(credentials, project=project_id)
        else:
            ee.Initialize(project=project_id)
        
        print(f"✓ GEE initialized with project: {project_id}")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize GEE: {str(e)}")
        return False

# EXPANDED: 10 cities with 5-7 districts each (60+ locations total)
CITIES = {
    'Kuala Lumpur': [
        {'name': 'KLCC', 'lat': 3.1578, 'lon': 101.7123},
        {'name': 'Bukit Bintang', 'lat': 3.1478, 'lon': 101.7108},
        {'name': 'Cheras', 'lat': 3.1167, 'lon': 101.7333},
        {'name': 'Bangsar', 'lat': 3.1319, 'lon': 101.6714},
        {'name': 'Sentul', 'lat': 3.1833, 'lon': 101.6833},
        {'name': 'Kepong', 'lat': 3.2167, 'lon': 101.6333},
        {'name': 'Seputeh', 'lat': 3.1000, 'lon': 101.6833},
    ],
    'Johor Bahru': [
        {'name': 'JB City Centre', 'lat': 1.4655, 'lon': 103.7578},
        {'name': 'Skudai', 'lat': 1.5333, 'lon': 103.6500},
        {'name': 'Pasir Gudang', 'lat': 1.4733, 'lon': 103.9000},
        {'name': 'Tebrau', 'lat': 1.5333, 'lon': 103.7833},
        {'name': 'Larkin', 'lat': 1.4833, 'lon': 103.7333},
        {'name': 'Tampoi', 'lat': 1.4667, 'lon': 103.7333},
    ],
    'Penang': [
        {'name': 'Georgetown', 'lat': 5.4141, 'lon': 100.3288},
        {'name': 'Bayan Lepas', 'lat': 5.2972, 'lon': 100.2656},
        {'name': 'Butterworth', 'lat': 5.3991, 'lon': 100.3644},
        {'name': 'Jelutong', 'lat': 5.3972, 'lon': 100.3167},
        {'name': 'Bayan Baru', 'lat': 5.3167, 'lon': 100.2833},
        {'name': 'Tanjung Tokong', 'lat': 5.4500, 'lon': 100.3167},
    ],
    'Ipoh': [
        {'name': 'Ipoh City', 'lat': 4.5975, 'lon': 101.0901},
        {'name': 'Buntong', 'lat': 4.6167, 'lon': 101.0833},
        {'name': 'Menglembu', 'lat': 4.6167, 'lon': 101.1167},
        {'name': 'Chemor', 'lat': 4.7333, 'lon': 101.1167},
        {'name': 'Simpang Pulai', 'lat': 4.5833, 'lon': 101.1500},
    ],
    'Shah Alam': [
        {'name': 'Shah Alam City', 'lat': 3.0733, 'lon': 101.5185},
        {'name': 'Section 7', 'lat': 3.0833, 'lon': 101.5167},
        {'name': 'Section 13', 'lat': 3.0667, 'lon': 101.5333},
        {'name': 'Section 24', 'lat': 3.0500, 'lon': 101.5500},
        {'name': 'Kota Kemuning', 'lat': 3.0167, 'lon': 101.5333},
    ],
    'Petaling Jaya': [
        {'name': 'PJ City Centre', 'lat': 3.1073, 'lon': 101.6067},
        {'name': 'Damansara', 'lat': 3.1333, 'lon': 101.6167},
        {'name': 'Subang Jaya', 'lat': 3.0500, 'lon': 101.5833},
        {'name': 'SS2', 'lat': 3.1167, 'lon': 101.6167},
        {'name': 'Kelana Jaya', 'lat': 3.1167, 'lon': 101.5833},
        {'name': 'Bandar Utama', 'lat': 3.1500, 'lon': 101.6000},
    ],
    'Kota Kinabalu': [
        {'name': 'KK City', 'lat': 5.9804, 'lon': 116.0735},
        {'name': 'Likas', 'lat': 5.9833, 'lon': 116.1000},
        {'name': 'Inanam', 'lat': 6.0167, 'lon': 116.1167},
        {'name': 'Putatan', 'lat': 5.9667, 'lon': 116.0500},
        {'name': 'Penampang', 'lat': 5.9333, 'lon': 116.1000},
    ],
    'Kuching': [
        {'name': 'Kuching City', 'lat': 1.5535, 'lon': 110.3593},
        {'name': 'Petra Jaya', 'lat': 1.5667, 'lon': 110.3667},
        {'name': 'Matang', 'lat': 1.5833, 'lon': 110.3500},
        {'name': 'Padungan', 'lat': 1.5500, 'lon': 110.3500},
        {'name': 'Tabuan', 'lat': 1.5333, 'lon': 110.3667},
    ],
    'Melaka': [
        {'name': 'Melaka City', 'lat': 2.1896, 'lon': 102.2501},
        {'name': 'Bukit Beruang', 'lat': 2.2167, 'lon': 102.2667},
        {'name': 'Batu Berendam', 'lat': 2.2333, 'lon': 102.2500},
        {'name': 'Ayer Keroh', 'lat': 2.2667, 'lon': 102.2833},
        {'name': 'Tanjung Kling', 'lat': 2.1667, 'lon': 102.1833},
    ],
    'Seremban': [
        {'name': 'Seremban City', 'lat': 2.7258, 'lon': 101.9424},
        {'name': 'Senawang', 'lat': 2.7000, 'lon': 101.9667},
        {'name': 'Nilai', 'lat': 2.8167, 'lon': 101.8000},
        {'name': 'Port Dickson', 'lat': 2.5167, 'lon': 101.8000},
        {'name': 'Rasah', 'lat': 2.7333, 'lon': 101.9500},
    ],
}

def get_landsat_data(lat, lon, date_str, max_retries=3):
    """Extract LST, NDVI, and NDBI with retry logic"""
    for attempt in range(max_retries):
        try:
            point = ee.Geometry.Point([lon, lat])
            date = ee.Date(date_str)
            
            # Try Landsat 9 first, then Landsat 8
            for collection_name in ['LANDSAT/LC09/C02/T1_L2', 'LANDSAT/LC08/C02/T1_L2']:
                collection = ee.ImageCollection(collection_name) \
                    .filterDate(date, date.advance(1, 'day')) \
                    .filterBounds(point)
                
                if collection.size().getInfo() > 0:
                    image = collection.first()
                    
                    # Get LST (Land Surface Temperature)
                    thermal = image.select('ST_B10')
                    lst_celsius = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
                    temp_value = lst_celsius.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        geometry=point,
                        scale=30
                    ).get('ST_B10').getInfo()
                    
                    # Get NDVI (Vegetation Index)
                    nir = image.select('SR_B5')
                    red = image.select('SR_B4')
                    ndvi = nir.subtract(red).divide(nir.add(red))
                    ndvi_value = ndvi.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        geometry=point,
                        scale=30
                    ).get('SR_B5').getInfo()
                    
                    # Get NDBI (Built-up Index)
                    swir = image.select('SR_B6')
                    ndbi = swir.subtract(nir).divide(swir.add(nir))
                    ndbi_value = ndbi.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        geometry=point,
                        scale=30
                    ).get('SR_B6').getInfo()
                    
                    if temp_value is not None:
                        return {
                            'temperature': round(temp_value, 2),
                            'ndvi': round(ndvi_value, 3) if ndvi_value else None,
                            'ndbi': round(ndbi_value, 3) if ndbi_value else None
                        }
            
            return None
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)  # Wait before retry
                continue
            else:
                return None

def extract_data_expanded(start_year=2016, end_year=2024):
    """Extract data for expanded city list"""
    print(f"\n{'='*60}")
    print(f"EXPANDED Data Extraction: {start_year} - {end_year}")
    print(f"Cities: {len(CITIES)} | Locations: {sum(len(locs) for locs in CITIES.values())}")
    print(f"{'='*60}\n")
    
    all_data = []
    
    # Monthly intervals
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    current_date = start_date
    
    dates = []
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=30)
    
    total_extractions = len(dates) * sum(len(locs) for locs in CITIES.values())
    print(f"Total dates: {len(dates)}")
    print(f"Total extractions: {total_extractions:,}")
    print(f"Estimated time: {total_extractions * 2 / 60:.0f} minutes\n")
    
    for city_name, locations in CITIES.items():
        print(f"\n{'─'*60}")
        print(f"Processing: {city_name} ({len(locations)} districts)")
        print(f"{'─'*60}")
        
        for location in locations:
            print(f"\n  📍 {location['name']}")
            success_count = 0
            
            for i, date in enumerate(dates):
                date_str = date.strftime('%Y-%m-%d')
                
                if (i + 1) % 5 == 0 or i == 0:
                    print(f"    [{i+1}/{len(dates)}] {date_str}...", end=' ')
                
                result = get_landsat_data(location['lat'], location['lon'], date_str)
                
                if result:
                    all_data.append({
                        'city': city_name,
                        'district': location['name'],
                        'latitude': location['lat'],
                        'longitude': location['lon'],
                        'date': date_str,
                        'temperature': result['temperature'],
                        'ndvi': result['ndvi'],
                        'ndbi': result['ndbi'],
                        'year': date.year,
                        'month': date.month,
                        'source': 'Landsat 8/9'
                    })
                    success_count += 1
                    if (i + 1) % 5 == 0 or i == 0:
                        print("✓")
                else:
                    if (i + 1) % 5 == 0 or i == 0:
                        print("✗")
            
            print(f"\n    ✓ {location['name']}: {success_count}/{len(dates)} successful")
    
    print(f"\n{'='*60}")
    print(f"Extraction Complete!")
    print(f"Total records: {len(all_data):,}")
    print(f"{'='*60}\n")
    
    return pd.DataFrame(all_data)

def save_data(df, output_dir='data'):
    """Save to Parquet"""
    os.makedirs(output_dir, exist_ok=True)
    
    complete_file = os.path.join(output_dir, 'malaysia_cities_expanded_2016_2024.parquet')
    df.to_parquet(complete_file, index=False, compression='snappy')
    
    print(f"✓ Saved: {complete_file}")
    print(f"  Size: {os.path.getsize(complete_file) / 1024:.1f} KB")
    print(f"  Rows: {len(df):,}")
    
    # Summary by city
    summary_file = os.path.join(output_dir, 'data_summary_expanded.csv')
    summary = df.groupby(['city', 'district']).agg({
        'temperature': ['count', 'mean', 'min', 'max'],
        'ndvi': ['mean'],
        'ndbi': ['mean']
    }).round(2)
    summary.to_csv(summary_file)
    print(f"✓ Saved summary: {summary_file}")
    
    return complete_file

def main():
    print("\n" + "="*60)
    print("EXPANDED GEE Data Extraction")
    print("10 Cities | 60+ Districts | 2016-2024")
    print("="*60)
    
    if not initialize_gee():
        print("\n✗ GEE initialization failed")
        return
    
    print("\nStarting extraction (estimated 3-4 hours)...\n")
    
    df = extract_data_expanded(start_year=2016, end_year=2024)
    
    if len(df) == 0:
        print("\n✗ No data extracted")
        return
    
    output_file = save_data(df)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Records: {len(df):,}")
    print(f"Cities: {df['city'].nunique()}")
    print(f"Districts: {df['district'].nunique()}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Avg temp: {df['temperature'].mean():.2f}°C")
    print(f"Avg NDVI: {df['ndvi'].mean():.3f}")
    print(f"Avg NDBI: {df['ndbi'].mean():.3f}")
    print("="*60)
    print(f"\n✓ Complete! Next: python upload_to_supabase.py")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
