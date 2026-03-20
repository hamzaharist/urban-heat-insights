# Architecture - Frontend

- **Executive Summary:** A high-speed, interactive React analytics dashboard providing a visual UI for adjusting the backend spatial machine learning models.
- **Technology Stack:** React (Vite, TypeScript), Tailwind CSS, Shadcn UI, Mapbox GL.
- **Architecture Pattern:** SPA Component Hierarchy.
- **Data Architecture:** Retrieves geospatial geometries directly from Supabase via PostgREST. Global state acts entirely as a thin client proxy to `useQuery`.
- **API Surface:** Consumes the `/api/spatial` FastAPI boundaries.
- **Testing:** Strict TypeScript type checking across component props.
