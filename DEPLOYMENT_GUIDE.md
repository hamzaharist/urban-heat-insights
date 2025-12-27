# Deployment Guide - Urban Heat Insights

## 🚀 Quick Deployment Steps

### Step 1: Commit and Push to GitHub

```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Deploy Backend to Render

1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your `hamzaharist/urban-heat-insights` repository
5. Configure:
   - **Name:** `urban-heat-api` (or your choice)
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables (click "Advanced"):
   ```
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_KEY=<your_supabase_service_key>
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
   ```
7. Click "Create Web Service"
8. **Save the URL** (e.g., `https://urban-heat-api.onrender.com`)

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import `hamzaharist/urban-heat-insights`
5. Vercel auto-detects Vite - just click "Deploy"
6. After deployment, go to "Settings" → "Environment Variables"
7. Add these variables:
   ```
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
   VITE_MAPBOX_ACCESS_TOKEN=<your_mapbox_token>
   VITE_API_URL=<your_render_backend_url>
   ```
8. Redeploy from the "Deployments" tab

### Step 4: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://urban-heat-insights.vercel.app`)
2. Navigate to "/choropleth"
3. Wait 30-50 seconds for backend to wake up (first time only)
4. Verify map loads with data

## 🎯 URLs You'll Get

- **Frontend:** `https://urban-heat-insights.vercel.app`
- **Backend API:** `https://urban-heat-api.onrender.com`
- **API Docs:** `https://urban-heat-api.onrender.com/docs`

## ✅ Add to LinkedIn

Update your LinkedIn project with:
- **Project URL:** Your Vercel frontend URL
- **GitHub:** https://github.com/hamzaharist/urban-heat-insights

---

**Note:** First load takes 30-50 seconds (backend wakes up). Subsequent loads are instant for 15 minutes.
