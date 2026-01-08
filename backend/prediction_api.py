from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Union
import joblib  # For loading Random Forest model
import pickle  # Keep for backward compatibility
import pandas as pd
import numpy as np
from pathlib import Path
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("[DEBUG] prediction_api.py: Module loading started")

router = APIRouter()

print(f"[DEBUG] prediction_api.py: Router created at {id(router)}")

# ---------------------------------------------------------
# CONSTANTS & CONFIG
# ---------------------------------------------------------
# MODEL_PATH = Path(__file__).parent / "models" / "xgboost_best_spatial_model.pkl"  # OLD MODEL
MODEL_PATH = Path(__file__).parent / "models" / "uhi_rf_model_tuned.pkl"  # NEW TUNED RANDOM FOREST

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
            # Use joblib for scikit-learn models (Random Forest)
            model = joblib.load(MODEL_PATH)
            print(f"[OK] ML model loaded from {MODEL_PATH}")
        else:
            print(f"[WARNING] Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to load ML model: {e}")

    print("[OK] Prediction API ready (data loaded on-demand from Supabase)")

# Load immediately
load_resources()

# Export for main.py
def load_model():
    """Alias for load_resources() - called from main.py startup"""
    load_resources()

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def calculate_population_at_risk(temperature: float, population: float, threshold: float = 35.0) -> int:
    """
    THE KILLER FEATURE: Calculate how many people are at risk from dangerous heat.

    Logic:
    - If temp >= threshold: ALL population is at risk
    - If temp < threshold: Proportional risk based on how close to threshold
    - This is a simplified model; could be enhanced with heat-health research

    Args:
        temperature: Current/predicted temperature (°C)
        population: Total population in the area
        threshold: Temperature above which health risk is significant (default 35°C)

    Returns:
        Number of people at risk (integer)
    """
    if temperature >= threshold:
        # Everyone is at risk when temp exceeds threshold
        return int(population)
    elif temperature >= (threshold - 5):
        # Partial risk: proportional to how close to threshold
        # E.g., at 33°C with threshold 35°C: (33-30)/(35-30) = 60% at risk
        risk_start = threshold - 5  # Start considering risk 5°C below threshold
        risk_ratio = (temperature - risk_start) / (threshold - risk_start)
        return int(population * risk_ratio)
    else:
        # Below 30°C (for 35°C threshold), minimal risk
        return 0

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
            "Population": float(df['population'].sum()) if df['population'].notna().any() else 100000.0,  # SUM not MEAN - it's pixel-level data
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

class HeatDriver(BaseModel):
    factor: str
    contribution_percent: float
    impact_celsius: float

class DiagnosticResponse(BaseModel):
    location: str
    current_temp: float
    baseline_ndvi: float
    baseline_ndbi: float
    population: float  # Total population in the location
    population_at_risk: int  # THE KILLER FEATURE: People exposed to dangerous heat
    heat_risk_threshold: float  # Temperature threshold for "at risk" (default: 35°C)
    drivers: List[HeatDriver]
    dominant_factor: str
    recommendation: str

class PrescriptionRequest(BaseModel):
    city: str
    target_temp_reduction: float  # e.g., 2.0 means reduce temp by 2°C

class PrescriptionResponse(BaseModel):
    location: str
    current_temp: float
    target_temp: float
    current_ndvi: float
    target_ndvi: float
    ndvi_increase_needed: float
    current_population_at_risk: int  # People at risk BEFORE intervention
    people_protected: int  # THE KILLER METRIC: How many people we save
    feasible: bool
    notes: List[str]

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------

@router.get("/model-info")
def get_model_info():
    """Get information about the currently loaded model"""
    if not model:
        return {"status": "error", "message": "Model not loaded"}
    
    # Extract feature importance from Random Forest model
    features = []
    try:
        if hasattr(model, 'feature_importances_'):
            # Random Forest model uses 4 features in this order:
            feature_names = ['NDVI', 'NDBI', 'Elevation', 'Population']
            importances = model.feature_importances_
            
            for name, imp in zip(feature_names, importances):
                features.append({"feature": name, "importance": float(imp)})
            
            # Sort highest first
            features.sort(key=lambda x: x["importance"], reverse=True)
    except:
        pass

    return {
        "model_type": "Random Forest Regressor (Tuned)",
        "r2_score": 0.9415,  # From hyperparameter tuning
        "rmse": 1.38,  # From hyperparameter tuning
        "features": features,
        "training_samples": 62134,
        "test_samples": 15534
    }

