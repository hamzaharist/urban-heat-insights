"""
Combine all city parquet files into one master dataset
Run this after extracting data from all cities
"""

import pandas as pd
import os
from pathlib import Path

def combine_city_data():
    """Combine all city parquet files into one master file"""
    
    print("\n" + "="*60)
    print("COMBINING CITY DATA")
    print("="*60 + "\n")
    
    data_dir = Path('data')
    
    # List of expected city files (2016-2024)
    city_files = [
        'ipoh_2016_2024.parquet',
        'shah_alam_2016_2024.parquet',
        'petaling_jaya_2016_2024.parquet',
        'kota_kinabalu_2016_2024.parquet',
        'kuching_2016_2024.parquet',
        'melaka_2016_2024.parquet',
        'seremban_2016_2024.parquet',
        # Add existing cities if you have them
        'kl_districts_2016_2024.parquet',
        'jb_districts_2016_2024.parquet',
        'penang_districts_2016_2024.parquet',
    ]
    
    all_dataframes = []
    found_files = []
    missing_files = []
    
    print("Searching for city files...\n")
    
    for filename in city_files:
        filepath = data_dir / filename
        if filepath.exists():
            print(f"✓ Found: {filename}")
            df = pd.read_parquet(filepath)
            all_dataframes.append(df)
            found_files.append(filename)
            print(f"  Records: {len(df):,}")
        else:
            print(f"✗ Missing: {filename}")
            missing_files.append(filename)
    
    if not all_dataframes:
        print("\n✗ No parquet files found!")
        print("Run extraction scripts first.")
        return
    
    print(f"\n{'─'*60}")
    print(f"Found: {len(found_files)} files")
    print(f"Missing: {len(missing_files)} files")
    print(f"{'─'*60}\n")
    
    # Combine all dataframes
    print("Combining data...")
    combined_df = pd.concat(all_dataframes, ignore_index=True)
    
    # Sort by city, district, date
    combined_df = combined_df.sort_values(['city', 'district', 'date'])
    
    # Save combined file
    output_file = data_dir / 'all_cities_combined_2016_2024.parquet'
    combined_df.to_parquet(output_file, index=False, compression='snappy')
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Total records: {len(combined_df):,}")
    print(f"Cities: {combined_df['city'].nunique()}")
    print(f"Districts: {combined_df['district'].nunique()}")
    print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
    print(f"Avg temp: {combined_df['temperature'].mean():.2f}°C")
    print(f"Avg NDVI: {combined_df['ndvi'].mean():.3f}")
    print(f"Avg NDBI: {combined_df['ndbi'].mean():.3f}")
    print(f"\n✓ Saved: {output_file}")
    print(f"  Size: {os.path.getsize(output_file) / 1024:.1f} KB")
    print("="*60 + "\n")
    
    # Show breakdown by city
    print("\nBreakdown by City:")
    print("─"*60)
    city_summary = combined_df.groupby('city').agg({
        'district': 'nunique',
        'temperature': ['count', 'mean'],
        'ndvi': 'mean',
        'ndbi': 'mean'
    }).round(2)
    print(city_summary)
    print("\n")
    
    return output_file

if __name__ == "__main__":
    combine_city_data()
