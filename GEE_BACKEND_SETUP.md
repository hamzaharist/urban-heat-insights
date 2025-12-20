# GEE Backend Setup Guide

## Quick Start

### 1. Copy Your Service Account Key

Place your GEE service account JSON key file in the backend directory:
```
backend/service-account-key.json
```

### 2. Update Backend Environment

Edit `backend/.env`:
```env
GEE_PROJECT_ID=uhifyp
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@uhifyp.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=./service-account-key.json
PORT=3001
FRONTEND_URL=http://localhost:8081
ENVIRONMENT=development
```

### 3. Start the Backend

```bash
cd backend
python main.py
```

Backend will start at: **http://localhost:3001**

### 4. Test the Backend

```bash
# Health check
curl http://localhost:3001/

# Test LST endpoint
curl "http://localhost:3001/api/gee/lst?lat=3.1390&lon=101.6869&date=2024-12-01"
```

### 5. Frontend is Already Configured

The frontend `.env` already has:
```env
VITE_GEE_BACKEND_URL="http://localhost:3001"
```

Just refresh your browser at http://localhost:8081/

---

## Testing the Integration

### Test LST Data

1. Start backend: `cd backend && python main.py`
2. Frontend should already be running at http://localhost:8081/
3. Open browser console (F12)
4. Navigate to map section
5. Check for GEE API calls

### Expected Behavior

- Map section fetches real LST data from satellites
- NDVI values calculate vegetation index
- Loading states show while fetching
- Error handling if no satellite data available

---

## Troubleshooting

### Backend Won't Start

**Error**: `Failed to initialize Google Earth Engine`

**Solution**:
1. Check `service-account-key.json` exists in backend folder
2. Verify `GEE_PROJECT_ID` matches your project
3. Ensure service account is registered with Earth Engine

### No Satellite Data

**Error**: `404 - No satellite data available`

**Solution**:
- Landsat passes every 16 days
- Try recent dates (within last month)
- Cloud cover affects availability
- Try: `2024-12-01` or `2024-11-15`

### CORS Errors

**Error**: `CORS policy blocked`

**Solution**:
1. Check `FRONTEND_URL` in backend `.env`
2. Restart backend after changing `.env`
3. Clear browser cache

---

## For Your FYP Demo

### Running Both Services

**Terminal 1** (Backend):
```bash
cd backend
python main.py
```

**Terminal 2** (Frontend):
```bash
npm run dev
```

### Demo URLs

- **Frontend**: http://localhost:8081/
- **Backend API**: http://localhost:3001/
- **API Docs**: http://localhost:3001/docs (FastAPI auto-docs)

### Demo Script

1. Show frontend loading real data
2. Open browser DevTools → Network tab
3. Show API calls to backend (`/api/gee/lst`)
4. Show backend terminal logs
5. Explain satellite data processing

---

## Deployment (For Final Submission)

### Railway Deployment

1. Create `railway.json` in backend folder (already done)
2. Push to GitHub
3. Connect Railway to your repo
4. Add environment variables in Railway dashboard
5. Deploy!

### Environment Variables for Railway

```
GEE_PROJECT_ID=uhifyp
GEE_SERVICE_ACCOUNT_EMAIL=your-email
GEE_PRIVATE_KEY_PATH=./service-account-key.json
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=3001
```

**Important**: Upload `service-account-key.json` as a Railway secret file

---

## Next Steps

1. ✅ Backend is set up
2. ✅ Frontend is configured
3. ⏳ Copy service account key to `backend/service-account-key.json`
4. ⏳ Update `backend/.env` with your project ID
5. ⏳ Start backend and test

Once backend is running, your app will fetch real satellite data! 🛰️
