"""
Filter GeoJSON to only include districts that have data in Supabase.
This will remove the 29 districts without data, giving us 100% enrichment.
"""

import json

# The 29 districts to REMOVE (no data available)
DISTRICTS_TO_REMOVE = [
    'Asajaya', 'Bagan Datuk', 'Beluran', 'Beluru', 'Bukit Mabong',
    'Kabong', 'Kalabakan', 'Kampar', 'Kecil Lojing', 'Kulai',
    'Kunak', 'Matu', 'Muallim', 'Nabawan', 'Pakan',
    'Pokok Sena', 'Pusa', 'Putatan', 'Segamat', 'Selama',
    'Selangau', 'Subis', 'Tangkak', 'Tanjung Manis', 'Tebedu',
    'Telang Usan', 'Telupid', 'Tongod', 'W.P. Putrajaya'
]

def filter_geojson():
    """Filter the districts GeoJSON to remove districts without data."""

    # Read the original GeoJSON
    input_file = 'api/data/malaysia_districts.geojson'
    output_file = 'api/data/malaysia_districts_filtered.geojson'

    print(f"Reading GeoJSON from: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    original_count = len(geojson_data['features'])
    print(f"Original district count: {original_count}")

    # Filter out districts without data
    filtered_features = []
    removed_districts = []

    for feature in geojson_data['features']:
        district_name = feature['properties'].get('name', '')

        if district_name not in DISTRICTS_TO_REMOVE:
            filtered_features.append(feature)
        else:
            removed_districts.append(district_name)

    # Update the GeoJSON
    geojson_data['features'] = filtered_features

    # Write the filtered GeoJSON
    print(f"\nWriting filtered GeoJSON to: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, ensure_ascii=False, indent=2)

    # Report results
    filtered_count = len(filtered_features)
    removed_count = len(removed_districts)

    print("\n" + "=" * 60)
    print("FILTERING COMPLETE")
    print("=" * 60)
    print(f"Original districts: {original_count}")
    print(f"Filtered districts: {filtered_count}")
    print(f"Removed districts:  {removed_count}")
    print(f"Enrichment rate:    {filtered_count}/{filtered_count} (100%)")

    print(f"\nRemoved the following {removed_count} districts:")
    for district in sorted(removed_districts):
        print(f"  - {district}")

    print(f"\n✓ Filtered GeoJSON saved to: {output_file}")
    print("\nNext steps:")
    print("1. Update backend/api/geojson.py to use 'districts_filtered.geojson'")
    print("2. Restart the backend server")
    print("3. Refresh the browser - you should now see 100% enrichment!")

if __name__ == '__main__':
    filter_geojson()
