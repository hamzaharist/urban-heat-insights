"""
Test script to verify the new tuned Random Forest model loads and works correctly
"""
import joblib  # Changed from pickle
import pandas as pd
import numpy as np
from pathlib import Path

print("="*70)
print("TESTING NEW TUNED RANDOM FOREST MODEL")
print("="*70)

# Load the model
model_path = Path("backend/models/uhi_rf_model_tuned.pkl")

if not model_path.exists():
    print(f"\n❌ ERROR: Model file not found at {model_path}")
    print("Please make sure the model file exists.")
    exit(1)

print(f"\n✓ Model file found: {model_path}")

# Load model with joblib
model = joblib.load(model_path)

print(f"✓ Model loaded successfully")
print(f"  Type: {type(model).__name__}")

# Check model attributes
if hasattr(model, 'feature_importances_'):
    print(f"  Number of features: {len(model.feature_importances_)}")
    print(f"  Number of estimators: {model.n_estimators}")
    print(f"  Max depth: {model.max_depth}")

# Test prediction with sample data
print("\n" + "-"*70)
print("TESTING MODEL PREDICTIONS")
print("-"*70)

# Create test data (4 features: NDVI, NDBI, Elevation, Population)
test_data = pd.DataFrame([
    {
        'NDVI': 0.5,      # Medium vegetation
        'NDBI': 0.0,      # Low urban density
        'Elevation': 50,   # Sea level
        'Population': 1.0  # Medium population
    },
    {
        'NDVI': 0.2,      # Low vegetation
        'NDBI': 0.4,      # High urban density
        'Elevation': 50,
        'Population': 10.0  # High population
    },
    {
        'NDVI': 0.8,      # High vegetation
        'NDBI': -0.2,     # Very low urban density
        'Elevation': 200,  # Higher altitude
        'Population': 0.1  # Low population
    }
])

print("\nTest scenarios:")
for i, row in test_data.iterrows():
    pred = model.predict(pd.DataFrame([row]))[0]
    print(f"\n  Scenario {i+1}:")
    print(f"    NDVI: {row['NDVI']:.2f}, NDBI: {row['NDBI']:.2f}, " +
          f"Elevation: {row['Elevation']:.0f}m, Population: {row['Population']:.1f}")
    print(f"    Predicted LST: {pred:.2f}°C")

# Feature importance
print("\n" + "-"*70)
print("FEATURE IMPORTANCE")
print("-"*70)

if hasattr(model, 'feature_importances_'):
    feature_names = ['NDVI', 'NDBI', 'Elevation', 'Population']
    importances = model.feature_importances_
    
    feature_imp = list(zip(feature_names, importances))
    feature_imp.sort(key=lambda x: x[1], reverse=True)
    
    print()
    for feature, importance in feature_imp:
        bar_length = int(importance * 50)
        bar = '█' * bar_length if bar_length > 0 else ''
        print(f"  {feature:12s} │ {bar} {importance:.4f}")

print("\n" + "="*70)
print("✓ MODEL TEST COMPLETE - All checks passed!")
print("="*70)
print("\nThe model is ready to use in your application!")
