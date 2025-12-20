# Urban Heat Insights - Project Documentation

## Executive Summary

**Urban Heat Insights** is a full-stack web application that visualizes Urban Heat Island (UHI) effects across Malaysian cities using real satellite data from Google Earth Engine. The system processes 8 years of historical temperature data (2016-2024) and provides interactive visualizations to support sustainable urban planning decisions.

**Key Technologies**: React, TypeScript, Python, FastAPI, Google Earth Engine, Supabase, TailwindCSS

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MapSection   │  │ Predictions  │  │ Statistics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                    React Query Layer                         │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐     ┌───────▼────────┐
        │   Supabase     │     │  FastAPI       │
        │   (PostgreSQL) │     │  Backend       │
        │                │     │                │
        │  - hotspots    │     │  - LST data    │
        │  - temp_data   │     │  - NDVI data   │
        │  - predictions │     │  - UHI maps    │
        └────────────────┘     └────────┬───────┘
                                        │
                                ┌───────▼────────┐
                                │  Google Earth  │
                                │    Engine      │
                                │  (Landsat 8)   │
                                └────────────────┘
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS + Shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Data Fetching**: Supabase JS Client
- **Routing**: React Router

#### Backend
- **API Server**: FastAPI (Python 3.11)
- **Satellite Data**: Google Earth Engine Python API
- **Data Processing**: Pandas, NumPy
- **Database Client**: Supabase Python SDK

#### Database
- **Platform**: Supabase (PostgreSQL)
- **Features**: Row Level Security, Real-time subscriptions
- **Tables**: hotspots, temperature_readings, predictions

#### DevOps
- **Version Control**: Git
- **Package Management**: npm (frontend), pip (backend)
- **Environment**: .env files for configuration

---

## 2. Data Flow

### 2.1 Data Extraction Pipeline

```
Google Earth Engine (Landsat 8)
         │
         ▼
extract_gee_region_based.py
  - Queries LST, NDVI, NDBI
  - Time range: 2016-2024
  - 8 Malaysian cities
         │
         ▼
Parquet Files (data/)
  - malaysia_cities_2016_2024_region_based.parquet
  - malaysia_cities_yearly_averages.csv
         │
         ▼
upload_to_supabase.py
  - Processes temperature data
  - Generates hotspots
  - Creates predictions
         │
         ▼
Supabase Database
```

### 2.2 Frontend Data Flow

```
User Interface
      │
      ▼
React Query Hooks
  - useHotspots()
  - usePredictions()
      │
      ▼
Supabase Client
  - Query hotspots table
  - Query predictions table
      │
      ▼
Component Rendering
  - MapSection (hotspot visualization)
  - PredictionSection (forecast display)
  - Statistics cards
```

---

## 3. Component Architecture

### 3.1 Frontend Components

#### Core Pages
- **`src/pages/Index.tsx`**: Main landing page
  - Hero section
  - Map visualization
  - Predictions
  - Statistics

#### Key Components

**MapSection** (`src/components/MapSection.tsx`)
- Displays static Malaysia map
- Overlays hotspot markers with real coordinates
- Shows animated pulse effects
- Hover tooltips with temperature data
- Statistics dashboard

**PredictionSection** (`src/components/PredictionSection.tsx`)
- Displays temperature predictions (2025-2030)
- Interactive charts
- Confidence levels
- Trend analysis

**StatsCards** (`src/components/StatsCards.tsx`)
- Peak temperature display
- Critical hotspots count
- NDVI averages
- Built-up index

#### Custom Hooks

**useHotspots** (`src/hooks/useHotspots.ts`)
```typescript
// Fetches hotspot data from Supabase
const { data, isLoading, error } = useHotspots('Kuala Lumpur');
```

**usePredictions** (`src/hooks/usePredictions.ts`)
```typescript
// Fetches prediction data
const { data, isLoading, error } = usePredictions('Kuala Lumpur');
```

### 3.2 Backend Components

#### FastAPI Server (`backend/main.py`)

