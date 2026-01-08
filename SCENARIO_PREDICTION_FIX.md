# Scenario Prediction Fix - Debug Guide

## 🐛 Problem Identified

**Issue:** Sliders moved but no predictions were displayed
**Symptoms:**
- Baseline Temperature showed `--°C`
- No predicted temperature after moving sliders
- Elevation showed "Current: 0m"

## 🔍 Root Causes Found

### 1. **Initial District Selection Issue**
- **Problem:** Initial `selectedDistrict` was hardcoded to "Kuala Lumpur"
- **Issue:** This exact district name may not exist in the database
- **Fix:** Changed to empty string `""` with auto-selection from first available district

### 2. **No Error Visibility**
- **Problem:** Silent failures - no way to see what was going wrong
- **Fix:** Added comprehensive console logging at every step

## ✅ Fixes Applied

### Fix #1: Auto-Select First Available District

**Before:**
```typescript
const [selectedDistrict, setSelectedDistrict] = useState<string>("Kuala Lumpur");
```

**After:**
```typescript
const [selectedDistrict, setSelectedDistrict] = useState<string>("");

// Auto-select first available district when data loads
useEffect(() => {
  if (districtGeoJSON?.features && districtGeoJSON.features.length > 0 && !selectedDistrict) {
    const firstDistrict = districtGeoJSON.features[0]?.properties?.name;
    if (firstDistrict) {
      console.log('[ScenarioPage] Setting initial district:', firstDistrict);
      setSelectedDistrict(firstDistrict);
    }
  }
}, [districtGeoJSON, selectedDistrict]);
```

### Fix #2: Comprehensive Logging

Added logging to track the entire flow:

1. **District Selection:**
   ```
   [ScenarioPage] Setting initial district: <district_name>
   [ScenarioPage] Fetching data for district: <district_name>
   ```

2. **API Fetch:**
   ```
   [ScenarioPage] fetchDistrictData called for: <district>
   [ScenarioPage] Fetching from: <url>
   [ScenarioPage] Response status: <status>
   [ScenarioPage] Received data: <data>
   ```

3. **Simulation:**
   ```
   [ScenarioPage] Running simulation with adjustments: {ndviAdjustment, ndbiAdjustment}
   [ScenarioPage] API request body: {...}
   [ScenarioPage] Prediction result: {...}
   ```

### Fix #3: Enhanced Error Handling

**Before:**
```typescript
if (response.ok) {
  const data = await response.json();
  // ... process data
}
```

**After:**
```typescript
const response = await fetch(url);
console.log('[ScenarioPage] Response status:', response.status);

if (response.ok) {
  const data = await response.json();
  console.log('[ScenarioPage] Received data:', data);
  
  if (data && data.length > 0) {
    // ... process data
  } else {
    console.warn('[ScenarioPage] No data returned for district:', district);
  }
} else {
  console.error('[ScenarioPage] API error:', response.status, response.statusText);
}
```

## 🧪 How to Test

### 1. Open Browser Console
Press `F12` or Right-click → Inspect → Console tab

### 2. Navigate to Scenarios Page
Watch the console logs appear in sequence:

```
[ScenarioPage] Setting initial district: Beaufort
[ScenarioPage] Fetching data for district: Beaufort
[ScenarioPage] Fetching from: http://localhost:8001/api/hotspots?district=Beaufort
[ScenarioPage] Response status: 200
[ScenarioPage] Received data: [{...}]
[ScenarioPage] District info: {...}
[ScenarioPage] District data set successfully
[ScenarioPage] Running simulation with adjustments: {ndviAdjustment: 0, ndbiAdjustment: 0}
[ScenarioPage] API request body: {...}
[ScenarioPage] Prediction API response status: 200
[ScenarioPage] Prediction result: {...}
[ScenarioPage] Prediction set: 33.5 Change: 0
```

### 3. Move Sliders
You should see:

```
[ScenarioPage] Running simulation for: Beaufort
[ScenarioPage] Adjustments: {ndviAdjustment: 0.2, ndbiAdjustment: 0, elevationOverride: null}
[ScenarioPage] District data: {...}
[ScenarioPage] API request body: {...}
[ScenarioPage] Prediction API response status: 200
[ScenarioPage] Prediction result: {predicted_temp: 32.1, temp_difference: -1.4, ...}
[ScenarioPage] Prediction set: 32.1 Change: -1.4
```

### 4. Check Prediction Card
Should now show:
- Baseline Temperature: **33.5°C**
- Predicted Temperature: **32.1°C**
- **⬇️ -1.4°C (Cooler)** 🎉

## 🔧 Troubleshooting

### If You Still See `--°C`:

1. **Check Console for Errors:**
   - Look for `[ScenarioPage] API error:` messages
   - Look for `[ScenarioPage] No data returned` warnings

2. **Verify Backend is Running:**
   - Check if `http://localhost:8001` is accessible
   - Test API directly: `http://localhost:8001/api/hotspots?district=Beaufort`

3. **Check District Name:**
   - Console shows: `[ScenarioPage] Setting initial district: <name>`
   - Verify this district actually exists in your database

4. **Check API Response:**
   - Look for `[ScenarioPage] Received data:` in console
   - Should show an array with district information

### If Predictions Don't Update:

1. **Check Slider Movement:**
   - Console should show: `[ScenarioPage] Running simulation for: ...`
   - If not appearing, check if `districtData` is set

2. **Check API Call:**
   - Look for `[ScenarioPage] Prediction API response status:`
   - Should be `200`
   - If `404`, the prediction endpoint might not exist
   - If `500`, check backend logs

3. **Check Backend Model:**
   - Verify `backend/models/uhi_rf_model_tuned.pkl` exists
   - Check backend terminal for errors

## 📊 Expected Flow

```
Page Load
  ↓
Load District GeoJSON from Supabase
  ↓
Auto-select First District (e.g., "Beaufort")
  ↓
Fetch District Data from /api/hotspots?district=Beaufort
  ↓
Set Baseline Temperature
  ↓
Run Initial Simulation (adjustments = 0)
  ↓
Show Baseline Temperature in Card
  ↓
User Moves Slider
  ↓  
Run Simulation with New Adjustments
  ↓
POST to /api/predictions/scenario-single
  ↓
Show Predicted Temperature + Delta
  ↓
Display Cooling/Warming Effect
```

## 🎯 Success Criteria

✅ Console shows clear log trail
✅ Baseline temperature appears immediately
✅ Moving sliders triggers new predictions
✅ Delta is shown with up/down arrow
✅ Color-coded feedback (green = cooler, red = warmer)

---

**Status:** Fixes applied. Check browser console for detailed logging!
