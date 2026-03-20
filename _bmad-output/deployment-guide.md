# Deployment Guide

## Production Architecture
The application utilizes a distributed rendering architecture:
- **Frontend App:** Static React/Vite bundle, deployable to services like Vercel, Netlify, or Railway static hosting.
- **Backend API:** FastAPI Python server, currently configured via JSON (`railway.json`).
- **Database:** Supabase (fully hosted PostgreSQL + PostGIS platform). No manual database deployments are necessary aside from running DDL scripts in `backend/` locally to scaffold remote schema updates.
