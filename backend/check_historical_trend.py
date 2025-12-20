import pandas as pd
import numpy as np

df = pd.read_parquet('data/all_districts_2016_2024.parquet')

print("\n" + "="*80)
print("HISTORICAL TEMPERATURE TREND (2016-2024)")
print("="*80 + "\n")

# Get KL data only
kl_data = df[df['city'].str.contains('Kuala Lumpur', na=False)]

# Group by year and calculate average
yearly_avg = kl_data.groupby('year')['temperature'].mean()

print("Year-by-year average temperature:")
for year, temp in yearly_avg.items():
    print(f"  {year}: {temp:.2f}°C")

# Calculate trend
years = yearly_avg.index.values
temps = yearly_avg.values
trend = np.polyfit(years, temps, 1)[0]

print(f"\nLinear trend: {trend:.4f}°C per year")
print(f"Total change 2016-2024: {trend * 8:.2f}°C")
print(f"Projected change 2024-2030: {trend * 6:.2f}°C")

print("\n" + "="*80 + "\n")
