# State Management Patterns - Frontend

The frontend application employs a decoupled state strategy, utilizing **React Query (TanStack Query)** for remote server state caching, while isolating local user interactions to native `useState` bindings.

## 1. Server State (React Query / TanStack)
The primary workhorse for asynchronous data.
- **`useDistrictHeatmap`**: Fetches Supabase GeoJSON features and caches them for Mapbox injection.
- **`usePredictionModel`**: Caches inferential POST requests to the FastAPI backend, enabling near-instant UI feedback when the Scenario Simulator is scrubbed without repeatedly hitting the backend for the identical parameters.

## 2. Global Context
- **Global `CityContext`**: Stores the absolute state of the user's currently viewed city/location globally, avoiding prop-drilling.
- **ThemeContext**: Manages light/dark mode css vars (`next-themes`).

## 3. Local UI State
- Standard `useState` primitives are used strictly for local form controls (e.g., slider coordinates, specific modal visibility flags) ensuring components remain pure and modular.
