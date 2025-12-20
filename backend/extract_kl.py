"""
Extract GEE data for Kuala Lumpur districts (10 districts)
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

# KL Districts
cities = {
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
    print("Extracting Kuala Lumpur Districts (2016-2024)")
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
        output = 'data/kl_districts_2016_2024.parquet'
        df.to_parquet(output, index=False)
        
        print(f"\n✓ Saved {len(df)} records to {output}")
        print(f"  Cities: {df['city'].nunique()}")
