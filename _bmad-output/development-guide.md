# Development Guide

## Environment Setup
1. Clone the repository.
2. Node Version: v22+
3. Python Version: 3.11+
4. Database: Ensure access to the remote Supabase project.

## Frontend (React/Vite)
- **Install:** `npm install`
- **Run Development Server:** `npm run dev`
- **Build Prod:** `npm run build`

## Backend (FastAPI)
- **Install:** Create a venv and run `pip install -r backend/requirements.txt`
- **Run Local API Server:** Navigate to `backend/` and run `python main.py` or manually trigger `uvicorn` (runs on port 8000 by default).
- Note: Environment variables for Google Earth Engine (`uhifyp-*.json`) and Supabase (`.env`) are required in the backend directory.
