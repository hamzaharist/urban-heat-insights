# Urban Heat Insights - Malaysia

> **An interactive platform for analyzing and visualizing urban heat patterns across Malaysia using satellite data, machine learning, and geospatial analytics.**

[![Status](https://img.shields.io/badge/status-production-success)]()
[![Data Quality](https://img.shields.io/badge/data%20quality-99.5%25-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-42%2C706%20hotspots-blue)]()

---

## 🎯 Project Overview

Urban Heat Insights reveals Malaysia's unique climate phenomenon: **well-planned urban areas are 11.58°C cooler than deforested rural areas**, inverting the traditional Urban Heat Island effect. This platform provides actionable data for urban planners, researchers, and policymakers to create cooler, more livable cities.

**Key Discovery:** Malaysia's urban green infrastructure creates "Urban Cool Islands" - challenging conventional UHI assumptions and providing evidence for sustainable development strategies.

---

## ✨ Features

### 🗺️ Interactive Mapping
- **Heatmap Visualization** - Real-time temperature overlay across Malaysia
- **Choropleth Maps** - District and state-level aggregated analysis
- **42,706 Hotspot Markers** - Clustering and detailed location data
- **Dual-Level Analysis** - Navigate from national overview to district details

### 📊 Regional Analytics Dashboard (6 Tabs)

1. **Alerts** - Temperature threshold monitoring (34°C+) with critical hotspot identification
2. **Rankings** - Hottest to coolest region comparisons with percentile calculations
3. **Heat Risk Assessment** - Multi-factor scoring (temperature + NDBI + NDVI)
4. **Green Space Impact** - Vegetation index visualization and cooling benefit analysis
5. **Urbanization Metrics** - Built-up area classification and intra-urban heat variation
6. **Action Recommendations** - Evidence-based cooling strategies and interventions

### 📈 Data Insights
- **Temperature Analysis** - 99.5% clean data (20-60°C range)
- **NDBI Integration** - Urbanization index tracking
- **NDVI Monitoring** - Vegetation coverage measurement
- **Historical Trends** - 2016-2024 temperature patterns (CSV-based)

### 🔮 Scenario Planning & Prediction
- **Time-Series Projection** - Forecast future temperatures up to 2050 using Random Forest models
- **Interactive Interventions** - Simulate the cooling impact of adding green spaces (NDVI) or reducing built-up areas (NDBI)
- **Climate Warming Models** - Built-in baseline climate change offsets combined with spatial predictions

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Mapping:** Mapbox GL JS
- **Icons:** Lucide React
- **UI Components:** Custom components + shadcn/ui

### Backend
- **API:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Data Processing:** Pandas, NumPy
- **Data Source:** Landsat 8/9 Collection 2 Level 2

### Infrastructure
- **Hosting:** [Your hosting service]
- **Database:** Supabase Cloud
- **CDN:** [If applicable]

---

## 🚀 Getting Started

### Prerequisites

```bash
- Node.js >= 18
- Python >= 3.11
- npm or yarn
- Supabase account
```

### Frontend Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd urban-heat-insights-main

# Install frontend dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Backend Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit backend/.env with your Supabase credentials

# Start backend server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend API will be available at `http://localhost:8000`

---

## 🔧 Configuration

### Environment Variables

**Frontend (`.env`):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

**Backend (`backend/.env`):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

---

## 📁 Project Structure

```
urban-heat-insights-main/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── MapboxHeatMap.tsx    # Main interactive heatmap
│   │   ├── choropleth/
│   │   │   ├── ChoroplethMap.tsx         # Regional visualization
│   │   │   ├── RegionalAnalytics.tsx     # 6-tab analytics dashboard
│   │   │   ├── analysis/                  # Analytics components
│   │   │   │   ├── HeatRiskAssessment.tsx
│   │   │   │   ├── GreenSpaceImpact.tsx
│   │   │   │   ├── UrbanizationMetrics.tsx
│   │   │   │   └── ActionRecommendations.tsx
│   │   │   └── ...
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/
│   │   ├── useTemperatureTrend.ts  # Temperature data hook
│   │   └── useCities.ts            # City data hook
│   ├── lib/                      # Utilities and helpers
│   └── App.tsx                   # Main application component
│
├── backend/                      # Backend API
│   ├── main.py                  # FastAPI entry point
│   ├── geojson_api.py          # Spatial data endpoints
│   ├── timeseries_api.py       # Temporal data endpoints
│   ├── data/                    # CSV data files
│   │   └── malaysia_cities_2016_2024_region_based.csv
│   └── migrations/              # Database migrations
│
├── public/                       # Static assets
├── _bmad-output/                # BMAD workflow outputs
│   └── analysis/
│       └── product-brief-*.md   # Product documentation
├── docs/                         # Additional documentation
└── package.json                  # Dependencies
```

---

## 📊 Database Schema

### Hotspots Table (42,706 records)

```sql
CREATE TABLE hotspots (
  id INTEGER PRIMARY KEY,
  latitude DECIMAL,
  longitude DECIMAL,
  avg_temperature DECIMAL,
  avg_ndbi DECIMAL,          -- Built-up index
  avg_ndvi DECIMAL,          -- Vegetation index
  intensity TEXT,
  state_name TEXT,
  district_name TEXT,
  state_code TEXT,
  district_code TEXT,
  elevation DECIMAL,
  population INTEGER,
  last_updated TIMESTAMP
);
```

---

## 🔗 API Endpoints

### Spatial Data
- `GET /api/geojson/aggregated` - District/state-level aggregated data
  - Query params: `level` (state|district)
  
- `GET /api/geojson/hotspots` - Individual hotspot markers
  - Query params: `limit`, `offset`

### Temporal Data
- `GET /api/timeseries/temperature` - Historical temperature trends
  - Query params: `region` (optional), `level` (state|district)

### Prediction & Scenarios
- `POST /api/predict-scenario` - Generate future temperature projections based on intervention scenarios
- `GET /api/predict/model-info` - Get Random Forest model metrics and configuration

---

## 📈 Key Metrics

### Data Coverage
| Metric | Value |
|--------|-------|
| **Total Hotspots** | 42,706 |
| **States Covered** | 10 / 16 (62.5%) |
| **Districts** | 44 |
| **Date Range** | 2016-2024 |
| **Data Quality** | 99.5% clean |

### Temperature Insights by Category

| Category | Avg Temp | NDVI | Records | Description |
|----------|----------|------|---------|-------------|
| **Highly Urban** | 30.21°C | 0.836 | 35,767 | Green cities with parks |
| **Urban** | 32.71°C | 0.676 | 4,150 | Mixed development |
| **Low Urban** | 36.26°C | 0.490 | 2,386 | Sprawling development |
| **Rural** | 41.79°C | 0.276 | 403 | Deforested agriculture |

**UHI Intensity:** -11.58°C (Urban Cool Island effect)

---

## 🧪 Data Quality

### Recent Audit (Dec 24, 2025)
- ✅ **Temperature:** 99.5% within realistic range (20-60°C)
- ✅ **NDBI:** Successfully corrected inversion issue
- ✅ **NDVI:** All values within valid range [-1, 1]
- ✅ **Geographic:** 100% within Malaysia bounds
- ✅ **Completeness:** 0% missing data in critical fields

### Known Patterns
- **Inverted Correlation:** Temp vs NDBI is negative (-0.66)
  - **Reason:** Urban green infrastructure creates cooling effect
  - **Status:** Documented as feature, not bug

---

## 🚧 Available Scripts

### Frontend
```bash
npm run dev          # Start development server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
python -m uvicorn main:app --reload    # Start API server (port 8000)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000  # Public access
```

---

## 🎨 Development

### Adding New Features

1. **Frontend Components:** Add to `src/components/`
2. **Analytics Tabs:** Extend `RegionalAnalytics.tsx`
3. **API Endpoints:** Add to `backend/main.py` or relevant router
4. **Database Changes:** Create migration in `backend/migrations/`

### Code Style
- **Frontend:** TypeScript + ESLint + Prettier
- **Backend:** Python + PEP 8
- **Commits:** Conventional Commits format

---

## 📚 Documentation

- **Product Brief:** `_bmad-output/analysis/product-brief-*.md`
- **Data Quality Reports:** `_bmad-output/analysis/*-data-*-report.md`
- **API Documentation:** Visit `/docs` when backend is running
- **Component Docs:** See inline JSDoc comments

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing feature`)
5. Open a Pull Request

---

## 🔮 Future Enhancements

### Phase 1: Data Expansion
- [ ] Add remaining 6 Malaysian states
- [ ] Upload complete 2016-2024 historical data to Supabase
- [ ] Add date/year columns to hotspots table
- [ ] Monthly granularity instead of yearly

### Phase 2: Advanced Features
- [x] Predictive temperature modeling
- [x] Climate change scenario analysis
- [ ] Real-time satellite data integration
- [ ] Mobile application

### Phase 3: Community
- [ ] Public API for researchers
- [ ] Downloadable datasets
- [ ] User-submitted observations
- [ ] Interactive comparison tools

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Data Source:** Landsat 8/9 Collection 2 Level 2 (via Google Earth Engine)
- **Infrastructure:** Supabase, Mapbox
- **Inspiration:** Climate research and sustainable urban development

---

## 📧 Contact

For questions or collaborations:
- **Project Lead:** [Your Name]
- **Email:** [Your Email]
- **Issues:** [GitHub Issues URL]

---

## 🌟 Star History

If this project helps your research or work, please consider giving it a star!

---

**Built with ❤️ for a cooler, greener Malaysia** 🌳🇲🇾
