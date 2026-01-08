import pandas as pd

df = pd.read_csv('backend/data/UHI_Training_Data_Malaysia_Combined.csv')
cols = ['LST', 'NDVI', 'NDBI', 'Elevation', 'Population']

print("\n" + "="*70)
print("        UHI TRAINING DATASET - STATISTICS SUMMARY")
print("="*70)
print(f"Total Rows: {len(df):,}\n")

# Basic stats
print(df[cols].describe().to_string())

# Correlation with LST
print("\n" + "="*70)
print("CORRELATION WITH LST (Target):")
print("="*70)
corr = df[cols].corr()['LST']
for col, val in corr.items():
    if col != 'LST':
        print(f"  {col:12s} : {val:+.4f}")

print("\n" + "="*70)
