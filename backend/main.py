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
from prediction_api import router as prediction_router, load_model

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
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:8081")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include prediction router
app.include_router(prediction_router)

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
    load_model()  # Load ML prediction model

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3003))  # Changed to 3003 to avoid conflicts
    uvicorn.run(app, host="0.0.0.0", port=port)
