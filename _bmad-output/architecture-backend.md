# Architecture - Backend

- **Executive Summary:** A hybrid data extraction pipeline and real-time machine learning inference server.
- **Technology Stack:** Python, FastAPI, Scikit-Learn, CatBoost, Pandas, PyArrow.
- **Architecture Pattern:** Controller-Service Model & Offline ETL Batch scripts.
- **Data Architecture:** Owns the pipeline of data loading into the remote Supabase PostGIS instances and extracting from Google Earth Engine.
- **API Surface:** Exposes UHI prediction deltas seamlessly mapping `.pkl` Random Forest weights deployed instantly into system RAM upon Uvicorn launch to achieve 50-100ms response targets.
