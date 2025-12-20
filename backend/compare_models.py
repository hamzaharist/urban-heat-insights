"""
Comprehensive ML Model Comparison for Temperature Prediction
Tests multiple models and returns performance scores to find the best one
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# Import all models to test
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, AdaBoostRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from xgboost import XGBRegressor

# Try to import LightGBM (optional)
try:
    from lightgbm import LGBMRegressor
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    print("Note: LightGBM not available, skipping...")

print("\n" + "="*80)
print("ML MODEL COMPARISON FOR TEMPERATURE PREDICTION")
print("="*80 + "\n")

# Load data
print("Loading data...")
df = pd.read_parquet('data/all_districts_2016_2024.parquet')
print(f"Total records: {len(df)}")
print(f"Date range: {df['year'].min()}-{df['year'].max()}")

# Feature engineering
print("\nCreating features...")
df['year_normalized'] = (df['year'] - df['year'].min()) / (df['year'].max() - df['year'].min())
df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

# Create lag features
df = df.sort_values(['city', 'year', 'month'])
df['temp_lag_1y'] = df.groupby('city')['temperature'].shift(12)
df['temp_lag_2y'] = df.groupby('city')['temperature'].shift(24)
df['temp_rolling_mean_3m'] = df.groupby('city')['temperature'].transform(lambda x: x.rolling(3, min_periods=1).mean())
df['temp_rolling_std_3m'] = df.groupby('city')['temperature'].transform(lambda x: x.rolling(3, min_periods=1).std())

# Fill NaN values
df['ndvi_filled'] = df['ndvi'].fillna(df['ndvi'].mean())
df['ndbi_filled'] = df['ndbi'].fillna(df['ndbi'].mean())
df = df.dropna()

# Prepare features and target
feature_cols = [
    'year_normalized', 'month_sin', 'month_cos',
    'temp_lag_1y', 'temp_lag_2y',
    'temp_rolling_mean_3m', 'temp_rolling_std_3m',
    'ndvi_filled', 'ndbi_filled'
]

X = df[feature_cols]
y = df['temperature']

print(f"Features: {len(feature_cols)}")
print(f"Samples after preprocessing: {len(X)}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features for models that need it
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("\n" + "="*80)
print("TRAINING AND EVALUATING MODELS")
print("="*80 + "\n")

# Define models to test
models = {
    # Linear Models
    'Linear Regression': LinearRegression(),
    'Ridge Regression': Ridge(alpha=1.0),
    'Lasso Regression': Lasso(alpha=0.1),
    'ElasticNet': ElasticNet(alpha=0.1, l1_ratio=0.5),
    
    # Tree-based Models
    'Decision Tree': DecisionTreeRegressor(max_depth=10, random_state=42),
    'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
    'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    'XGBoost': XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1),
    'AdaBoost': AdaBoostRegressor(n_estimators=50, random_state=42),
    
    # Other Models
    'K-Nearest Neighbors': KNeighborsRegressor(n_neighbors=5),
    'Support Vector Regression': SVR(kernel='rbf', C=1.0),
}

# Add LightGBM if available
if HAS_LIGHTGBM:
    models['LightGBM'] = LGBMRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)

results = []

for name, model in models.items():
    print(f"Training {name}...")
    
    try:
        # Use scaled data for models that need it
        if name in ['K-Nearest Neighbors', 'Support Vector Regression', 'Ridge Regression', 'Lasso Regression', 'ElasticNet']:
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2', n_jobs=-1)
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2', n_jobs=-1)
        
        # Calculate metrics
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        cv_mean = cv_scores.mean()
        cv_std = cv_scores.std()
        
        results.append({
            'Model': name,
            'MAE': mae,
            'RMSE': rmse,
            'R²': r2,
            'CV R² (mean)': cv_mean,
            'CV R² (std)': cv_std
        })
        
        print(f"  ✓ MAE: {mae:.4f}, RMSE: {rmse:.4f}, R²: {r2:.4f}, CV R²: {cv_mean:.4f} ± {cv_std:.4f}")
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        results.append({
            'Model': name,
            'MAE': np.nan,
            'RMSE': np.nan,
            'R²': np.nan,
            'CV R² (mean)': np.nan,
            'CV R² (std)': np.nan
        })

# Create results DataFrame
results_df = pd.DataFrame(results)
results_df = results_df.sort_values('R²', ascending=False)

print("\n" + "="*80)
print("FINAL RESULTS (Sorted by R² Score)")
print("="*80 + "\n")

print(results_df.to_string(index=False))

print("\n" + "="*80)
print("BEST MODEL RECOMMENDATION")
print("="*80 + "\n")

best_model = results_df.iloc[0]
print(f"🏆 Best Model: {best_model['Model']}")
print(f"   - R² Score: {best_model['R²']:.4f}")
print(f"   - MAE: {best_model['MAE']:.4f}°C")
print(f"   - RMSE: {best_model['RMSE']:.4f}°C")
print(f"   - Cross-Validation R²: {best_model['CV R² (mean)']:.4f} ± {best_model['CV R² (std)']:.4f}")

print("\n" + "="*80)
print("INTERPRETATION")
print("="*80 + "\n")

print("Metrics Explained:")
print("  - MAE (Mean Absolute Error): Average prediction error in °C (lower is better)")
print("  - RMSE (Root Mean Squared Error): Penalizes large errors more (lower is better)")
print("  - R² Score: Proportion of variance explained (higher is better, max 1.0)")
print("  - CV R²: Cross-validation score shows generalization ability")

print("\nRecommendation:")
if best_model['R²'] > 0.8:
    print("  ✅ Excellent model performance! Ready for production use.")
elif best_model['R²'] > 0.6:
    print("  ✓ Good model performance. Suitable for predictions.")
elif best_model['R²'] > 0.4:
    print("  ⚠ Moderate performance. Consider feature engineering.")
else:
    print("  ❌ Poor performance. Need better features or more data.")

print("\n" + "="*80 + "\n")
