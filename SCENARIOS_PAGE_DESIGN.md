# Scenarios Page - 2-Layer Design Implementation

## ✅ Complete Redesign Following Best Practices

The Scenarios page has been completely redesigned following the **2-Layer Informative + Predictive** guideline for effective data storytelling.

---

## 🎯 Layer 1: The "INFORMATIVE" Layer (Situation Awareness)

**Goal:** Answer "What is happening right now and why?"

### 1. **Executive Summary (KPI Cards)**
**Purpose:** Instant headline numbers for policymakers

- **National Avg Temp** - Blue card with thermometer icon
- **Hottest District** - Red card showing peak temperature
- **Coolest District** - Green card showing coolest area

**Data Source:** Real-time from `useDistrictHeatmap()` hook (Supabase)

**Why It Matters:** Decision-makers see the critical numbers in 3 seconds.

### 2. **Spatial Context (Interactive Map)**
**Purpose:** Reveal geographic patterns

- Color-coded Malaysia district map
- Click districts to select and analyze
- Visual heat distribution (Red = Hot, Blue = Cool)

**Insight:** Instantly shows if heat is urban (KL, Penang) vs rural

### 3. **Historical Proof (Trend Line 2015-2024)**
**Purpose:** Create URGENCY by showing worsening trend

- Horizontal bar chart showing temperature rise over time
- Gradient yellow-to-red bars
- Clear upward trend visualization

**Impact:** "This isn't a one-time event - it's getting worse!"

### 4. **The "WHY" (Feature Importance Chart)**
**Purpose:** Scientific validation of recommendations

- NDBI (Urban Density): 38.2% - Strongest driver
- NDVI (Vegetation): 25.0% - Second strongest (cooling effect)
- Population: 22.6%
- Elevation: 14.3%

**Proof:** When we say "plant more trees," this scientifically proves WHY.

---

## 🔮 Layer 2: The "WHAT-IF" SIMULATOR (Intervention Impact)

**Goal:** Answer "What happens if we intervene?"

### The Digital Twin Concept

The sidebar creates a simplified "Digital Twin" of any selected district, allowing users to:

1. **Select a Location** - Choose any district from dropdown
2. **View Baseline** - See current temperature, NDVI, NDBI
3. **Adjust Parameters:**
   - **Greenery Slider (NDVI)**: -0.5 to +0.5
   - **Urban Density Slider (NDBI)**: -0.5 to +0.5  
   - **Elevation Override**: Numeric input
4. **Get Live Prediction** - RF Model predicts new temperature
5. **See Impact** - Delta metrics with visual feedback

### The Prediction Engine

**Brain:** Tuned Random Forest model (`uhi_rf_model_tuned.pkl`)

**Process:**
```
User Input → API Call → RF Model Prediction → Delta Calculation → Visual Feedback
```

**API Endpoint:** `POST /api/predictions/scenario-single`

**Request:**
```json
{
  "city": "Kuala Lumpur",
  "ndvi_change": +0.2,
  "ndbi_change": -0.1,
  "elevation": 50
}
```

**Response:**
```json
{
  "original_temp": 33.5,
  "predicted_temp": 31.0,
  "temp_difference": -2.5,
  "confidence_score": 0.94
}
```

### Delta Metrics Visualization

**Good Design (IMPLEMENTED):**
✅ Baseline Temperature: **33.5°C**
✅ Predicted Temperature: **31.0°C**  
✅ Impact: **⬇️ -2.5°C (Cooler)** 🎉

Color-coded feedback:
- **Green** with ⬇️ icon = Cooling effect
- **Red** with ⬆️ icon = Warming effect

**Bad Design (AVOIDED):**
❌ Just showing "New Temp: 31°C" (requires mental math)

---

## 📊 Complete User Workflow

