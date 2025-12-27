"""
FastAPI server for Google Earth Engine integration
Provides endpoints for LST, NDVI, and UHI analysis
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import ee
from prediction_api import router as prediction_router
from scenarios_api import router as scenarios_router
from heatmap_api import router as heatmap_router
from geojson_api import router as geojson_router
from timeseries_api import router as timeseries_router

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="UHI GEE Backend",
    description="Google Earth Engine API for Urban Heat Island Analysis",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:8080",
        "https://*.vercel.app",  # All Vercel deployments
        "https://urban-heat-insights.vercel.app",  # Production URL
        os.getenv("FRONTEND_URL", "http://localhost:8081"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(prediction_router)
app.include_router(scenarios_router)
app.include_router(heatmap_router)
app.include_router(geojson_router)
app.include_router(timeseries_router)

# Load compliance data for API endpoints
import pandas as pd
from pathlib import Path

compliance_data = None
cities_data = None

def load_compliance_data():
    """Load compliance scores data"""
    global compliance_data, cities_data
    try:
        data_file = Path(__file__).parent / "data" / "compliance_scores_all_cities.csv"
        if data_file.exists():
            compliance_data = pd.read_csv(data_file)
            
            # Create cities summary
            cities_data = compliance_data.groupby(['city', 'State']).agg({
                'gbi_score': 'mean',
                'sdg11_score': 'mean',
                'green_cover_percentage': 'mean',
                'property_risk_score': 'mean'
            }).reset_index()
            
            print(f"✓ Loaded compliance data for {len(cities_data)} cities")
        else:
            print("⚠ Compliance data file not found")
    except Exception as e:
        print(f"✗ Error loading compliance data: {e}")

# Load compliance data on startup
load_compliance_data()

# Initialize Google Earth Engine
def initialize_gee():
    """Initialize Google Earth Engine with service account"""
    try:
        # Get credentials from environment
        project_id = os.getenv("GEE_PROJECT_ID")
        key_file = os.getenv("GEE_PRIVATE_KEY_PATH")
        
        if not project_id:
            raise ValueError("GEE_PROJECT_ID not set in environment")
        
        # Initialize with service account
        if key_file and os.path.exists(key_file):
            credentials = ee.ServiceAccountCredentials(
                email=None,  # Will be read from key file
                key_file=key_file
            )
            ee.Initialize(credentials, project=project_id)
        else:
            # Try to initialize with default credentials
            ee.Initialize(project=project_id)
        
        print(f"✓ Google Earth Engine initialized with project: {project_id}")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize Google Earth Engine: {str(e)}")
        return False

# Initialize GEE on startup
@app.on_event("startup")
async def startup_event():
    initialize_gee()
    
    # Pre-load GeoJSON cache to speed up first request
    from geojson_api import get_hotspots_from_db
    print("Pre-loading GeoJSON cache...")
    try:
        hotspots = get_hotspots_from_db()
        print(f"✓ GeoJSON cache pre-loaded with {len(hotspots)} hotspots")
    except Exception as e:
        print(f"⚠ Warning: Could not pre-load GeoJSON cache: {e}")

# Pydantic models
class LSTResponse(BaseModel):
    temperature: float
    latitude: float
    longitude: float
    date: str
    satellite: str

class NDVIResponse(BaseModel):
    ndvi: float
    latitude: float
    longitude: float
    date: str

class UHIMapRequest(BaseModel):
    bounds: dict
    date: str

class UHIMapResponse(BaseModel):
    mapUrl: str
    bounds: dict

# Health check endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "UHI GEE Backend",
        "version": "1.0.0"
    }

# LST endpoint
@app.get("/api/gee/lst", response_model=LSTResponse)
async def get_land_surface_temperature(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    date: str = Query(..., description="Date in YYYY-MM-DD format")
):
    """
    Get Land Surface Temperature for a specific location and date
    Uses Landsat 8/9 Collection 2 data
    """
    try:
        # Create point geometry
        point = ee.Geometry.Point([lon, lat])
        
        # Get Landsat 8/9 collection
        collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate(date, ee.Date(date).advance(1, 'day')) \
            .filterBounds(point)
        
        # Get the first image
        image = collection.first()
        
        if image is None:
            raise HTTPException(status_code=404, detail="No satellite data available for this date and location")
        
        # Get thermal band (ST_B10 for Landsat 9)
        thermal = image.select('ST_B10')
        
        # Apply scaling factor and convert to Celsius
        # Landsat Collection 2 thermal band scale: 0.00341802 + 149.0
        lst_celsius = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
        
        # Get temperature value at point
        temp_value = lst_celsius.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=30
        ).get('ST_B10')
        
        temperature = temp_value.getInfo()
        
        if temperature is None:
            raise HTTPException(status_code=404, detail="Could not extract temperature value")
        
        return LSTResponse(
            temperature=round(temperature, 2),
            latitude=lat,
            longitude=lon,
            date=date,
            satellite="LANDSAT/LC09/C02/T1_L2"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing LST: {str(e)}")

# NDVI endpoint
@app.get("/api/gee/ndvi", response_model=NDVIResponse)
async def get_ndvi(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    date: str = Query(..., description="Date in YYYY-MM-DD format")
):
    """
    Get NDVI (Normalized Difference Vegetation Index) for a location
    Uses Landsat 8/9 Collection 2 data
    """
    try:
        # Create point geometry
        point = ee.Geometry.Point([lon, lat])
        
        # Get Landsat collection
        collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate(date, ee.Date(date).advance(1, 'day')) \
            .filterBounds(point)
        
        image = collection.first()
        
        if image is None:
            raise HTTPException(status_code=404, detail="No satellite data available")
        
        # Calculate NDVI: (NIR - Red) / (NIR + Red)
        # For Landsat 9: NIR = SR_B5, Red = SR_B4
        nir = image.select('SR_B5')
        red = image.select('SR_B4')
        
        ndvi = nir.subtract(red).divide(nir.add(red))
        
        # Get NDVI value at point
        ndvi_value = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=30
        ).get('SR_B5')
        
        ndvi_result = ndvi_value.getInfo()
        
        if ndvi_result is None:
            raise HTTPException(status_code=404, detail="Could not extract NDVI value")
        
        return NDVIResponse(
            ndvi=round(ndvi_result, 3),
            latitude=lat,
            longitude=lon,
            date=date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing NDVI: {str(e)}")

# UHI Map endpoint
@app.post("/api/gee/uhi-map", response_model=UHIMapResponse)
async def generate_uhi_map(request: UHIMapRequest):
    """
    Generate UHI map visualization for a region
    Returns a map tile URL
    """
    try:
        bounds = request.bounds
        date = request.date
        
        # Create bounding box geometry
        geometry = ee.Geometry.Rectangle([
            bounds['west'],
            bounds['south'],
            bounds['east'],
            bounds['north']
        ])
        
        # Get Landsat collection for the region
        collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate(date, ee.Date(date).advance(1, 'day')) \
            .filterBounds(geometry)
        
        # Create mosaic and calculate LST
        image = collection.mosaic()
        thermal = image.select('ST_B10')
        lst_celsius = thermal.multiply(0.00341802).add(149.0).subtract(273.15)
        
        # Define visualization parameters
        vis_params = {
            'min': 25,
            'max': 45,
            'palette': ['blue', 'cyan', 'green', 'yellow', 'orange', 'red']
        }
        
        # Get map tile URL
        map_id = lst_celsius.getMapId(vis_params)
        
        return UHIMapResponse(
            mapUrl=map_id['tile_fetcher'].url_format,
            bounds=bounds
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating UHI map: {str(e)}")

# Compliance endpoints
@app.get("/api/compliance/{city}")
async def get_city_compliance(city: str):
    """
    Get compliance scores for a specific city
    Returns GBI, SDG11 scores, and financial risk metrics
    """
    if compliance_data is None:
        raise HTTPException(status_code=503, detail="Compliance data not loaded")
    
    try:
        # Filter by city (case-insensitive)
        city_data = compliance_data[compliance_data['city'].str.lower() == city.lower()]
        
        if city_data.empty:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found")
        
        # Calculate aggregates
        result = {
            "city": city.title(),
            "state": city_data['State'].iloc[0],
            "total_zones": len(city_data),
            "gbi_score": int(city_data['gbi_score'].mean()),
            "gbi_status": city_data['gbi_status'].mode()[0] if len(city_data) > 0 else "UNKNOWN",
            "sdg11_score": int(city_data['sdg11_score'].mean()),
            "green_cover_percentage": round(float(city_data['green_cover_percentage'].mean()), 1),
            "uhi_intensity": round(float(city_data['uhi_intensity'].mean()), 2),
            "trees_needed": int(city_data['trees_needed'].sum()),
            "property_risk_score": int(city_data['property_risk_score'].mean()),
            "estimated_value_loss": float(city_data['estimated_value_loss'].sum()),
            "zones_pass": int((city_data['gbi_status'] == 'PASS').sum()),
            "zones_warning": int((city_data['gbi_status'] == 'WARNING').sum()),
            "zones_fail": int((city_data['gbi_status'] == 'FAIL').sum())
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching compliance data: {str(e)}")

@app.get("/api/cities")
async def get_all_cities():
    """
    Get list of all cities with basic compliance info
    Returns cities grouped by state
    """
    if cities_data is None:
        raise HTTPException(status_code=503, detail="Cities data not loaded")
    
    try:
        # Convert to dict grouped by state
        cities_by_state = {}
        for _, row in cities_data.iterrows():
            state = row['State']
            if state not in cities_by_state:
                cities_by_state[state] = []
            
            cities_by_state[state].append({
                "name": row['city'].title(),
                "gbi_score": int(row['gbi_score']),
                "sdg11_score": int(row['sdg11_score']),
                "green_cover": round(float(row['green_cover_percentage']), 1),
                "risk_score": int(row['property_risk_score'])
            })
        
        # Sort cities within each state
        for state in cities_by_state:
            cities_by_state[state] = sorted(cities_by_state[state], key=lambda x: x['name'])
        
        return {
            "total_cities": len(cities_data),
            "total_states": len(cities_by_state),
            "cities_by_state": cities_by_state
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cities: {str(e)}")

@app.get("/api/compliance/summary")
async def get_compliance_summary():
    """
    Get overall compliance summary across all cities
    """
    if compliance_data is None:
        raise HTTPException(status_code=503, detail="Compliance data not loaded")
    
    try:
        summary = {
            "total_zones": len(compliance_data),
            "total_cities": compliance_data['city'].nunique(),
            "total_states": compliance_data['State'].nunique(),
            "avg_gbi_score": round(float(compliance_data['gbi_score'].mean()), 1),
            "avg_sdg11_score": round(float(compliance_data['sdg11_score'].mean()), 1),
            "avg_green_cover": round(float(compliance_data['green_cover_percentage'].mean()), 1),
            "avg_uhi_intensity": round(float(compliance_data['uhi_intensity'].mean()), 2),
            "total_trees_needed": int(compliance_data['trees_needed'].sum()),
            "total_value_at_risk": float(compliance_data['estimated_value_loss'].sum()),
            "zones_pass": int((compliance_data['gbi_status'] == 'PASS').sum()),
            "zones_warning": int((compliance_data['gbi_status'] == 'WARNING').sum()),
            "zones_fail": int((compliance_data['gbi_status'] == 'FAIL').sum()),
            "compliance_rate": round(float((compliance_data['gbi_status'] == 'PASS').sum() / len(compliance_data) * 100), 1)
        }
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3004))  # Changed to 3004 to avoid conflicts
    uvicorn.run(app, host="0.0.0.0", port=port)

