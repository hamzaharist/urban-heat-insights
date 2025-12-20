"""
Gradient Boosting Temperature Prediction Model
Trains on historical satellite data to predict future urban heat trends
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os

def create_features(df):
    """
    Create features for ML model from historical data
    """
    # Time-based features
    df['year_normalized'] = (df['year'] - df['year'].min()) / (df['year'].max() - df['year'].min())
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    # Lag features (previous year's temperature)
    df = df.sort_values(['city', 'year', 'month'])
    df['temp_lag_1y'] = df.groupby('city')['temperature'].shift(12)
    df['temp_lag_2y'] = df.groupby('city')['temperature'].shift(24)
    
    # Rolling statistics
    df['temp_rolling_mean_3m'] = df.groupby('city')['temperature'].transform(
        lambda x: x.rolling(window=3, min_periods=1).mean()
    )
    df['temp_rolling_std_3m'] = df.groupby('city')['temperature'].transform(
        lambda x: x.rolling(window=3, min_periods=1).std()
    )
    
    # NDVI and NDBI features (if available)
    if 'ndvi' in df.columns:
        df['ndvi_filled'] = df.groupby('city')['ndvi'].transform(lambda x: x.fillna(x.mean()))
    else:
        df['ndvi_filled'] = 0
        
    if 'ndbi' in df.columns:
        df['ndbi_filled'] = df.groupby('city')['ndbi'].transform(lambda x: x.fillna(x.mean()))
    else:
        df['ndbi_filled'] = 0
    
    return df

def train_gradient_boosting_model(parquet_file):
    """
    Train Gradient Boosting model on historical data
    """
    print("\n" + "="*60)
    print("Training Gradient Boosting Temperature Prediction Model")
    print("="*60 + "\n")
    
    # Load data
    print("Loading historical data...")
    df = pd.read_parquet(parquet_file)
    print(f"✓ Loaded {len(df)} records from {df['year'].min()}-{df['year'].max()}")
    
    # Create features
    print("\nEngineering features...")
    df = create_features(df)
    
    # Remove rows with NaN (from lag features)
    df = df.dropna()
    print(f"✓ {len(df)} records after feature engineering")
    
    # Define features and target
    feature_cols = [
        'year_normalized', 'month_sin', 'month_cos',
        'temp_lag_1y', 'temp_lag_2y',
        'temp_rolling_mean_3m', 'temp_rolling_std_3m',
        'ndvi_filled', 'ndbi_filled'
    ]
    
    X = df[feature_cols]
    y = df['temperature']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train Gradient Boosting model
    print("\nTraining Gradient Boosting model...")
    model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    print("\n" + "="*60)
    print("MODEL PERFORMANCE")
    print("="*60)
    print(f"Train MAE: {train_mae:.2f}°C")
    print(f"Test MAE:  {test_mae:.2f}°C")
    print(f"Train R²:  {train_r2:.3f}")
    print(f"Test R²:   {test_r2:.3f}")
    
    # Feature importance
    print("\n" + "="*60)
    print("FEATURE IMPORTANCE")
    print("="*60)
    importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for _, row in importance.iterrows():
        print(f"  {row['feature']:25} {row['importance']:.3f}")
    
    # Save model
    os.makedirs('models', exist_ok=True)
    model_path = 'models/gradient_boosting_temperature_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"\n✓ Model saved to: {model_path}")
    
    return model, feature_cols, df

def generate_predictions_gradient_boosting(parquet_file, model=None, feature_cols=None):
    """
    Generate future predictions using trained Gradient Boosting model
    """
    print("\n" + "="*60)
    print("Generating Gradient Boosting Predictions (2026-2030)")
    print("="*60 + "\n")
    
    # Load or train model
    if model is None:
        model_path = 'models/gradient_boosting_temperature_model.pkl'
        if os.path.exists(model_path):
            print("Loading pre-trained model...")
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
        else:
            print("No pre-trained model found. Training new model...")
            model, feature_cols, _ = train_gradient_boosting_model(parquet_file)
    
    # Load historical data
    df = pd.read_parquet(parquet_file)
    df = create_features(df)
    
    predictions = []
    
    # Get latest data per city for prediction baseline
    latest_data = df.groupby('city').apply(
        lambda x: x.nlargest(12, 'year')  # Last 12 months
    ).reset_index(drop=True)
    
    for city in df['city'].unique():
        city_data = latest_data[latest_data['city'] == city]
        
        if len(city_data) == 0:
            continue
        
        # Get baseline values
        last_temp = city_data['temperature'].mean()
        last_ndvi = city_data['ndvi_filled'].mean()
        last_ndbi = city_data['ndbi_filled'].mean()
        
        # Predict for years 2026-2030
        for year_offset in range(1, 6):
            future_year = 2025 + year_offset
            
            # Create features for prediction
            year_norm = (future_year - df['year'].min()) / (df['year'].max() - df['year'].min())
            
            # Predict for each month
            monthly_preds = []
            for month in range(1, 13):
                features = pd.DataFrame({
                    'year_normalized': [year_norm],
                    'month_sin': [np.sin(2 * np.pi * month / 12)],
                    'month_cos': [np.cos(2 * np.pi * month / 12)],
                    'temp_lag_1y': [last_temp],
                    'temp_lag_2y': [last_temp],
                    'temp_rolling_mean_3m': [last_temp],
                    'temp_rolling_std_3m': [1.0],
                    'ndvi_filled': [last_ndvi],
                    'ndbi_filled': [last_ndbi]
                })
                
                pred = model.predict(features[feature_cols])[0]
                monthly_preds.append(pred)
            
            # Average prediction for the year
            avg_pred = np.mean(monthly_preds)
            std_pred = np.std(monthly_preds)
            
            # Confidence decreases with time
            confidence = max(0.5, 1.0 - (year_offset * 0.08))
            
            predictions.append({
                'city': city,
                'year': future_year,
                'predicted_temp': round(avg_pred, 2),
                'confidence_level': round(confidence, 2),
                'prediction_std': round(std_pred, 2)
            })
    
    print(f"✓ Generated {len(predictions)} predictions for {len(df['city'].unique())} cities")
    
    return predictions

if __name__ == "__main__":
    # Train model and generate predictions
    parquet_file = 'data/all_districts_2016_2024.parquet'
    
    if os.path.exists(parquet_file):
        # Train model
        model, feature_cols, df = train_gradient_boosting_model(parquet_file)
        
        # Generate predictions
        predictions = generate_predictions_gradient_boosting(parquet_file, model, feature_cols)
        
        # Save predictions
        pred_df = pd.DataFrame(predictions)
        pred_df.to_csv('data/gradient_boosting_predictions.csv', index=False)
        print(f"\n✓ Predictions saved to: data/gradient_boosting_predictions.csv")
        
        print("\n" + "="*60)
        print("Sample Predictions:")
        print("="*60)
        print(pred_df.head(10))
    else:
        print(f"✗ Data file not found: {parquet_file}")
