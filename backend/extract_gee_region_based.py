"""
Efficient GEE Data Extraction using Region-based Analysis
Extracts LST, NDVI, and NDBI for Malaysian cities (2016-2024)
Uses buffer regions for faster extraction
"""

import ee
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

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

# Define cities with their coordinates (lat, lon) and buffer radius in meters
cities = {
    # Kuala Lumpur - 10 districts
    'Kuala Lumpur - KLCC': {'coords': [3.1578, 101.7123], 'radius': 3000},
    'Kuala Lumpur - Bukit Bintang': {'coords': [3.1478, 101.7108], 'radius': 3000},
    'Kuala Lumpur - Cheras': {'coords': [3.1167, 101.7333], 'radius': 3000},
    'Kuala Lumpur - Bangsar': {'coords': [3.1319, 101.6714], 'radius': 3000},
    'Kuala Lumpur - Sentul': {'coords': [3.1833, 101.6917], 'radius': 3000},
    'Kuala Lumpur - Kepong': {'coords': [3.2167, 101.6333], 'radius': 3000},
    'Kuala Lumpur - Ampang': {'coords': [3.1500, 101.7667], 'radius': 3000},
    'Kuala Lumpur - Setapak': {'coords': [3.1917, 101.7250], 'radius': 3000},
    'Kuala Lumpur - Mont Kiara': {'coords': [3.1725, 101.6508], 'radius': 3000},
    'Kuala Lumpur - Petaling Jaya': {'coords': [3.1073, 101.6067], 'radius': 3000},
    
    # Johor Bahru - 10 districts
    'Johor Bahru - City Centre': {'coords': [1.4655, 103.7578], 'radius': 3000},
    'Johor Bahru - Skudai': {'coords': [1.5333, 103.6500], 'radius': 3000},
    'Johor Bahru - Tebrau': {'coords': [1.5333, 103.8000], 'radius': 3000},
    'Johor Bahru - Pasir Gudang': {'coords': [1.4733, 103.9000], 'radius': 3000},
    'Johor Bahru - Nusajaya': {'coords': [1.4300, 103.6500], 'radius': 3000},
    'Johor Bahru - Tampoi': {'coords': [1.4833, 103.7500], 'radius': 3000},
    'Johor Bahru - Kulai': {'coords': [1.6556, 103.6000], 'radius': 3000},
    'Johor Bahru - Senai': {'coords': [1.6000, 103.6667], 'radius': 3000},
    'Johor Bahru - Gelang Patah': {'coords': [1.3833, 103.6167], 'radius': 3000},
    'Johor Bahru - Permas Jaya': {'coords': [1.4917, 103.8167], 'radius': 3000},
    
    # Penang - 10 districts
    'Penang - Georgetown': {'coords': [5.4141, 100.3288], 'radius': 3000},
    'Penang - Bayan Lepas': {'coords': [5.2972, 100.2656], 'radius': 3000},
    'Penang - Butterworth': {'coords': [5.3991, 100.3644], 'radius': 3000},
    'Penang - Bukit Mertajam': {'coords': [5.3631, 100.4667], 'radius': 3000},
    'Penang - Tanjung Bungah': {'coords': [5.4667, 100.2833], 'radius': 3000},
    'Penang - Jelutong': {'coords': [5.3833, 100.3167], 'radius': 3000},
    'Penang - Batu Kawan': {'coords': [5.2833, 100.4333], 'radius': 3000},
    'Penang - Balik Pulau': {'coords': [5.3500, 100.2167], 'radius': 3000},
    'Penang - Tanjung Tokong': {'coords': [5.4500, 100.3000], 'radius': 3000},
    'Penang - Seberang Perai': {'coords': [5.3833, 100.4000], 'radius': 3000},
}

# Date range
start_date = '2016-01-01'
end_date = '2024-12-31'

def calculate_lst(image):
    """Calculate Land Surface Temperature from Landsat 8"""
    # Select thermal band (Band 10 for Landsat 8)
    thermal = image.select('ST_B10')
    # Convert to Celsius
    lst = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
    return image.addBands(lst.rename('LST'))

def calculate_ndvi(image):
    """Calculate NDVI"""
    ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
    return image.addBands(ndvi)

def calculate_ndbi(image):
    """Calculate NDBI (Normalized Difference Built-up Index)"""
    # NDBI = (SWIR - NIR) / (SWIR + NIR)
    ndbi = image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI')
    return image.addBands(ndbi)

