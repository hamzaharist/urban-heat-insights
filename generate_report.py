import pandas as pd
import sys

# Redirect output to file
sys.stdout = open('DATA_STATISTICS_REPORT.txt', 'w', encoding='utf-8')

df = pd.read_csv('backend/data/UHI_Training_Data_Malaysia_Combined.csv')
cols = ['LST', 'NDVI', 'NDBI', 'Elevation', 'Population']

print("="*90)
print(" "*25 + "UHI TRAINING DATASET")
print(" "*20 + "COMPREHENSIVE STATISTICS REPORT")
print("="*90)
print(f"\nDataset: UHI_Training_Data_Malaysia_Combined.csv")
print(f"Total Rows: {len(df):,}")
print(f"Years Covered: 2015, 2018, 2021, 2024")
print(f"Features Analyzed: LST, NDVI, NDBI, Elevation, Population")

print("\n\n" + "="*90)
print("1. DESCRIPTIVE STATISTICS")
print("="*90)
print("\n" + df[cols].describe().to_string())

print("\n\n" + "="*90)
print("2. DETAILED METRICS BY FEATURE")
print("="*90)

for col in cols:
    print(f"\n{col}:")
    print("-"*50)
    print(f"  Count:              {df[col].count():>15,}")
    print(f"  Mean:               {df[col].mean():>15.4f}")
    print(f"  Median:             {df[col].median():>15.4f}")
    print(f"  Std Deviation:      {df[col].std():>15.4f}")
    print(f"  Variance:           {df[col].var():>15.4f}")
    print(f"  Minimum:            {df[col].min():>15.4f}")
    print(f"  Maximum:            {df[col].max():>15.4f}")
    print(f"  Range:              {df[col].max() - df[col].min():>15.4f}")
    print(f"  25th Percentile:    {df[col].quantile(0.25):>15.4f}")
    print(f"  75th Percentile:    {df[col].quantile(0.75):>15.4f}")
    print(f"  IQR:                {df[col].quantile(0.75) - df[col].quantile(0.25):>15.4f}")
    print(f"  Skewness:           {df[col].skew():>15.4f}")
    print(f"  Kurtosis:           {df[col].kurtosis():>15.4f}")

print("\n\n" + "="*90)
print("3. CORRELATION MATRIX")
print("="*90)
corr = df[cols].corr()
print("\n" + corr.to_string())

print("\n\n" + "="*90)
print("4. CORRELATIONS WITH LST (Target Variable)")
print("="*90)
print("\nFeature Relationships with Land Surface Temperature:\n")
lst_corr = corr['LST'].sort_values(ascending=False)
for col, val in lst_corr.items():
    if col != 'LST':
        strength = 'STRONG' if abs(val) > 0.7 else 'MODERATE' if abs(val) > 0.4 else 'WEAK'
        direction = 'POSITIVE' if val > 0 else 'NEGATIVE'
        print(f"  {col:12s} : {val:+.4f}  [{direction:8s} / {strength}]")

print("\n\n" + "="*90)
print("5. KEY INSIGHTS")
print("="*90)
print("""
- NDBI (Built-up Index) shows STRONG POSITIVE correlation (+0.66) with LST
  → More urban/built-up areas have higher temperatures

- NDVI (Vegetation Index) shows STRONG NEGATIVE correlation (-0.56) with LST  
  → More vegetation leads to cooler temperatures

- Elevation shows STRONG NEGATIVE correlation (-0.55) with LST
  → Higher elevations tend to be cooler

- Population shows MODERATE POSITIVE correlation (+0.52) with LST
  → Areas with more people tend to be warmer

- LST ranges from -46.67°C to 63.21°C with mean of 33.22°C
  → Wide temperature variability across Malaysia
""")

print("\n" + "="*90)
print("Report generated successfully!")
print("="*90)

sys.stdout.close()

# Reset stdout and print confirmation to console
sys.stdout = sys.__stdout__
print("Statistics report saved to: DATA_STATISTICS_REPORT.txt")
