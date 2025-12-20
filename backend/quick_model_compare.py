"""
Quick model comparison - saves results to JSON
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor
import json

# Load and prepare data
df = pd.read_parquet('data/all_districts_2016_2024.parquet')
df['year_normalized'] = (df['year'] - df['year'].min()) / (df['year'].max() - df['year'].min())
df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
df = df.sort_values(['city', 'year', 'month'])
df['temp_lag_1y'] = df.groupby('city')['temperature'].shift(12)
df['temp_lag_2y'] = df.groupby('city')['temperature'].shift(24)
df['temp_rolling_mean_3m'] = df.groupby('city')['temperature'].transform(lambda x: x.rolling(3, min_periods=1).mean())
df['temp_rolling_std_3m'] = df.groupby('city')['temperature'].transform(lambda x: x.rolling(3, min_periods=1).std())
df['ndvi_filled'] = df['ndvi'].fillna(df['ndvi'].mean())
df['ndbi_filled'] = df['ndbi'].fillna(df['ndbi'].mean())
df = df.dropna()

feature_cols = ['year_normalized', 'month_sin', 'month_cos', 'temp_lag_1y', 'temp_lag_2y', 
                'temp_rolling_mean_3m', 'temp_rolling_std_3m', 'ndvi_filled', 'ndbi_filled']
X = df[feature_cols]
y = df['temperature']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Test models
models = {
    'Linear Regression': LinearRegression(),
    'Ridge': Ridge(),
    'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42),
    'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    'XGBoost': XGBRegressor(n_estimators=100, max_depth=5, random_state=42)
}

results = {}
for name, model in models.items():
    print(f"Testing {name}...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    results[name] = {
        'MAE': float(mean_absolute_error(y_test, y_pred)),
        'R2': float(r2_score(y_test, y_pred))
    }

# Save to JSON
with open('model_comparison.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nResults saved to model_comparison.json")
print(json.dumps(results, indent=2))
