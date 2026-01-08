"""
Extract aggregated data for missing districts from CSV
These districts exist in CSV but are not in Supabase yet
"""

import pandas as pd
import json

# Path to CSV
CSV_FILE = r'backend\data\Malaysia_All_Cities_LST_2016_2024.csv'

# Missing districts (as they appear in the CSV)
MISSING_DISTRICTS = [
    'Alur Gajah',    # Melaka - should match "Alor Gajah" in GeoJSON
    'Batu Pahit',    # Johor - should match "Batu Pahat" in GeoJSON
    'Bentung',       # Pahang - should match "Bentong" in GeoJSON
    'Kelang',        # Selangor - should match "Klang" in GeoJSON
    'Labuk & Sugut', # Sabah
    'Pensiangan',    # Sabah
    'Temerluh',      # Pahang - should match "Temerloh" in GeoJSON
]

def aggregate_district(df, district_name):
    """Aggregate hotspot data for a single district"""
    district_data = df[df['District'] == district_name].copy()

    if len(district_data) == 0:
        print(f"WARNING: No data found for {district_name}")
        return None

    # Get state (should be consistent)
    state = district_data['State'].iloc[0]

    # Calculate aggregations
    aggregated = {
        'district_name': district_name,
        'city': district_data['city'].iloc[0],
        'state_name': state,
        'avg_temperature': float(district_data['LST'].mean()),
        'min_temperature': float(district_data['LST'].min()),
        'max_temperature': float(district_data['LST'].max()),
        'avg_ndvi': float(district_data['NDVI'].mean()),
        'avg_ndbi': float(district_data['NDBI'].mean()),
        'avg_elevation': float(district_data['Elevation'].mean()),
        'avg_population': float(district_data['Population'].mean()),
        'avg_latitude': float(district_data['latitude'].mean()),
        'avg_longitude': float(district_data['longitude'].mean()),
        'hotspot_count': len(district_data),
        'data_points': len(district_data)
    }

    return aggregated

def main():
    print("Loading CSV data...")
    df = pd.read_csv(CSV_FILE)
    print(f"Total rows in CSV: {len(df)}")
    print(f"Total unique districts: {df['District'].nunique()}\n")

    results = []

    print("Extracting aggregated data for missing districts:\n")
    print("-" * 80)

    for district in MISSING_DISTRICTS:
        agg = aggregate_district(df, district)
        if agg:
            results.append(agg)
            print(f"\n{district} ({agg['state_name']}):")
            print(f"  Hotspot count: {agg['hotspot_count']}")
            print(f"  Avg Temperature: {agg['avg_temperature']:.2f}°C")
            print(f"  Min Temperature: {agg['min_temperature']:.2f}°C")
            print(f"  Max Temperature: {agg['max_temperature']:.2f}°C")
            print(f"  Avg NDVI: {agg['avg_ndvi']:.4f}")
            print(f"  Avg NDBI: {agg['avg_ndbi']:.4f}")
            print(f"  Location: ({agg['avg_latitude']:.4f}, {agg['avg_longitude']:.4f})")

    print("\n" + "-" * 80)
    print(f"\nTotal districts extracted: {len(results)}")

    # Save to JSON for easy import
    output_file = 'backend/missing_districts_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nData saved to: {output_file}")

    # Generate SQL INSERT statements
    print("\n" + "=" * 80)
    print("SQL INSERT STATEMENTS FOR SUPABASE:")
    print("=" * 80)
    print("\n-- Copy and paste these into Supabase SQL Editor:\n")

    for agg in results:
        sql = f"""INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  '{agg['district_name']}', '{agg['city']}', '{agg['state_name']}',
  {agg['avg_temperature']:.6f}, {agg['min_temperature']:.6f}, {agg['max_temperature']:.6f},
  {agg['avg_ndvi']:.6f}, {agg['avg_ndbi']:.6f}, {agg['avg_elevation']:.6f}, {agg['avg_population']:.6f},
  {agg['avg_latitude']:.6f}, {agg['avg_longitude']:.6f}, {agg['hotspot_count']}
);"""
        print(sql)

    print("\n" + "=" * 80)
    print("\nNOTE: After inserting into Supabase, refresh your choropleth map.")
    print("The enrichment rate should increase from 81.2% to 85.6% (137/160 districts).")

if __name__ == '__main__':
    main()
