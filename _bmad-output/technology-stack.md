# Technology Stack

## Frontend (Web)

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | React (Vite) | ^18.3.1 | High-performance client-side rendering with instant HMR via Vite |
| Language | TypeScript | ^5.8.3 | Strong static typing for robust application code |
| UI Library | Tailwind CSS & Shadcn UI | ^3.4.17 (Tailwind) | Utility-first styling with accessible, headless UI components |
| Maps | Mapbox GL & React-Leaflet | ^3.17.0 (Mapbox) | Rendering high-performance interactive district choropleths and heatmaps |
| State/Data | React Query & Context API | ^5.83.0 | Server state caching and efficient database polling |
| Charts | Recharts | ^2.15.4 | Visualizing temperature trends and historical data |
| Database Client | Supabase JS | ^2.87.1 | Direct frontend querying to the managed Postgres backend |

## Backend (API)

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | FastAPI | 0.109.0 | High-performance async Python web framework for ML inference |
| Language | Python | 3.11+ | Industry standard for machine learning and spatial data processing |
| Database | Supabase (PostgreSQL + PostGIS) | >=2.26.0 | Managed database handling relational aggregates and geospatial queries |
| Server | Uvicorn | 0.27.0 | ASGI web server implementation to run FastAPI |
| Machine Learning | Scikit-learn, XGBoost | 1.4.0 (SK), 2.0.3 (XGB) | Implementation of the spatial Random Forest and tree models for prediction |
| Data Processing | Pandas, PyArrow | 2.1.4 (Pd) | In-memory data manipulation and parquet processing |
| Satellite Data API | Google Earth Engine Python API | 0.1.398 | Extracting satellite imagery (Landsat 8) for analysis |
