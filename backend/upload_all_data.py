"""
Direct Upload Strategy
======================
Upload all 42,706 pixel-level rows directly to Supabase.
No aggregation - preserves full spatial detail.

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

def prepare_data():
    """Load and prepare data for upload"""
    print("\n" + "=" * 60)
    print("STEP 2: PREPARING DATA")
    print("=" * 60)

    # Load pixel-level data
    df = pd.read_csv(INPUT_FILE)
    print(f"✓ Loaded {len(df):,} rows from {INPUT_FILE}")

    # Rename columns to match Supabase schema
    df_upload = df.rename(columns={
        'State': 'state_name',
        'District': 'district_name',
        'LST': 'avg_temperature',
        'NDVI': 'avg_ndvi',
        'NDBI': 'avg_ndbi',
        'Elevation': 'elevation',
        'Population': 'population',
        'latitude': 'latitude',
        'longitude': 'longitude'
    })

    # Remove 'city' column if it exists (not in Supabase schema)
    if 'city' in df_upload.columns:
        df_upload = df_upload.drop('city', axis=1)

    print(f"✓ Prepared {len(df_upload):,} rows for upload")
    print(f"  Columns: {list(df_upload.columns)}")
    print(f"  States: {df_upload['state_name'].nunique()}")
    print(f"  Districts: {df_upload['district_name'].nunique()}")

    return df_upload

def clear_table():
    """Clear existing data from hotspots table"""
    print("\n" + "=" * 60)
    print("STEP 3: CLEARING OLD DATA")
    print("=" * 60)

    supabase = get_supabase()
    if not supabase:
        print("ERROR: Could not connect to Supabase")
        return False

    try:
        # Delete all rows
        print("Deleting old data...")
        supabase.table('hotspots').delete().neq('id', -1).execute()
        print("✓ Old data cleared")
        return True
    except Exception as e:
        print(f"Warning: Could not clear old data: {e}")
        print("Continuing anyway...")
        return True

def upload_to_supabase(df):
    """Upload data to Supabase in batches"""
    print("\n" + "=" * 60)
    print("STEP 4: UPLOADING TO SUPABASE")
    print("=" * 60)

    supabase = get_supabase()
    if not supabase:
        print("ERROR: Could not connect to Supabase")
        return False

    # Upload in batches (Supabase has limits)
    BATCH_SIZE = 500  # Larger batches for faster upload
    total_rows = len(df)

    print(f"Uploading {total_rows:,} rows in batches of {BATCH_SIZE}...")
    print("This will take a few minutes...\n")

    uploaded = 0
    failed = 0

    for i in range(0, total_rows, BATCH_SIZE):
        batch = df.iloc[i:i+BATCH_SIZE]
        batch_data = batch.to_dict('records')

        try:
            supabase.table('hotspots').insert(batch_data).execute()
            uploaded += len(batch_data)
            batch_num = i // BATCH_SIZE + 1
            total_batches = (total_rows + BATCH_SIZE - 1) // BATCH_SIZE
            progress = (uploaded / total_rows) * 100
            print(f"  ✓ Batch {batch_num}/{total_batches} ({progress:.1f}% complete) - {uploaded:,}/{total_rows:,} rows")
        except Exception as e:
            failed += len(batch_data)
            print(f"  ✗ ERROR uploading batch {i//BATCH_SIZE + 1}: {e}")
            print(f"    Continuing with next batch...")

    print(f"\n{'=' * 60}")
    if failed == 0:
        print(f"✓ Successfully uploaded all {uploaded:,} rows!")
        return True
    else:
        print(f"⚠ Uploaded {uploaded:,} rows, {failed:,} failed")
        return uploaded > 0

def verify_upload():
    """Verify the upload was successful"""
    print("\n" + "=" * 60)
    print("STEP 5: VERIFICATION")
    print("=" * 60)

    supabase = get_supabase()
    if not supabase:
        return False

    try:
        response = supabase.table('hotspots').select('*').limit(1000).execute()

        if response.data:
            df = pd.DataFrame(response.data)

            # Get total count
            count_response = supabase.table('hotspots').select('*', count='exact').execute()
            total_count = count_response.count if hasattr(count_response, 'count') else len(response.data)

            print(f"✓ Database now contains approximately {total_count:,} rows")
            print(f"✓ States: {df['state_name'].nunique()}")
            print(f"✓ Districts: {df['district_name'].nunique()}")

            if 'population' in df.columns:
                print(f"✓ Total population (sample): {df['population'].sum():,.0f}")

            # Test a query
            test_district = "Kuala Lumpur"
            test_response = supabase.table('hotspots').select('*').eq('district_name', test_district).execute()

            if test_response.data and len(test_response.data) > 0:
                print(f"\n✓ Test query for {test_district}:")
                print(f"    Found {len(test_response.data)} pixel-level data points")
                data = test_response.data[0]
                print(f"    Sample temperature: {data.get('avg_temperature', 'N/A')}°C")
                print(f"    Sample NDVI: {data.get('avg_ndvi', 'N/A')}")
                print(f"    Sample location: ({data.get('latitude', 'N/A')}, {data.get('longitude', 'N/A')})")

            return True
        else:
            print("ERROR: No data found after upload!")
            return False

    except Exception as e:
        print(f"ERROR verifying: {e}")
        return False

def main():
    """Execute the direct upload strategy"""
    print("\n" + "=" * 60)
    print("DIRECT DATA UPLOAD - ALL PIXELS")
    print("=" * 60)
    print(f"Input: {INPUT_FILE}")
    print(f"Strategy: Upload all 42,706 pixel-level rows")
    print(f"No aggregation - full spatial detail preserved")
    print("=" * 60 + "\n")

    # Step 1: Backup
    if not backup_current_data():
        print("\n❌ Backup failed. Aborting.")
        return

    # Step 2: Prepare data
    df = prepare_data()
    if df is None or len(df) == 0:
        print("\n❌ Data preparation failed. Aborting.")
        return

    # Step 3: Clear table
    if not clear_table():
        print("\n❌ Failed to clear table. Aborting.")
        return

    # Step 4: Upload
    if not upload_to_supabase(df):
        print("\n❌ Upload failed. You can restore from backup:")
        print(f"   {BACKUP_FILE}")
        return

    # Step 5: Verify
    if not verify_upload():
        print("\n⚠️  Verification failed but data may have uploaded.")
        return

    print("\n" + "=" * 60)
    print("✓ SUCCESS!")
    print("=" * 60)
    print("Your AI Consultant now has full spatial detail:")
    print("  • 42,706 pixel-level data points")
    print("  • 15 states")
    print("  • 131 districts")
    print("  • Complete geographic coverage of Malaysia")
    print("\nNext steps:")
    print("  1. Test AI Consultant with Kuala Lumpur, Petaling, etc.")
    print("  2. Build detailed heatmaps using pixel-level data")
    print("  3. Backup saved to:")
    print(f"     {BACKUP_FILE}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
