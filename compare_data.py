import pandas as pd

# Read raw CSV
df = pd.read_csv('backend/data/Malaysia_All_Cities_LST_2016_2024.csv')

print('='*70)
print('RAW CSV DATA ANALYSIS')
print('='*70)

# Sample districts
districts = ['Petaling', 'Johor Bahru', 'Melaka Tengah', 'Kota Bharu']

print('\nRAW CSV STATISTICS (per district):')
print('-'*70)

for d in districts:
    match = df[df['District'].str.contains(d, case=False, na=False)]
    if len(match) > 0:
        print(f'\n{d}:')
        print(f'  Count: {len(match)}')
        print(f'  LST Mean: {match["LST"].mean():.2f} C')
        print(f'  NDVI Mean: {match["NDVI"].mean():.3f}')
        print(f'  NDBI Mean: {match["NDBI"].mean():.3f}')

print('\n' + '='*70)
print('SAMPLE RAW DATA (first 5 rows of Petaling):')
print('='*70)
petaling = df[df['District'].str.contains('Petaling', case=False, na=False)].head(5)
print(petaling[['District', 'LST', 'NDVI', 'NDBI', 'Elevation', 'Population']].to_string(index=False))

print('\n' + '='*70)
print('NDBI RANGE CHECK:')
print('='*70)
print(f'Min NDBI in CSV: {df["NDBI"].min():.3f}')
print(f'Max NDBI in CSV: {df["NDBI"].max():.3f}')
print(f'Samples with NDBI > 0: {(df["NDBI"] > 0).sum()} out of {len(df)}')
