"""
Time-Series Prediction API
Uses the new population-aware, urbanization-aware model with baseline comparison
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
import os
from supabase import create_client
from dotenv import load_dotenv
import sys

load_dotenv()

router = APIRouter()

# Model path
MODEL_PATH = Path(__file__).parent / "models" / "timeseries_temperature_model.pkl"

# Global variables
model_data = None
supabase_client = None

def get_supabase():
    """Get or create Supabase client"""
    global supabase_client
    if supabase_client is None:
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_ANON_KEY")
        if url and key:
            supabase_client = create_client(url, key)
    return supabase_client

def load_model():
    """Load the time-series model"""
    global model_data
    if model_data is None:
        if MODEL_PATH.exists():
            with open(MODEL_PATH, 'rb') as f:
                model_data = pickle.load(f)
            print(f"[OK] Time-series model loaded: {model_data['model_name']}, R² = {model_data['r2_score']:.3f}")
        else:
            print(f"[WARNING] Model not found at {MODEL_PATH}")
    return model_data

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
            "population": float(df['population'].mean()),
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
    Generate time-series predictions with population growth and urbanization
    """
    if not model_data:
        raise HTTPException(status_code=503, detail="Model not loaded")

    model = model_data['model']
    feature_cols = model_data['feature_cols']

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

        # Project population
        future_population = baseline['population'] * ((1 + pop_growth_rate) ** years_ahead)

        # Project urbanization (NDBI increases, NDVI decreases)
        future_ndbi = min(1.0, baseline['avg_ndbi'] + (urban_rate * years_ahead))
        future_ndvi = max(-1.0, baseline['avg_ndvi'] - (urban_rate * 0.5 * years_ahead))

        # Apply user adjustments
        future_ndbi = np.clip(future_ndbi + request.ndbi_adjustment, -1.0, 1.0)
        future_ndvi = np.clip(future_ndvi + request.ndvi_adjustment, -1.0, 1.0)

        # Climate warming (0.025°C per year, adjusted by factor)
        climate_offset = 0.025 * years_ahead * request.climate_factor

        # Create features
        features = pd.DataFrame([{
            'avg_ndvi': future_ndvi,
            'avg_ndbi': future_ndbi,
            'elevation': baseline['elevation'],
            'population': future_population,
            'latitude': baseline['latitude'],
            'longitude': baseline['longitude'],
            'years_from_baseline': years_ahead,
            'climate_offset': climate_offset
        }])

        # Predict
        pred_temp = float(model.predict(features[feature_cols])[0])

        # Add climate offset
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

    # Confidence decreases with time
    years_span = end_year - start_year + 1
    confidence = max(0.65, 1.0 - (years_span * 0.03))

    # Baseline temperature from the database
    baseline_temp = baseline.get('base_temperature', 0)

    metrics_obj = PredictionMetrics(
        peak_temp=round(peak_temp, 2),
        avg_increase=round(avg_increase, 2),
        trend=trend,
        confidence=round(confidence, 2),
        baseline_temp=round(baseline_temp, 2)
    )

    return TimeSeriesPredictionResponse(
        predictions=predictions,
        metrics=metrics_obj
    )

@router.get("/api/predict/model-info")
def get_timeseries_model_info():
    """Get information about the time-series model"""
    if not model_data:
        return {"status": "error", "message": "Model not loaded"}

    return {
        "model_type": model_data['model_name'],
        "r2_score": round(model_data['r2_score'], 3),
        "train_mae": round(model_data['train_mae'], 3),
        "test_mae": round(model_data['test_mae'], 3),
        "features": model_data['feature_cols'],
        "description": "Time-series model with population growth and urbanization trends"
    }
