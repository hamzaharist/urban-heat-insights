# Data Models - Backend

This document outlines the primary data structures that drive the Urban Heat Insights Supabase instance.

## 1. Primary Aggregate Tables

### `state_aggregates`
Contains the summarized environmental data at the Macro state-level.
- **id** (UUID, Primary Key)
- **state** (String): e.g., "Kuala Lumpur"
- **country** (String): Always "Malaysia"
- **year** (Integer): e.g., 2024
- **month** (Integer)
- **avg_lst** (Float): Spatially averaged Land Surface Temperature (°C)
- **avg_ndvi** (Float): Normalized Difference Vegetation Index
- **avg_ndbi** (Float): Normalized Difference Built-up Index
- **geometry** (Geometry / JSONB): The polygon boundary for Mapbox.

### `district_aggregates`
The core micro-level table used by the interactive heat maps and scenario simulator.
- **id** (UUID, Primary Key)
- **district** (String)
- **state** (String)
- **population** (Integer): Sourced from official census/gridded population datasets.
- **elevation** (Float): Sourced from SRTM DEM.
- *(Inherits all time/environmental metrics from state_aggregates downscaled to district geometries)*

## 2. ML Training Matrix
### `UHI_Training_Data_Malaysia_Combined`
The raw flattened matrix (80,000 samples) used to train the Scikit-learn Random Forest and Catboost models. Contains continuous floating schemas for NDVI, NDBI, Elevation, Population, and the target vector LST.

## 3. Migration Strategy
Migrations are tracked via Python scripts (`setup_supabase.py`, `create_district_aggregates_table.py`) driving direct SQL DDL injections over the Supabase Python Client. No ORM (like Prisma or SQLAlchemy) is used; rather, direct SQL executions via `.sql` files ensure rapid PostGIS compatibility.
