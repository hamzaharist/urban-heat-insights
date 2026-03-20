# Urban Heat Insights Malaysia — System Architecture

---

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          URBAN HEAT INSIGHTS MALAYSIA                           │
│                       Full-Stack Geospatial Analytics Platform                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────────────┐
│  DATA SOURCES   │     │  DATA PIPELINE  │     │         STORAGE              │
│                 │     │                 │     │                              │
│ • Google Earth  │────▶│ • GEE Scripts   │────▶│  Supabase PostgreSQL         │
│   Engine (GEE)  │     │ • Data Cleaning │     │  ├── hotspots (42,706)        │
│ • Landsat 8/9   │     │ • Feature Eng.  │     │  ├── temperature_readings     │
│ • LST / NDVI /  │     │ • Model Training│     │  ├── predictions              │
│   NDBI Indices  │     │ • Supabase Load │     │  ├── district_aggregates      │
└─────────────────┘     └─────────────────┘     │  └── state_aggregates        │
                                                 └──────────────┬───────────────┘
                                                                │
                              ┌─────────────────────────────────▼───────────────┐
                              │               BACKEND LAYER (FastAPI)            │
                              │                                                  │
                              │  ┌───────────────┐  ┌────────────────────────┐  │
                              │  │ Spatial API   │  │  Time-Series API       │  │
                              │  │ (RF Model)    │  │  (CatBoost Model)      │  │
                              │  └───────────────┘  └────────────────────────┘  │
                              │  ┌───────────────┐  ┌────────────────────────┐  │
                              │  │ GeoJSON API   │  │  GEE Live API          │  │
                              │  │ (Boundaries)  │  │  (On-demand queries)   │  │
                              │  └───────────────┘  └────────────────────────┘  │
                              └─────────────────────────────────┬───────────────┘
                                                                │ REST/HTTP
                              ┌─────────────────────────────────▼───────────────┐
                              │             FRONTEND LAYER (React + Vite)        │
                              │                                                  │
                              │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
                              │  │ Heatmap  │ │Choropleth│ │  Scenario /    │  │
                              │  │   Page   │ │   Page   │ │  Prediction    │  │
                              │  └──────────┘ └──────────┘ └────────────────┘  │
                              │         Mapbox GL JS + Recharts + shadcn/ui     │
                              └──────────────────────────────────────────────────┘
