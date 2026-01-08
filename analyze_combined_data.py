import pandas as pd

# Load the combined dataset
df = pd.read_csv('backend/data/UHI_Training_Data_Malaysia_Combined.csv')

# Select only numeric columns excluding Year
numeric_cols = ['LST', 'NDVI', 'NDBI', 'Elevation', 'Population']

print("=" * 80)
print("COMPREHENSIVE DATA STATISTICS - UHI COMBINED TRAINING DATASET")
print("=" * 80)
print(f"\nTotal Rows: {len(df):,}")
print(f"Total Columns: {len(df.columns)}")
print(f"\nAnalyzing columns: {', '.join(numeric_cols)}")
print("\n" + "=" * 80)

# Basic statistics
stats = df[numeric_cols].describe()
print("\nBASIC STATISTICS:")
print("=" * 80)
print(stats.to_string())

# Additional detailed metrics
print("\n\n" + "=" * 80)
print("DETAILED METRICS BY COLUMN:")
print("=" * 80)

for col in numeric_cols:
    print(f"\n📊 {col}")
    print("-" * 40)
    print(f"  Count:          {df[col].count():,}")
    print(f"  Mean:           {df[col].mean():.4f}")
    print(f"  Median:         {df[col].median():.4f}")
    print(f"  Std Dev:        {df[col].std():.4f}")
    print(f"  Variance:       {df[col].var():.4f}")
    print(f"  Min:            {df[col].min():.4f}")
    print(f"  Max:            {df[col].max():.4f}")
    print(f"  Range:          {df[col].max() - df[col].min():.4f}")
    print(f"  25th Percentile: {df[col].quantile(0.25):.4f}")
    print(f"  75th Percentile: {df[col].quantile(0.75):.4f}")
    print(f"  IQR:            {df[col].quantile(0.75) - df[col].quantile(0.25):.4f}")
    print(f"  Missing Values: {df[col].isna().sum()}")
    print(f"  Skewness:       {df[col].skew():.4f}")
    print(f"  Kurtosis:       {df[col].kurtosis():.4f}")

# Correlation matrix
print("\n\n" + "=" * 80)
print("CORRELATION MATRIX:")
print("=" * 80)
corr = df[numeric_cols].corr()
print(corr.to_string())

print("\n\n" + "=" * 80)
print("KEY CORRELATIONS WITH LST:")
print("=" * 80)
lst_corr = corr['LST'].sort_values(ascending=False)
for col, value in lst_corr.items():
    if col != 'LST':
        print(f"  LST vs {col:12s}: {value:+.4f}")

print("\n" + "=" * 80)
