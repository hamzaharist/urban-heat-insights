"""
COMPREHENSIVE DEBUG - Trace NDVI/NDBI from parquet to database
"""
import pandas as pd
import os
from supabase import create_client
from dotenv import load_dotenv
import pathlib

load_dotenv(pathlib.Path(__file__).parent.parent / '.env')

print("\n" + "="*70)
print("NDVI/NDBI PIPELINE TRACER")
print("="*70)

# STEP 1: Check parquet file
print("\n[STEP 1] Reading parquet file...")
parquet_file = 'data/malaysia_cities_2016_2024_region_based.parquet'
df = pd.read_parquet(parquet_file)

print(f"  Rows: {len(df)}")
print(f"  Columns: {list(df.columns)}")
print(f"  Has NDVI: {'ndvi' in df.columns}")
print(f"  Has NDBI: {'ndbi' in df.columns}")

if 'ndvi' in df.columns:
    print(f"\n  NDVI Stats:")
    print(f"    Min: {df['ndvi'].min():.3f}")
    print(f"    Max: {df['ndvi'].max():.3f}")
    print(f"    Mean: {df['ndvi'].mean():.3f}")
    print(f"    Non-null: {df['ndvi'].notna().sum()}/{len(df)}")

if 'ndbi' in df.columns:
    print(f"\n  NDBI Stats:")
    print(f"    Min: {df['ndbi'].min():.3f}")
    print(f"    Max: {df['ndbi'].max():.3f}")
    print(f"    Mean: {df['ndbi'].mean():.3f}")
    print(f"    Non-null: {df['ndbi'].notna().sum()}/{len(df)}")

# STEP 2: Simulate hotspot creation
print("\n[STEP 2] Simulating hotspot creation...")

# Calculate average temperature per city (same as upload script)
if 'location_name' in df.columns:
    hotspots = df.groupby(['city', 'location_name', 'latitude', 'longitude']).agg({
        'temperature': 'mean'
    }).reset_index()
    hotspots.columns = ['city', 'name', 'latitude', 'longitude', 'avg_temperature']
else:
    hotspots = df.groupby(['city', 'latitude', 'longitude']).agg({
        'temperature': 'mean'
    }).reset_index()
    hotspots.columns = ['city', 'latitude', 'longitude', 'avg_temperature']
    hotspots['name'] = hotspots['city']

print(f"  Created {len(hotspots)} hotspots")
print(f"  Hotspot columns: {list(hotspots.columns)}")

# STEP 3: Simulate NDVI/NDBI merge
print("\n[STEP 3] Simulating NDVI/NDBI merge...")

if 'ndvi' in df.columns:
    agg_dict = {'ndvi': 'mean'}
    if 'ndbi' in df.columns:
        agg_dict['ndbi'] = 'mean'
    
    if 'location_name' in df.columns:
        indices = df.groupby(['city', 'location_name']).agg(agg_dict).reset_index()
        print(f"  Indices grouped by: city, location_name")
    else:
        indices = df.groupby(['city']).agg(agg_dict).reset_index()
        print(f"  Indices grouped by: city")
    
    print(f"  Indices shape: {indices.shape}")
    print(f"  Indices columns: {list(indices.columns)}")
    print(f"\n  Sample indices:")
    print(indices.head())
    
    # Merge
    print(f"\n  Before merge - hotspots shape: {hotspots.shape}")
    if 'location_name' in df.columns:
        hotspots = hotspots.merge(indices, on=['city', 'name'], how='left')
    else:
        hotspots = hotspots.merge(indices, on='city', how='left')
    
    print(f"  After merge - hotspots shape: {hotspots.shape}")
    print(f"  After merge - columns: {list(hotspots.columns)}")
    
    # Rename
    hotspots.rename(columns={'ndvi': 'avg_ndvi', 'ndbi': 'avg_ndbi'}, inplace=True)
    
    print(f"\n  NDVI in hotspots:")
    print(f"    Non-null: {hotspots['avg_ndvi'].notna().sum()}/{len(hotspots)}")
    print(f"    Mean: {hotspots['avg_ndvi'].mean():.3f}")
    
    print(f"\n  NDBI in hotspots:")
    print(f"    Non-null: {hotspots['avg_ndbi'].notna().sum()}/{len(hotspots)}")
    print(f"    Mean: {hotspots['avg_ndbi'].mean():.3f}")
    
    print(f"\n  Sample hotspots with NDVI/NDBI:")
    print(hotspots[['name', 'city', 'avg_ndvi', 'avg_ndbi']].head())

# STEP 4: Check what would be uploaded
print("\n[STEP 4] Checking upload payload...")
records = hotspots.to_dict('records')
print(f"  Total records to upload: {len(records)}")
print(f"\n  Sample record:")
if records:
    sample = records[0]
    print(f"    name: {sample.get('name')}")
    print(f"    city: {sample.get('city')}")
    print(f"    avg_temperature: {sample.get('avg_temperature')}")
    print(f"    avg_ndvi: {sample.get('avg_ndvi')}")
    print(f"    avg_ndbi: {sample.get('avg_ndbi')}")

# STEP 5: Check database
print("\n[STEP 5] Checking current database...")
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

if url and key:
    sb = create_client(url, key)
    result = sb.table('hotspots').select('name,city,avg_ndvi,avg_ndbi').execute()
    
    print(f"  Hotspots in database: {len(result.data)}")
    print(f"\n  Current database values:")
    for h in result.data[:5]:
        print(f"    {h['name']:20} - NDVI: {h.get('avg_ndvi')}, NDBI: {h.get('avg_ndbi')}")

print("\n" + "="*70)
print("DEBUG COMPLETE")
print("="*70 + "\n")
