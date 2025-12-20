"""
Optimized GEE Data Extraction Script
Extracts recent historical data (2020-2024) for faster processing
Includes better error handling and progress tracking
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

# Simplified city locations (3 per city for faster extraction)
CITIES = {
    'Kuala Lumpur': [
        {'name': 'KLCC', 'lat': 3.1578, 'lon': 101.7123},
        {'name': 'Bukit Bintang', 'lat': 3.1478, 'lon': 101.7108},
        {'name': 'Cheras', 'lat': 3.1167, 'lon': 101.7333},
    ],
    'Johor Bahru': [
        {'name': 'JB City Centre', 'lat': 1.4655, 'lon': 103.7578},
        {'name': 'Skudai', 'lat': 1.5333, 'lon': 103.6500},
        {'name': 'Pasir Gudang', 'lat': 1.4733, 'lon': 103.9000},
    ],
    'Penang': [
        {'name': 'Georgetown', 'lat': 5.4141, 'lon': 100.3288},
        {'name': 'Bayan Lepas', 'lat': 5.2972, 'lon': 100.2656},
        {'name': 'Butterworth', 'lat': 5.3991, 'lon': 100.3644},
    ],
}

def get_landsat_data(lat, lon, date_str, max_retries=3):
    """Extract LST and NDVI with retry logic"""
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
                    
                    # Get LST
                    thermal = image.select('ST_B10')
                    lst_celsius = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
                    temp_value = lst_celsius.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        geometry=point,
                        scale=30
                    ).get('ST_B10').getInfo()
                    
                    # Get NDVI
                    nir = image.select('SR_B5')
                    red = image.select('SR_B4')
                    ndvi = nir.subtract(red).divide(nir.add(red))
                    ndvi_value = ndvi.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        geometry=point,
                        scale=30
                    ).get('SR_B5').getInfo()
                    
                    if temp_value is not None:
                        return {
                            'temperature': round(temp_value, 2),
                            'ndvi': round(ndvi_value, 3) if ndvi_value else None
                        }
            
            return None
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)  # Wait before retry
                continue
            else:
                return None

def extract_data_optimized(start_year=2020, end_year=2024):
    """Extract data with optimized settings"""
    print(f"\n{'='*60}")
    print(f"Optimized Data Extraction: {start_year} - {end_year}")
    print(f"Cities: {', '.join(CITIES.keys())}")
    print(f"{'='*60}\n")
    
    all_data = []
    
    # Use monthly intervals instead of 16-day for faster extraction
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    current_date = start_date
    
    dates = []
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=30)  # Monthly samples
    
    print(f"Total dates: {len(dates)}")
    print(f"Total locations: {sum(len(locs) for locs in CITIES.values())}")
    print(f"Total extractions: {len(dates) * sum(len(locs) for locs in CITIES.values())}\n")
    
    for city_name, locations in CITIES.items():
        print(f"\n{'─'*60}")
        print(f"Processing: {city_name}")
        print(f"{'─'*60}")
        
        for location in locations:
            print(f"\n  📍 {location['name']}")
            success_count = 0
            
            for i, date in enumerate(dates):
                date_str = date.strftime('%Y-%m-%d')
                
                # Progress indicator
                if (i + 1) % 5 == 0 or i == 0:
                    print(f"    [{i+1}/{len(dates)}] {date_str}...", end=' ')
                
                # Get data
                result = get_landsat_data(location['lat'], location['lon'], date_str)
                
                if result:
                    all_data.append({
                        'city': city_name,
                        'location_name': location['name'],
                        'latitude': location['lat'],
                        'longitude': location['lon'],
                        'date': date_str,
                        'temperature': result['temperature'],
                        'ndvi': result['ndvi'],
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
    print(f"Total records: {len(all_data)}")
    print(f"{'='*60}\n")
    
    return pd.DataFrame(all_data)

def save_data(df, output_dir='data'):
    """Save to Parquet"""
    os.makedirs(output_dir, exist_ok=True)
    
    complete_file = os.path.join(output_dir, 'malaysia_cities_2020_2024_optimized.parquet')
    df.to_parquet(complete_file, index=False, compression='snappy')
    
    print(f"✓ Saved: {complete_file}")
    print(f"  Size: {os.path.getsize(complete_file) / 1024:.1f} KB")
    print(f"  Rows: {len(df):,}")
    
    # Summary
    summary_file = os.path.join(output_dir, 'data_summary_optimized.csv')
    summary = df.groupby(['city', 'location_name']).agg({
        'temperature': ['count', 'mean', 'min', 'max'],
        'ndvi': ['mean']
    }).round(2)
    summary.to_csv(summary_file)
    print(f"✓ Saved summary: {summary_file}")
    
    return complete_file

def main():
    print("\n" + "="*60)
    print("OPTIMIZED GEE Data Extraction")
    print("2020-2024 | Monthly Samples | 9 Locations")
    print("="*60)
    
    if not initialize_gee():
        print("\n✗ GEE initialization failed")
        return
    
    print("\nStarting extraction (estimated 15-30 minutes)...\n")
    
    df = extract_data_optimized(start_year=2020, end_year=2024)
    
    if len(df) == 0:
        print("\n✗ No data extracted")
        return
    
    output_file = save_data(df)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Records: {len(df):,}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Avg temp: {df['temperature'].mean():.2f}°C")
    print(f"Avg NDVI: {df['ndvi'].mean():.3f}")
    print("="*60)
    print(f"\n✓ Complete! Run: python upload_to_supabase.py")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
