"""
Google Earth Engine Data Extraction Script
Extracts historical LST and NDVI data for Malaysian cities (2016-2024)

Cities: Kuala Lumpur, Johor Bahru, Penang
Data: Land Surface Temperature, NDVI, Weather metrics
Output: Parquet files for efficient storage and Supabase upload
"""

import ee
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Google Earth Engine
def initialize_gee():
    """Initialize GEE with service account"""
    try:
        project_id = os.getenv("uhifyp")
        key_file = os.getenv("backend/uhifyp-13f8cdbd0d07.json")
        
        if key_file and os.path.exists(key_file):
            credentials = ee.ServiceAccountCredentials(
                email=None,
                key_file=key_file
            )
            ee.Initialize(credentials, project=project_id)
        else:
            ee.Initialize(project=project_id)
        
        print(f"✓ Google Earth Engine initialized with project: {project_id}")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize GEE: {str(e)}")
        return False

# Define city locations with multiple hotspots
CITIES = {
    'Kuala Lumpur': [
        {'name': 'KLCC', 'lat': 3.1578, 'lon': 101.7123},
        {'name': 'Bukit Bintang', 'lat': 3.1478, 'lon': 101.7108},
        {'name': 'Cheras', 'lat': 3.1167, 'lon': 101.7333},
        {'name': 'Petaling Jaya', 'lat': 3.1073, 'lon': 101.6067},
        {'name': 'Mont Kiara', 'lat': 3.1725, 'lon': 101.6508},
    ],
    'Johor Bahru': [
        {'name': 'JB City Centre', 'lat': 1.4655, 'lon': 103.7578},
        {'name': 'Skudai', 'lat': 1.5333, 'lon': 103.6500},
        {'name': 'Tebrau', 'lat': 1.5333, 'lon': 103.8000},
        {'name': 'Pasir Gudang', 'lat': 1.4733, 'lon': 103.9000},
        {'name': 'Nusajaya', 'lat': 1.4300, 'lon': 103.6500},
    ],
    'Penang': [
        {'name': 'Georgetown', 'lat': 5.4141, 'lon': 100.3288},
        {'name': 'Bayan Lepas', 'lat': 5.2972, 'lon': 100.2656},
        {'name': 'Butterworth', 'lat': 5.3991, 'lon': 100.3644},
        {'name': 'Bukit Mertajam', 'lat': 5.3631, 'lon': 100.4667},
        {'name': 'Tanjung Bungah', 'lat': 5.4667, 'lon': 100.2833},
    ],
}

def get_landsat_lst(lat, lon, date_str):
    """
    Extract Land Surface Temperature from Landsat 8/9
    """
    try:
        point = ee.Geometry.Point([lon, lat])
        date = ee.Date(date_str)
        
        # Try Landsat 9 first (2021 onwards)
        collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate(date, date.advance(1, 'day')) \
            .filterBounds(point)
        
        # If no Landsat 9, try Landsat 8 (2013-present)
        if collection.size().getInfo() == 0:
            collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') \
                .filterDate(date, date.advance(1, 'day')) \
                .filterBounds(point)
        
        if collection.size().getInfo() == 0:
            return None
        
        image = collection.first()
        
        # Get thermal band and convert to Celsius
        thermal = image.select('ST_B10')
        lst_celsius = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
        
        # Extract value at point
        temp_value = lst_celsius.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=30
        ).get('ST_B10')
        
        temperature = temp_value.getInfo()
        
        if temperature is None:
            return None
            
        return round(temperature, 2)
        
    except Exception as e:
        print(f"Error getting LST for {lat},{lon} on {date_str}: {str(e)}")
        return None

def get_ndvi(lat, lon, date_str):
    """
    Calculate NDVI (vegetation index) from Landsat
    """
    try:
        point = ee.Geometry.Point([lon, lat])
        date = ee.Date(date_str)
        
        # Try Landsat 9 first
        collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate(date, date.advance(1, 'day')) \
            .filterBounds(point)
        
        # Fallback to Landsat 8
        if collection.size().getInfo() == 0:
            collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') \
                .filterDate(date, date.advance(1, 'day')) \
                .filterBounds(point)
        
        if collection.size().getInfo() == 0:
            return None
        
        image = collection.first()
        
        # Calculate NDVI: (NIR - Red) / (NIR + Red)
        nir = image.select('SR_B5')
        red = image.select('SR_B4')
        ndvi = nir.subtract(red).divide(nir.add(red))
        
        # Extract value
        ndvi_value = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=30
        ).get('SR_B5')
        
        result = ndvi_value.getInfo()
        
        if result is None:
            return None
            
        return round(result, 3)
        
    except Exception as e:
        print(f"Error getting NDVI for {lat},{lon} on {date_str}: {str(e)}")
        return None