```

---

## 2. Layer-by-Layer Architecture

### 2.1 Data Ingestion Layer

```
┌──────────────────────────────────────────────────────┐
│                  DATA INGESTION LAYER                 │
│                                                      │
│  Google Earth Engine (Satellite Remote Sensing)      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Landsat 8/9 Collection 2                      │  │
│  │  ├── Band ST_B10 → Land Surface Temp (LST)     │  │
│  │  ├── Bands B4/B5 → NDVI (Vegetation Index)     │  │
│  │  └── Bands B5/B6 → NDBI (Built-up Index)       │  │
│  │                                                │  │
│  │  Temporal Coverage: 2016–2024                  │  │
│  │  Spatial Coverage: Malaysia (all 16 states)    │  │
│  │  Resolution: 30m per pixel                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Processing Scripts (backend/)                       │
│  ├── extract_gee_data.py       → Raw LST/NDVI/NDBI   │
│  ├── extract_missing_districts.py → Gap filling      │
│  ├── train_spatial_model.py   → RF model training    │
│  └── train_timeseries_model.py → CatBoost training   │
└──────────────────────────────────────────────────────┘
```

### 2.2 Machine Learning Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    ML PIPELINE ARCHITECTURE                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    SPATIAL MODEL                          │    │
│  │  Tuned Random Forest (uhi_rf_model_tuned.pkl)            │    │
│  │                                                          │    │
│  │  Inputs:                      Outputs:                   │    │
│  │  ├── NDVI    (24.96% weight) → Predicted LST (°C)        │    │
│  │  ├── NDBI    (38.21% weight) → Confidence Interval       │    │
│  │  ├── Pop. Density (22.57%)  → Heat Risk Score            │    │
│  │  └── Elevation (14.26%)     → Feature Importance         │    │
│  │                                                          │    │
│  │  Performance: R²=0.9415, RMSE=1.38°C                     │    │
│  │  Training: 62,134 samples | Test: 15,534 samples         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │               TIME-SERIES MODEL                           │    │
│  │  CatBoost (timeseries_temperature_model.pkl)             │    │
│  │                                                          │    │
│  │  Inputs:                      Outputs:                   │    │
│  │  ├── Historical LST values  → Future temp (2025–2030+)   │    │
│  │  ├── Year / Month / Season  → Trend trajectory           │    │
│  │  └── District identifiers   → Confidence bands           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Model Serving: joblib.load() at FastAPI startup                 │
│  Inference: <100ms per prediction (in-memory)                    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Backend API Layer

```
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER — FastAPI (Python)                   │
│                    Host: localhost:8000 (dev) / GCP (prod)           │
│                                                                      │
│  Entry Points                                                        │
│  ├── main.py                (GEE + ML integration, root router)      │
│  ├── prediction_api.py      (Spatial RF predictions)                 │
│  ├── timeseries_prediction_api.py (CatBoost time-series)             │
│  └── api/geojson.py         (GeoJSON boundary endpoints)             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  SPATIAL PREDICTION  /api/spatial/*                          │    │
│  │  POST /scenario-single  → Single-point prediction            │    │
│  │  POST /scenario         → Bulk grid predictions              │    │
│  │  POST /diagnose         → Heat driver diagnostics            │    │
│  │  POST /prescribe        → Cooling intervention recs          │    │
│  │  GET  /model-info       → Model metadata & performance       │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  TIME-SERIES  /api/timeseries/*                              │    │
│  │  POST /predict          → Future temp forecast               │    │
│  │  GET  /trends           → Historical trend analysis          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  GEOJSON DATA  /api/geojson/*                                │    │
│  │  GET /states            → State boundaries + enriched stats  │    │
│  │  GET /districts         → District boundaries + aggregations │    │
│  │  GET /hotspots          → 42,706 hotspot markers             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  LIVE GEE  /api/gee/*                                        │    │
│  │  GET /lst               → On-demand LST queries              │    │
│  │  GET /ndvi              → Vegetation index queries           │    │
│  │  GET /uhi-map           → UHI intensity maps                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Middleware: CORS (localhost:8080–8090, *.vercel.app)                │
│  Docs: GET /docs  (Swagger UI / OpenAPI 3.0)                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.4 Database Schema

```
┌──────────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL DATABASE                        │
│                   Project: xntorsihhrdzjwhrohkr.supabase.co          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  hotspots                       (42,706 records)            │     │
│  │  ├── id              UUID PK                                │     │
│  │  ├── latitude        DECIMAL                                │     │
│  │  ├── longitude       DECIMAL                                │     │
│  │  ├── avg_temperature DECIMAL (°C)                           │     │
│  │  ├── avg_ndbi        DECIMAL (-1 to +1)                     │     │
│  │  ├── avg_ndvi        DECIMAL (-1 to +1)                     │     │
│  │  ├── intensity       ENUM (extreme|hot|warm|mild|cool)      │     │
│  │  ├── state_name      TEXT                                   │     │
│  │  ├── district_name   TEXT                                   │     │
│  │  ├── elevation       DECIMAL (meters)                       │     │
│  │  ├── population      INTEGER                                │     │
│  │  └── last_updated    TIMESTAMPTZ                            │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  temperature_readings                                       │     │
│  │  ├── id, city, location_name                                │     │
│  │  ├── latitude, longitude                                    │     │
│  │  ├── temperature, humidity                                  │     │
│  │  ├── recorded_at TIMESTAMPTZ                                │     │
│  │  └── source (Landsat | GEE)                                 │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  predictions                                                │     │
│  │  ├── id, city, year                                         │     │
│  │  ├── predicted_temp DECIMAL                                 │     │
│  │  ├── confidence_level DECIMAL                               │     │
│  │  └── created_at TIMESTAMPTZ                                 │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  district_aggregates / state_aggregates                     │     │
│  │  ├── geometry   GEOGRAPHY (GeoJSON polygon)                 │     │
│  │  ├── name, state_name                                       │     │
│  │  ├── avg_temp, max_temp, min_temp                           │     │
│  │  ├── avg_ndvi, avg_ndbi                                     │     │
│  │  └── Spatial index (PostGIS)                                │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Security: Row Level Security (RLS) — public read, auth write        │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.5 Frontend Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                  FRONTEND LAYER — React 18 + TypeScript               │
│                  Build: Vite 5 | Styling: TailwindCSS + shadcn/ui    │
│                                                                      │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────────┐    │
│  │  Index Page  │   │ HeatMap Page  │   │   Choropleth Page    │    │
│  │  (Landing)   │   │               │   │                      │    │
│  │              │   │ MapboxHeatMap │   │ ChoroplethMap.tsx    │    │
│  │ Navigation   │   │ ├─ Heatmap    │   │ ChoroplethAnalytics  │    │
│  │ Overview     │   │ ├─ Clustering │   │ ├─ Alerts Tab        │    │
│  │ Stats        │   │ └─ Markers    │   │ ├─ Rankings Tab      │    │
│  └──────────────┘   └───────────────┘   │ ├─ Heat Risk Tab     │    │
│                                         │ ├─ Green Space Tab   │    │
│  ┌──────────────────────────────────┐   │ ├─ Urbanization Tab  │    │
│  │         Scenario Page            │   │ └─ Actions Tab       │    │
│  │                                  │   └──────────────────────┘    │
│  │  ScenarioControls (sliders)      │                               │
│  │  ├── NDVI adjuster               │   ┌──────────────────────┐    │
│  │  ├── NDBI adjuster               │   │  AI Consultant Panel │    │
│  │  ├── Elevation input             │   │                      │    │
│  │  └── Population input            │   │ ConsultantPanel.tsx  │    │
│  │                                  │   │ ├─ Heat Diagnostics  │    │
│  │  Prediction Results              │   │ ├─ Cooling Recs      │    │
│  │  ├── Temperature output          │   │ └─ Pop. At-Risk      │    │
│  │  ├── Confidence intervals        │   └──────────────────────┘    │
│  │  ├── Time-series chart           │                               │
│  │  └── Comparison mode            │                               │
│  └──────────────────────────────────┘                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                                │    │
│  │                                                              │    │
│  │  React Query (TanStack)         Supabase Client              │    │
│  │  ├── useHotspots.ts    ────────▶ hotspots table              │    │
│  │  ├── usePredictions.ts ────────▶ predictions table           │    │
│  │  ├── useDistrictHeatmap.ts ────▶ district_aggregates         │    │
│  │  ├── useStateHeatmap.ts ───────▶ state_aggregates            │    │
│  │  └── useMLPredictions.ts ──────▶ POST /api/spatial/*        │    │
│  │                                                              │    │
│  │  services/predictionApi.ts → axios calls to FastAPI          │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Data Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        END-TO-END DATA FLOW                               │
└───────────────────────────────────────────────────────────────────────────┘

OFFLINE (Batch) Pipeline:
─────────────────────────
[Google Earth Engine]
    │ Landsat 8/9 imagery (30m resolution, 2016–2024)
    ▼
[Python Extraction Scripts]
    │ Compute LST, NDVI, NDBI per pixel
    │ Aggregate to district level
    │ Export to CSV / Parquet
    ▼
[Model Training Scripts]
    │ Feature engineering
    │ Train Random Forest (spatial)
    │ Train CatBoost (time-series)
    │ Serialize to .pkl files
    ▼
[Supabase Ingest]
    │ Load hotspots, aggregates, predictions
    │ Apply SQL migrations
    └─ 42,706 hotspot records in DB


ONLINE (Real-Time) Flow:
────────────────────────
[Browser / User Action]
    │ Map pan / zoom / filter
    ▼
[React Query Hook]
    │ Cache check (stale-while-revalidate)
    ├── Cache hit  → render immediately
    └── Cache miss ↓
        ▼
    [Supabase Client] ─────────────────▶ [PostgreSQL]
        │ Hotspot + aggregate queries        │ RLS policies
        ◀───────────────────────────────────┘
        │ GeoJSON with enriched stats
    ▼
[Mapbox GL / Recharts]
    │ Render heatmap / choropleth / charts
    ▼
[User sees result in ~200ms]


PREDICTION Flow (Scenario Modeling):
─────────────────────────────────────
[User adjusts NDVI / NDBI / Elevation / Population sliders]
    │
    ▼
[React Hook: useMLPredictions]
    │ Debounced fetch (300ms)
    ▼
[FastAPI: POST /api/spatial/scenario-single]
    │ Load RF model from memory
    │ Run inference (<100ms)
    │ Apply confidence interval ±2σ
    ▼
[Response: { predicted_temp, lower_bound, upper_bound, risk_level }]
    │
    ▼
[UI: ScenarioPage / PredictionWidget]
    │ Live temperature display
    │ Time-series CatBoost chart (2025–2030)
    └─ Comparison mode (up to 2 scenarios)
```

---

## 4. Component Dependency Map

```
App.tsx
 ├── React Router DOM
 ├── Index.tsx (Landing)
 ├── HeatMapPage.tsx
 │    ├── MapboxHeatMap.tsx
 │    │    ├── react-map-gl (Mapbox)
 │    │    └── useHotspots.ts → Supabase
 │    └── [filter controls]
 ├── ChoroplethPage.tsx
 │    ├── ChoroplethMap.tsx
 │    │    ├── react-map-gl
 │    │    └── useDistrictHeatmap / useStateHeatmap → Supabase
 │    ├── ChoroplethAnalytics.tsx
 │    │    └── Recharts (bar, line, area charts)
 │    ├── BloomeeWidget.tsx
 │    ├── ComparisonWidget.tsx
 │    └── ScenarioControls.tsx
 ├── ScenarioPage.tsx
 │    ├── useMLPredictions.ts → FastAPI /api/spatial/*
 │    └── usePredictions.ts  → FastAPI /api/timeseries/*
 └── [shadcn/ui components throughout]
      ├── Card, Tabs, Slider, Badge, Button
      └── Sonner (toast notifications)
```

---

## 5. Deployment Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT TOPOLOGY                           │
│                                                                   │
│  ┌─────────────────────┐        ┌───────────────────────────┐     │
│  │   Vercel (Frontend) │        │   GCP / Railway (Backend) │     │
│  │                     │        │                           │     │
│  │  React + Vite SPA   │──HTTP──▶  FastAPI + Uvicorn        │     │
│  │  /dist bundle       │        │  Port 8000                │     │
│  │  CDN-distributed    │        │  GEE Service Account Auth │     │
│  └─────────────────────┘        └───────────┬───────────────┘     │
│           │                                 │                     │
│           │                                 │                     │
│           ▼                                 ▼                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │            Supabase (Managed PostgreSQL)                 │      │
│  │            Region: Southeast Asia (ap-southeast-1)       │      │
│  │            Storage: ~5M rows, GeoJSON geometries         │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                   │
│  External Services:                                               │
│  ├── Mapbox API          (map tiles, geocoding)                   │
│  └── Google Earth Engine (on-demand satellite queries)            │
└───────────────────────────────────────────────────────────────────┘

Environment Variables:
  Frontend (VITE_*):           Backend (.env):
  ├── VITE_SUPABASE_URL        ├── SUPABASE_URL / SERVICE_KEY
  ├── VITE_SUPABASE_ANON_KEY   ├── GEE_PROJECT_ID
  ├── VITE_MAPBOX_TOKEN        └── [model paths]
  ├── VITE_GEE_BACKEND_URL
  └── VITE_API_BASE_URL
```

---

## 6. Security Architecture

| Layer | Mechanism | Detail |
|---|---|---|
| Database | Row Level Security (RLS) | Public read; authenticated write |
| API Keys | Environment variables | Never committed to git |
| GEE Auth | Service account JSON | Stored outside repo |
| CORS | Allowlist origins | localhost + *.vercel.app |
| Frontend | Anon key only | No admin/service key exposed |
| Transport | HTTPS (prod) | TLS enforced on Vercel + Supabase |

---

## 7. Scalability Considerations

| Concern | Current State | Recommended Path |
|---|---|---|
| API throughput | Single FastAPI process | Add Gunicorn workers or container scaling |
| DB queries | Direct Supabase client | Add Redis cache for GeoJSON responses |
| ML inference | In-memory, synchronous | Move to async background tasks for bulk |
| Satellite data | Batch extraction scripts | Automate with Cloud Scheduler or Airflow |
| Model updates | Manual retraining | CI/CD pipeline with MLflow experiment tracking |
| Map data | 42,706 points loaded | Implement tile-based pagination / clustering server-side |

---

## 8. Key Design Decisions

1. **Tuned Random Forest over XGBoost** — RF achieved R²=0.9415 vs XGBoost's lower score; simpler to interpret feature importances for urban planning recommendations.

2. **Supabase over raw PostgreSQL** — Provides built-in RLS, real-time subscriptions, and hosted PostGIS without infra overhead.

3. **React Query for data fetching** — Handles caching, background refetch, and stale-while-revalidate seamlessly for geospatial data that updates infrequently.

4. **Dual prediction models** — Spatial RF handles "what-if scenario" predictions at a point in space; CatBoost handles temporal forecasting for trend charts.

5. **Offline batch + online serving split** — Heavy GEE processing runs offline to avoid latency; only lightweight inference runs on-demand.

6. **Urban Cool Island finding** — Data reveals -11.58°C UHI inversion (urban areas cooler than rural deforested land), which fundamentally shapes the analytics and recommendations shown in the UI.
