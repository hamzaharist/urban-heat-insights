import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib
import time

print("="*90)
print(" "*25 + "RANDOM FOREST HYPERPARAMETER TUNING")
print(" "*30 + "UHI Temperature Prediction")
print("="*90)

# 1. LOAD DATA
print("\n[1/6] Loading cleaned dataset...")
df = pd.read_csv("backend/data/UHI_Dataset_Cleaned_Final.csv")
print(f"Dataset size: {len(df):,} rows")

X = df[['NDVI', 'NDBI', 'Elevation', 'Population']]
y = df['LST']

print(f"Features: {list(X.columns)}")
print(f"Target: LST (Land Surface Temperature)")

# 2. TRAIN-TEST SPLIT
print("\n[2/6] Splitting data (80% train, 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Training samples: {len(X_train):,}")
print(f"Testing samples: {len(X_test):,}")

# 3. BASELINE MODEL (Default Settings)
print("\n[3/6] Training baseline model (default settings)...")
default_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
default_model.fit(X_train, y_train)
default_pred = default_model.predict(X_test)

baseline_r2 = r2_score(y_test, default_pred)
baseline_rmse = np.sqrt(mean_squared_error(y_test, default_pred))
baseline_mae = mean_absolute_error(y_test, default_pred)

print(f"Baseline Performance:")
print(f"  R² Score: {baseline_r2:.4f}")
print(f"  RMSE:     {baseline_rmse:.4f}°C")
print(f"  MAE:      {baseline_mae:.4f}°C")

# 4. DEFINE HYPERPARAMETER GRID
print("\n[4/6] Setting up hyperparameter grid...")
print("Parameters to optimize:")
print("  - n_estimators: Number of trees in the forest")
print("  - max_depth: Maximum depth of each tree")
print("  - min_samples_split: Minimum samples to split a node")
print("  - min_samples_leaf: Minimum samples at leaf node")
print("  - max_features: Features to consider at each split")

param_grid = {
    'n_estimators': [100, 200, 300, 400],           # Number of trees
    'max_depth': [10, 20, 30, 40, None],            # Tree depth
    'min_samples_split': [2, 5, 10],                # Min samples to split
    'min_samples_leaf': [1, 2, 4],                  # Min samples at leaf
    'max_features': ['sqrt', 'log2', None],         # Features per split
    'bootstrap': [True, False]                      # Bootstrap samples
}

print(f"\nTotal possible combinations: {4*5*3*3*3*2} = 1,080")
print(f"Testing: 30 random combinations (3-fold cross-validation)")

# 5. RUN RANDOMIZED SEARCH
print("\n[5/6] Starting hyperparameter tuning...")
print("This will take approximately 3-7 minutes...")
print("-"*90)

rf = RandomForestRegressor(random_state=42, n_jobs=-1)

rf_random = RandomizedSearchCV(
    estimator=rf, 
    param_distributions=param_grid, 
    n_iter=30,          # Try 30 different random combinations
    cv=3,               # 3-Fold Cross Validation
    verbose=2,          # Show progress
    random_state=42, 
    n_jobs=-1,          # Use all CPU cores
    scoring='r2'        # Optimize for R² score
)

start_time = time.time()
rf_random.fit(X_train, y_train)
tuning_time = time.time() - start_time

print("-"*90)
print(f"\nTuning completed in {tuning_time:.2f} seconds ({tuning_time/60:.2f} minutes)")

# 6. EVALUATE TUNED MODEL
print("\n[6/6] Evaluating tuned model...")
best_model = rf_random.best_estimator_
tuned_pred = best_model.predict(X_test)

tuned_r2 = r2_score(y_test, tuned_pred)
tuned_rmse = np.sqrt(mean_squared_error(y_test, tuned_pred))
tuned_mae = mean_absolute_error(y_test, tuned_pred)

# 7. RESULTS COMPARISON
print("\n" + "="*90)
print(" "*30 + "RESULTS COMPARISON")
print("="*90)

print("\nBest Hyperparameters Found:")
print("-"*90)
for param, value in rf_random.best_params_.items():
    print(f"  {param:20s}: {value}")

print("\n" + "="*90)
print("PERFORMANCE COMPARISON")
print("="*90)
print(f"\n{'Metric':<20} {'Baseline':<15} {'Tuned':<15} {'Improvement':<15}")
print("-"*90)
print(f"{'R² Score':<20} {baseline_r2:<15.4f} {tuned_r2:<15.4f} {(tuned_r2-baseline_r2):+.4f} ({((tuned_r2-baseline_r2)/baseline_r2*100):+.2f}%)")
print(f"{'RMSE (°C)':<20} {baseline_rmse:<15.4f} {tuned_rmse:<15.4f} {(tuned_rmse-baseline_rmse):+.4f} ({((tuned_rmse-baseline_rmse)/baseline_rmse*100):+.2f}%)")
print(f"{'MAE (°C)':<20} {baseline_mae:<15.4f} {tuned_mae:<15.4f} {(tuned_mae-baseline_mae):+.4f} ({((tuned_mae-baseline_mae)/baseline_mae*100):+.2f}%)")

# 8. FEATURE IMPORTANCE
print("\n" + "="*90)
print("FEATURE IMPORTANCE (Tuned Model)")
print("="*90)
feature_importance = pd.DataFrame({
    'Feature': X.columns,
    'Importance': best_model.feature_importances_
}).sort_values('Importance', ascending=False)

print()
for idx, row in feature_importance.iterrows():
    bar_length = int(row['Importance'] * 50)  # Scale to 50 chars max
    bar = '█' * bar_length
    print(f"{row['Feature']:12s} │ {bar} {row['Importance']:.4f}")

# 9. SAVE MODELS
print("\n" + "="*90)
print("SAVING MODELS")
print("="*90)

joblib.dump(best_model, 'backend/models/uhi_rf_model_tuned.pkl')
print("✓ Tuned model saved: backend/models/uhi_rf_model_tuned.pkl")

joblib.dump(default_model, 'backend/models/uhi_rf_model_baseline.pkl')
print("✓ Baseline model saved: backend/models/uhi_rf_model_baseline.pkl")

# Save feature list for later use
joblib.dump(list(X.columns), 'backend/models/feature_names.pkl')
print("✓ Feature names saved: backend/models/feature_names.pkl")

# Save scaler if needed (though RF doesn't require scaling)
print("\nNote: Random Forest doesn't require feature scaling")

# 10. MODEL METADATA
metadata = {
    'model_type': 'RandomForestRegressor',
    'best_params': rf_random.best_params_,
    'features': list(X.columns),
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'baseline_r2': baseline_r2,
    'tuned_r2': tuned_r2,
    'baseline_rmse': baseline_rmse,
    'tuned_rmse': tuned_rmse,
    'tuning_time_seconds': tuning_time,
    'feature_importance': feature_importance.to_dict('records')
}

import json
with open('backend/models/model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("✓ Model metadata saved: backend/models/model_metadata.json")

print("\n" + "="*90)
print("HYPERPARAMETER TUNING COMPLETE!")
print("="*90)
print(f"\nFinal Model Performance:")
print(f"  R² Score: {tuned_r2:.4f} (Explains {tuned_r2*100:.2f}% of temperature variance)")
print(f"  RMSE:     {tuned_rmse:.4f}°C (Average prediction error)")
print(f"  MAE:      {tuned_mae:.4f}°C (Mean absolute error)")
print(f"\nThe model is ready for deployment! 🚀")
print("="*90)