def extract_data_for_city(city_name, coords, radius):
    """Extract LST, NDVI, and NDBI for a specific city"""
    print(f"Processing {city_name}...")
    
    # Create point geometry
    point = ee.Geometry.Point(coords[1], coords[0])
    region = point.buffer(radius)
    
    # Load Landsat 8 Collection 2 Tier 1 Surface Reflectance
    collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') \
        .filterDate(start_date, end_date) \
        .filterBounds(region) \
        .filter(ee.Filter.lt('CLOUD_COVER', 20))
    
    # Process each image
    def process_image(image):
        img = calculate_lst(image)
        img = calculate_ndvi(img)
        img = calculate_ndbi(img)
        return img
    
    processed = collection.map(process_image)
    
    # Extract values
    def extract_values(image):
        date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')
        
        # Get mean values for the region
        stats = image.select(['LST', 'NDVI', 'NDBI']).reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30,
            maxPixels=1e9
        )
        
        return ee.Feature(None, {
            'date': date,
            'city': city_name,
            'LST': stats.get('LST'),
            'NDVI': stats.get('NDVI'),
            'NDBI': stats.get('NDBI'),
            'latitude': coords[0],
            'longitude': coords[1]
        })
    
    features = processed.map(extract_values)
    return features

def main():
    print("\n" + "="*60)
    print("Efficient GEE Data Extraction")
    print("Region-based Analysis | 2016-2024 | 30 Districts")
    print("="*60 + "\n")
    
    if not initialize_gee():
        return
    
    # Collect data for all cities
    all_features = []
    
    for city_name, city_data in cities.items():
        try:
            city_features = extract_data_for_city(
                city_name, 
                city_data['coords'], 
                city_data['radius']
            )
            all_features.append(city_features)
        except Exception as e:
            print(f"Error processing {city_name}: {str(e)}")
    
    # Combine all features
    print("\nCombining data from all cities...")
    combined = ee.FeatureCollection(all_features).flatten()
    
    # Export to list
    print("Extracting data from Google Earth Engine...")
    print("(This may take a few minutes...)")
    data_list = combined.getInfo()
    
    # Convert to pandas DataFrame
    records = []
    for feature in data_list['features']:
        props = feature['properties']
        records.append(props)
    
    df = pd.DataFrame(records)
    
    # Clean and sort data
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['city', 'date'])
    
    # Rename LST column to temperature for consistency
    df = df.rename(columns={'LST': 'temperature', 'NDVI': 'ndvi', 'NDBI': 'ndbi'})
    
    # Add year and month columns
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['source'] = 'Landsat 8 (Region-based)'
    
    # Display summary statistics
    print("\n" + "="*60)
    print("DATA EXTRACTION COMPLETE")
    print("="*60)
    print(f"\nTotal records: {len(df)}")
    print(f"\nRecords per city:")
    print(df['city'].value_counts())
    
    print("\n" + "="*60)
    print("SUMMARY STATISTICS")
    print("="*60)
    print(df.groupby('city')[['temperature', 'ndvi', 'ndbi']].agg(['mean', 'min', 'max']).round(2))
    
    # Save to Parquet (more efficient than CSV)
    os.makedirs('data', exist_ok=True)
    parquet_file = 'data/malaysia_cities_2016_2024_region_based.parquet'
    df.to_parquet(parquet_file, index=False, compression='snappy')
    print(f"\n✓ Data saved to: {parquet_file}")
    print(f"  Size: {os.path.getsize(parquet_file) / 1024:.1f} KB")
    
    # Also save CSV for easy viewing
    csv_file = 'data/malaysia_cities_2016_2024_region_based.csv'
    df.to_csv(csv_file, index=False)
    print(f"✓ CSV saved to: {csv_file}")
    
    # Create yearly averages
    df['year'] = df['date'].dt.year
    yearly_avg = df.groupby(['city', 'year'])[['temperature', 'ndvi', 'ndbi']].mean().reset_index()
    yearly_file = 'data/malaysia_cities_yearly_averages.csv'
    yearly_avg.to_csv(yearly_file, index=False)
    print(f"✓ Yearly averages saved to: {yearly_file}")
    
    # Display sample data
    print("\n" + "="*60)
    print("SAMPLE DATA")
    print("="*60)
    print(df.head(10))
    
    print("\n" + "="*60)
    print("EXTRACTION COMPLETE!")
    print("="*60)
    print("\nFiles created:")
    print(f"1. {parquet_file} - All data (Parquet format)")
    print(f"2. {csv_file} - All data (CSV format)")
    print(f"3. {yearly_file} - Yearly averages")
    print("\nNext step: Run python upload_to_supabase.py")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