| User Question | Dashboard Component | Data Source |
|--------------|-------------------|-------------|
| **"Where is it hot?"** | Map & KPI Cards | Real-time Supabase data |
| **"Is it getting worse?"** | Trend Line 2015-2024 | Historical training data |
| **"What causes it?"** | Feature Importance Chart | RF Model analysis |
| **"Can we fix it?"** | **What-If Simulator** | **Live RF Predictions** |

---

## 🎨 Design Highlights

### Visual Hierarchy
1. **Header:** Clear 2-layer concept explanation
2. **Left Sidebar (Purple accent):** Interactive controls - Layer 2
3. **Right Main Panel:**
   - Top: Situation (KPIs + Map) - Layer 1  
   - Bottom: Insights (Trends + Rankings + Why) - Layer 1

### Color Coding
- **Blue:** General temperature/water
- **Green:** Vegetation/cooling
- **Red/Orange:** Urban/heat
- **Purple:** Analysis/insights
- **Emerald:** Model accuracy badge

### Interactive Elements
- ✅ Gradient sliders show effect visually
- ✅ Real-time prediction updates
- ✅ Click map to select districts
- ✅ Load districts from database (not hardcoded)
- ✅ Reset button to return to baseline

---

## 🚀 Technical Implementation

### Key Technologies
- **React + TypeScript**
- **Tailwind CSS** for styling
- **Lucide Icons** for visual elements
- **MapBox** via ChoroplethMap component
- **Supabase** for real-time district data
- **FastAPI Backend** for predictions

### Custom Hooks Used
- `useDistrictHeatmap()` - Fetches all district GeoJSON data
- Computed KPIs from GeoJSON features
- Computed hottest districts from GeoJSON features

### State Management
```typescript
// Layer 1 Data (Informative)
const kpiData = computed from districtGeoJSON
const hottestDistricts = computed from districtGeoJSON  
const trendData = useState(historical data)

// Layer 2 Data (Predictive)
const [ndviAdjustment, setNdviAdjustment] = useState(0)
const [ndbiAdjustment, setNdbiAdjustment] = useState(0)
const [predictedTemp, setPredictedTemp] = useState<number | null>(null)
const [tempChange, setTempChange] = useState<number>(0)
```

---

## 📈 Data Flow

### Informative Layer (Layer 1)
```
Supabase → useDistrictHeatmap() → GeoJSON → Computed KPIs → Display
```

### Predictive Layer (Layer 2)
```
User Adjusts Sliders → runSimulation() → POST /api/predictions/scenario-single → 
RF Model → Prediction → Delta Calculation → Visual Feedback
```

---

## 🎯 Key Success Metrics

✅ **Information Density:** All critical data visible without scrolling
✅ **Interaction Clarity:** Sliders + instant feedback
✅ **Scientific Credibility:** Feature importance validates recommendations
✅ **Decision Support:** "What-if" enables evidence-based planning
✅ **Visual Impact:** Professional design suitable for stakeholder presentations

---

## 💡 Design Philosophy

This page transforms the dashboard from a **passive report** into an **active planning tool**:

- **Looking Back:** Historical trends show the problem is real and urgent
- **Understanding Now:** KPIs and maps show current hotspots  
- **Proving Why:** Feature importance validates the science
- **Planning Forward:** What-if simulator enables intervention testing

---

## 🔄 Future Enhancements (Optional)

1. **Trade-off Visualization:** Show NDVI/NDBI inverse relationship
2. **Multi-District Comparison:** Compare scenarios for 2+ districts
3. **Cost-Benefit Analysis:** Add implementation cost estimates
4. **Prescription Mode:** "I want 3°C cooling - tell me required NDVI"
5. **Historical Playback:** Animate temperature changes 2015→2024
6. **Export Reports:** PDF/PNG export for presentations

---

**Status: ✅ COMPLETE**

The Scenarios page now provides a complete **Inform → Understand → Predict → Act** workflow, making it a powerful tool for urban planners, policymakers, and researchers!
