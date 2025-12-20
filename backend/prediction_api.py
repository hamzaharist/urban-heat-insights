"""
ML Prediction API Endpoint
Provides real-time temperature predictions using trained Gradient Boosting model
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pickle
import pandas as pd
import numpy as np
from pathlib import Path

router = APIRouter()

# Load model on startup
MODEL_PATH = Path(__file__).parent / "models" / "gradient_boosting_temperature_model.pkl"
model = None

def load_model():
    """Load the trained ML model"""
    global model
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        print(f"✓ ML model loaded from {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"✗ Failed to load ML model: {e}")
        return False

# Request/Response models
class ScenarioPredictionRequest(BaseModel):
    city: str
    year_range: List[int]  # [start_year, end_year]
    ndvi_adjustment: float = 0.0  # -1.0 to 1.0 (percentage change)
    ndbi_adjustment: float = 0.0  # -1.0 to 1.0 (percentage change)
    climate_factor: float = 1.0   # 0.9 to 1.1 (multiplier)

class YearPrediction(BaseModel):
    year: int
    temperature: float

class PredictionMetrics(BaseModel):
    peak_temp: float
    avg_increase: float
    trend: str
    confidence: float

class ScenarioPredictionResponse(BaseModel):
    predictions: List[YearPrediction]
    metrics: PredictionMetrics

def create_prediction_features(year, base_temp, ndvi, ndbi, month=6):
    """
    Create features for a single prediction
    Uses historical baseline and scenario adjustments
    """
    # Normalize year (assuming 2020-2030 range)
    year_normalized = (year - 2020) / 10.0
    
    # Month features (using June as baseline - peak heat month)
    month_sin = np.sin(2 * np.pi * month / 12)
    month_cos = np.cos(2 * np.pi * month / 12)
    
    # Temperature lags (use base_temp as approximation)
    temp_lag_1y = base_temp
    temp_lag_2y = base_temp
    
    # Rolling statistics (use base_temp)
    temp_rolling_mean_3m = base_temp
    temp_rolling_std_3m = 1.5  # Typical std deviation
    
    # Environmental indices
    ndvi_filled = ndvi
    ndbi_filled = ndbi
    
    return pd.DataFrame([{
        'year_normalized': year_normalized,
        'month_sin': month_sin,
        'month_cos': month_cos,
        'temp_lag_1y': temp_lag_1y,
        'temp_lag_2y': temp_lag_2y,
        'temp_rolling_mean_3m': temp_rolling_mean_3m,
        'temp_rolling_std_3m': temp_rolling_std_3m,
        'ndvi_filled': ndvi_filled,
        'ndbi_filled': ndbi_filled
    }])

# City baseline data (from historical averages)
CITY_BASELINES = {
    "Kuala Lumpur": {"temp": 35.2, "ndvi": 0.3, "ndbi": 0.7},
    "Johor Bahru": {"temp": 34.8, "ndvi": 0.35, "ndbi": 0.65},
    "Penang": {"temp": 34.5, "ndvi": 0.4, "ndbi": 0.6},
}

@router.post("/api/predict-scenario", response_model=ScenarioPredictionResponse)
async def predict_scenario(request: ScenarioPredictionRequest):
    """
    Generate ML-based temperature predictions for a scenario
    
    Parameters:
    - city: City name
    - year_range: [start_year, end_year]
    - ndvi_adjustment: Vegetation change (-1.0 to 1.0, e.g., 0.1 = +10%)
    - ndbi_adjustment: Built-up area change (-1.0 to 1.0)
    - climate_factor: Climate multiplier (0.9 to 1.1, e.g., 1.02 = +2%)
    """
    if model is None:
        if not load_model():
            raise HTTPException(status_code=500, detail="ML model not loaded")
    
    # Get city baseline
    baseline = CITY_BASELINES.get(request.city)
    if not baseline:
        raise HTTPException(status_code=404, detail=f"City '{request.city}' not found")
    
    # Apply scenario adjustments to environmental indices
    base_ndvi = baseline["ndvi"]
    base_ndbi = baseline["ndbi"]
    base_temp = baseline["temp"]
    
    # Adjust NDVI and NDBI based on scenario
    adjusted_ndvi = base_ndvi * (1 + request.ndvi_adjustment)
    adjusted_ndbi = base_ndbi * (1 + request.ndbi_adjustment)
    
    # Clamp values to valid ranges
    adjusted_ndvi = max(0.0, min(1.0, adjusted_ndvi))
    adjusted_ndbi = max(0.0, min(1.0, adjusted_ndbi))
    
    # Generate predictions for each year
    predictions = []
    start_year, end_year = request.year_range
    
    for year in range(start_year, end_year + 1):
        # Create features
        features = create_prediction_features(
            year=year,
            base_temp=base_temp,
            ndvi=adjusted_ndvi,
            ndbi=adjusted_ndbi
        )
        
        # Predict temperature
        predicted_temp = model.predict(features)[0]
        
        # Apply climate factor
        predicted_temp *= request.climate_factor
        
        predictions.append(YearPrediction(
            year=year,
            temperature=round(float(predicted_temp), 2)
        ))
    
    # Calculate metrics
    temps = [p.temperature for p in predictions]
    peak_temp = max(temps)
    avg_increase = temps[-1] - temps[0]
    
    if avg_increase > 0.5:
        trend = "rising"
    elif avg_increase < -0.5:
        trend = "falling"
    else:
        trend = "stable"
    
    # Confidence decreases with future years
    years_ahead = end_year - 2024
    confidence = max(60, 95 - (years_ahead * 5))
    
    metrics = PredictionMetrics(
        peak_temp=round(peak_temp, 1),
        avg_increase=round(avg_increase, 1),
        trend=trend,
        confidence=round(confidence, 0)
    )
    
    return ScenarioPredictionResponse(
        predictions=predictions,
        metrics=metrics
    )
