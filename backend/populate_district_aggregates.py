"""
Populate District Aggregates Table
===================================
Standalone script to populate district_aggregates table.
Run this AFTER creating the table via SQL in Supabase dashboard.
"""

import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

def main():
    print("=" * 60)
    print("POPULATING DISTRICT AGGREGATES TABLE")
    print("=" * 60)

    # Connect to Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Step 1: Fetch ALL hotspot data in batches
    print("\nStep 1: Fetching all hotspot data...")
    all_data = []
    batch_size = 1000  # Supabase default max
    offset = 0

    while True:
        print(f"  Fetching batch at offset {offset:,}...")
        result = supabase.table('hotspots').select(
            'district_name, state_name, avg_temperature, avg_ndvi, avg_ndbi, population'
        ).limit(batch_size).offset(offset).execute()

        if not result.data or len(result.data) == 0:
            print(f"  No more data at offset {offset:,}")
            break

        all_data.extend(result.data)
        print(f"  Total fetched so far: {len(all_data):,} rows")

        # Continue if we got a full batch
        if len(result.data) < batch_size:
            print(f"  Last batch had only {len(result.data)} rows, stopping")
            break

        offset += batch_size

        # Safety limit to prevent infinite loop (increase to accommodate 42K rows)
        if offset > 50000:
            print(f"  Safety limit reached at {offset:,} rows")
            break

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
    for col in ['avg_temperature', 'min_temperature', 'max_temperature', 'temp_std', 'temp_range']:
        district_aggs[col] = district_aggs[col].round(2)

    for col in ['avg_ndvi', 'min_ndvi', 'max_ndvi', 'avg_ndbi']:
        district_aggs[col] = district_aggs[col].round(3)

    district_aggs['total_population'] = district_aggs['total_population'].round(0)

    print(f"Created aggregates for {len(district_aggs)} districts")

    # Step 3: Upload to Supabase
    print("\nStep 3: Uploading to Supabase...")

    try:
        # Try to delete old data
        supabase.table('district_aggregates').delete().gte('id', 0).execute()
        print("  Cleared old aggregates")
    except Exception as e:
        print(f"  Could not clear old data: {e}")

    # Upload new aggregates in batches
    BATCH_SIZE = 50
    total = len(district_aggs)
    uploaded = 0

    for i in range(0, total, BATCH_SIZE):
        batch = district_aggs.iloc[i:i+BATCH_SIZE]
        batch_data = batch.to_dict('records')

        try:
            supabase.table('district_aggregates').upsert(batch_data).execute()
            uploaded += len(batch_data)
            print(f"  Uploaded {uploaded}/{total} districts ({uploaded/total*100:.1f}%)")
        except Exception as e:
            print(f"  ERROR uploading batch: {e}")
            # Continue with next batch

    print(f"\nSuccessfully uploaded {uploaded} out of {total} district aggregates!")

    # Step 4: Verify
    print("\nStep 4: Verification...")
    result = supabase.table('district_aggregates').select('*').limit(10).execute()

    if result.data:
        print(f"Table contains data! Sample:")
        sample_df = pd.DataFrame(result.data)
        print(sample_df[['district_name', 'state_name', 'avg_temperature', 'total_population']].head().to_string(index=False))

        # Check for key districts
        print("\nChecking key districts:")
        for district in ['Kuala Lumpur', 'Petaling', 'Johor Bahru']:
            check = supabase.table('district_aggregates').select('*').eq('district_name', district).execute()
            if check.data:
                print(f"  {district}: {check.data[0]['avg_temperature']}C")
            else:
                print(f"  {district}: NOT FOUND")

    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print(f"District aggregates table populated with {uploaded} districts")
    print("GeoJSON enrichment will now be instant!")

    return True

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
