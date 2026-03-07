import { useState, useEffect } from "react";
import {
  MapPin,
  Thermometer,
  Leaf,
  Building2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Activity,
  BarChart3,
  Target,
  Minus,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ChoroplethMap } from "@/components/choropleth/ChoroplethMap";
import { ScenarioNavbar } from "@/components/ScenarioNavbar";
import { useDistrictHeatmap } from "@/hooks/useDistrictHeatmap";
import { useStateHeatmap } from "@/hooks/useStateHeatmap";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// --- Interfaces ---
interface KPIData {
  nationalAvg: number;
  hottestDistrict: { name: string; temp: number };
  coolestDistrict: { name: string; temp: number };
}

interface DistrictData {
  name: string;
  temperature: number;
  ndvi: number;
  ndbi: number;
  elevation: number;
  population: number;
}

interface TimeSeriesResult {
  predictions: { year: number; temperature: number }[];
  metrics: {
    peak_temp: number;
    avg_increase: number;
    trend: string;
    confidence: number;
    baseline_temp: number;
  };
}

// --- Chart Tooltips ---
const TrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{payload[0].value.toFixed(1)}°C</p>
      </div>
    );
  }
  return null;
};

const ProjectionTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">Year {label}</p>
        <p className="text-sm font-semibold text-foreground">{payload[0].value.toFixed(1)}°C</p>
      </div>
    );
  }
  return null;
};

// --- Scenario Templates ---
const scenarioTemplates = [
  { name: "Green City", description: "Maximize green spaces", ndvi: 0.3, ndbi: -0.2, icon: Leaf, color: "text-eco" },
  { name: "High Urban", description: "Dense development", ndvi: -0.2, ndbi: 0.3, icon: Building2, color: "text-orange-500" },
  { name: "Eco District", description: "Moderate greening", ndvi: 0.15, ndbi: -0.1, icon: Leaf, color: "text-emerald-500" },
  { name: "Expansion", description: "Urban growth", ndvi: -0.15, ndbi: 0.2, icon: Building2, color: "text-red-500" },
];

// Feature importance (from the trained RF model)
const featureImportance = [
  { feature: "Urban Density (NDBI)", importance: 38.21, fill: "#ef4444" },
  { feature: "Vegetation (NDVI)", importance: 24.96, fill: "#22c55e" },
  { feature: "Population", importance: 22.57, fill: "#f59e0b" },
  { feature: "Elevation", importance: 14.26, fill: "#3b82f6" },
];

// National temperature trend data (2015-2024)
const trendData = [
  { year: 2015, temperature: 31.5 },
  { year: 2016, temperature: 32.1 },
  { year: 2017, temperature: 31.8 },
  { year: 2018, temperature: 32.4 },
  { year: 2019, temperature: 32.6 },
  { year: 2020, temperature: 32.3 },
  { year: 2021, temperature: 32.8 },
  { year: 2022, temperature: 33.1 },
  { year: 2023, temperature: 33.4 },
  { year: 2024, temperature: 33.6 },
];

// --- Name normalizer ---
const normalizeDistrictName = (name: string): string => {
  const map: Record<string, string> = {
    "W.P. Kuala Lumpur": "Kuala Lumpur",
    "W.P. Putrajaya": "Putrajaya",
    "W.P. Labuan": "Labuan",
  };
  return map[name] || name;
};

