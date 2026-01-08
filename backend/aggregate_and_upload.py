"""
Hybrid Data Upload Strategy
============================
Creates district-level aggregates for Supabase while preserving detailed spatial data in files.

Strategy:
1. Aggregate 42,706 pixel-level rows into 131 district summaries
2. Calculate min/max/mean/std for each district
3. Upload aggregated data to Supabase (fast queries)
4. Keep original CSV for future detailed mapping features

Author: AI Urban Cooling Consultant
Date: 2026-01-01
"""

import os
import pandas as pd
from datetime import datetime
from prediction_api import get_supabase

# Configuration
INPUT_FILE = "data/Malaysia_All_Cities_LST_2016_2024.csv"
BACKUP_FILE = f"data/backup_hotspots_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
OUTPUT_AGGREGATE = "data/district_aggregates.csv"

def backup_current_data():
    """Backup existing hotspots table data"""
    print("=" * 60)
    print("STEP 1: BACKING UP CURRENT DATA")
    print("=" * 60)

    supabase = get_supabase()
    if not supabase:
        print("ERROR: Could not connect to Supabase")
        return False

    try:
        response = supabase.table('hotspots').select('*').execute()
        if response.data:
            backup_df = pd.DataFrame(response.data)
            backup_df.to_csv(BACKUP_FILE, index=False)
            print(f"✓ Backed up {len(backup_df)} rows to {BACKUP_FILE}")
            return True
        else:
            print("✓ No existing data to backup")
            return True
    except Exception as e:
        print(f"ERROR backing up: {e}")
        return False

def create_district_aggregates():
    """
    Aggregate pixel-level data to district summaries

    Output columns:
    - state_name: State name
    - district_name: District name
    - avg_temperature: Mean LST across all pixels
    - min_temperature: Minimum LST in district
    - max_temperature: Maximum LST in district
    - temp_std: Temperature standard deviation (shows variation)
    - avg_ndvi: Mean vegetation index
    - min_ndvi: Minimum NDVI
    - max_ndvi: Maximum NDVI
    - avg_ndbi: Mean built-up index
    - elevation: Mean elevation
    - population: TOTAL population (sum of pixels)
    - latitude: Center latitude
    - longitude: Center longitude
    - data_points: Number of pixel samples
    - temp_range: Max - Min temperature
    """
    print("\n" + "=" * 60)
    print("STEP 2: CREATING DISTRICT AGGREGATES")
    print("=" * 60)

    # Load pixel-level data
    df = pd.read_csv(INPUT_FILE)
    print(f"✓ Loaded {len(df):,} pixel-level data points")

    # Aggregate by district
    aggregates = df.groupby(['State', 'District']).agg({
        'LST': ['mean', 'min', 'max', 'std', 'count'],
        'NDVI': ['mean', 'min', 'max'],
        'NDBI': 'mean',
        'Elevation': 'mean',
        'Population': 'sum',  # SUM population (not mean!)
        'latitude': 'mean',
        'longitude': 'mean'
    }).reset_index()

    # Flatten column names
    aggregates.columns = [
        'state_name', 'district_name',
        'avg_temperature', 'min_temperature', 'max_temperature', 'temp_std', 'data_points',
        'avg_ndvi', 'min_ndvi', 'max_ndvi',
        'avg_ndbi',
        'elevation',
        'population',
        'latitude',
        'longitude'
    ]

    # Add temperature range
    aggregates['temp_range'] = aggregates['max_temperature'] - aggregates['min_temperature']

    # Round to reasonable precision
    aggregates['avg_temperature'] = aggregates['avg_temperature'].round(2)
    aggregates['min_temperature'] = aggregates['min_temperature'].round(2)
    aggregates['max_temperature'] = aggregates['max_temperature'].round(2)
    aggregates['temp_std'] = aggregates['temp_std'].round(2)
    aggregates['temp_range'] = aggregates['temp_range'].round(2)
    aggregates['avg_ndvi'] = aggregates['avg_ndvi'].round(3)
    aggregates['min_ndvi'] = aggregates['min_ndvi'].round(3)
    aggregates['max_ndvi'] = aggregates['max_ndvi'].round(3)
    aggregates['avg_ndbi'] = aggregates['avg_ndbi'].round(3)
    aggregates['elevation'] = aggregates['elevation'].round(0)
    aggregates['population'] = aggregates['population'].round(0)
    aggregates['latitude'] = aggregates['latitude'].round(6)
    aggregates['longitude'] = aggregates['longitude'].round(6)

    # Save aggregates to CSV for review
    aggregates.to_csv(OUTPUT_AGGREGATE, index=False)
    print(f"✓ Created {len(aggregates)} district aggregates")
    print(f"✓ Saved to {OUTPUT_AGGREGATE}")

    # Show sample
    print("\nSample of aggregated data:")
    print(aggregates[['district_name', 'avg_temperature', 'temp_range', 'population', 'data_points']].head(10).to_string(index=False))

    return aggregates

