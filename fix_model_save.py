"""
Fix: Re-save the tuned Random Forest model correctly
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV
import joblib
import pickle

print("Loading data and retraining the tuned model...")

# Load cleaned data
df = pd.read_csv("backend/data/UHI_Dataset_Cleaned_Final.csv")
X = df[['NDVI', 'NDBI', 'Elevation', 'Population']]
y = df['LST']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Load the best parameters from metadata
import json
with open('backend/models/model_metadata.json', 'r') as f:
    metadata = json.load(f)

best_params = metadata['best_params']
print(f"\nBest parameters: {best_params}")

# Train model with best parameters
print("\nTraining Random Forest with optimized parameters...")
model = RandomForestRegressor(
    n_estimators=best_params['n_estimators'],
    max_depth=best_params['max_depth'],
    min_samples_split=best_params['min_samples_split'],
    min_samples_leaf=best_params['min_samples_leaf'],
    max_features=best_params['max_features'],
    bootstrap=best_params['bootstrap'],
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✓ Model trained successfully")

# Test prediction
test_pred = model.predict(X_test[:5])
print(f"\nTest predictions: {test_pred}")

# Save the model using both joblib and pickle
print("\nSaving model...")

# Method 1: joblib
joblib.dump(model, 'backend/models/uhi_rf_model_tuned.pkl')
print("✓ Model saved with joblib to: backend/models/uhi_rf_model_tuned.pkl")

# Method 2: pickle (as backup)
with open('backend/models/uhi_rf_model_tuned_pickle.pkl', 'wb') as f:
    pickle.dump(model, f)
print("✓ Model saved with pickle to: backend/models/uhi_rf_model_tuned_pickle.pkl")

# Verify it loads correctly
loaded_model = joblib.load('backend/models/uhi_rf_model_tuned.pkl')
print(f"\n✓ Model verified - Type: {type(loaded_model).__name__}")
print(f"✓ Has predict method: {hasattr(loaded_model, 'predict')}")

# Test loaded model
loaded_pred = loaded_model.predict(X_test[:5])
print(f"✓ Loaded model predictions match: {np.allclose(test_pred, loaded_pred)}")

print("\n" + "="*70)
print("MODEL RE-SAVED SUCCESSFULLY!")
print("="*70)
