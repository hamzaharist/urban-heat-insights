# API Contracts - Backend

This document details the REST endpoints exposed by the Python FastAPI backend (`backend/prediction_api.py` and `backend/timeseries_prediction_api.py`), functioning as the primary interface for remote UI actions.

## 1. Spatial/Prediction Endpoints

### `POST /api/spatial/scenario-single`
- **Purpose**: Feeds adjusted environmental parameters into the Random Forest `.pkl` model to predict new baseline temperatures.
- **Request Body**:
  ```json
  {
    "base_lst": 31.4,
    "base_ndvi": 0.2,
    "base_ndbi": 0.1,
    "elevation": 45.2,
    "population": 12000,
    "ndvi_change": 0.3,
    "ndbi_change": -0.1
  }
  ```
- **Response**:
  ```json
  {
    "new_lst": 29.8,
    "original_predicted_lst": 31.5,
    "temperature_delta": -1.7,
    "feature_contributions": {
      "NDVI": 24.96,
      "NDBI": 38.21,
      "Elevation": 14.26,
      "Population": 22.57
    }
  }
  ```

### `POST /api/spatial/scenario-batch`
- **Purpose**: Processes an array of districts for state-level simulation mapping.
- **Payload**: Accepts an array of the `scenario-single` request objects.
- **Response**: Array of predictions matching the district inputs.

## 2. Time-series Endpoints

### `GET /api/timeseries/city/{city}`
- **Purpose**: Fetches historical and predictive LST curves mapped by Catboost.
- **Parameters**: `city` (string).
- **Response**: 
  ```json
  {
    "city": "Kuala Lumpur",
    "historical_data": [...],
    "predictions": [...]
  }
  ```

### `GET /api/spatial/districts`
- **Purpose**: Returns the spatial coordinates (Longitude/Latitude) arrays used to bound Mapbox GL limits for a given city query.
