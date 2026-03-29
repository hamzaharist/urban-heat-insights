"""
Time-Series Prediction API
Uses the SAME Random Forest spatial model as the prediction API,
projecting future temperatures with urbanization and climate trends.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Use the SAME Random Forest model as the spatial prediction API
MODEL_PATH = Path(__file__).parent / "models" / "uhi_rf_model_tuned.pkl"

# Global variables
rf_model = None
supabase_client = None

def get_supabase():
    """Get or create Supabase client"""
    global supabase_client
    if supabase_client is None:
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
        if url and key:
            supabase_client = create_client(url, key)
    return supabase_client

def load_model():
    """Load the Random Forest spatial model (same as prediction_api)"""
    global rf_model
    if rf_model is None:
        if MODEL_PATH.exists():
            rf_model = joblib.load(MODEL_PATH)
            print(f"[OK] Time-series API: Random Forest model loaded from {MODEL_PATH}")
        else:
            print(f"[WARNING] Time-series API: Model not found at {MODEL_PATH}")
    return rf_model

# Load model on startup
load_model()

def estimate_population_growth_rate(state):
    """Estimate annual population growth rate by state"""
    growth_rates = {
        'Johor': 2.5, 'Kedah': 1.2, 'Kelantan': 1.8, 'Melaka': 2.0,
        'Negeri Sembilan': 1.8, 'Pahang': 1.5, 'Penang': 1.5, 'Perak': 0.8,
        'Perlis': 0.5, 'Sabah': 2.8, 'Sarawak': 1.5, 'Selangor': 3.2,
        'Terengganu': 1.5, 'W.P. Kuala Lumpur': 2.0, 'W.P. Labuan': 1.0,
        'W.P. Putrajaya': 3.0,
    }
    return growth_rates.get(state, 1.5) / 100

def estimate_urbanization_rate(state):
    """Estimate annual urbanization rate"""
    urbanization_rates = {
        'Selangor': 0.015, 'Johor': 0.012, 'Penang': 0.010,
        'W.P. Kuala Lumpur': 0.008, 'Melaka': 0.010, 'Pahang': 0.008,
        'Kedah': 0.006, 'Perak': 0.005, 'Sabah': 0.012, 'Sarawak': 0.010,
    }
    return urbanization_rates.get(state, 0.008)

def get_location_baseline(location_name: str):
    """Get baseline data from Supabase hotspots"""
    try:
        supabase = get_supabase()
        if not supabase:
            return None

        # Try state-level match first
        response = supabase.table('hotspots').select(
            'state_name, district_name, avg_ndvi, avg_ndbi, elevation, '
            'population, latitude, longitude, avg_temperature'
        ).eq('state_name', location_name).execute()

        # If no state match, try district
        if not response.data or len(response.data) == 0:
            response = supabase.table('hotspots').select(
                'state_name, district_name, avg_ndvi, avg_ndbi, elevation, '
                'population, latitude, longitude, avg_temperature'
            ).eq('district_name', location_name).execute()

        if not response.data or len(response.data) == 0:
            return None

        # Aggregate results
        df = pd.DataFrame(response.data)

        baseline = {
            "state_name": df['state_name'].iloc[0],
            "location_name": location_name,
            "avg_ndvi": float(df['avg_ndvi'].mean()),
            "avg_ndbi": float(df['avg_ndbi'].mean()),
            "elevation": float(df['elevation'].mean()),
            "population": float(df['population'].sum()),  # SUM not MEAN - matches spatial API
            "latitude": float(df['latitude'].mean()),
            "longitude": float(df['longitude'].mean()),
            "base_temperature": float(df['avg_temperature'].mean())
        }

        return baseline

    except Exception as e:
        print(f"Error fetching baseline for {location_name}: {e}")
        return None

# Pydantic Models
class TimeSeriesPredictionRequest(BaseModel):
    city: str  # Can be state or district name
    year_range: List[int]  # [start_year, end_year] e.g., [2026, 2030]
    ndvi_adjustment: float = 0.0  # -1.0 to 1.0
    ndbi_adjustment: float = 0.0  # -1.0 to 1.0
    climate_factor: float = 1.0   # 0.9 to 1.1 (multiplier for climate warming)

class YearPrediction(BaseModel):
    year: int
    temperature: float

class PredictionMetrics(BaseModel):
    peak_temp: float
    avg_increase: float
    trend: str  # 'rising', 'stable', 'falling'
    confidence: float
    baseline_temp: float  # Current baseline temperature

class TimeSeriesPredictionResponse(BaseModel):
    predictions: List[YearPrediction]
    metrics: PredictionMetrics

@router.post("/api/predict-scenario", response_model=TimeSeriesPredictionResponse)
async def predict_timeseries_scenario(request: TimeSeriesPredictionRequest):
    """
    Generate time-series predictions using the Random Forest spatial model.
    Projects future temperatures by applying urbanization trends, population
    growth, and climate warming offsets year-by-year.
    """
    if not rf_model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Get baseline data
    baseline = get_location_baseline(request.city)
    if not baseline:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{request.city}' not found in database"
        )

    state = baseline['state_name']
    pop_growth_rate = estimate_population_growth_rate(state)
    urban_rate = estimate_urbanization_rate(state)

    start_year, end_year = request.year_range
    predictions = []

    for year in range(start_year, end_year + 1):
        years_ahead = year - 2024

        # Project population growth
        future_population = baseline['population'] * ((1 + pop_growth_rate) ** years_ahead)

        # Project urbanization (NDBI increases, NDVI decreases naturally)
        future_ndbi = min(1.0, baseline['avg_ndbi'] + (urban_rate * years_ahead))
        future_ndvi = max(-1.0, baseline['avg_ndvi'] - (urban_rate * 0.5 * years_ahead))

        # Apply user adjustments (the "intervention" scenario)
        future_ndbi = np.clip(future_ndbi + request.ndbi_adjustment, -1.0, 1.0)
        future_ndvi = np.clip(future_ndvi + request.ndvi_adjustment, -1.0, 1.0)

        # Climate warming offset (0.025°C per year)
        climate_offset = 0.025 * years_ahead * request.climate_factor

        # Create feature DataFrame matching RF model: ['NDVI', 'NDBI', 'Elevation', 'Population']
        features = pd.DataFrame([{
            'NDVI': future_ndvi,
            'NDBI': future_ndbi,
            'Elevation': baseline['elevation'],
            'Population': future_population
        }])

        # Predict using the Random Forest model
        pred_temp = float(rf_model.predict(features)[0])

        # Add climate warming offset on top of RF prediction
        pred_temp += climate_offset

        predictions.append(YearPrediction(
            year=year,
            temperature=round(pred_temp, 2)
        ))

    # Calculate metrics
    temps = [p.temperature for p in predictions]
    peak_temp = max(temps)
    avg_increase = temps[-1] - temps[0] if len(temps) > 1 else 0.0

    if avg_increase > 0.5:
        trend = 'rising'
    elif avg_increase < -0.5:
        trend = 'falling'
    else:
        trend = 'stable'

    # Confidence decreases with projection horizon
    years_span = end_year - start_year + 1
    confidence = max(0.65, 1.0 - (years_span * 0.03))

    # Also predict baseline temp using RF model (no adjustments) for consistency
    baseline_features = pd.DataFrame([{
        'NDVI': baseline['avg_ndvi'],
        'NDBI': baseline['avg_ndbi'],
        'Elevation': baseline['elevation'],
        'Population': baseline['population']
    }])
    model_baseline_temp = float(rf_model.predict(baseline_features)[0])

    metrics_obj = PredictionMetrics(
        peak_temp=round(peak_temp, 2),
        avg_increase=round(avg_increase, 2),
        trend=trend,
        confidence=round(confidence, 2),
        baseline_temp=round(model_baseline_temp, 2)
    )

    return TimeSeriesPredictionResponse(
        predictions=predictions,
        metrics=metrics_obj
    )

@router.get("/api/predict/model-info")
def get_timeseries_model_info():
    """Get information about the model used for time-series projections"""
    if not rf_model:
        return {"status": "error", "message": "Model not loaded"}

    return {
        "model_type": "Random Forest Regressor (Tuned)",
        "r2_score": 0.9415,
        "rmse": 1.38,
        "features": ["NDVI", "NDBI", "Elevation", "Population"],
        "description": "Random Forest spatial model with urbanization and climate trend projections"
    }
