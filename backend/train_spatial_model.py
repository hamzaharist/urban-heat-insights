"""
Train XGBoost Spatial Model for Urban Heat Island Prediction
Uses: NDVI, NDBI, Elevation, Population, latitude, longitude -> Temperature
"""
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import pickle
import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase():
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("Supabase credentials not found in environment")

    return create_client(url, key)

def load_training_data():
    """Load training data from Supabase"""
    print("Loading data from Supabase...")
    supabase = get_supabase()

    # Fetch temperature data with spatial features from hotspots table
    response = supabase.table('hotspots') \
        .select('avg_ndvi, avg_ndbi, elevation, population, latitude, longitude, avg_temperature, district_name') \
        .execute()

    df = pd.DataFrame(response.data)

    # Rename columns to match expected format
    df = df.rename(columns={
        'avg_ndvi': 'NDVI',
        'avg_ndbi': 'NDBI',
        'elevation': 'Elevation',
        'population': 'Population',
        'avg_temperature': 'LST',
        'district_name': 'city'
    })

    print(f"Loaded {len(df)} records")
    print(f"Columns: {df.columns.tolist()}")

    return df

def train_spatial_model():
    """Train XGBoost spatial model"""

    # Load data
    df = load_training_data()

    # Prepare features and target
    feature_cols = ['NDVI', 'NDBI', 'Elevation', 'Population', 'latitude', 'longitude']
    target_col = 'LST'

    # Remove rows with missing values
    df_clean = df[feature_cols + [target_col]].dropna()

    print(f"\nAfter removing missing values: {len(df_clean)} records")
    print(f"Features: {feature_cols}")
    print(f"Target: {target_col}")

    X = df_clean[feature_cols]
    y = df_clean[target_col]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")

    # Train XGBoost model
    print("\nTraining XGBoost model...")
    model = XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

    print("\n" + "="*60)
    print("MODEL PERFORMANCE")
    print("="*60)
    print(f"Training MAE:   {train_mae:.2f}°C")
    print(f"Test MAE:       {test_mae:.2f}°C")
    print(f"Training R²:    {train_r2:.3f}")
    print(f"Test R²:        {test_r2:.3f}")
    print(f"Training RMSE:  {train_rmse:.2f}°C")
    print(f"Test RMSE:      {test_rmse:.2f}°C")
    print("="*60)

    # Save model
    os.makedirs('models', exist_ok=True)
    model_path = 'models/xgboost_best_spatial_model.pkl'

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    print(f"\n✓ Model saved to: {model_path}")

    # Feature importance
    print("\nFeature Importance:")
    for feature, importance in zip(feature_cols, model.feature_importances_):
        print(f"  {feature:15s}: {importance:.3f}")

    return model, test_r2

if __name__ == "__main__":
    try:
        model, r2 = train_spatial_model()
        print(f"\n✓ Spatial model training complete! R² = {r2:.3f}")
    except Exception as e:
        print(f"\n✗ Error during training: {e}")
        import traceback
        traceback.print_exc()
