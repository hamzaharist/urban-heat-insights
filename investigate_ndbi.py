import pandas as pd
import numpy as np

df = pd.read_csv('backend/data/Malaysia_All_Cities_LST_2016_2024.csv')

print('='*60)
print('NDBI DATA INVESTIGATION')
print('='*60)

# Overall stats
print('\n1. OVERALL NDBI STATISTICS:')
print(f'   Total samples: {len(df)}')
print(f'   Mean NDBI: {df["NDBI"].mean():.3f}')
print(f'   Std NDBI: {df["NDBI"].std():.3f}')

# Distribution
print('\n2. NDBI DISTRIBUTION:')
positive_ndbi = (df['NDBI'] > 0).sum()
negative_ndbi = (df['NDBI'] <= 0).sum()
print(f'   Positive NDBI (Urban): {positive_ndbi} ({100*positive_ndbi/len(df):.1f}%)')
print(f'   Negative NDBI (Vegetation): {negative_ndbi} ({100*negative_ndbi/len(df):.1f}%)')

# Highly urban samples
print('\n3. SAMPLES WITH STRONG POSITIVE NDBI (>0.1):')
urban = df[df['NDBI'] > 0.1]
print(f'   Count: {len(urban)} ({100*len(urban)/len(df):.1f}%)')

# Check specific urban districts
print('\n4. EXPECTED URBAN AREAS (By District):')
urban_districts = ['Petaling', 'Johor Bahru', 'Pulau Pinang']
for d in urban_districts:
    match = df[df['District'].str.contains(d, case=False, na=False)]
    if len(match) > 0:
        print(f'   {d}: n={len(match)}, NDBI mean={match["NDBI"].mean():.3f}, max={match["NDBI"].max():.3f}')

# Check if there are any truly urban samples
print('\n5. TOP 10 DISTRICTS BY NDBI (Most Urban):')
top_urban = df.groupby('District')['NDBI'].mean().sort_values(ascending=False).head(10)
print(top_urban)

# Check correlation with temperature
print('\n6. NDBI vs TEMPERATURE CORRELATION:')
corr = df['NDBI'].corr(df['LST'])
print(f'   Correlation: {corr:.3f}')
print('   (Positive = higher NDBI means higher temp, as expected)')
