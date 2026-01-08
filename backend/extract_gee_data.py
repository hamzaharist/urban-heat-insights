"""
GEE Data Extraction Script (v2 - Rigorous)
------------------------------------------
Ports the user's GEE Script to Python with Critical Enhancements:
1. Cloud Masking: Uses QA_PIXEL to mask clouds and shadows (Geoscientist Requirement #1)
2. MNDWI: Calculates Modified Normalized Difference Water Index (Geoscientist Requirement #3)
3. Population: Extracts WorldPop data (Killer Feature)
"""

import ee
import pandas as pd
import os
import json
from dotenv import load_dotenv

# Initialize GEE
try:
    ee.Initialize()
    print("[OK] Google Earth Engine initialized")
except Exception as e:
    print("Initializing GEE with auth...")
    # Trigger auth flow if needed, or use service account if set in env
    load_dotenv()
    project_id = os.getenv("GEE_PROJECT_ID")
    if project_id:
        ee.Initialize(project=project_id)
    else:
        ee.Authenticate()
        ee.Initialize()

def mask_clouds_landsat89(image):
    """
    Masks clouds and cloud shadows using the QA_PIXEL band.
    Ref: https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC09_C02_T1_L2
    """
    qa = image.select('QA_PIXEL')
    
    # Bits 0-5 are: Fill, Dilated Cloud, Cirrus, Cloud, Cloud Shadow
    # We want to mask out all of these.
    # 1 << 0 = Fill
    # 1 << 1 = Dilated Cloud
    # 1 << 2 = Cirrus
    # 1 << 3 = Cloud
    # 1 << 4 = Cloud Shadow
    mask = qa.bitwiseAnd(1 << 0).eq(0) \
        .And(qa.bitwiseAnd(1 << 1).eq(0)) \
        .And(qa.bitwiseAnd(1 << 2).eq(0)) \
        .And(qa.bitwiseAnd(1 << 3).eq(0)) \
        .And(qa.bitwiseAnd(1 << 4).eq(0))
        
    return image.updateMask(mask)

def add_indices_and_variables(image):
    """Calculate LST, NDVI, NDBI, MNDWI"""
    
    # Scale factors for Collection 2 Level 2
    # Optical bands: 0.0000275 + -0.2
    optical = image.select(['SR_B.']).multiply(0.0000275).add(-0.2)
    # Thermal band: 0.00341802 + 149.0
    thermal = image.select('ST_B10').multiply(0.00341802).add(149.0)
    
    # 1. LST (Celsius)
    lst = thermal.subtract(273.15).rename('LST')
    
    # 2. NDVI (Vegetation): (NIR - Red) / (NIR + Red)
    # L8/9: NIR=B5, Red=B4
    ndvi = optical.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
    
    # 3. NDBI (Built-Up): (SWIR1 - NIR) / (SWIR1 + NIR)
    # L8/9: SWIR1=B6, NIR=B5
    # Note: Using standard formula (SWIR - NIR) / (SWIR + NIR)
    ndbi = optical.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI')
    
    # 4. MNDWI (Water): (Green - SWIR1) / (Green + SWIR1)
    # L8/9: Green=B3, SWIR1=B6
    # Required for Geoscientist features
    mndwi = optical.normalizedDifference(['SR_B3', 'SR_B6']).rename('MNDWI')
    
    return image.addBands([lst, ndvi, ndbi, mndwi])

def main():
    print("Starting Extraction Pipeline...")
    
    # 1. Define Region
    print("Loading Malaysia districts...")
    malaysia_districts = ee.FeatureCollection("FAO/GAUL/2015/level2") \
        .filter(ee.Filter.eq('ADM0_NAME', 'Malaysia'))
        
    # 2. Define Data Sources
    start_date = '2016-01-01'
    end_date = '2024-12-30'
    
    print(f"Data Range: {start_date} to {end_date}")
    
    # Landsat 8/9 Collection
    l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2") \
        .filterDate(start_date, end_date) \
        .filterBounds(malaysia_districts) \
        .filter(ee.Filter.lt('CLOUD_COVER', 30)) # Relaxed scene filter, relying on pixel mask
        
    l9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2") \
        .filterDate(start_date, end_date) \
        .filterBounds(malaysia_districts) \
        .filter(ee.Filter.lt('CLOUD_COVER', 30))
        
    merged_col = l8.merge(l9)
    
    # Apply Masking & Processing
    processed_col = merged_col.map(mask_clouds_landsat89).map(add_indices_and_variables)
    
    # Create Composite (Median)
    # Note: Median helps further check outliers
    composite = processed_col.median().clip(malaysia_districts)
    
    # Other Layers
    elevation = ee.Image("NASA/NASADEM_HGT/001").select('elevation').rename('Elevation').clip(malaysia_districts)
    
    population = ee.ImageCollection("WorldPop/GP/100m/pop") \
        .filterDate('2020-01-01', '2021-01-01') \
        .mean().rename('Population').clip(malaysia_districts)
        
    lat_lon = ee.Image.pixelLonLat().rename(['longitude', 'latitude'])
    
    # Combined Image
    final_image = ee.Image.cat([
        composite.select(['LST', 'NDVI', 'NDBI', 'MNDWI']),
        elevation,
        population,
        lat_lon
    ])
    
    # 3. Sampling
    print("Generating sampling points...")
    
    # We will sample per district to ensure coverage
    # Using python-side iteration to manage large requests
    districts_list = malaysia_districts.getInfo()['features']
    print(f"Found {len(districts_list)} districts.")
    
    all_data = []
    
    for i, district in enumerate(districts_list):
        props = district['properties']
        district_name = props['ADM2_NAME']
        state_name = props['ADM1_NAME']
        
        # Geometry
        geom = ee.Geometry(district['geometry'])
        
        # Calculate number of points based on area (copied from user script logic)
        # We need simpler logic here since 'area' calculation in Python/Client side is different
        # Let's use a fixed density approximation or just request points
        # Using ee.call to calculate area server side
        area_sq_km = geom.area().divide(1e6).getInfo()
        
        # 1 point per 5 sq km, min 10, max 300 (reduced cap for speed/quota)
        num_points = int(max(10, min(300, area_sq_km / 5)))
        
        # print(f"Processing {district_name} ({state_name}): {area_sq_km:.1f} km2 -> {num_points} points")
        
        try:
            points = ee.FeatureCollection.randomPoints(region=geom, points=num_points, seed=123)
            
            samples = final_image.sampleRegions(
                collection=points,
                scale=100, # Increased scale slightly for speed (Landsat Thermal is 100m native anyway)
                geometries=False
            )
            
            # Fetch data (this is the network call)
            data = samples.getInfo()['features']
            
            for d in data:
                p = d['properties']
                p['district'] = district_name
                p['state'] = state_name
                p['city'] = district_name # Standardize
                all_data.append(p)
                
            if i % 10 == 0:
                print(f"  Processed {i}/{len(districts_list)} districts... (Total samples: {len(all_data)})")
                
        except Exception as e:
            print(f"  ERROR processing {district_name}: {e}")
            
    # 4. Save to Parquet
    print(f"\nExtraction complete. Total samples: {len(all_data)}")
    df = pd.DataFrame(all_data)
    
    # Basic cleanup
    df = df.dropna(subset=['LST', 'NDVI', 'Population'])
    
    output_path = 'data/malaysia_districts_final_v2.parquet'
    os.makedirs('data', exist_ok=True)
    df.to_parquet(output_path, index=False)
    
    print(f"Saved to {output_path}")
    print("\nNext: Run 'train_xgboost.py' to retrain model on this new data.")

if __name__ == "__main__":
    main()
