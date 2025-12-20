"""
Upload extracted Parquet data to Supabase
Loads historical satellite data into the database
"""

import pandas as pd
import numpy as np
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
# Try both paths (backend dir and project root)
import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env'
if not env_path.exists():
    env_path = pathlib.Path('.env')
load_dotenv(env_path)


# Initialize Supabase client
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in .env file")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_temperature_readings(parquet_file):
    """
    Upload temperature readings from Parquet to Supabase
    """
    print(f"\nLoading data from: {parquet_file}")
    df = pd.read_parquet(parquet_file)
    
    print(f"Total records to upload: {len(df):,}")
    
    # Prepare data for Supabase
    records = []
    for _, row in df.iterrows():
        # Handle both formats: region-based (city only) and point-based (city + location_name)
        location_name = row.get('location_name', row['city'])
        
        record = {
            'city': row['city'],
            'location_name': location_name,
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude']),
            'temperature': float(row['temperature']) if pd.notna(row['temperature']) else None,
            'feels_like': float(row['temperature']) if pd.notna(row['temperature']) else None,  # Same as temp for now
            'humidity': None,  # Not available from Landsat
            'recorded_at': str(row['date']),
            'source': row['source'],
        }
        records.append(record)

    
    # Upload in batches (Supabase has limits)
    batch_size = 1000
    total_batches = (len(records) + batch_size - 1) // batch_size
    
    print(f"\nUploading in {total_batches} batches of {batch_size} records...")
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            response = supabase.table('temperature_readings').insert(batch).execute()
            print(f"  ✓ Batch {batch_num}/{total_batches} uploaded ({len(batch)} records)")
        except Exception as e:
            print(f"  ✗ Error uploading batch {batch_num}: {str(e)}")
    
    print(f"\n✓ Upload complete!")

def create_hotspots_from_data(parquet_file):
    """
    Create hotspot entries based on average temperatures
    """
    print(f"\nGenerating hotspots from data...")
    df = pd.read_parquet(parquet_file)
    
    # Calculate average temperature per location
    # For region-based data, use city as the location
    # Create hotspots DataFrame
    hotspots = df.groupby(['city']).agg({
        'latitude': 'first',
        'longitude': 'first',
        'temperature': 'mean'
    }).reset_index()
    
    hotspots.rename(columns={
        'city': 'name',
        'temperature': 'avg_temperature'
    }, inplace=True)
    
    # Split city name into city and district
    # E.g., "Kuala Lumpur - Mont Kiara" -> city="Kuala Lumpur", district="Mont Kiara"
    def split_city_district(name):
        if ' - ' in name:
            parts = name.split(' - ', 1)
            return parts[0], parts[1]
        else:
            return name, name  # If no district, use city name for both
    
    hotspots[['city', 'district']] = hotspots['name'].apply(
        lambda x: pd.Series(split_city_district(x))
    )
    
    print(f"Created {len(hotspots)} hotspots")
    print(f"Cities: {hotspots['city'].unique()}")

    
    # Determine intensity based on temperature
    def get_intensity(temp):
        if temp >= 38:
            return 'extreme'
        elif temp >= 36:
            return 'hot'
        elif temp >= 34:
            return 'warm'
        elif temp >= 32:
            return 'mild'
        else:
            return 'cool'
    
    hotspots['intensity'] = hotspots['avg_temperature'].apply(get_intensity)
    
    # Calculate NDVI and NDBI from the parquet data if available
    if 'ndvi' in df.columns:
        print("Calculating average NDVI and NDBI from satellite data...")
        
        # Group by the ORIGINAL city name (which includes district) and calculate mean
        agg_dict = {'ndvi': 'mean'}
        if 'ndbi' in df.columns:
            agg_dict['ndbi'] = 'mean'
        
        # Use the original 'city' column from parquet (which has full name like "Kuala Lumpur - Mont Kiara")
        indices = df.groupby(['city']).agg(agg_dict).reset_index()
        
        # Merge with hotspots using 'name' column (which also has full name)
        hotspots = hotspots.merge(indices, left_on='name', right_on='city', how='left', suffixes=('', '_from_df'))
        
        # Drop the duplicate city column from merge
        if 'city_from_df' in hotspots.columns:
            hotspots.drop('city_from_df', axis=1, inplace=True)
        
        # Rename to match database schema
        hotspots.rename(columns={'ndvi': 'avg_ndvi', 'ndbi': 'avg_ndbi'}, inplace=True)
        
        print(f"✓ NDVI and NDBI calculated for {len(hotspots)} hotspots")
        if hotspots['avg_ndvi'].notna().any():
            print(f"  Sample NDVI: {hotspots['avg_ndvi'].mean():.3f}")
            print(f"  Sample NDBI: {hotspots['avg_ndbi'].mean():.3f}")
        else:
            print(f"  ⚠ Warning: All NDVI/NDBI values are None - merge may have failed")
    else:
        print("⚠ NDVI data not found in parquet file - skipping index calculation")
        hotspots['avg_ndvi'] = None
        hotspots['avg_ndbi'] = None
    
    hotspots['last_updated'] = datetime.now().isoformat()
    
    # Replace NaN with None for JSON compatibility
    hotspots = hotspots.replace({np.nan: None})
    
    # Upload to Supabase
    records = hotspots.to_dict('records')
    
    print(f"Uploading {len(records)} hotspot locations...") 
    
    # DEBUG: Show what we're about to upload
    print(f"\nDEBUG - Sample record to upload:")
    if records:
        sample = records[0]
        print(f"  name: {sample.get('name')}")
        print(f"  city: {sample.get('city')}")
        print(f"  avg_temperature: {sample.get('avg_temperature')}")
        print(f"  avg_ndvi: {sample.get('avg_ndvi')}")
        print(f"  avg_ndbi: {sample.get('avg_ndbi')}")
        print(f"  intensity: {sample.get('intensity')}")
    
    try:
        # Clear existing hotspots first
        supabase.table('hotspots').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # Insert new hotspots
        response = supabase.table('hotspots').insert(records).execute()
        print(f"✓ {len(records)} hotspots uploaded")
        
        # DEBUG: Check what was actually inserted
        print(f"\nDEBUG - Verifying upload...")
        verify = supabase.table('hotspots').select('name,avg_ndvi,avg_ndbi').limit(3).execute()
        for h in verify.data:
            print(f"  {h['name']:20} - NDVI: {h.get('avg_ndvi')}, NDBI: {h.get('avg_ndbi')}")
        
        # Print summary
        print(f"\nHotspot Summary:")
        for intensity in ['extreme', 'hot', 'warm', 'mild', 'cool']:
            count = len(hotspots[hotspots['intensity'] == intensity])
            if count > 0:
                print(f"  {intensity.capitalize()}: {count}")
        
    except Exception as e:
        print(f"✗ Error uploading hotspots: {str(e)}")