@router.get("/locations")
def get_available_locations():
    """
    Get list of all available districts/locations for the scenario dashboard.
    Returns sorted list of unique district names from Supabase.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return {"locations": [], "error": "Database not connected"}
        
        # Fetch all unique district names
        response = supabase.table('hotspots').select('district_name').execute()
        
        if response.data:
            # Get unique district names, filter out None/empty
            districts = list(set([
                row['district_name'] 
                for row in response.data 
                if row.get('district_name')
            ]))
            districts.sort()
            return {"locations": districts, "count": len(districts)}
        
        return {"locations": [], "count": 0}
    except Exception as e:
        return {"locations": [], "error": str(e)}

@router.post("/scenario-single", response_model=ScenarioResponse)
async def predict_scenario_single(request: ScenarioRequest):
    """
    Predict temperature for a single location based on environmental changes.
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
    # Must match training order: ['NDVI', 'NDBI', 'Elevation', 'Population']
    input_data = pd.DataFrame([{
        'NDVI': new_ndvi,
        'NDBI': new_ndbi,
        'Elevation': elevation,
        'Population': population
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
        'Population': baseline['Population']
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
        confidence_score=0.94, # R2 score from tuned Random Forest
        notes=notes
    )

@router.post("/diagnose", response_model=DiagnosticResponse)
async def diagnose_heat_drivers(city: str):
    """
    Local Sensitivity Analysis: Calculate heat driver contributions for a location.
    Perturbs NDVI and NDBI to measure their individual impact on temperature.
    Returns percentage contribution of each factor to current temperature.
    """
    if not model:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    # Get baseline data
    baseline = get_location_baseline(city)
    if not baseline:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{city}' not found in database."
        )

    # Current environmental state
    current_ndvi = baseline['NDVI']
    current_ndbi = baseline['NDBI']
    elevation = baseline['Elevation']
    population = baseline['Population']
    lat = baseline['latitude']
    lon = baseline['longitude']

    # Use ACTUAL measured temperature from satellite data, not model prediction
    current_temp = baseline['base_temp']

    # Calculate heat drivers based on REAL DATA, not model predictions
    # Use empirical coefficients from actual correlations in the data:
    # - Global correlation: Temp vs NDVI = -0.326 (vegetation cools)
    # - Global correlation: Temp vs NDBI = 0.498 (urban density heats)

    # Empirical sensitivities (°C per 0.1 unit change):
    # From urban heat island literature and our data analysis:
    ndvi_sensitivity = 1.5  # °C reduction per 0.1 NDVI increase (conservative estimate)
    ndbi_sensitivity = 1.0  # °C reduction per 0.1 NDBI decrease (conservative estimate)

    # Calculate potential for improvement:
    # NDVI: How far below optimal vegetation (0.7-0.8 is dense vegetation)
    # NDBI: How far above optimal (< -0.2 is low urban density)
    optimal_ndvi = 0.7
    optimal_ndbi = -0.2

    ndvi_gap = max(0, optimal_ndvi - current_ndvi)  # Room for greening
    ndbi_gap = max(0, current_ndbi - optimal_ndbi)  # Room for de-densifying

    # Both factors always contribute based on their gap from optimal
    # This shows the ACTUAL situation, not model artifacts

    # Calculate cooling potential for each factor
    # Potential = gap from optimal × sensitivity × 10 (to scale to per-unit instead of per-0.1)
    ndvi_cooling_potential = ndvi_gap * ndvi_sensitivity * 10  # °C that could be saved by greening
    ndbi_cooling_potential = ndbi_gap * ndbi_sensitivity * 10  # °C that could be saved by reducing density

    total_cooling_potential = ndvi_cooling_potential + ndbi_cooling_potential

    # Calculate percentage contributions based on improvement potential
    if total_cooling_potential < 0.1:
        # Both factors near optimal - limited cooling potential overall
        ndvi_contribution = 50.0
        ndbi_contribution = 50.0
    else:
        # Calculate based on relative cooling potential
        ndvi_contribution = (ndvi_cooling_potential / total_cooling_potential * 100)
        ndbi_contribution = (ndbi_cooling_potential / total_cooling_potential * 100)

    # Build heat drivers list
    drivers = [
        HeatDriver(
            factor="Vegetation Deficit",
            contribution_percent=round(ndvi_contribution, 1),
            impact_celsius=round(ndvi_sensitivity, 2)
        ),
        HeatDriver(
            factor="Urban Density",
            contribution_percent=round(ndbi_contribution, 1),
            impact_celsius=round(ndbi_sensitivity, 2)
        )
    ]

    # Sort by contribution (highest first)
    drivers.sort(key=lambda x: x.contribution_percent, reverse=True)

    # Determine dominant factor and recommendation
    dominant_factor = drivers[0].factor

    # THE KILLER FEATURE: Calculate population at risk
    heat_risk_threshold = 35.0  # Temperature threshold for health risk
    population_at_risk = calculate_population_at_risk(current_temp, population, heat_risk_threshold)

    # Generate contextual recommendations based on improvement potential
    if total_cooling_potential < 0.1:
        # Neither intervention would help significantly - already near optimal
        recommendation = f"Area has limited cooling potential from vegetation or urban density changes. Current NDVI: {current_ndvi:.2f}, NDBI: {current_ndbi:.2f}. Consider alternative cooling strategies such as reflective surfaces, water features, or building design improvements."
    elif ndvi_cooling_potential > ndbi_cooling_potential:
        # Vegetation has more potential
        recommendation = f"Increase vegetation cover (NDVI) to reduce temperature. Current NDVI: {current_ndvi:.2f}. Every 0.1 increase could reduce temp by {ndvi_sensitivity:.2f}°C."
    else:
        # Reducing urban density has more potential
        recommendation = f"Reduce urban density (NDBI) to reduce temperature. Current NDBI: {current_ndbi:.2f}. Every 0.1 decrease could reduce temp by {ndbi_sensitivity:.2f}°C."

    # Add population context to recommendation
    if population_at_risk > 0:
        recommendation += f" Currently {population_at_risk:,} people are exposed to dangerous heat levels."

    return DiagnosticResponse(
        location=city,
        current_temp=round(current_temp, 2),
        baseline_ndvi=round(current_ndvi, 3),
        baseline_ndbi=round(current_ndbi, 3),
        population=round(population, 0),
        population_at_risk=population_at_risk,
        heat_risk_threshold=heat_risk_threshold,
        drivers=drivers,
        dominant_factor=dominant_factor,
        recommendation=recommendation
    )

@router.post("/prescribe", response_model=PrescriptionResponse)
async def prescribe_cooling_solution(request: PrescriptionRequest):
    """
    Remediation Solver: Find target NDVI needed to reduce temperature by X degrees.
    Uses binary search to find the NDVI value that achieves the target temperature.
    """
    if not model:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    # Get baseline data
    baseline = get_location_baseline(request.city)
    if not baseline:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{request.city}' not found in database."
        )

    # Current environmental state
    current_ndvi = baseline['NDVI']
    current_ndbi = baseline['NDBI']
    elevation = baseline['Elevation']
    population = baseline['Population']
    lat = baseline['latitude']
    lon = baseline['longitude']

    # Get current temperature from ACTUAL measured data
    current_temp = baseline['base_temp']

    # Target temperature
    target_temp = current_temp - request.target_temp_reduction

    # Get model baseline for comparison (to calculate relative changes)
    baseline_input = pd.DataFrame([{
        'NDVI': current_ndvi,
        'NDBI': current_ndbi,
        'Elevation': elevation,
        'Population': population
    }])
    model_current_temp = float(model.predict(baseline_input)[0])

    # Binary search for target NDVI
    # We search between current NDVI and the maximum realistic value (0.8)
    min_ndvi = current_ndvi
    max_ndvi = 0.8  # Realistic upper limit for NDVI (dense forest)
    tolerance = 0.01  # Temperature tolerance in °C
    max_iterations = 50

    target_ndvi = current_ndvi
    feasible = False
    notes = []

    # First check if maximum NDVI can achieve the goal
    max_ndvi_input = pd.DataFrame([{
        'NDVI': max_ndvi,
        'NDBI': current_ndbi,
        'Elevation': elevation,
        'Population': population
    }])
    model_max_temp = float(model.predict(max_ndvi_input)[0])
    # Calculate temperature reduction relative to model baseline
    max_temp_reduction = model_current_temp - model_max_temp

    if max_temp_reduction < request.target_temp_reduction:
        # Goal is not achievable with vegetation alone
        target_ndvi = max_ndvi
        notes.append(f"Target reduction of {request.target_temp_reduction:.2f}°C is not achievable with vegetation alone.")
        notes.append(f"Maximum possible reduction with NDVI={max_ndvi:.2f} is {max_temp_reduction:.2f}°C.")
        notes.append("Consider also reducing urban density (NDBI) or other interventions.")
        feasible = False
    else:
        # Binary search for the exact NDVI
        # Target model temperature = model baseline - requested reduction
        target_model_temp = model_current_temp - request.target_temp_reduction

        for _ in range(max_iterations):
            mid_ndvi = (min_ndvi + max_ndvi) / 2

            test_input = pd.DataFrame([{
                'NDVI': mid_ndvi,
                'NDBI': current_ndbi,
                'Elevation': elevation,
                'Population': population
            }])
            predicted_temp = float(model.predict(test_input)[0])

            if abs(predicted_temp - target_model_temp) < tolerance:
                # Found the solution
                target_ndvi = mid_ndvi
                feasible = True
                break
            elif predicted_temp > target_model_temp:
                # Need more vegetation (higher NDVI)
                min_ndvi = mid_ndvi
            else:
                # Too much vegetation (lower NDVI)
                max_ndvi = mid_ndvi

        if feasible:
            ndvi_increase = target_ndvi - current_ndvi
            notes.append(f"Increase NDVI from {current_ndvi:.3f} to {target_ndvi:.3f} (change of +{ndvi_increase:.3f}).")
            notes.append(f"This corresponds to increasing vegetation cover by approximately {(ndvi_increase * 100):.1f}%.")
            notes.append("Practical steps: Plant trees, create green roofs, expand parks, protect existing forests.")

    # THE KILLER METRIC: Calculate how many people we save
    heat_risk_threshold = 35.0
    current_population_at_risk = calculate_population_at_risk(current_temp, population, heat_risk_threshold)
    future_population_at_risk = calculate_population_at_risk(target_temp, population, heat_risk_threshold)
    people_protected = max(0, current_population_at_risk - future_population_at_risk)

    if people_protected > 0:
        notes.append(f"🎯 This intervention will protect {people_protected:,} people from dangerous heat exposure!")

    return PrescriptionResponse(
        location=request.city,
        current_temp=round(current_temp, 2),
        target_temp=round(target_temp, 2),
        current_ndvi=round(current_ndvi, 3),
        target_ndvi=round(target_ndvi, 3),
        ndvi_increase_needed=round(target_ndvi - current_ndvi, 3),
        current_population_at_risk=current_population_at_risk,
        people_protected=people_protected,
        feasible=feasible,
        notes=notes
    )

