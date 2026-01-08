"""
Create District Aggregates Table in Supabase
=============================================
Creates a pre-aggregated table for fast GeoJSON enrichment.
This solves the timeout issue when fetching 42K+ rows.

Strategy:
1. Create a new table: district_aggregates
2. Aggregate all 42,706 hotspot rows by district
3. Store 131 aggregated rows (one per district)
4. Update GeoJSON API to use this table instead

Author: AI Urban Cooling Consultant
Date: 2026-01-01
"""

import sys
sys.path.insert(0, '.')
from prediction_api import get_supabase
import pandas as pd

def create_aggregates_table():
    """Create and populate district_aggregates table"""

    supabase = get_supabase()
    if not supabase:
        print("ERROR: Could not connect to Supabase")
        return False

    print("=" * 60)
    print("CREATING DISTRICT AGGREGATES TABLE")
    print("=" * 60)

    # Step 1: Fetch ALL hotspot data in batches
    print("\nStep 1: Fetching all hotspot data...")
    all_data = []
    batch_size = 2000
    offset = 0

    while True:
        result = supabase.table('hotspots').select(
            'district_name, state_name, avg_temperature, avg_ndvi, avg_ndbi, population'
        ).range(offset, offset + batch_size - 1).execute()

        if not result.data or len(result.data) == 0:
            break

        all_data.extend(result.data)
        print(f"  Fetched {len(all_data):,} rows...")

        if len(result.data) < batch_size:
            break

        offset += batch_size

    print(f"\nTotal rows fetched: {len(all_data):,}")

    if not all_data:
        print("ERROR: No hotspots data found")
        return False

    # Step 2: Aggregate by district
    print("\nStep 2: Aggregating by district...")
    df = pd.DataFrame(all_data)

    district_aggs = df.groupby('district_name').agg({
        'avg_temperature': ['mean', 'min', 'max', 'std', 'count'],
        'avg_ndvi': ['mean', 'min', 'max'],
        'avg_ndbi': 'mean',
        'population': 'sum',
        'state_name': 'first'
    }).reset_index()

    # Flatten column names
    district_aggs.columns = [
        'district_name',
        'avg_temperature', 'min_temperature', 'max_temperature', 'temp_std', 'data_points',
        'avg_ndvi', 'min_ndvi', 'max_ndvi',
        'avg_ndbi',
        'total_population',
        'state_name'
    ]

    # Add temperature range
    district_aggs['temp_range'] = district_aggs['max_temperature'] - district_aggs['min_temperature']

    # Round values
    district_aggs['avg_temperature'] = district_aggs['avg_temperature'].round(2)
    district_aggs['min_temperature'] = district_aggs['min_temperature'].round(2)
    district_aggs['max_temperature'] = district_aggs['max_temperature'].round(2)
    district_aggs['temp_std'] = district_aggs['temp_std'].round(2)
    district_aggs['temp_range'] = district_aggs['temp_range'].round(2)
    district_aggs['avg_ndvi'] = district_aggs['avg_ndvi'].round(3)
    district_aggs['min_ndvi'] = district_aggs['min_ndvi'].round(3)
    district_aggs['max_ndvi'] = district_aggs['max_ndvi'].round(3)
    district_aggs['avg_ndbi'] = district_aggs['avg_ndbi'].round(3)
    district_aggs['total_population'] = district_aggs['total_population'].round(0)

    print(f"Created aggregates for {len(district_aggs)} districts")

    # Step 3: Clear old aggregates table if exists and insert new data
    print("\nStep 3: Uploading to Supabase...")

    try:
        # Try to delete old data
        supabase.table('district_aggregates').delete().neq('id', -1).execute()
        print("  Cleared old aggregates")
    except Exception as e:
        print(f"  Note: {e} (table may not exist yet)")

    # Upload new aggregates in batches
    BATCH_SIZE = 50
    total = len(district_aggs)
    uploaded = 0

    for i in range(0, total, BATCH_SIZE):
        batch = district_aggs.iloc[i:i+BATCH_SIZE]
        batch_data = batch.to_dict('records')

        try:
            supabase.table('district_aggregates').insert(batch_data).execute()
            uploaded += len(batch_data)
            print(f"  Uploaded {uploaded}/{total} districts")
        except Exception as e:
            print(f"  ERROR uploading batch {i//BATCH_SIZE + 1}: {e}")
            return False

    print(f"\n✓ Successfully uploaded {uploaded} district aggregates!")

    # Step 4: Verify
    print("\nStep 4: Verification...")
    result = supabase.table('district_aggregates').select('*').limit(5).execute()

    if result.data:
        print(f"✓ Table contains {len(result.data)} sample rows")
        print("\nSample data:")
        sample_df = pd.DataFrame(result.data)
        print(sample_df[['district_name', 'state_name', 'avg_temperature', 'total_population', 'data_points']].to_string(index=False))
    else:
        print("WARNING: Could not verify table")

    print("\n" + "=" * 60)
    print("SUCCESS! District aggregates table created")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Update geojson.py to use district_aggregates table")
    print("2. GeoJSON enrichment will be instant (131 rows instead of 42K)")
    print("=" * 60)

    return True

if __name__ == "__main__":
    success = create_aggregates_table()
    sys.exit(0 if success else 1)
