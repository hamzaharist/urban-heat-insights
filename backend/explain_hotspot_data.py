from supabase import create_client
import os
import pathlib
from dotenv import load_dotenv

load_dotenv(pathlib.Path(__file__).parent.parent / '.env')

sb = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')
)

print("\n" + "="*80)
print("HOTSPOT DATA STRUCTURE & SAMPLE")
print("="*80 + "\n")

# Get one sample hotspot
result = sb.table('hotspots').select('*').limit(1).execute()

if result.data and len(result.data) > 0:
    sample = result.data[0]
    
    print("COLUMNS IN HOTSPOTS TABLE:")
    print("-" * 80)
    for key, value in sample.items():
        value_str = str(value)[:50] if value is not None else "None"
        print(f"  {key:20} = {value_str}")
    
    print("\n" + "="*80)
    print("DATA SOURCE BREAKDOWN:")
    print("="*80 + "\n")
    
    print("📍 LOCATION DATA (Manual/Predefined):")
    print(f"  - name: {sample.get('name')}")
    print(f"  - city: {sample.get('city')}")
    print(f"  - district: {sample.get('district')}")
    print(f"  - latitude: {sample.get('latitude')}")
    print(f"  - longitude: {sample.get('longitude')}")
    
    print("\n🌡️ TEMPERATURE DATA (Landsat 8 Satellite):")
    print(f"  - avg_temperature: {sample.get('avg_temperature')}°C")
    print(f"  - Source: Landsat 8 Band 10 (Thermal Infrared)")
    print(f"  - Period: 2016-2024 average")
    
    print("\n🌿 NDVI DATA (Landsat 8 Satellite):")
    print(f"  - avg_ndvi: {sample.get('avg_ndvi')}")
    print(f"  - Source: Landsat 8 Bands 4 & 5 (Red & NIR)")
    print(f"  - Meaning: Vegetation density (higher = more green)")
    
    print("\n🏗️ NDBI DATA (Landsat 8 Satellite):")
    print(f"  - avg_ndbi: {sample.get('avg_ndbi')}")
    print(f"  - Source: Landsat 8 Bands 5 & 6 (NIR & SWIR)")
    print(f"  - Meaning: Built-up area density (higher = more urban)")
    
    print("\n🔥 INTENSITY CLASSIFICATION (Calculated):")
    print(f"  - intensity: {sample.get('intensity')}")
    print(f"  - Based on: avg_temperature thresholds")
    print(f"  - Categories: extreme, hot, warm, mild, cool")

print("\n" + "="*80 + "\n")