**Endpoints**:
- `GET /api/lst` - Land Surface Temperature data
- `GET /api/ndvi` - Vegetation index data
- `GET /api/uhi-map` - UHI intensity maps
- `GET /health` - Health check

**Features**:
- CORS enabled for frontend
- Error handling middleware
- Request validation
- Response caching

#### Data Extraction Scripts

**extract_gee_region_based.py**
- Connects to Google Earth Engine
- Queries Landsat 8 imagery
- Processes LST, NDVI, NDBI
- Exports to Parquet format

**upload_to_supabase.py**
- Reads Parquet files
- Processes temperature data
- Generates hotspots (top 5 per city)
- Creates 5-year predictions
- Uploads to Supabase

---

## 4. Database Schema

### 4.1 Tables

#### hotspots
```sql
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  avg_temperature DOUBLE PRECISION NOT NULL,
  intensity TEXT CHECK (intensity IN ('extreme', 'hot', 'warm', 'mild', 'cool')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### temperature_readings
```sql
CREATE TABLE temperature_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  ndvi DOUBLE PRECISION,
  ndbi DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

#### predictions
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  year INTEGER NOT NULL,
  predicted_temp DOUBLE PRECISION NOT NULL,
  confidence_level DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Indexes
- `idx_hotspots_city` on hotspots(city)
- `idx_temp_city_date` on temperature_readings(city, recorded_at)
- `idx_predictions_city_year` on predictions(city, year)

---

## 5. API Integration

### 5.1 Google Earth Engine

**Authentication**: Service Account
**Dataset**: LANDSAT/LC08/C02/T1_L2
**Bands Used**:
- ST_B10: Surface Temperature
- SR_B4, SR_B5: NDVI calculation
- SR_B5, SR_B6: NDBI calculation

**Processing**:
```python
# LST calculation
lst = image.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15)

# NDVI calculation
ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])

# NDBI calculation
ndbi = image.normalizedDifference(['SR_B6', 'SR_B5'])
```

### 5.2 Supabase

**Client Initialization**:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

**Query Example**:
```typescript
const { data, error } = await supabase
  .from('hotspots')
  .select('*')
  .eq('city', 'Kuala Lumpur')
  .order('avg_temperature', { ascending: false });
```

---

## 6. Environment Configuration

### 6.1 Frontend (.env)
```env
VITE_SUPABASE_URL=https://xntorsihhrdzjwhrohkr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_GEE_BACKEND_URL=http://localhost:3002
VITE_DEFAULT_CITY=Kuala Lumpur
VITE_DEFAULT_LAT=3.1390
VITE_DEFAULT_LON=101.6869
```

### 6.2 Backend (.env)
```env
GEE_PROJECT_ID=<project-id>
GEE_SERVICE_ACCOUNT_EMAIL=<service-account>@<project>.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=path/to/service-account-key.json
PORT=3002
SUPABASE_URL=https://xntorsihhrdzjwhrohkr.supabase.co
SUPABASE_KEY=<service-role-key>
```

---

## 7. Deployment Guide

### 7.1 Frontend Deployment

**Recommended Platforms**:
- Vercel (recommended)
- Netlify
- GitHub Pages

**Build Command**:
```bash
npm run build
```

**Output Directory**: `dist/`

**Environment Variables**: Set all VITE_* variables in platform dashboard

### 7.2 Backend Deployment

**Recommended Platforms**:
- Railway
- Render
- Heroku

**Requirements**:
- Python 3.11+
- Service account JSON file
- Environment variables configured

**Start Command**:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 7.3 Database

**Supabase** (already deployed)
- URL: https://xntorsihhrdzjwhrohkr.supabase.co
- Run migration: `supabase/quick_setup.sql`
- Upload data: `python backend/upload_to_supabase.py`

---

## 8. Development Workflow

### 8.1 Local Development

**Frontend**:
```bash
npm install
npm run dev
# Runs on http://localhost:8080/
```

