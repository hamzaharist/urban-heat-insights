import pandas as pd
import numpy as np

# Load the combined dataset
df = pd.read_csv('backend/data/UHI_Training_Data_Malaysia_Combined.csv')

# Columns to analyze (all numeric except Year)
cols_to_analyze = ['LST', 'NDVI', 'NDBI', 'Elevation', 'Population']

print("=" * 90)
print(" " * 20 + "UHI COMBINED TRAINING DATASET - STATISTICS")
print("=" * 90)
print(f"\nTotal Rows: {len(df):,}")
print(f"Years Covered: 2015, 2018, 2021, 2024")
print(f"\nColumns Analyzed: {', '.join(cols_to_analyze)}")
print("\n" + "=" * 90)

# Basic statistics table
print("\nBASIC STATISTICS:")
print("-" * 90)
stats = df[cols_to_analyze].describe()
print(stats.to_string())

# Detailed metrics for each column
print("\n\n" + "=" * 90)
print("DETAILED METRICS BY COLUMN:")
print("=" * 90)

for col in cols_to_analyze:
    print(f"\n[{col}]")
    print("-" * 50)
    print(f"  {'Count:':<20} {df[col].count():>15,}")
    print(f"  {'Mean:':<20} {df[col].mean():>15.4f}")
    print(f"  {'Median:':<20} {df[col].median():>15.4f}")
    print(f"  {'Std Deviation:':<20} {df[col].std():>15.4f}")
    print(f"  {'Minimum:':<20} {df[col].min():>15.4f}")
    print(f"  {'Maximum:':<20} {df[col].max():>15.4f}")
    print(f"  {'Range:':<20} {df[col].max() - df[col].min():>15.4f}")
    print(f"  {'25th Percentile:':<20} {df[col].quantile(0.25):>15.4f}")
    print(f"  {'50th Percentile:':<20} {df[col].quantile(0.50):>15.4f}")
    print(f"  {'75th Percentile:':<20} {df[col].quantile(0.75):>15.4f}")
    print(f"  {'IQR:':<20} {df[col].quantile(0.75) - df[col].quantile(0.25):>15.4f}")
    print(f"  {'Skewness:':<20} {df[col].skew():>15.4f}")
    print(f"  {'Kurtosis:':<20} {df[col].kurtosis():>15.4f}")

# Correlation matrix
print("\n\n" + "=" * 90)
print("CORRELATION MATRIX:")
print("=" * 90)
corr = df[cols_to_analyze].corr()
print("\n" + corr.to_string())

# Highlight correlations with LST
print("\n\n" + "=" * 90)
print("CORRELATIONS WITH LST (Target Variable):")
print("=" * 90)
lst_corr = corr['LST'].sort_values(ascending=False)
print()
for col, value in lst_corr.items():
    if col != 'LST':
        strength = ''
        if abs(value) > 0.7:
            strength = '(Strong)'
        elif abs(value) > 0.4:
            strength = '(Moderate)'
        else:
            strength = '(Weak)'
        
        direction = 'Positive' if value > 0 else 'Negative'
        print(f"  {col:<12} : {value:>+7.4f}  [{direction} {strength}]")

print("\n" + "=" * 90)
print("\nAnalysis complete!")
print("=" * 90)
