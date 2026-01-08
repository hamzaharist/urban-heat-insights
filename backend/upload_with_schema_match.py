"""
Upload Malaysia UHI Data with Proper Schema Mapping
====================================================
Maps CSV columns to match Supabase hotspots table schema exactly.
"""

import sys
sys.path.insert(0, '.')
from prediction_api import get_supabase
import pandas as pd
from datetime import datetime

def classify_intensity(temp):
    """Classify temperature intensity"""
    if temp >= 40:
        return "Very High"
    elif temp >= 35:
        return "High"
    elif temp >= 30:
        return "Medium"
    else:
        return "Low"

def prepare_data_for_upload():
    """Load and transform data to match Supabase schema"""
    print("Loading data...")
    df = pd.read_csv('data/Malaysia_All_Cities_LST_2016_2024.csv')
    print(f"Loaded {len(df):,} rows")

    print("Transforming to match Supabase schema...")

    # Create records matching Supabase schema
    records = []
    for _, row in df.iterrows():
        record = {
            # Primary identifiers
            'city': row['city'] if pd.notna(row['city']) else row['District'],
            'name': row['District'],
            'district': row['District'],
            'district_name': row['District'],
            'state': row['State'],
            'state_name': row['State'],

            # Geographic
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude']),
            'elevation': float(row['Elevation']),

            # Temperature & indices
            'avg_temperature': round(float(row['LST']), 2),
            'intensity': classify_intensity(row['LST']),
            'avg_ndvi': round(float(row['NDVI']), 3),
            'avg_ndbi': round(float(row['NDBI']), 3),

            # Population
            'population': round(float(row['Population']), 2),

            # Metadata
            'last_updated': datetime.now().isoformat(),

            # Optional fields (empty for now)
            'state_id': None,
            'state_code': None,
            'district_code': None
        }
        records.append(record)

    return records

def upload_data(records):
    """Upload data in batches"""
    supabase = get_supabase()

    BATCH_SIZE = 500
    total = len(records)
    uploaded = 0
    failed = 0

    print(f"\nUploading {total:,} records in batches of {BATCH_SIZE}...")

    for i in range(0, total, BATCH_SIZE):
        batch = records[i:i+BATCH_SIZE]

        try:
            supabase.table('hotspots').insert(batch).execute()
            uploaded += len(batch)
            progress = (uploaded / total) * 100
            print(f"  Batch {i//BATCH_SIZE + 1}: {uploaded:,}/{total:,} ({progress:.1f}%)")
        except Exception as e:
            failed += len(batch)
            print(f"  ERROR at batch {i//BATCH_SIZE + 1}: {str(e)[:150]}")
            # Continue with next batch

    return uploaded, failed

def verify_upload():
    """Verify the data was uploaded correctly"""
    supabase = get_supabase()

    print("\n" + "="*60)
    print("VERIFICATION")
    print("="*60)

    # Get count
    response = supabase.table('hotspots').select('*', count='exact').limit(1).execute()
    total_rows = response.count if hasattr(response, 'count') else 0
    print(f"Total rows in database: {total_rows:,}")

    # Get sample data
    sample = supabase.table('hotspots').select('*').limit(100).execute()
    if sample.data:
        df = pd.DataFrame(sample.data)
        print(f"Unique states: {df['state_name'].nunique()}")
        print(f"Unique districts: {df['district_name'].nunique()}")

        # Test key cities
        print("\nTesting key cities:")
        test_cities = ['Kuala Lumpur', 'Petaling', 'Johor Bahru', 'Kota Kinabalu']
        for city in test_cities:
            result = supabase.table('hotspots').select('*').eq('district_name', city).limit(1).execute()
            if result.data:
                data = result.data[0]
                print(f"  {city}: {data['avg_temperature']}°C, {data['intensity']}, pop {data['population']}")
            else:
                print(f"  {city}: NOT FOUND")

    return total_rows

def main():
    print("="*60)
    print("MALAYSIA UHI DATA UPLOAD")
    print("="*60)

    # Step 1: Prepare data
    try:
        records = prepare_data_for_upload()
        print(f"\nPrepared {len(records):,} records")
    except Exception as e:
        print(f"ERROR preparing data: {e}")
        return

    # Step 2: Upload
    try:
        uploaded, failed = upload_data(records)
        print(f"\nUpload Summary:")
        print(f"  Uploaded: {uploaded:,}")
        print(f"  Failed: {failed:,}")

        if uploaded > 0:
            # Step 3: Verify
            total = verify_upload()

            if total > 40000:
                print("\n" + "="*60)
                print("SUCCESS!")
                print("="*60)
                print("Your AI Consultant now has complete Malaysia coverage!")
            else:
                print(f"\nWARNING: Expected ~42K rows, got {total:,}")
        else:
            print("\nERROR: No data was uploaded!")

    except Exception as e:
        print(f"ERROR during upload: {e}")

if __name__ == "__main__":
    main()