def upload_to_supabase(aggregates_df):
    """Upload aggregated district data to Supabase"""
    print("\n" + "=" * 60)
    print("STEP 3: UPLOADING TO SUPABASE")
    print("=" * 60)

    supabase = get_supabase()
    if not supabase:
        print("ERROR: Could not connect to Supabase")
        return False

    # Clear existing data
    print("Clearing old data from hotspots table...")
    try:
        # Delete all rows
        supabase.table('hotspots').delete().neq('id', -1).execute()
        print("✓ Old data cleared")
    except Exception as e:
        print(f"Warning: Could not clear old data: {e}")

    # Upload in batches (Supabase has limits)
    BATCH_SIZE = 100
    total_rows = len(aggregates_df)

    print(f"Uploading {total_rows} districts in batches of {BATCH_SIZE}...")

    for i in range(0, total_rows, BATCH_SIZE):
        batch = aggregates_df.iloc[i:i+BATCH_SIZE]
        batch_data = batch.to_dict('records')

        try:
            supabase.table('hotspots').insert(batch_data).execute()
            print(f"  ✓ Uploaded batch {i//BATCH_SIZE + 1}/{(total_rows + BATCH_SIZE - 1)//BATCH_SIZE}")
        except Exception as e:
            print(f"  ERROR uploading batch {i//BATCH_SIZE + 1}: {e}")
            return False

    print(f"✓ Successfully uploaded all {total_rows} districts!")
    return True

def verify_upload():
    """Verify the upload was successful"""
    print("\n" + "=" * 60)
    print("STEP 4: VERIFICATION")
    print("=" * 60)

    supabase = get_supabase()
    if not supabase:
        return False

    try:
        response = supabase.table('hotspots').select('*').execute()

        if response.data:
            df = pd.DataFrame(response.data)
            print(f"✓ Database now contains {len(df)} rows")
            print(f"✓ States: {df['state_name'].nunique()}")
            print(f"✓ Districts: {df['district_name'].nunique()}")
            print(f"✓ Total population: {df['population'].sum():,.0f}")

            # Test a query
            test_district = "Kuala Lumpur"
            test_response = supabase.table('hotspots').select('*').eq('district_name', test_district).execute()

            if test_response.data:
                data = test_response.data[0]
                print(f"\n✓ Test query for {test_district}:")
                print(f"    Avg temp: {data['avg_temperature']:.2f}°C")
                print(f"    Range: {data['min_temperature']:.2f}°C - {data['max_temperature']:.2f}°C")
                print(f"    Variation: {data['temp_range']:.2f}°C")
                print(f"    Population: {data['population']:,.0f}")
                print(f"    Data points: {data['data_points']}")

            return True
        else:
            print("ERROR: No data found after upload!")
            return False

    except Exception as e:
        print(f"ERROR verifying: {e}")
        return False

def main():
    """Execute the hybrid upload strategy"""
    print("\n" + "=" * 60)
    print("HYBRID DATA UPLOAD STRATEGY")
    print("=" * 60)
    print(f"Input: {INPUT_FILE}")
    print(f"Strategy: Aggregate 42,706 pixels → 131 districts")
    print(f"Database: Fast aggregates")
    print(f"Filesystem: Detailed pixels (for future features)")
    print("=" * 60 + "\n")

    # Step 1: Backup
    if not backup_current_data():
        print("\n❌ Backup failed. Aborting.")
        return

    # Step 2: Create aggregates
    aggregates = create_district_aggregates()
    if aggregates is None:
        print("\n❌ Aggregation failed. Aborting.")
        return

    # Step 3: Upload
    if not upload_to_supabase(aggregates):
        print("\n❌ Upload failed. You can restore from backup:")
        print(f"   {BACKUP_FILE}")
        return

    # Step 4: Verify
    if not verify_upload():
        print("\n⚠️  Verification failed but data may have uploaded.")
        return

    print("\n" + "=" * 60)
    print("✓ SUCCESS!")
    print("=" * 60)
    print("Your AI Consultant now has nationwide coverage:")
    print("  • 15 states")
    print("  • 131 districts")
    print("  • Fast queries using aggregated data")
    print("  • Detailed pixel data preserved in CSV for future use")
    print("\nNext steps:")
    print("  1. Test AI Consultant with new districts (Kuala Lumpur, Penang, etc.)")
    print("  2. Original pixel data still available in:")
    print(f"     {INPUT_FILE}")
    print("  3. Backup of old data saved to:")
    print(f"     {BACKUP_FILE}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