// ============================
// MAIN COMPONENT
// ============================
const ScenarioPage = () => {
  const { data: districtGeoJSON, isLoading: isLoadingDistricts } = useDistrictHeatmap();
  const { data: stateGeoJSON, isLoading: isLoadingStates } = useStateHeatmap();

  // --- State ---
  const [viewLevel, setViewLevel] = useState<"states" | "districts">("districts");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Sliders (raw NDVI/NDBI adjustment, -0.5 to +0.5)
  const [ndviAdjustment, setNdviAdjustment] = useState([0]);
  const [ndbiAdjustment, setNdbiAdjustment] = useState([0]);

  // Spatial prediction result
  const [baselineTemp, setBaselineTemp] = useState<number | null>(null);
  const [predictedTemp, setPredictedTemp] = useState<number | null>(null);
  const [tempChange, setTempChange] = useState<number>(0);

  // Time-series projection
  const [timeSeriesResult, setTimeSeriesResult] = useState<TimeSeriesResult | null>(null);

  // --- Derived data based on current view level ---
  const currentGeoJSON = viewLevel === "states" ? stateGeoJSON : districtGeoJSON;
  const isLoadingData = viewLevel === "states" ? isLoadingStates : isLoadingDistricts;

  const kpiData: KPIData | null = (() => {
    if (!currentGeoJSON?.features?.length) return null;
    const valid = currentGeoJSON.features
      .filter((f: any) => f.properties.avg_temperature != null && !isNaN(f.properties.avg_temperature))
      .map((f: any) => ({ name: f.properties.name || "Unknown", temp: f.properties.avg_temperature! }));
    if (!valid.length) return null;
    const avg = valid.reduce((s: number, d: any) => s + d.temp, 0) / valid.length;
    const sorted = [...valid].sort((a: any, b: any) => b.temp - a.temp);
    return { nationalAvg: avg, hottestDistrict: sorted[0], coolestDistrict: sorted[sorted.length - 1] };
  })();

  const hottestLocations = (() => {
    if (!currentGeoJSON?.features) return [];
    return currentGeoJSON.features
      .filter((f: any) => f.properties.avg_temperature != null && !isNaN(f.properties.avg_temperature))
      .map((f: any) => ({ name: f.properties.name || "Unknown", temperature: f.properties.avg_temperature! }))
      .sort((a: any, b: any) => b.temperature - a.temperature)
      .slice(0, 10);
  })();

  // --- Effects ---
  // Reset selection when switching between states and districts
  useEffect(() => {
    setSelectedLocation("");
    setDistrictData(null);
    setBaselineTemp(null);
    setPredictedTemp(null);
    setTempChange(0);
    setTimeSeriesResult(null);
  }, [viewLevel]);

  // Auto-select first location when data loads
  useEffect(() => {
    if (currentGeoJSON?.features?.length && !selectedLocation) {
      const first = currentGeoJSON.features[0]?.properties?.name;
      if (first) setSelectedLocation(first);
    }
  }, [currentGeoJSON, selectedLocation]);

  useEffect(() => {
    if (selectedLocation) fetchLocationData(selectedLocation);
  }, [selectedLocation, viewLevel]);

  // --- Data fetching ---
  const fetchLocationData = (location: string) => {
    setLoading(true);
    if (!currentGeoJSON?.features) { setLoading(false); return; }

    const feature = currentGeoJSON.features.find((f: any) => {
      const name = f.properties?.name || f.properties?.district_name || f.properties?.state_name;
      return name === location;
    });

    if (!feature) {
      toast.error(`${viewLevel === "states" ? "State" : "District"} "${location}" not found.`);
      setLoading(false);
      return;
    }

    const p = feature.properties;
    if (!p.avg_temperature || p.avg_temperature === 0) {
      toast.error(`No temperature data for "${location}".`);
      setLoading(false);
      return;
    }

    setDistrictData({
      name: location,
      temperature: p.avg_temperature || 0,
      ndvi: p.avg_ndvi || 0.5,
      ndbi: p.avg_ndbi || 0,
      elevation: (p as any).elevation || 50,
      population: (p as any).population || 0,
    });
    setBaselineTemp(p.avg_temperature || 0);
    setPredictedTemp(null);
    setTempChange(0);
    setTimeSeriesResult(null);
    setLoading(false);
  };

  // --- Simulation ---
  const runSimulation = async () => {
    if (!districtData) return;
    setIsSimulating(true);

    try {
      const normalizedName = normalizeDistrictName(selectedLocation);

      // 1. Spatial prediction (XGBoost)
      const spatialRes = await fetch(`${API_BASE}/api/spatial/scenario-single`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: normalizedName,
          ndvi_change: ndviAdjustment[0],
          ndbi_change: ndbiAdjustment[0],
        }),
      });

      if (spatialRes.ok) {
        const result = await spatialRes.json();
        setPredictedTemp(result.predicted_temp);
        setTempChange(result.temp_difference);
      } else {
        toast.error(`Spatial prediction failed for "${selectedLocation}"`);
      }

      // 2. Time-series projection (CatBoost) - fire in parallel
      try {
        const tsRes = await fetch(`${API_BASE}/api/timeseries/api/predict-scenario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: normalizedName,
            year_range: [2025, 2035],
            ndvi_adjustment: ndviAdjustment[0],
            ndbi_adjustment: ndbiAdjustment[0],
            climate_factor: 1.0,
          }),
        });
        if (tsRes.ok) {
          setTimeSeriesResult(await tsRes.json());
        }
      } catch {
        // Time-series is optional — don't block on failure
      }

      toast.success(`Prediction complete for ${selectedLocation}`);
    } catch {
      toast.error("Connection error. Is the backend running?");
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setNdviAdjustment([0]);
    setNdbiAdjustment([0]);
    setPredictedTemp(null);
    setTempChange(0);
    setTimeSeriesResult(null);
  };

  const applyPreset = (t: typeof scenarioTemplates[0]) => {
    setNdviAdjustment([t.ndvi]);
    setNdbiAdjustment([t.ndbi]);
  };

  const hasAdjustment = ndviAdjustment[0] !== 0 || ndbiAdjustment[0] !== 0;
  const trendIcon = tempChange < 0 ? TrendingDown : tempChange > 0 ? TrendingUp : Minus;
  const TrendIcon = trendIcon;

  // ============================
  // RENDER
  // ============================
  return (
    <div className="min-h-screen bg-background">
      {/* ───────── NAVBAR ───────── */}
      <ScenarioNavbar
        selectedLocation={selectedLocation}
        viewLevel={viewLevel}
        onViewLevelChange={setViewLevel}
        locations={
          currentGeoJSON?.features
            ?.map((f: any) => f.properties.name)
            .filter((n: any) => n)
            .sort() || []
        }
        onLocationChange={setSelectedLocation}
        currentTemp={baselineTemp}
        predictedTemp={predictedTemp}
        tempChange={tempChange}
        ndvi={districtData?.ndvi ?? null}
        ndbi={districtData?.ndbi ?? null}
        onApplyPreset={(preset) => {
          setNdviAdjustment([preset.ndvi]);
          setNdbiAdjustment([preset.ndbi]);
        }}
        onReset={resetSimulation}
        isLoading={loading}
        isSimulating={isSimulating}
        trendData={trendData}
      />

      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ═══════════════════════════════
              SIDEBAR (3 cols)
              ═══════════════════════════════ */}
          <div className="lg:col-span-3 space-y-5">

            {/* --- What-If Controls --- */}
            <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
              <h2 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                What-If Controls
              </h2>

              {/* Quick Presets */}
              <div className="mb-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick Scenarios</p>
                <div className="grid grid-cols-2 gap-2">
                  {scenarioTemplates.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(t)}
                      className="px-3 py-2 text-left rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs group"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-foreground group-hover:text-primary">
                        <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                        {t.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NDVI Slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-eco" />
                    <span className="text-sm font-medium text-foreground">Greenery (NDVI)</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${ndviAdjustment[0] >= 0 ? "text-eco" : "text-orange-500"}`}>
                    {ndviAdjustment[0] > 0 ? "+" : ""}{ndviAdjustment[0].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={ndviAdjustment}
                  onValueChange={setNdviAdjustment}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  className="[&_[role=slider]]:bg-eco [&_[role=slider]]:border-eco [&_.bg-primary]:bg-eco"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>Less Green</span>
                  <span>More Green</span>
                </div>
              </div>

              {/* NDBI Slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-foreground">Urban Density (NDBI)</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${ndbiAdjustment[0] >= 0 ? "text-orange-500" : "text-blue-500"}`}>
                    {ndbiAdjustment[0] > 0 ? "+" : ""}{ndbiAdjustment[0].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={ndbiAdjustment}
                  onValueChange={setNdbiAdjustment}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500 [&_.bg-primary]:bg-orange-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>Less Urban</span>
                  <span>More Urban</span>
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={runSimulation}
                disabled={!hasAdjustment || isSimulating}
                className="w-full mb-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg"
                size="lg"
              >
                {isSimulating ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Running…</>
                ) : !hasAdjustment ? (
                  "Adjust sliders first"
                ) : (
                  <><ChevronRight className="w-4 h-4 mr-1" /> Predict Temperature</>
                )}
              </Button>
              <Button variant="ghost" onClick={resetSimulation} className="w-full text-muted-foreground text-sm">
                Reset to Baseline
              </Button>
            </div>

            {/* --- Prediction Result Card --- */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-xl p-5 text-primary-foreground">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="w-4 h-4" />
                <h3 className="font-display font-semibold text-sm">Prediction Result</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-primary-foreground/70">Baseline</p>
                    <p className="text-3xl font-display font-bold">{baselineTemp?.toFixed(1) || "--"}°C</p>
                  </div>

                  {predictedTemp !== null && (
                    <>
                      <div className="h-px bg-primary-foreground/20" />
                      <div>
                        <p className="text-xs text-primary-foreground/70">Predicted</p>
                        <p className="text-3xl font-display font-bold">{predictedTemp.toFixed(1)}°C</p>
                      </div>
                      <div className={`flex items-center gap-2 text-lg font-bold ${tempChange < 0 ? "text-emerald-300" : "text-red-300"}`}>
                        <TrendIcon className="w-5 h-5" />
                        <span>{tempChange > 0 ? "+" : ""}{tempChange.toFixed(2)}°C</span>
                      </div>
                      <p className="text-xs text-primary-foreground/80">
                        {tempChange < 0 ? "🎉 Your changes help reduce heat!" : "⚠️ Consider more green spaces."}
                      </p>
                    </>
                  )}

                  {predictedTemp === null && !hasAdjustment && (
                    <div className="p-3 bg-primary-foreground/10 rounded-xl">
                      <p className="text-xs text-primary-foreground/80">
                        👆 Move the sliders above, then click Predict to see results.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════
              MAIN PANEL (9 cols)
              ═══════════════════════════════ */}
          <div className="lg:col-span-9 space-y-6">

            {/* --- KPI Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "National Avg Temp",
                  value: kpiData?.nationalAvg,
                  sub: null,
                  icon: Thermometer,
                  iconBg: "bg-primary/10",
                  iconColor: "text-primary",
                  valueColor: "text-foreground",
                },
                {
                  label: "Hottest District",
                  value: kpiData?.hottestDistrict.temp,
                  sub: kpiData?.hottestDistrict.name,
                  icon: TrendingUp,
                  iconBg: "bg-red-500/10",
                  iconColor: "text-red-500",
                  valueColor: "text-red-500",
                },
                {
                  label: "Coolest District",
                  value: kpiData?.coolestDistrict.temp,
                  sub: kpiData?.coolestDistrict.name,
                  icon: TrendingDown,
                  iconBg: "bg-eco/10",
                  iconColor: "text-eco",
                  valueColor: "text-eco",
                },
              ].map((card, i) => (
                <div key={i} className="bg-card rounded-2xl shadow-card p-5 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                      {card.value != null ? (
                        <>
                          <p className={`text-2xl font-display font-bold ${card.valueColor}`}>
                            {card.value.toFixed(1)}°C
                          </p>
                          {card.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>}
                        </>
                      ) : (
                        <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
                      )}
                    </div>
                    <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                      <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Map --- */}
            <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
              <h2 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {viewLevel === "states" ? "State" : "District"} Temperature Map
              </h2>
              <div className="h-[400px] rounded-xl overflow-hidden bg-muted/30">
                <ChoroplethMap
                  level={viewLevel}
                  highlightedDistrict={selectedLocation}
                  onLocationClick={(feature: any) => {
                    const name = feature.properties?.name || feature.properties?.district_name;
                    if (name) setSelectedLocation(name);
                  }}
                />
              </div>
            </div>

            {/* --- Time-Series Projection (appears after prediction) --- */}
            {timeSeriesResult && (() => {
              // Apply spatial model's tempChange to time-series predictions for consistency
              // This makes the projection START from the spatial prediction result
              const offset = tempChange || 0;
              const adjustedPredictions = timeSeriesResult.predictions.map(p => ({
                ...p,
                temperature: Math.round((p.temperature + offset) * 100) / 100 // Apply offset and round
              }));

              const adjustedBaseline = baselineTemp || timeSeriesResult.metrics.baseline_temp;
              const temps = adjustedPredictions.map(p => p.temperature);
              const minTemp = Math.min(...temps);
              const maxTemp = Math.max(...temps);
              const adjustedPeak = maxTemp;
              const avgAdjustedTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
              const changeFromBaseline = avgAdjustedTemp - adjustedBaseline;
              const effectiveTrend = offset < -0.1 ? "cooling" : offset > 0.1 ? "warming" : "stable";

              return (
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl shadow-card p-6 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                        {effectiveTrend === "cooling" ? <TrendingDown className="w-4 h-4 text-eco" /> : <TrendingUp className="w-4 h-4 text-accent" />}
                        10-Year Projection with Your Scenario
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Based on spatial prediction ({offset > 0 ? "+" : ""}{offset.toFixed(1)}°C) · Confidence: {Math.round(timeSeriesResult.metrics.confidence * 100)}%
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      effectiveTrend === "cooling"
                        ? "bg-eco/10 text-eco"
                        : effectiveTrend === "warming"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {effectiveTrend === "cooling" ? "↓" : effectiveTrend === "warming" ? "↑" : "→"} {effectiveTrend}
                    </div>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adjustedPredictions} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) => `${v.toFixed(1)}°`}
                          domain={[Math.floor(minTemp - 1), Math.ceil(maxTemp + 1)]}
                          width={45}
                        />
                        <Tooltip content={<ProjectionTooltip />} />
                        <ReferenceLine
                          y={adjustedBaseline}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="5 5"
                          opacity={0.5}
                          label={{ value: "Current", fill: "hsl(var(--muted-foreground))", fontSize: 10, position: "right" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke={effectiveTrend === "cooling" ? "hsl(142, 76%, 36%)" : "hsl(var(--accent))"}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: effectiveTrend === "cooling" ? "hsl(142, 76%, 36%)" : "hsl(var(--accent))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                          animationDuration={800}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                    <span>Peak: <strong className="text-foreground">{adjustedPeak.toFixed(1)}°C</strong></span>
                    <span>Avg vs Current: <strong className={changeFromBaseline < 0 ? "text-eco" : "text-red-500"}>
                      {changeFromBaseline > 0 ? "+" : ""}{changeFromBaseline.toFixed(1)}°C
                    </strong></span>
                  </div>
                </div>
              );
            })()}

            {/* --- Bottom Charts Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Temperature Trend (Recharts AreaChart) */}
              <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
                <h2 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  Temperature Trend (2015–2024)
                </h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} domain={[31, 34]} />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#trendGrad)"
                        dot={{ r: 4, fill: "#ef4444", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Hottest Locations (Recharts BarChart) */}
              <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
                <h2 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  Top 10 Hottest {viewLevel === "states" ? "States" : "Districts"}
                </h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hottestLocations} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} domain={[30, "dataMax + 1"]} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<TrendTooltip />} />
                      <Bar dataKey="temperature" radius={[0, 4, 4, 0]} animationDuration={800}>
                        {hottestLocations.map((_: any, i: number) => (
                          <Cell key={i} fill={i < 3 ? "#ef4444" : i < 6 ? "#f97316" : "#fb923c"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Importance (full width) */}
              <div className="md:col-span-2 bg-card rounded-2xl shadow-card p-5 border border-border">
                <h2 className="font-display font-semibold text-foreground text-sm mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  Model Feature Importance
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Random Forest model reveals which factors most impact urban heat.
                </p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 45]} />
                      <YAxis type="category" dataKey="feature" width={130} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Importance"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="importance" radius={[0, 6, 6, 0]} animationDuration={1000}>
                        {featureImportance.map((item, i) => (
                          <Cell key={i} fill={item.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-accent/5 border border-accent/10 rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-accent">Key Insight:</strong> Urban density (NDBI) is the strongest heat driver at 38.2%, followed by vegetation cover (NDVI) at 25%. This validates that greening cities can effectively combat urban heat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPage;
