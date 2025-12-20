"""
Extract GEE data for Ipoh and districts (2016-2024)
5 districts: Ipoh City, Buntong, Menglembu, Chemor, Simpang Pulai
"""

import ee
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time

load_dotenv()

def initialize_gee():
    try:
        project_id = os.getenv("GEE_PROJECT_ID")
        key_file = os.getenv("GEE_PRIVATE_KEY_PATH")
        if key_file and os.path.exists(key_file):
            credentials = ee.ServiceAccountCredentials(email=None, key_file=key_file)
            ee.Initialize(credentials, project=project_id)
        else:
            ee.Initialize(project=project_id)
        print(f"✓ GEE initialized")
        return True
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
        return False

DISTRICTS = [
    {'name': 'Ipoh City', 'lat': 4.5975, 'lon': 101.0901},
    {'name': 'Buntong', 'lat': 4.6167, 'lon': 101.0833},
    {'name': 'Menglembu', 'lat': 4.6167, 'lon': 101.1167},
    {'name': 'Chemor', 'lat': 4.7333, 'lon': 101.1167},
    {'name': 'Simpang Pulai', 'lat': 4.5833, 'lon': 101.1500},
    {'name': 'Tambun', 'lat': 4.6500, 'lon': 101.1333},
    {'name': 'Jelapang', 'lat': 4.6333, 'lon': 101.1000},
    {'name': 'Tasek', 'lat': 4.5667, 'lon': 101.0667},
    {'name': 'Gunung Rapat', 'lat': 4.5500, 'lon': 101.1167},
    {'name': 'Silibin', 'lat': 4.6000, 'lon': 101.0667},
]

def get_landsat_data(lat, lon, date_str, max_retries=3):
    for attempt in range(max_retries):
        try:
            point = ee.Geometry.Point([lon, lat])
            date = ee.Date(date_str)
            
            for collection_name in ['LANDSAT/LC09/C02/T1_L2', 'LANDSAT/LC08/C02/T1_L2']:
                collection = ee.ImageCollection(collection_name).filterDate(date, date.advance(1, 'day')).filterBounds(point)
                
                if collection.size().getInfo() > 0:
                    image = collection.first()
                    thermal = image.select('ST_B10')
                    lst_celsius = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
                    temp_value = lst_celsius.reduceRegion(reducer=ee.Reducer.mean(), geometry=point, scale=30).get('ST_B10').getInfo()
                    
                    nir = image.select('SR_B5')
                    red = image.select('SR_B4')
                    ndvi = nir.subtract(red).divide(nir.add(red))
                    ndvi_value = ndvi.reduceRegion(reducer=ee.Reducer.mean(), geometry=point, scale=30).get('SR_B5').getInfo()
                    
                    swir = image.select('SR_B6')
                    ndbi = swir.subtract(nir).divide(swir.add(nir))
                    ndbi_value = ndbi.reduceRegion(reducer=ee.Reducer.mean(), geometry=point, scale=30).get('SR_B6').getInfo()
                    
                    if temp_value is not None:
                        return {'temperature': round(temp_value, 2), 'ndvi': round(ndvi_value, 3) if ndvi_value else None, 'ndbi': round(ndbi_value, 3) if ndbi_value else None}
            return None
        except:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return None

def main():
    print(f"\n{'='*60}\nIPOH Extraction (2016-2024)\n{'='*60}\n")
    if not initialize_gee():
        return
    
    all_data = []
    dates = []
    current_date = datetime(2016, 1, 1)
    while current_date <= datetime(2024, 12, 31):
        dates.append(current_date)
        current_date += timedelta(days=30)
    
    print(f"Districts: {len(DISTRICTS)} | Dates: {len(dates)} | Total: {len(DISTRICTS)*len(dates)}\n")
    
    for district in DISTRICTS:
        print(f"📍 {district['name']}")
        success = 0
        for i, date in enumerate(dates):
            if (i + 1) % 5 == 0 or i == 0:
                print(f"  [{i+1}/{len(dates)}]...", end=' ')
            result = get_landsat_data(district['lat'], district['lon'], date.strftime('%Y-%m-%d'))
            if result:
                all_data.append({'city': 'Ipoh', 'district': district['name'], 'latitude': district['lat'], 'longitude': district['lon'], 'date': date.strftime('%Y-%m-%d'), 'temperature': result['temperature'], 'ndvi': result['ndvi'], 'ndbi': result['ndbi'], 'year': date.year, 'month': date.month})
                success += 1
                if (i + 1) % 5 == 0 or i == 0:
                    print("✓")
            else:
                if (i + 1) % 5 == 0 or i == 0:
                    print("✗")
        print(f"  ✓ {success}/{len(dates)}\n")
    
    if len(all_data) > 0:
        os.makedirs('data', exist_ok=True)
        output = 'data/ipoh_2016_2024.parquet'
        pd.DataFrame(all_data).to_parquet(output, index=False)
        print(f"\n✓ Saved: {output} ({len(all_data)} records)\n")

if __name__ == "__main__":
    main()
