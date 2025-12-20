"""
Combine district data from KL, JB, and Penang into single file
"""
import pandas as pd
import os

print("\n" + "="*60)
print("Combining District Data")
print("="*60 + "\n")

files = [
    'data/kl_districts_2016_2024.parquet',
    'data/jb_districts_2016_2024.parquet',
    'data/penang_districts_2016_2024.parquet'
]

dfs = []
for file in files:
    if os.path.exists(file):
        df = pd.read_parquet(file)
        print(f"✓ Loaded {file}: {len(df)} records, {df['city'].nunique()} districts")
        dfs.append(df)
    else:
        print(f"✗ Missing: {file}")

if dfs:
    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.sort_values(['city', 'date'])
    
    output = 'data/all_districts_2016_2024.parquet'
    combined.to_parquet(output, index=False)
    
    csv_output = 'data/all_districts_2016_2024.csv'
    combined.to_csv(csv_output, index=False)
    
    print(f"\n{'='*60}")
    print("COMBINED DATA")
    print("="*60)
    print(f"Total records: {len(combined)}")
    print(f"Total districts: {combined['city'].nunique()}")
    print(f"\nRecords per city:")
    print(combined['city'].value_counts())
    print(f"\n✓ Saved to: {output}")
    print(f"✓ Saved to: {csv_output}")
    print("="*60 + "\n")
