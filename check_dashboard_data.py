"""Check what data source the dashboard is using"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

print("=" * 70)
print("DASHBOARD DATA SOURCES")
print("=" * 70)

# Check district_aggregates table
result = supabase.table('district_aggregates').select('district_name, avg_temperature, avg_ndvi').limit(3).execute()
print("\n1. CHOROPLETH MAP DATA:")
print(f"   Source: Supabase table 'district_aggregates'")
print(f"   Districts: {len(result.data)} sampled")
if result.data:
    print(f"   Sample: {result.data[0]['district_name']}")
    print(f"     - Avg Temp: {result.data[0]['avg_temperature']:.2f}°C")
    print(f"     - Avg NDVI: {result.data[0]['avg_ndvi']:.3f}")

# Check hotspots table (raw pixel data)
hotspots_result = supabase.table('hotspots').select('district_name, avg_temperature', count='exact').limit(1).execute()
print(f"\n2. RAW PIXEL DATA:")
print(f"   Source: Supabase table 'hotspots'")
print(f"   Total pixels: {hotspots_result.count:,}")

# Check where this data came from originally
print("\n3. DATA ORIGIN:")
print("   The 'hotspots' table contains pixel-level data")
print("   The 'district_aggregates' table contains district averages computed from hotspots")
print("\n4. TIME PERIOD:")
print("   Need to check the data upload scripts to determine when this data was collected...")

# Try to find any date/year information
sample = supabase.table('hotspots').select('*').limit(1).execute()
if sample.data:
    print("\n5. SAMPLE HOTSPOT RECORD:")
    for key, value in sample.data[0].items():
        if 'year' in key.lower() or 'date' in key.lower() or 'time' in key.lower():
            print(f"   {key}: {value}")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print("The dashboard displays data from the 'district_aggregates' table,")
print("which is aggregated from the 'hotspots' table (pixel-level satellite data).")
print("=" * 70)