def extract_data(start_year=2016, end_year=2024):
    """
    Extract data for all cities from start_year to end_year
    """
    print(f"\n{'='*60}")
    print(f"Starting data extraction: {start_year} - {end_year}")
    print(f"Cities: {', '.join(CITIES.keys())}")
    print(f"{'='*60}\n")
    
    all_data = []
    total_points = 0
    successful_points = 0
    
    # Calculate date range (Landsat 16-day cycle)
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    current_date = start_date
    
    dates = []
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=16)  # Landsat revisit cycle
    
    print(f"Total dates to process: {len(dates)}")
    print(f"Total locations: {sum(len(locs) for locs in CITIES.values())}")
    print(f"Total data points to extract: {len(dates) * sum(len(locs) for locs in CITIES.values())}\n")
    
    # Extract data for each city
    for city_name, locations in CITIES.items():
        print(f"\n{'─'*60}")
        print(f"Processing: {city_name}")
        print(f"{'─'*60}")
        
        for location in locations:
            print(f"\n  Location: {location['name']}")
            location_success = 0
            
            for i, date in enumerate(dates):
                date_str = date.strftime('%Y-%m-%d')
                total_points += 1
                
                # Progress indicator
                if (i + 1) % 10 == 0:
                    print(f"    Progress: {i+1}/{len(dates)} dates processed...")
                
                # Get LST
                lst = get_landsat_lst(location['lat'], location['lon'], date_str)
                
                # Get NDVI
                ndvi = get_ndvi(location['lat'], location['lon'], date_str)
                
                # Only save if we got data
                if lst is not None or ndvi is not None:
                    all_data.append({
                        'city': city_name,
                        'location_name': location['name'],
                        'latitude': location['lat'],
                        'longitude': location['lon'],
                        'date': date_str,
                        'temperature': lst,
                        'ndvi': ndvi,
                        'year': date.year,
                        'month': date.month,
                        'day': date.day,
                        'source': 'Landsat 8/9'
                    })
                    successful_points += 1
                    location_success += 1
            
            print(f"    ✓ {location['name']}: {location_success}/{len(dates)} successful extractions")
    
    print(f"\n{'='*60}")
    print(f"Extraction Complete!")
    print(f"Total successful extractions: {successful_points}/{total_points}")
    print(f"Success rate: {(successful_points/total_points)*100:.1f}%")
    print(f"{'='*60}\n")
    
    return pd.DataFrame(all_data)

def save_data(df, output_dir='data'):
    """
    Save extracted data to Parquet files
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save complete dataset
    complete_file = os.path.join(output_dir, 'malaysia_cities_2016_2024_complete.parquet')
    df.to_parquet(complete_file, index=False, compression='snappy')
    print(f"✓ Saved complete dataset: {complete_file}")
    print(f"  Size: {os.path.getsize(complete_file) / 1024:.1f} KB")
    print(f"  Rows: {len(df):,}")
    
    # Save by city
    for city in df['city'].unique():
        city_df = df[df['city'] == city]
        city_file = os.path.join(output_dir, f'{city.lower().replace(" ", "_")}_2016_2024.parquet')
        city_df.to_parquet(city_file, index=False, compression='snappy')
        print(f"✓ Saved {city}: {city_file} ({len(city_df):,} rows)")
    
    # Save summary statistics
    summary_file = os.path.join(output_dir, 'data_summary.csv')
    summary = df.groupby(['city', 'location_name']).agg({
        'temperature': ['count', 'mean', 'min', 'max', 'std'],
        'ndvi': ['mean', 'min', 'max']
    }).round(2)
    summary.to_csv(summary_file)
    print(f"✓ Saved summary statistics: {summary_file}")
    
    return complete_file

def main():
    """
    Main execution function
    """
    print("\n" + "="*60)
    print("GEE Data Extraction Script")
    print("Malaysian Cities: 2016-2024")
    print("="*60)
    
    # Initialize GEE
    if not initialize_gee():
        print("\n✗ Failed to initialize Google Earth Engine")
        print("Please check your credentials and try again.")
        return
    
    # Extract data
    print("\nStarting data extraction...")
    print("This may take 30-60 minutes depending on your connection.")
    print("Progress will be shown for each location.\n")
    
    df = extract_data(start_year=2016, end_year=2024)
    
    if len(df) == 0:
        print("\n✗ No data extracted. Please check your GEE credentials.")
        return
    
    # Save data
    print("\nSaving data to Parquet files...")
    output_file = save_data(df)
    
    # Print final summary
    print("\n" + "="*60)
    print("EXTRACTION SUMMARY")
    print("="*60)
    print(f"Total records: {len(df):,}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Cities: {df['city'].nunique()}")
    print(f"Locations: {df['location_name'].nunique()}")
    print(f"\nTemperature Statistics:")
    print(f"  Mean: {df['temperature'].mean():.2f}°C")
    print(f"  Min: {df['temperature'].min():.2f}°C")
    print(f"  Max: {df['temperature'].max():.2f}°C")
    print(f"\nNDVI Statistics:")
    print(f"  Mean: {df['ndvi'].mean():.3f}")
    print(f"  Min: {df['ndvi'].min():.3f}")
    print(f"  Max: {df['ndvi'].max():.3f}")
    print("="*60)
    print(f"\n✓ Data extraction complete!")
    print(f"✓ Files saved in 'data/' directory")
    print(f"\nNext steps:")
    print(f"1. Review the data in: {output_file}")
    print(f"2. Run upload_to_supabase.py to load data into database")
    print(f"3. Update frontend to use the new data")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
