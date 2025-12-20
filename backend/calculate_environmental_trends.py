"""
Calculate environmental trends using linear regression (more robust for noisy data)
Shows actual trends in NDBI, NDVI, and temperature over time
"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import json

print("\n" + "="*80)
print("CALCULATING ENVIRONMENTAL TRENDS (2016-2024) - LINEAR REGRESSION")
print("="*80 + "\n")

# Load data
df = pd.read_parquet('data/all_districts_2016_2024.parquet')

print(f"Total records: {len(df)}")
print(f"Date range: {df['year'].min()}-{df['year'].max()}")

def calculate_trend_regression(df, column):
    """Calculate trend using linear regression"""
    # Remove NaN values
    data = df[[column, 'year']].dropna()
    
    if len(data) == 0:
        return None
    
    X = data[['year']].values
    y = data[column].values
    
    # Fit linear regression
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict for first and last year
    first_year = df['year'].min()
    last_year = df['year'].max()
    
    first_pred = model.predict([[first_year]])[0]
    last_pred = model.predict([[last_year]])[0]
    
    # Calculate percentage change
    if first_pred != 0:
        pct_change = ((last_pred - first_pred) / abs(first_pred)) * 100
    else:
        pct_change = 0
    
    return {
        'first_year_trend': first_pred,
        'last_year_trend': last_pred,
        'absolute_change': last_pred - first_pred,
        'percent_change': pct_change,
        'slope': model.coef_[0],
        'r2': model.score(X, y)
    }

# Calculate trends
temp_trend = calculate_trend_regression(df, 'temperature')
ndvi_trend = calculate_trend_regression(df, 'ndvi')
ndbi_trend = calculate_trend_regression(df, 'ndbi')

print("\n" + "="*80)
print("TEMPERATURE TREND (Linear Regression)")
print("="*80)
print(f"2016 Trend: {temp_trend['first_year_trend']:.2f}°C")
print(f"2024 Trend: {temp_trend['last_year_trend']:.2f}°C")
print(f"Change: {temp_trend['absolute_change']:+.2f}°C ({temp_trend['percent_change']:+.1f}%)")
print(f"Slope: {temp_trend['slope']:+.3f}°C/year")
print(f"R² Score: {temp_trend['r2']:.3f}")

print("\n" + "="*80)
print("NDVI TREND (Vegetation)")
print("="*80)
print(f"2016 Trend: {ndvi_trend['first_year_trend']:.3f}")
print(f"2024 Trend: {ndvi_trend['last_year_trend']:.3f}")
print(f"Change: {ndvi_trend['absolute_change']:+.3f} ({ndvi_trend['percent_change']:+.1f}%)")
print(f"Slope: {ndvi_trend['slope']:+.4f}/year")
print(f"R² Score: {ndvi_trend['r2']:.3f}")

print("\n" + "="*80)
print("NDBI TREND (Urban Built-up)")
print("="*80)
print(f"2016 Trend: {ndbi_trend['first_year_trend']:.3f}")
print(f"2024 Trend: {ndbi_trend['last_year_trend']:.3f}")
print(f"Change: {ndbi_trend['absolute_change']:+.3f} ({ndbi_trend['percent_change']:+.1f}%)")
print(f"Slope: {ndbi_trend['slope']:+.4f}/year")
print(f"R² Score: {ndbi_trend['r2']:.3f}")

# For display: show relative contribution based on absolute magnitude of changes
# Use absolute values to show impact regardless of direction

urban_impact = abs(ndbi_trend['percent_change'])
vegetation_impact = abs(ndvi_trend['percent_change'])
climate_impact = abs(temp_trend['percent_change'])

# Normalize to 100%
total_impact = urban_impact + vegetation_impact + climate_impact
if total_impact > 0:
    urban_display = round((urban_impact / total_impact) * 100)
    vegetation_display = round((vegetation_impact / total_impact) * 100)
    climate_display = 100 - urban_display - vegetation_display  # Ensure it adds to 100
else:
    urban_display = 33
    vegetation_display = 33
    climate_display = 34

print("\n" + "="*80)
print("DISPLAY PERCENTAGES (Normalized Impact)")
print("="*80)
print(f"Urban Expansion: {urban_display}%")
print(f"Vegetation Loss: {vegetation_display}%")
print(f"Climate Baseline: {climate_display}%")

# Risk probability based on temperature trend
if temp_trend['slope'] > 0:
    # Warming trend
    risk_probability = min(95, max(65, 70 + int(abs(temp_trend['percent_change']) * 2)))
else:
    # Cooling trend (unexpected, but handle it)
    risk_probability = 75  # Moderate risk

print(f"\nRisk Probability: {risk_probability}%")

# Save to JSON
environmental_trends = {
    'keyFactors': {
        'urbanExpansion': urban_display,
        'vegetationLoss': vegetation_display,
        'climateBaseline': climate_display
    },
    'riskProbability': risk_probability,
    'rawTrends': {
        'temperature': {
            'change_celsius': round(temp_trend['absolute_change'], 2),
            'change_percent': round(temp_trend['percent_change'], 1),
            'slope_per_year': round(temp_trend['slope'], 3),
            'year_2016_trend': round(temp_trend['first_year_trend'], 2),
            'year_2024_trend': round(temp_trend['last_year_trend'], 2),
            'r2_score': round(temp_trend['r2'], 3)
        },
        'ndvi': {
            'change_absolute': round(ndvi_trend['absolute_change'], 3),
            'change_percent': round(ndvi_trend['percent_change'], 1),
            'slope_per_year': round(ndvi_trend['slope'], 4),
            'year_2016_trend': round(ndvi_trend['first_year_trend'], 3),
            'year_2024_trend': round(ndvi_trend['last_year_trend'], 3),
            'r2_score': round(ndvi_trend['r2'], 3)
        },
        'ndbi': {
            'change_absolute': round(ndbi_trend['absolute_change'], 3),
            'change_percent': round(ndbi_trend['percent_change'], 1),
            'slope_per_year': round(ndbi_trend['slope'], 4),
            'year_2016_trend': round(ndbi_trend['first_year_trend'], 3),
            'year_2024_trend': round(ndbi_trend['last_year_trend'], 3),
            'r2_score': round(ndbi_trend['r2'], 3)
        }
    }
}

# Save
with open('data/environmental_trends.json', 'w') as f:
    json.dump(environmental_trends, f, indent=2)

# Copy to public folder
import shutil
shutil.copy('data/environmental_trends.json', '../public/environmental_trends.json')

print(f"\n✓ Environmental trends saved to:")
print(f"  - data/environmental_trends.json")
print(f"  - public/environmental_trends.json")

print("\n" + "="*80 + "\n")
