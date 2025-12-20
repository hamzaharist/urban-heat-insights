"""
Extract GEE data for Penang districts (10 districts)
"""
import ee
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

def initialize_gee():
    try:
        ee.Initialize(project="uhifyp")
        print("✓ GEE initialized")
        return True
    except Exception as e:
        print(f"✗ GEE init failed: {e}")
        return False

# Penang Districts
cities = {
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

def calculate_indices(image):
    thermal = image.select('ST_B10')
    lst = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
    ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])
    ndbi = image.normalizedDifference(['SR_B6', 'SR_B5'])
    return image.addBands([lst.rename('LST'), ndvi.rename('NDVI'), ndbi.rename('NDBI')])

def extract_for_district(city_name, coords, radius, year):
    point = ee.Geometry.Point(coords[1], coords[0])
    region = point.buffer(radius)
    
    collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') \
        .filterDate(f'{year}-01-01', f'{year}-12-31') \
        .filterBounds(region) \
        .filter(ee.Filter.lt('CLOUD_COVER', 20)) \
        .map(calculate_indices)
    
    def extract_values(image):
        stats = image.select(['LST', 'NDVI', 'NDBI']).reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30
        )
        return ee.Feature(None, {
            'date': image.date().format('YYYY-MM-dd'),
            'city': city_name,
            'temperature': stats.get('LST'),
            'ndvi': stats.get('NDVI'),
            'ndbi': stats.get('NDBI'),
            'latitude': coords[0],
            'longitude': coords[1]
        })
    
    return collection.map(extract_values)

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Extracting Penang Districts (2016-2024)")
    print("="*60 + "\n")
    
    if not initialize_gee():
        exit(1)
    
    all_records = []
    
    for year in range(2016, 2025):  # 2016-2024
        print(f"\nYear {year}:")
        for city_name, city_data in cities.items():
            print(f"  {city_name}...", end=" ")
            try:
                features = extract_for_district(city_name, city_data['coords'], city_data['radius'], year)
                data = features.getInfo()
                count = len(data['features'])
                for feature in data['features']:
                    all_records.append(feature['properties'])
                print(f"✓ {count} records")
            except Exception as e:
                print(f"✗ Error: {e}")
    
    if all_records:
        df = pd.DataFrame(all_records)
        df['date'] = pd.to_datetime(df['date'])
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['source'] = 'Landsat 8'
        
        os.makedirs('data', exist_ok=True)
        output = 'data/penang_districts_2016_2024.parquet'
        df.to_parquet(output, index=False)
        
        print(f"\n✓ Saved {len(df)} records to {output}")
        print(f"  Cities: {df['city'].nunique()}")