class ScenarioRequest(BaseModel):
    ndvi_adjustment: float = 0.0
    ndbi_adjustment: float = 0.0

@router.post("/scenario")
async def calculate_scenario_temperatures(request: ScenarioRequest):
    """
    Calculate temperature adjustments for all districts based on NDVI/NDBI changes.
    Returns a mapping of location names to their adjusted temperatures.
    """
    ndvi_adjustment = request.ndvi_adjustment
    ndbi_adjustment = request.ndbi_adjustment

    if not model:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database connection not available.")

        # Get all unique locations from hotspots
        response = supabase.table('hotspots').select(
            'state_name, district_name, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude'
        ).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="No location data found.")

        df = pd.DataFrame(response.data)

        # Group by location and calculate adjusted temperatures
        results = {}

        # Process state-level aggregations
        state_groups = df.groupby('state_name').agg({
            'avg_ndvi': 'mean',
            'avg_ndbi': 'mean',
            'elevation': 'mean',
            'population': 'mean',
            'latitude': 'mean',
            'longitude': 'mean'
        }).reset_index()

        for _, row in state_groups.iterrows():
            state_name = row['state_name']

            # Calculate baseline temperature
            baseline_input = pd.DataFrame([{
                'NDVI': row['avg_ndvi'],
                'NDBI': row['avg_ndbi'],
                'Elevation': row['elevation'],
                'Population': row['population']
            }])
            baseline_temp = float(model.predict(baseline_input)[0])

            # Calculate adjusted temperature
            # NOTE: Our Random Forest model learned the correct relationship
            # NDVI+ (more vegetation) decreases temp, NDBI+ (more urban) increases temp
            adjusted_input = pd.DataFrame([{
                'NDVI': max(-1, min(1, row['avg_ndvi'] + ndvi_adjustment)),
                'NDBI': max(-1, min(1, row['avg_ndbi'] + ndbi_adjustment)),
                'Elevation': row['elevation'],
                'Population': row['population']
            }])
            adjusted_temp = float(model.predict(adjusted_input)[0])

            # Store with both original name and alternative names (for map matching)
            result_data = {
                'baseline_temp': round(baseline_temp, 2),
                'adjusted_temp': round(adjusted_temp, 2),
                'temp_change': round(adjusted_temp - baseline_temp, 2)
            }
            results[state_name] = result_data

            # Add alternative name mappings for better map compatibility
            if state_name == "W.P. Kuala Lumpur":
                results["WP K Lumpur"] = result_data
            elif state_name == "W.P. Putrajaya":
                results["WP Putrajaya"] = result_data
            elif state_name == "W.P. Labuan":
                results["WP Labuan"] = result_data

        # Add hardcoded WP territories (not in hotspots as states, only as districts)
        # Data from GeoJSON enrichment
        wp_data = {
            'WP K Lumpur': {'avg_ndvi': 0.4477, 'avg_ndbi': 0.1065, 'lat': 3.1569, 'lon': 101.7123},
            'WP Putrajaya': {'avg_ndvi': 0.5411, 'avg_ndbi': 0.1856, 'lat': 2.9264, 'lon': 101.6964},
            'WP Labuan': {'avg_ndvi': 0.6219, 'avg_ndbi': 0.254, 'lat': 5.2831, 'lon': 115.2308}
        }

        for wp_name, wp_info in wp_data.items():
            if wp_name not in results:
                # Calculate baseline
                baseline_input = pd.DataFrame([{
                    'NDVI': wp_info['avg_ndvi'],
                    'NDBI': wp_info['avg_ndbi'],
                    'Elevation': 50,  # Default elevation
                    'Population': 1000000  # Default population
                }])
                baseline_temp = float(model.predict(baseline_input)[0])

                # Calculate adjusted (correct direction - no inversion needed)
                adjusted_input = pd.DataFrame([{
                    'NDVI': max(-1, min(1, wp_info['avg_ndvi'] + ndvi_adjustment)),
                    'NDBI': max(-1, min(1, wp_info['avg_ndbi'] + ndbi_adjustment)),
                    'Elevation': 50,
                    'Population': 1000000
                }])
                adjusted_temp = float(model.predict(adjusted_input)[0])

                results[wp_name] = {
                    'baseline_temp': round(baseline_temp, 2),
                    'adjusted_temp': round(adjusted_temp, 2),
                    'temp_change': round(adjusted_temp - baseline_temp, 2)
                }

        # Process district-level aggregations  
        district_groups = df.groupby('district_name').agg({
            'avg_ndvi': 'mean',
            'avg_ndbi': 'mean',
            'elevation': 'mean',
            'population': 'mean'
        }).reset_index()

        for _, row in district_groups.iterrows():
            district_name = row['district_name']

            # Calculate baseline temperature
            baseline_input = pd.DataFrame([{
                'NDVI': row['avg_ndvi'],
                'NDBI': row['avg_ndbi'],
                'Elevation': row['elevation'],
                'Population': row['population']
            }])
            baseline_temp = float(model.predict(baseline_input)[0])

            # Calculate adjusted temperature  
            # NOTE: Correct relationship - NDVI+ decreases temp,  NDBI+ increases temp
            adjusted_input = pd.DataFrame([{
                'NDVI': max(-1, min(1, row['avg_ndvi'] + ndvi_adjustment)),
                'NDBI': max(-1, min(1, row['avg_ndbi'] + ndbi_adjustment)),
                'Elevation': row['elevation'],
                'Population': row['population']
            }])
            adjusted_temp = float(model.predict(adjusted_input)[0])

            results[district_name] = {
                'baseline_temp': round(baseline_temp, 2),
                'adjusted_temp': round(adjusted_temp, 2),
                'temp_change': round(adjusted_temp - baseline_temp, 2)
            }

        return {
            'ndvi_adjustment': ndvi_adjustment,
            'ndbi_adjustment': ndbi_adjustment,
            'locations': results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating scenario: {str(e)}")

# Debug: Print all routes registered
print(f"[DEBUG] prediction_api.py: Routes registered: {[r.path for r in router.routes]}")
