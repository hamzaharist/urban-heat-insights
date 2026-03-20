# UI Component Inventory - Frontend

The frontend (`urban-heat-insights-main`) is built using a Shadcn UI foundational layer, heavily extended with custom domain-specific mapping and charting components.

## 1. Domain Components (Complex Interactive)
- `MapboxHeatMap` & `ChoroplethMap`: Core interactive district heatmaps utilizing `mapbox-gl`.
- `ScenarioSimulator`: Multi-slider UI allowing dynamic manipulation of NDVI/NDBI. Extensively utilizes Shadcn `Slider` and local state callbacks.
- `TrendChart`: A `Recharts`-powered historical line graph mapping LST curves.
- `CitySelector`: A complex dropdown managing the global active city filter.

## 2. Layout Components
- `MapSection.tsx`: Orchestrates the Mapbox layers and coordinate bounds.
- `ScenarioSection.tsx`: The primary analytical split-screen view.
- `DashboardLayout.tsx`: The main application wrapper handling responsive grid CSS.

## 3. Foundational Library (Shadcn)
Sited natively within `src/components/ui`. These are headless primitives styled by Tailwind.
- `Dialog`, `Popover`, `Select`, `Slider`, `Card`, `Button`, `Accordion`, `Tabs`, `Toast`.
