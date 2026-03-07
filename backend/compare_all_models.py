"""
Comprehensive Model Comparison for UHI Temperature Prediction
Tests multiple ML algorithms and finds the best performer
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

# Models to test
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    AdaBoostRegressor,
    ExtraTreesRegressor,
    BaggingRegressor
)
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor

# Try to import advanced models
try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("[WARNING] XGBoost not installed")

try:
    from lightgbm import LGBMRegressor
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    print("[WARNING] LightGBM not installed")

try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False
    print("[WARNING] CatBoost not installed")

print("=" * 70)
print("COMPREHENSIVE MODEL COMPARISON FOR UHI PREDICTION")
print("=" * 70)

# Load training data
data_dir = Path(__file__).parent / "data"
train_file = data_dir / "UHI_Training_Data_Malaysia_Combined.csv"
test_file = data_dir / "Malaysia_UHI_2025_Only.csv"

print(f"\n[1] Loading data...")
train_df = pd.read_csv(train_file)
test_df = pd.read_csv(test_file)

print(f"    Training data: {len(train_df):,} samples")
print(f"    Test data (2025): {len(test_df):,} samples")

# Features and target
FEATURES = ['NDVI', 'NDBI', 'Elevation', 'Population']
TARGET = 'LST'

# Clean data
def clean_data(df):
    """Remove outliers and invalid values"""
    df_clean = df[
        (df['LST'] >= 15) & (df['LST'] <= 50) &
        (df['NDVI'] >= -1) & (df['NDVI'] <= 1) &
        (df['NDBI'] >= -1) & (df['NDBI'] <= 1) &
        (df['Elevation'] >= -100) &
        (df['Population'] >= 0)
    ].copy()
    return df_clean.dropna(subset=FEATURES + [TARGET])

train_clean = clean_data(train_df)
test_clean = clean_data(test_df)

print(f"    After cleaning - Train: {len(train_clean):,}, Test: {len(test_clean):,}")

# Prepare data
X_train = train_clean[FEATURES]
y_train = train_clean[TARGET]
X_test = test_clean[FEATURES]
y_test = test_clean[TARGET]

# Split training for validation
X_tr, X_val, y_tr, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)

print(f"\n[2] Training and evaluating models...")
print("-" * 70)

# Define all models to test
models = {
    # Linear Models
    "Linear Regression": LinearRegression(),
    "Ridge Regression": Ridge(alpha=1.0),
    "Lasso Regression": Lasso(alpha=0.1),
    "ElasticNet": ElasticNet(alpha=0.1, l1_ratio=0.5),

    # Tree-based Models
    "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
    "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1),
    "Extra Trees": ExtraTreesRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    "AdaBoost": AdaBoostRegressor(n_estimators=100, random_state=42),
    "Bagging": BaggingRegressor(n_estimators=50, random_state=42, n_jobs=-1),

    # Distance-based
    "KNN (k=5)": KNeighborsRegressor(n_neighbors=5, n_jobs=-1),
    "KNN (k=10)": KNeighborsRegressor(n_neighbors=10, n_jobs=-1),

    # Neural Network
    "MLP Neural Network": MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42),
}

# Add advanced models if available
if HAS_XGBOOST:
    models["XGBoost"] = XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)

if HAS_LIGHTGBM:
    models["LightGBM"] = LGBMRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)

if HAS_CATBOOST:
    models["CatBoost"] = CatBoostRegressor(iterations=100, depth=6, learning_rate=0.1, random_state=42, verbose=0)

# Results storage
results = []

# Scale data for models that need it
scaler = StandardScaler()
X_tr_scaled = scaler.fit_transform(X_tr)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)

for name, model in models.items():
    print(f"    Training {name}...", end=" ")

    try:
        # Use scaled data for neural networks and SVR
        if "MLP" in name or "SVR" in name:
            model.fit(X_tr_scaled, y_tr)
            val_pred = model.predict(X_val_scaled)
            test_pred = model.predict(X_test_scaled)
        else:
            model.fit(X_tr, y_tr)
            val_pred = model.predict(X_val)
            test_pred = model.predict(X_test)

        # Validation metrics (internal)
        val_r2 = r2_score(y_val, val_pred)
        val_rmse = np.sqrt(mean_squared_error(y_val, val_pred))
        val_mae = mean_absolute_error(y_val, val_pred)

        # Test metrics (2025 data - external validation)
        test_r2 = r2_score(y_test, test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
        test_mae = mean_absolute_error(y_test, test_pred)

        results.append({
            "Model": name,
            "Val_R2": val_r2,
            "Val_RMSE": val_rmse,
            "Val_MAE": val_mae,
            "Test_R2": test_r2,
            "Test_RMSE": test_rmse,
            "Test_MAE": test_mae,
            "Generalization": test_r2 / val_r2 if val_r2 > 0 else 0  # Higher = better generalization
        })

        print(f"Val R²: {val_r2:.4f}, Test R²: {test_r2:.4f}")

    except Exception as e:
        print(f"ERROR: {e}")
        continue

# Create results DataFrame
results_df = pd.DataFrame(results)

# Sort by Test R² (real-world performance)
results_df = results_df.sort_values("Test_R2", ascending=False)

print("\n" + "=" * 70)
print("RESULTS SUMMARY (Sorted by Test R² - Real-world Performance)")
print("=" * 70)
print(f"\n{'Model':<25} {'Val R²':>10} {'Test R²':>10} {'Test RMSE':>12} {'Test MAE':>10} {'Gen. Ratio':>12}")
print("-" * 79)

for _, row in results_df.iterrows():
    gen_indicator = "[OK]" if row['Generalization'] > 0.7 else "[!]" if row['Generalization'] > 0.4 else "[X]"
    print(f"{row['Model']:<25} {row['Val_R2']:>10.4f} {row['Test_R2']:>10.4f} {row['Test_RMSE']:>12.2f}C {row['Test_MAE']:>9.2f}C {row['Generalization']:>10.2f} {gen_indicator}")

print("\n" + "=" * 70)
print("ANALYSIS")
print("=" * 70)

# Best models
best_test = results_df.iloc[0]
best_val = results_df.loc[results_df['Val_R2'].idxmax()]
best_gen = results_df.loc[results_df['Generalization'].idxmax()]

print(f"\n[BEST ON TEST DATA (2025)]: {best_test['Model']}")
print(f"   Test R2: {best_test['Test_R2']:.4f} | Test RMSE: {best_test['Test_RMSE']:.2f}C | Test MAE: {best_test['Test_MAE']:.2f}C")

print(f"\n[BEST ON VALIDATION DATA]: {best_val['Model']}")
print(f"   Val R2: {best_val['Val_R2']:.4f} | BUT Test R2: {best_val['Test_R2']:.4f}")

print(f"\n[BEST GENERALIZATION]: {best_gen['Model']}")
print(f"   Generalization Ratio: {best_gen['Generalization']:.2f} (Test R2 / Val R2)")

print("\n" + "-" * 70)
print("KEY INSIGHTS:")
print("-" * 70)

# Overfitting analysis
overfit_models = results_df[results_df['Generalization'] < 0.5]
if len(overfit_models) > 0:
    print(f"\n⚠️  Models with HIGH OVERFITTING (Gen. Ratio < 0.5):")
    for _, row in overfit_models.iterrows():
        print(f"   - {row['Model']}: Val R² {row['Val_R2']:.2f} → Test R² {row['Test_R2']:.2f}")

good_models = results_df[(results_df['Test_R2'] > 0.3) & (results_df['Generalization'] > 0.5)]
if len(good_models) > 0:
    print(f"\n✅ RECOMMENDED MODELS (Good test performance + generalization):")
    for _, row in good_models.head(5).iterrows():
        print(f"   - {row['Model']}: Test R² {row['Test_R2']:.4f}, RMSE {row['Test_RMSE']:.2f}°C")

# Save results
results_file = data_dir / "model_comparison_results.csv"
results_df.to_csv(results_file, index=False)
print(f"\n💾 Results saved to: {results_file}")

print("\n" + "=" * 70)
print("RECOMMENDATION")
print("=" * 70)
print(f"\nFor production use, consider: {best_test['Model']}")
print(f"Expected accuracy: R² = {best_test['Test_R2']:.1%}, Average error = ±{best_test['Test_MAE']:.1f}°C")
