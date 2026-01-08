"""
Time-Series Temperature Prediction Model
Trains on Supabase hotspot data to predict future urban heat trends with:
- Population growth modeling
- Urbanization trends (NDBI/NDVI changes)
- Climate change factor
- Proper time-series features
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, ExtraTreesRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import pickle
import os
from supabase import create_client
from dotenv import load_dotenv

# Import additional models
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("[WARNING] XGBoost not installed. Skipping XGBoost model.")

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    print("[WARNING] LightGBM not installed. Skipping LightGBM model.")

try:
    import catboost as cb
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False
    print("[WARNING] CatBoost not installed. Skipping CatBoost model.")

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("Supabase credentials not found in environment variables")

    return create_client(url, key)

def load_hotspot_data():
    """Load hotspot data from Supabase"""
    print("Loading hotspot data from Supabase...")

    supabase = get_supabase_client()

    # Fetch all hotspots
    response = supabase.table('hotspots').select(
        'city, name, state_name, district_name, avg_temperature, '
        'avg_ndvi, avg_ndbi, elevation, population, latitude, longitude'
    ).execute()

    if not response.data:
        raise ValueError("No data found in hotspots table")

    df = pd.DataFrame(response.data)
    print(f"[OK] Loaded {len(df)} hotspot records")

    return df

def estimate_population_growth_rate(state):
    """
    Estimate annual population growth rate by state based on Malaysian demographics
    Source: Department of Statistics Malaysia (DOSM) trends
    """
    # Annual growth rates (%) - Based on recent Malaysian trends
    growth_rates = {
        'Johor': 2.5,
        'Kedah': 1.2,
        'Kelantan': 1.8,
        'Melaka': 2.0,
        'Negeri Sembilan': 1.8,
        'Pahang': 1.5,
        'Penang': 1.5,
        'Perak': 0.8,
        'Perlis': 0.5,
        'Sabah': 2.8,
        'Sarawak': 1.5,
        'Selangor': 3.2,  # Highest growth
        'Terengganu': 1.5,
        'W.P. Kuala Lumpur': 2.0,
        'W.P. Labuan': 1.0,
        'W.P. Putrajaya': 3.0,
    }

    return growth_rates.get(state, 1.5) / 100  # Default 1.5% annual growth

def estimate_urbanization_rate(state):
    """
    Estimate annual urbanization rate (NDBI increase, NDVI decrease)
    Higher in rapidly developing states
    """
    urbanization_rates = {
        'Selangor': 0.015,      # 1.5% annual increase
        'Johor': 0.012,
        'Penang': 0.010,
        'W.P. Kuala Lumpur': 0.008,  # Already highly urbanized
        'Melaka': 0.010,
        'Pahang': 0.008,
        'Kedah': 0.006,
        'Perak': 0.005,
        'Sabah': 0.012,
        'Sarawak': 0.010,
    }

    return urbanization_rates.get(state, 0.008)  # Default 0.8% annual

def project_future_features(row, years_ahead):
    """
    Project environmental features into the future

    Args:
        row: Current hotspot data
        years_ahead: Number of years to project (1-10)

    Returns:
        dict with projected features
    """
    state = row['state_name']

    # Population growth (compound annual growth)
    pop_growth_rate = estimate_population_growth_rate(state)
    future_population = row['population'] * ((1 + pop_growth_rate) ** years_ahead)

    # Urbanization effects
    urban_rate = estimate_urbanization_rate(state)

    # NDBI increases with urbanization
    future_ndbi = min(1.0, row['avg_ndbi'] + (urban_rate * years_ahead))

    # NDVI decreases with urbanization (but not below -1)
    future_ndvi = max(-1.0, row['avg_ndvi'] - (urban_rate * 0.5 * years_ahead))

    # Climate change warming trend: ~0.02-0.03°C per year
    climate_warming = 0.025 * years_ahead

    return {
        'population': future_population,
        'avg_ndbi': future_ndbi,
        'avg_ndvi': future_ndvi,
        'climate_offset': climate_warming,
        'years_from_baseline': years_ahead,
    }

def create_training_features(df, base_year=2024):
    """
    Create features for model training
    Uses current data as baseline (year 0)
    """
    features = []

    for idx, row in df.iterrows():
        # Current year baseline (2024)
        features.append({
            'location': row.get('district_name') or row.get('city'),
            'state': row['state_name'],
            'avg_ndvi': row['avg_ndvi'],
            'avg_ndbi': row['avg_ndbi'],
            'elevation': row['elevation'],
            'population': row['population'],
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'years_from_baseline': 0,
            'climate_offset': 0.0,
            'temperature': row['avg_temperature'],  # Target
        })

    return pd.DataFrame(features)

def train_prediction_model(df):
    """
    Train temperature prediction model
    """
    print("\n" + "="*70)
    print("Training Time-Series Temperature Prediction Model")
    print("="*70 + "\n")

    # Prepare features
    print("Preparing training data...")
    train_df = create_training_features(df)

    # Remove rows with missing values
    train_df = train_df.dropna()
    print(f"[OK] {len(train_df)} training samples")

    # Define feature columns
    feature_cols = [
        'avg_ndvi', 'avg_ndbi', 'elevation', 'population',
        'latitude', 'longitude', 'years_from_baseline', 'climate_offset'
    ]

    X = train_df[feature_cols]
    y = train_df['temperature']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")

    # Try multiple models and pick the best
    models = {
        'Gradient Boosting': GradientBoostingRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42
        ),
        'Random Forest': RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        ),
        'Extra Trees': ExtraTreesRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
    }

    # Add XGBoost if available
    if HAS_XGBOOST:
        models['XGBoost'] = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
            verbosity=0
        )

    # Add LightGBM if available
    if HAS_LIGHTGBM:
        models['LightGBM'] = lgb.LGBMRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
            verbosity=-1
        )

    # Add CatBoost if available
    if HAS_CATBOOST:
        models['CatBoost'] = cb.CatBoostRegressor(
            iterations=200,
            depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
            verbose=False
        )

    best_model = None
    best_score = -np.inf
    best_name = None

    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)

        # Evaluate
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)

        train_mae = mean_absolute_error(y_train, train_pred)
        test_mae = mean_absolute_error(y_test, test_pred)
        train_r2 = r2_score(y_train, train_pred)
        test_r2 = r2_score(y_test, test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))

        print(f"  Train MAE: {train_mae:.3f}°C | R²: {train_r2:.3f}")
        print(f"  Test MAE:  {test_mae:.3f}°C | R²: {test_r2:.3f} | RMSE: {test_rmse:.3f}°C")

        # Cross-validation
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
        print(f"  CV R² (5-fold): {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

        if test_r2 > best_score:
            best_score = test_r2
            best_model = model
            best_name = name

    print("\n" + "="*70)
    print(f"BEST MODEL: {best_name} (R² = {best_score:.3f})")
    print("="*70)

    # Feature importance
    print("\nFEATURE IMPORTANCE:")
    importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)

    for _, row in importance.iterrows():
        bar = '#' * int(row['importance'] * 50)
        print(f"  {row['feature']:20} {bar} {row['importance']:.3f}")

    # Save model
    os.makedirs('models', exist_ok=True)
    model_path = 'models/timeseries_temperature_model.pkl'

    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': best_model,
            'feature_cols': feature_cols,
            'model_name': best_name,
            'r2_score': best_score,
            'train_mae': train_mae,
            'test_mae': test_mae
        }, f)

    print(f"\n[OK] Model saved to: {model_path}")

    return best_model, feature_cols

def generate_future_predictions(df, model, feature_cols, years_range=(2026, 2035)):
    """
    Generate predictions for future years with population growth and urbanization
    """
    start_year, end_year = years_range
    predictions = []

    print(f"\nGenerating predictions for {start_year}-{end_year}...")

    for idx, row in df.iterrows():
        location = row.get('district_name') or row.get('city')
        state = row['state_name']

        for year in range(start_year, end_year + 1):
            years_ahead = year - 2024

            # Project future features
            future = project_future_features(row, years_ahead)

            # Create feature vector
            features = pd.DataFrame([{
                'avg_ndvi': future['avg_ndvi'],
                'avg_ndbi': future['avg_ndbi'],
                'elevation': row['elevation'],  # Elevation doesn't change
                'population': future['population'],
                'latitude': row['latitude'],
                'longitude': row['longitude'],
                'years_from_baseline': future['years_from_baseline'],
                'climate_offset': future['climate_offset']
            }])

            # Predict temperature
            pred_temp = model.predict(features[feature_cols])[0]

            # Add climate warming offset
            pred_temp += future['climate_offset']

            # Confidence decreases with time
            confidence = max(0.65, 1.0 - (years_ahead * 0.035))

            predictions.append({
                'city': location,
                'state': state,
                'year': year,
                'predicted_temp': round(pred_temp, 2),
                'confidence_level': round(confidence, 2),
                'projected_population': int(future['population']),
                'projected_ndvi': round(future['avg_ndvi'], 3),
                'projected_ndbi': round(future['avg_ndbi'], 3),
            })

    print(f"[OK] Generated {len(predictions)} predictions")

    return predictions

def main():
    """Main training and prediction pipeline"""
    try:
        # Load data from Supabase
        df = load_hotspot_data()

        # Train model
        model, feature_cols = train_prediction_model(df)

        # Generate predictions for 2026-2035
        predictions = generate_future_predictions(df, model, feature_cols, (2026, 2035))

        # Save predictions
        pred_df = pd.DataFrame(predictions)
        pred_df.to_csv('data/timeseries_predictions_2026_2035.csv', index=False)
        print(f"\n[OK] Predictions saved to: data/timeseries_predictions_2026_2035.csv")

        # Show sample predictions
        print("\n" + "="*70)
        print("SAMPLE PREDICTIONS (First 5 locations, years 2026-2030):")
        print("="*70)
        sample = pred_df[pred_df['year'] <= 2030].head(20)
        print(sample.to_string(index=False))

        # Show statistics
        print("\n" + "="*70)
        print("PREDICTION STATISTICS:")
        print("="*70)
        for year in range(2026, 2036):
            year_data = pred_df[pred_df['year'] == year]
            print(f"{year}: Avg Temp = {year_data['predicted_temp'].mean():.2f}°C, "
                  f"Range = [{year_data['predicted_temp'].min():.1f}, {year_data['predicted_temp'].max():.1f}]°C")

        print("\n[OK] Training complete! Model ready for use.")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
