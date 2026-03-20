# Source Tree Analysis

```text
urban-heat-insights-main/
├── backend/            # FastAPI Python server & ML training scripts
│   ├── api/            # Route handlers
│   ├── data/           # Raw CSV datasets
│   ├── models/         # Serialized ML artifacts (.pkl)
│   └── utils/          # Shared helper functions
├── public/             # Static frontend assets
└── src/                # React Frontend Web Application
    ├── components/     # React functional components
    │   ├── choropleth/ # Heatmap logic
    │   ├── predictions/# ML simulator logic
    │   ├── scenarios/  # Main scenario split views
    │   └── ui/         # Shadcn foundational library
    ├── hooks/          # React Query state management
    ├── lib/            # Shared utilities (Tailwind)
    └── pages/          # Main application views
```

## Critical Pathways
- **Frontend Entry:** `src/main.tsx` initializes React. Application roots at `src/App.tsx`.
- **Backend Entry:** `backend/main.py` launches Uvicorn server and loads ML models into memory.