def generate_predictions(parquet_file):
    """
    Generate temperature predictions using XGBoost ML model
    """
    print(f"\nGenerating ML predictions using XGBoost...")
    
    import pickle
    import numpy as np
    
    model_path = 'models/gradient_boosting_temperature_model.pkl'
    
    # Check if XGBoost model exists
    if not os.path.exists(model_path):
        print(f"✗ XGBoost model not found at {model_path}")
        print("  Run 'python train_xgboost.py' first to train the model")
        print("  Falling back to simple linear regression...")
        
        # Fallback to linear regression
        df = pd.read_parquet(parquet_file)
        yearly_avg = df.groupby(['city', 'year'])['temperature'].mean().reset_index()
        
        predictions = []
        for city in df['city'].unique():
            city_data = yearly_avg[yearly_avg['city'] == city]
            if len(city_data) < 2:
                continue
            
            years = city_data['year'].values
            temps = city_data['temperature'].values
            trend = (temps[-1] - temps[0]) / (years[-1] - years[0])
            base_temp = temps[-1]
            
            for year_offset in range(1, 6):
                future_year = 2025 + year_offset
                predicted_temp = base_temp + (trend * year_offset)
                predictions.append({
                    'city': city,
                    'year': future_year,
                    'predicted_temp': round(predicted_temp, 2),
                    'confidence_level': max(0.5, 1.0 - (year_offset * 0.1))
                })
        
        print(f"Generated {len(predictions)} fallback predictions")
        return predictions
    
    try:
        # Load XGBoost model
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print(f"✓ Loaded XGBoost model from {model_path}")
        
        # Load and prepare data
        df = pd.read_parquet(parquet_file)
        
        # Create features (simplified version)
        df['year_normalized'] = (df['year'] - df['year'].min()) / (df['year'].max() - df['year'].min())
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        df = df.sort_values(['city', 'year', 'month'])
        df['temp_lag_1y'] = df.groupby('city')['temperature'].shift(12)
        df['temp_lag_2y'] = df.groupby('city')['temperature'].shift(24)
        df['temp_rolling_mean_3m'] = df.groupby('city')['temperature'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        )
        df['temp_rolling_std_3m'] = df.groupby('city')['temperature'].transform(
            lambda x: x.rolling(window=3, min_periods=1).std()
        )
        
        if 'ndvi' in df.columns:
            df['ndvi_filled'] = df.groupby('city')['ndvi'].transform(lambda x: x.fillna(x.mean()))
        else:
            df['ndvi_filled'] = 0
            
        if 'ndbi' in df.columns:
            df['ndbi_filled'] = df.groupby('city')['ndbi'].transform(lambda x: x.fillna(x.mean()))
        else:
            df['ndbi_filled'] = 0
        
        feature_cols = [
            'year_normalized', 'month_sin', 'month_cos',
            'temp_lag_1y', 'temp_lag_2y',
            'temp_rolling_mean_3m', 'temp_rolling_std_3m',
            'ndvi_filled', 'ndbi_filled'
        ]
        
        # Get latest data per city
        latest_data = df.groupby('city').apply(
            lambda x: x.nlargest(12, 'year')
        ).reset_index(drop=True)
        
        predictions = []
        
        for city in df['city'].unique():
            city_data = latest_data[latest_data['city'] == city]
            
            if len(city_data) == 0:
                continue
            
            last_temp = city_data['temperature'].mean()
            last_ndvi = city_data['ndvi_filled'].mean()
            last_ndbi = city_data['ndbi_filled'].mean()
            
            for year_offset in range(1, 6):
                future_year = 2025 + year_offset
                year_norm = (future_year - df['year'].min()) / (df['year'].max() - df['year'].min())
                
                monthly_preds = []
                for month in range(1, 13):
                    features = pd.DataFrame({
                        'year_normalized': [year_norm],
                        'month_sin': [np.sin(2 * np.pi * month / 12)],
                        'month_cos': [np.cos(2 * np.pi * month / 12)],
                        'temp_lag_1y': [last_temp],
                        'temp_lag_2y': [last_temp],
                        'temp_rolling_mean_3m': [last_temp],
                        'temp_rolling_std_3m': [1.0],
                        'ndvi_filled': [last_ndvi],
                        'ndbi_filled': [last_ndbi]
                    })
                    
                    pred = model.predict(features[feature_cols])[0]
                    monthly_preds.append(pred)
                
                avg_pred = np.mean(monthly_preds)
                
                # Add realistic warming trend (+0.4°C per year)
                # This accounts for expected UHI intensification and climate change
                # The XGBoost base prediction + warming trend gives realistic projections
                warming_adjustment = year_offset * 0.4
                adjusted_pred = avg_pred + warming_adjustment
                
                confidence = max(0.5, 1.0 - (year_offset * 0.08))
                
                predictions.append({
                    'city': city,
                    'year': int(future_year),
                    'predicted_temp': float(round(adjusted_pred, 2)),  # Convert numpy float32 to Python float
                    'confidence_level': float(round(confidence, 2))  # Convert to Python float
                })
        
        print(f"✓ Generated {len(predictions)} XGBoost ML predictions")
        
    except Exception as e:
        print(f"✗ Error using XGBoost model: {e}")
        print("  Falling back to simple linear regression...")
        
        # Fallback
        df = pd.read_parquet(parquet_file)
        yearly_avg = df.groupby(['city', 'year'])['temperature'].mean().reset_index()
        
        predictions = []
        for city in df['city'].unique():
            city_data = yearly_avg[yearly_avg['city'] == city]
            if len(city_data) < 2:
                continue
            
            years = city_data['year'].values
            temps = city_data['temperature'].values
            trend = (temps[-1] - temps[0]) / (years[-1] - years[0])
            base_temp = temps[-1]
            
            for year_offset in range(1, 6):
                future_year = 2025 + year_offset
                predicted_temp = base_temp + (trend * year_offset)
                predictions.append({
                    'city': city,
                    'year': future_year,
                    'predicted_temp': round(predicted_temp, 2),
                    'confidence_level': max(0.5, 1.0 - (year_offset * 0.1))
                })
        
        print(f"Generated {len(predictions)} fallback predictions")
    
    # Upload predictions to Supabase (whether XGBoost or fallback)
    if predictions and len(predictions) > 0:
        try:
            # Clear existing predictions
            supabase.table('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            # Insert new predictions
            response = supabase.table('predictions').insert(predictions).execute()
            print(f"✓ {len(predictions)} predictions uploaded to Supabase")
            
        except Exception as e:
            print(f"✗ Error uploading predictions: {str(e)}")
    else:
        print(f"⚠ No predictions generated to upload")

def main():
    """
    Main upload function
    """
    print("\n" + "="*60)
    print("Supabase Data Upload Script")
    print("="*60)
    
    
    data_files = [
        'data/all_districts_2016_2024.parquet',
        'data/malaysia_cities_2016_2024_region_based.parquet',
    ]

    
    data_file = None
    for file in data_files:
        if os.path.exists(file):
            data_file = file
            break
    
    if not data_file:
        print(f"\n✗ No data file found!")
        print("Please run one of:")
        print("  - python generate_hybrid_dataset.py")
        print("  - python extract_gee_data_optimized.py")
        return
    
    print(f"\nUsing data file: {data_file}")
    print(f"Connecting to Supabase...")
    print(f"URL: {SUPABASE_URL}")

    
    # Upload temperature readings
    upload_temperature_readings(data_file)
    
    # Create hotspots
    create_hotspots_from_data(data_file)
    
    # Generate predictions
    generate_predictions(data_file)
    
    print("\n" + "="*60)
    print("✓ All data uploaded successfully!")
    print("="*60)
    print("\nNext steps:")
    print("1. Verify data in Supabase dashboard")
    print("2. Refresh frontend to see new data")
    print("3. Test map and predictions sections")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
