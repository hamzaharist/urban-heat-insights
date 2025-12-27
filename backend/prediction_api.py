from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# ---------------------------------------------------------
# CONSTANTS & CONFIG
# ---------------------------------------------------------
MODEL_PATH = Path(__file__).parent / "models" / "xgboost_best_spatial_model.pkl"

# Supabase configuration - lazy loaded
_supabase_client = None

def get_supabase():
    """Get or create Supabase client (lazy initialization)"""
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
        if url and key:
            _supabase_client = create_client(url, key)
    return _supabase_client

# Global Variables
model = None

# ---------------------------------------------------------
# INITIALIZATION
# ---------------------------------------------------------
def load_resources():
    """Load ML model on startup (data loaded on-demand)"""
    global model
    
    # Load Model
    try:
        if MODEL_PATH.exists():
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print(f"✓ ML model loaded from {MODEL_PATH}")
        else:
            print(f"⚠ Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"✗ Failed to load ML model: {e}")
    
    print("✓ Prediction API ready (data loaded on-demand from Supabase)")

# Load immediately
load_resources()

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def get_location_baseline(location_name: str) -> dict:
    """
    Query Supabase to get baseline environmental data for a location.
    Tries to match state first, then district.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return None
        
        # Try state-level match
        response = supabase.table('hotspots').select(
            'avg_ndvi, avg_ndbi, elevation, population, latitude, longitude, avg_temperature'
        ).eq('state_name', location_name).execute()
        
        # If no state match, try district
        if not response.data or len(response.data) == 0:
            response = supabase.table('hotspots').select(
                'avg_ndvi, avg_ndbi, elevation, population, latitude, longitude, avg_temperature'
            ).eq('district_name', location_name).execute()
        
        if not response.data or len(response.data) == 0:
            return None
        
        # Aggregate the results (in case multiple hotspots for same location)
        df = pd.DataFrame(response.data)
        
        baseline = {
            "NDVI": float(df['avg_ndvi'].mean()) if df['avg_ndvi'].notna().any() else 0.5,
            "NDBI": float(df['avg_ndbi'].mean()) if df['avg_ndbi'].notna().any() else 0.3,
            "Elevation": float(df['elevation'].mean()) if df['elevation'].notna().any() else 100.0,
            "Population": float(df['population'].mean()) if df['population'].notna().any() else 100000.0,
            "latitude": float(df['latitude'].mean()),
            "longitude": float(df['longitude'].mean()),
            "base_temp": float(df['avg_temperature'].mean())
        }
        
        return baseline
        
    except Exception as e:
        print(f"Error fetching baseline for {location_name}: {e}")
        return None

# ---------------------------------------------------------
# Pydantic MODELS
# ---------------------------------------------------------
class ScenarioRequest(BaseModel):
    city: str
    target_ndvi: Optional[float] = None  # Specific target value (e.g. 0.6)
    ndvi_change: Optional[float] = None  # Relative change (e.g. +0.1)
    target_ndbi: Optional[float] = None
    ndbi_change: Optional[float] = None
    
    # Optional overrides for advanced users
    elevation: Optional[float] = None
    population: Optional[float] = None

class ModelFeatureImportance(BaseModel):
    feature: str
    importance: float

class ValidRange(BaseModel):
    min: float
    max: float
    avg: float

class CityBaseline(BaseModel):
    ndvi: ValidRange
    ndbi: ValidRange
    temp: ValidRange

class ScenarioResponse(BaseModel):
    original_temp: float
    predicted_temp: float
    temp_difference: float
    
    original_ndvi: float
    new_ndvi: float
    
    original_ndbi: float
    new_ndbi: float
    
    confidence_score: float # Model R2
    notes: List[str]

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------

@router.get("/api/predict/model-info")
def get_model_info():
    """Get information about the currently loaded model"""
    if not model:
        return {"status": "error", "message": "Model not loaded"}
    
    # Extract feature importance if available (XGBoost)
    features = []
    try:
        # Check if it's an XGBoost model
        if hasattr(model, 'feature_importances_'):
            # The training script used these columns in this order:
            feature_names = ['NDVI', 'NDBI', 'Elevation', 'Population', 'latitude', 'longitude']
            importances = model.feature_importances_
            
            for name, imp in zip(feature_names, importances):
                features.append({"feature": name, "importance": float(imp)})
            
            # Sort highest first
            features.sort(key=lambda x: x["importance"], reverse=True)
    except:
        pass

    return {
        "model_type": "XGBoost Spatial Regression",
        "r2_score": 0.88, # From our training matrix
        "rmse": 1.29,
        "features": features
    }

@router.post("/api/predict/scenario", response_model=ScenarioResponse)
async def predict_scenario(request: ScenarioRequest):
    """
    Predict temperature based on environmental changes.
    Example: "If I increase KL's NDVI by 0.2, what is the new temperature?"
    """
    if not model:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    # 1. Get City Baseline from Supabase (on-demand)
    baseline = get_location_baseline(request.city)
    
    if not baseline:
        raise HTTPException(
            status_code=404, 
            detail=f"City '{request.city}' not found in database. Try: Selangor, Penang, Johor, or specific districts."
        )

    # 2. Determine New Feature Values
    # NDVI
    current_ndvi = baseline['NDVI']
    if request.target_ndvi is not None:
        new_ndvi = request.target_ndvi
    elif request.ndvi_change is not None:
        new_ndvi = current_ndvi + request.ndvi_change
    else:
        new_ndvi = current_ndvi # No change
    
    # NDBI
    current_ndbi = baseline['NDBI']
    if request.target_ndbi is not None:
        new_ndbi = request.target_ndbi
    elif request.ndbi_change is not None:
        new_ndbi = current_ndbi + request.ndbi_change
    else:
        new_ndbi = current_ndbi

    # Clamp physically possible values
    new_ndvi = max(-1.0, min(1.0, new_ndvi))
    new_ndbi = max(-1.0, min(1.0, new_ndbi))

    # Other features (constant unless overridden)
    elevation = request.elevation if request.elevation is not None else baseline['Elevation']
    population = request.population if request.population is not None else baseline['Population']
    lat = baseline['latitude']
    lon = baseline['longitude']

    # 3. Create Prediction DataFrame
    # Must match training order: ['NDVI', 'NDBI', 'Elevation', 'Population', 'latitude', 'longitude']
    input_data = pd.DataFrame([{
        'NDVI': new_ndvi,
        'NDBI': new_ndbi,
        'Elevation': elevation,
        'Population': population,
        'latitude': lat,
        'longitude': lon
    }])

    # 4. Predict
    try:
        pred_temp = float(model.predict(input_data)[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # 5. Construct Response
    base_temp = baseline['base_temp'] # This is the average from data, might differ slightly from model(base_features)
    
    # For consistency, let's also predict the baseline using the model so the DELTA is purely model-driven
    baseline_input = pd.DataFrame([{
        'NDVI': current_ndvi,
        'NDBI': current_ndbi,
        'Elevation': baseline['Elevation'],
        'Population': baseline['Population'],
        'latitude': lat,
        'longitude': lon
    }])
    model_base_temp = float(model.predict(baseline_input)[0])
    
    # We report the model's base temp to ensure the difference makes sense
    diff = pred_temp - model_base_temp

    notes = []
    if new_ndvi > current_ndvi:
        notes.append(f"Increasing vegetation (NDVI) by {(new_ndvi - current_ndvi):.2f} reduces heat.")
    if new_ndbi < current_ndbi:
        notes.append(f"Reducing built-up density (NDBI) by {(current_ndbi - new_ndbi):.2f} helps cooling.")

    return ScenarioResponse(
        original_temp=round(model_base_temp, 2),
        predicted_temp=round(pred_temp, 2),
        temp_difference=round(diff, 2),
        original_ndvi=round(current_ndvi, 3),
        new_ndvi=round(new_ndvi, 3),
        original_ndbi=round(current_ndbi, 3),
        new_ndbi=round(new_ndbi, 3),
        confidence_score=0.88, # R2 score
        notes=notes
    )
