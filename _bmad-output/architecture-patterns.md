# Architecture Patterns

## Frontend (Web)
**Pattern:** Component-Based Hierarchy (Single Page Application)
The frontend utilizes a modern SPA paradigm, structured hierarchically via reusable React components. It segregates logic effectively:
- **Pages** (`src/pages/`): Act as layout coordinators (e.g., Scenario Simulator vs Interactive Maps).
- **Components** (`src/components/`): Atomic blocks (KPI Cards, interactive sliders, maps) utilizing Tailwind for modular CSS.
- **State Management**: Heavily offloads data-hydration to React Query hooks (`useDistrictHeatmap`, `usePredictionModel`), maintaining an extremely thin local component state to maximize rendering performance.

## Backend (API & Processing)
**Pattern:** Hybrid Pipeline (Offline ETL + Real-Time Inference Controller)
The backend operates dually as a batch processor and an asynchronous web service:
1. **Offline ETL Pipeline:** Disconnected Python scripts (like `aggregate_and_upload.py`, `extract_gee_data.py`) perform heavy lifting to extract from Google Earth Engine, train ML models, and dump aggregated results into Supabase.
2. **Real-time API Controllers:** FastAPI endpoints (`prediction_api.py`, `timeseries_prediction_api.py`) run as lightweight REST controllers. They load pre-trained `.pkl` model artifacts (Random Forest/Catboost) directly into memory at startup, allowing millisecond response times for frontend "What-if" simulation requests without hitting any external databases during inference.
