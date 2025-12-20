# UHI GEE Backend Service

Python/FastAPI backend service for Google Earth Engine integration.

## Features

- **LST (Land Surface Temperature)** - Get temperature data from Landsat satellites
- **NDVI (Vegetation Index)** - Calculate vegetation health
- **UHI Maps** - Generate urban heat island visualizations
- **CORS Enabled** - Ready for frontend integration

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy your GEE service account key file to `backend/service-account-key.json`

Update `backend/.env`:
```env
GEE_PROJECT_ID=your_actual_gee_project_id
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=./service-account-key.json
PORT=3001
FRONTEND_URL=http://localhost:8081
```

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 3001
```

Server will start at: http://localhost:3001

## API Endpoints

### Health Check
```
GET /
```

### Get Land Surface Temperature
```
GET /api/gee/lst?lat=3.1390&lon=101.6869&date=2024-12-15
```

Response:
```json
{
  "temperature": 35.2,
  "latitude": 3.1390,
  "longitude": 101.6869,
  "date": "2024-12-15",
  "satellite": "LANDSAT/LC09/C02/T1_L2"
}
```

### Get NDVI
```
GET /api/gee/ndvi?lat=3.1390&lon=101.6869&date=2024-12-15
```

Response:
```json
{
  "ndvi": 0.45,
  "latitude": 3.1390,
  "longitude": 101.6869,
  "date": "2024-12-15"
}
```

### Generate UHI Map
```
POST /api/gee/uhi-map
Content-Type: application/json

{
  "bounds": {
    "north": 3.2,
    "south": 3.0,
    "east": 101.8,
    "west": 101.5
  },
  "date": "2024-12-15"
}
```

## Testing

Test the endpoints:

```bash
# Health check
curl http://localhost:3001/

# LST
curl "http://localhost:3001/api/gee/lst?lat=3.1390&lon=101.6869&date=2024-12-15"

# NDVI
curl "http://localhost:3001/api/gee/ndvi?lat=3.1390&lon=101.6869&date=2024-12-15"
```

## Deployment

### Railway (Recommended for FYP)

1. Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. Push to GitHub
3. Connect to Railway
4. Add environment variables
5. Deploy!

### Render

1. Create `render.yaml`
2. Connect GitHub repo
3. Add environment variables
4. Deploy

## Troubleshooting

### GEE Authentication Failed
- Check service account key file exists
- Verify GEE_PROJECT_ID is correct
- Ensure service account is registered with Earth Engine

### No Satellite Data
- Try different dates (cloud cover affects availability)
- Landsat passes every 16 days
- Use dates within last 2 years for best results

### CORS Errors
- Update FRONTEND_URL in .env
- Restart the server after changes