**Backend**:
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:3002/
```

### 8.2 Data Pipeline

**Extract Data**:
```bash
cd backend
python extract_gee_region_based.py
```

**Upload to Supabase**:
```bash
python upload_to_supabase.py
```

---

## 9. Key Features

### 9.1 Implemented Features
- ✅ Real satellite data visualization (2016-2024)
- ✅ Interactive hotspot markers
- ✅ Temperature predictions (2025-2030)
- ✅ Statistics dashboard
- ✅ Multiple city support
- ✅ Responsive design
- ✅ Real-time data updates

### 9.2 Data Coverage
- **Cities**: Kuala Lumpur, Penang, Johor Bahru, Ipoh, Malacca, Seremban, Kuching, Kota Kinabalu
- **Time Range**: 2016-2024 (8 years)
- **Metrics**: LST, NDVI, NDBI
- **Predictions**: 2025-2030 (5 years)

---

## 10. Performance Considerations

### 10.1 Frontend Optimization
- React Query caching (15-minute stale time)
- Lazy loading of components
- Image optimization
- Code splitting

### 10.2 Backend Optimization
- GEE query optimization (region-based)
- Parquet file format for efficient storage
- Database indexing
- API response caching

---

## 11. Security

### 11.1 Frontend Security
- Environment variables for sensitive data
- HTTPS only in production
- Input validation
- XSS protection (React default)

### 11.2 Backend Security
- Service account authentication for GEE
- CORS configuration
- Environment-based secrets
- Row Level Security in Supabase

### 11.3 Database Security
- RLS policies enabled
- Public read access (anon key)
- Service role for write operations
- Encrypted connections

---

## 12. Testing Strategy

### 12.1 Manual Testing
- ✅ Supabase connection
- ✅ Data display verification
- ✅ Map marker positioning
- ✅ Statistics accuracy
- ✅ Responsive design

### 12.2 Recommended Automated Tests
- Unit tests for hooks
- Integration tests for API endpoints
- E2E tests for user flows
- Data validation tests

---

## 13. Known Limitations

### 13.1 Current Limitations
- Static map (not interactive zoom/pan)
- Single city filter at a time
- Manual data refresh required
- Limited to 8 cities

### 13.2 Future Enhancements
- Interactive map integration (Mapbox/Leaflet)
- Real-time data updates
- User authentication
- Admin dashboard
- Export functionality
- More cities coverage

---

## 14. Troubleshooting

### 14.1 Common Issues

**White Page / Blank Screen**
- Check browser console for errors
- Verify .env file has no quotes around values
- Restart dev server

**Invalid API Key**
- Ensure VITE_SUPABASE_PUBLISHABLE_KEY is correct
- No quotes in .env file
- Restart dev server after .env changes

**No Data Displayed**
- Verify Supabase tables have data
- Check network tab for API errors
- Confirm city name matches database

**GEE Authentication Failed**
- Verify service account JSON path
- Check GEE_PROJECT_ID is correct
- Ensure service account has Earth Engine access

---

## 15. Project Statistics

- **Total Files**: 100+
- **Lines of Code**: ~5,000
- **Components**: 15+
- **API Endpoints**: 4
- **Database Tables**: 3
- **Data Points**: Thousands (8 years × 8 cities)
- **Development Time**: Multiple weeks
- **Technologies Used**: 10+

---

## 16. References

### Documentation
- [Google Earth Engine](https://developers.google.com/earth-engine)
- [Supabase Docs](https://supabase.com/docs)
- [React Query](https://tanstack.com/query)
- [TailwindCSS](https://tailwindcss.com)

### Data Sources
- Landsat 8 Collection 2 Tier 1 Level 2
- OpenStreetMap (map tiles)

---

## 17. Conclusion

Urban Heat Insights successfully demonstrates the integration of satellite data, cloud databases, and modern web technologies to create a practical tool for urban heat analysis. The system provides valuable insights for sustainable urban planning in Malaysian cities.

**Project Status**: ✅ Functional and FYP-ready

**Deployment**: Ready for production deployment

**Documentation**: Complete

---

*Last Updated*: December 2024
*Version*: 1.0
*Author*: FYP Student - Universiti Teknologi PETRONAS
