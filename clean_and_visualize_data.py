import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# 1. LOAD DATA
df = pd.read_csv("backend/data/UHI_Training_Data_Malaysia_Combined.csv")
print("="*70)
print("DATA CLEANING PROCESS")
print("="*70)
print(f"Original Count: {len(df):,} rows")

# 2. CLEANING RULES
# ---------------------------------------------------------
# Rule A: LST (Temperature) -> Remove Clouds/Glitch
# Range: 20°C to 60°C
# ---------------------------------------------------------
# Rule B: NDVI (Vegetation) -> Remove Water
# Range: 0.0 to 1.0 (Removes negative values which are usually water)
# ---------------------------------------------------------
# Rule C: NDBI (Built-Up) -> Sanity Check
# Range: -1.0 to 1.0
# ---------------------------------------------------------

print("\nApplying cleaning rules:")
print("  - LST:  20°C to 60°C (physically reasonable temps)")
print("  - NDVI: 0.0 to 1.0 (removes water bodies)")
print("  - NDBI: -1.0 to 1.0 (mathematical constraint)")

df_clean = df[
    (df['LST'] >= 20) & (df['LST'] <= 60) &       # Physically possible temps
    (df['NDVI'] >= 0) & (df['NDVI'] <= 1) &       # Remove Water (NDVI < 0)
    (df['NDBI'] >= -1) & (df['NDBI'] <= 1)        # Math constraint
].copy()

# 3. STATS AFTER CLEANING
print("\n" + "="*70)
print("CLEANING RESULTS")
print("="*70)
print(f"Cleaned Count: {len(df_clean):,} rows")
print(f"Dropped: {len(df) - len(df_clean):,} rows ({((len(df) - len(df_clean))/len(df)*100):.1f}%)")
print("\n" + "-"*70)
print("New Value Ranges:")
print("-"*70)
print(f"LST:        {df_clean['LST'].min():.2f}°C to {df_clean['LST'].max():.2f}°C")
print(f"NDVI:       {df_clean['NDVI'].min():.4f} to {df_clean['NDVI'].max():.4f}")
print(f"NDBI:       {df_clean['NDBI'].min():.4f} to {df_clean['NDBI'].max():.4f}")
print(f"Elevation:  {df_clean['Elevation'].min():.0f}m to {df_clean['Elevation'].max():.0f}m")
print(f"Population: {df_clean['Population'].min():.2f} to {df_clean['Population'].max():.2f}")

# Show correlation changes
print("\n" + "-"*70)
print("CORRELATION WITH LST (Before vs After Cleaning):")
print("-"*70)
features = ['NDVI', 'NDBI', 'Elevation', 'Population']
corr_before = df[features + ['LST']].corr()['LST']
corr_after = df_clean[features + ['LST']].corr()['LST']

for feature in features:
    print(f"{feature:12s}: {corr_before[feature]:+.4f} -> {corr_after[feature]:+.4f} (Delta: {corr_after[feature]-corr_before[feature]:+.4f})")

# 4. VISUALIZE RELATIONSHIPS (The Physics Check)
# We want to see:
# - NDVI vs LST should be Downward sloping (More Green = Cooler)
# - NDBI vs LST should be Upward sloping (More Concrete = Hotter)

print("\nGenerating visualizations...")

plt.figure(figsize=(14, 10))

# Plot 1: Greenery vs Heat
plt.subplot(2, 2, 1)
sns.scatterplot(x=df_clean['NDVI'], y=df_clean['LST'], s=10, alpha=0.1, color='green')
plt.title("Vegetation (NDVI) vs Temperature", fontsize=14, fontweight='bold')
plt.xlabel("NDVI (Greenery Index)")
plt.ylabel("LST (°C)")
# Add a trend line to prove the correlation
sns.regplot(x=df_clean['NDVI'], y=df_clean['LST'], scatter=False, color='black')
plt.grid(True, alpha=0.3)

# Plot 2: Concrete vs Heat
plt.subplot(2, 2, 2)
sns.scatterplot(x=df_clean['NDBI'], y=df_clean['LST'], s=10, alpha=0.1, color='red')
plt.title("Built-Up (NDBI) vs Temperature", fontsize=14, fontweight='bold')
plt.xlabel("NDBI (Built-Up Index)")
plt.ylabel("LST (°C)")
# Add a trend line
sns.regplot(x=df_clean['NDBI'], y=df_clean['LST'], scatter=False, color='black')
plt.grid(True, alpha=0.3)

# Plot 3: Elevation vs Heat
plt.subplot(2, 2, 3)
sns.scatterplot(x=df_clean['Elevation'], y=df_clean['LST'], s=10, alpha=0.1, color='blue')
plt.title("Elevation vs Temperature", fontsize=14, fontweight='bold')
plt.xlabel("Elevation (m)")
plt.ylabel("LST (°C)")
sns.regplot(x=df_clean['Elevation'], y=df_clean['LST'], scatter=False, color='black')
plt.grid(True, alpha=0.3)

# Plot 4: Population vs Heat
plt.subplot(2, 2, 4)
sns.scatterplot(x=df_clean['Population'], y=df_clean['LST'], s=10, alpha=0.1, color='orange')
plt.title("Population vs Temperature", fontsize=14, fontweight='bold')
plt.xlabel("Population Density")
plt.ylabel("LST (°C)")
sns.regplot(x=df_clean['Population'], y=df_clean['LST'], scatter=False, color='black')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('data_relationships.png', dpi=300, bbox_inches='tight')
print("Saved visualization: data_relationships.png")

# Create correlation heatmap
plt.figure(figsize=(10, 8))
corr_matrix = df_clean[['LST', 'NDVI', 'NDBI', 'Elevation', 'Population']].corr()
sns.heatmap(corr_matrix, annot=True, fmt='.3f', cmap='coolwarm', center=0,
            square=True, linewidths=1, cbar_kws={"shrink": 0.8})
plt.title("Feature Correlation Matrix (Cleaned Data)", fontsize=14, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=300, bbox_inches='tight')
print("Saved correlation heatmap: correlation_heatmap.png")

plt.show()

# 5. SAVE
output_file = "backend/data/UHI_Dataset_Cleaned_Final.csv"
df_clean.to_csv(output_file, index=False)
print("\n" + "="*70)
print(f"Saved '{output_file}'")
print("Ready for ML Training!")
print("="*70)
