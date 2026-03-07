import { useState, useEffect, useMemo } from "react";
import {
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
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
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
  { name: "Green City", description: "Maximize green spaces (+30% vegetation)", ndvi: 0.3, ndbi: -0.2, icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { name: "Eco District", description: "Balanced sustainable approach", ndvi: 0.15, ndbi: -0.1, icon: Sparkles, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  { name: "High Urban", description: "Dense commercial development", ndvi: -0.2, ndbi: 0.3, icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { name: "Expansion", description: "Rapid urban growth scenario", ndvi: -0.15, ndbi: 0.2, icon: TrendingUp, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
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

  const kpiData: KPIData | null = useMemo(() => {
    if (!currentGeoJSON?.features?.length) return null;
    const valid = currentGeoJSON.features
      .filter((f: any) => f.properties.avg_temperature != null && !isNaN(f.properties.avg_temperature))
      .map((f: any) => ({ name: f.properties.name || "Unknown", temp: f.properties.avg_temperature! }));
    if (!valid.length) return null;
    const avg = valid.reduce((s: number, d: any) => s + d.temp, 0) / valid.length;
    const sorted = [...valid].sort((a: any, b: any) => b.temp - a.temp);
    return { nationalAvg: avg, hottestDistrict: sorted[0], coolestDistrict: sorted[sorted.length - 1] };
  }, [currentGeoJSON]);

  const hottestLocations = useMemo(() => {
    if (!currentGeoJSON?.features) return [];
    return currentGeoJSON.features
      .filter((f: any) => f.properties.avg_temperature != null && !isNaN(f.properties.avg_temperature))
      .map((f: any) => ({ name: f.properties.name || "Unknown", temperature: f.properties.avg_temperature! }))
      .sort((a: any, b: any) => b.temperature - a.temperature)
      .slice(0, 10);
  }, [currentGeoJSON]);

  // --- Effects ---
  useEffect(() => {
    setSelectedLocation("");
    setDistrictData(null);
    setBaselineTemp(null);
    setPredictedTemp(null);
    setTempChange(0);
    setTimeSeriesResult(null);
  }, [viewLevel]);

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

      // 2. Time-series projection (CatBoost)
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
        // Time-series is optional
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

  // Projection data for hero chart
  const projectionData = useMemo(() => {
    if (timeSeriesResult) {
      const offset = tempChange || 0;
      return timeSeriesResult.predictions.map(p => ({
        ...p,
        temperature: Math.round((p.temperature + offset) * 100) / 100
      }));
    }
    return null;
  }, [timeSeriesResult, tempChange]);

  const projectionStats = useMemo(() => {
    if (!projectionData || !baselineTemp) return null;
    const temps = projectionData.map(p => p.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    const changeFromBaseline = avgTemp - baselineTemp;
    const effectiveTrend = tempChange < -0.1 ? "cooling" : tempChange > 0.1 ? "warming" : "stable";
    return { minTemp, maxTemp, avgTemp, changeFromBaseline, effectiveTrend };
  }, [projectionData, baselineTemp, tempChange]);

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

      <div className="max-w-[1600px] mx-auto p-6">
        {/* ═══════════════════════════════
            HERO: 10-YEAR PROJECTION CHART
            ═══════════════════════════════ */}
        <div className="mb-6">
          {projectionData && projectionStats ? (
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-3xl shadow-xl border border-primary/10 overflow-hidden">
              {/* Hero Header */}
              <div className="p-6 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {projectionStats.effectiveTrend === "cooling" ? (
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                          <TrendingDown className="w-6 h-6 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="p-2 bg-accent/10 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-accent" />
                        </div>
                      )}
                      <div>
                        <h1 className="font-display text-xl font-bold text-foreground">
                          10-Year Temperature Projection
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {selectedLocation} · Based on your scenario adjustments
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4 py-2 bg-card rounded-xl border border-border">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Peak</p>
                      <p className="text-lg font-bold text-foreground">{projectionStats.maxTemp.toFixed(1)}°C</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-card rounded-xl border border-border">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Average</p>
                      <p className="text-lg font-bold text-foreground">{projectionStats.avgTemp.toFixed(1)}°C</p>
                    </div>
                    <div className={`text-center px-4 py-2 rounded-xl border ${
                      projectionStats.changeFromBaseline < 0
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">vs Baseline</p>
                      <p className={`text-lg font-bold ${
                        projectionStats.changeFromBaseline < 0 ? "text-emerald-500" : "text-red-500"
                      }`}>
                        {projectionStats.changeFromBaseline > 0 ? "+" : ""}{projectionStats.changeFromBaseline.toFixed(1)}°C
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      projectionStats.effectiveTrend === "cooling"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : projectionStats.effectiveTrend === "warming"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {projectionStats.effectiveTrend === "cooling" ? "↓ Cooling" :
                       projectionStats.effectiveTrend === "warming" ? "↑ Warming" : "→ Stable"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Chart */}
              <div className="p-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={projectionStats.effectiveTrend === "cooling" ? "#22c55e" : "#f97316"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={projectionStats.effectiveTrend === "cooling" ? "#22c55e" : "#f97316"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v.toFixed(1)}°`}
                        domain={[Math.floor(projectionStats.minTemp - 1), Math.ceil(projectionStats.maxTemp + 1)]}
                        width={50}
                      />
                      <Tooltip content={<ProjectionTooltip />} />
                      <ReferenceLine
                        y={baselineTemp}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                        opacity={0.6}
                        label={{ value: `Current: ${baselineTemp?.toFixed(1)}°C`, fill: "hsl(var(--muted-foreground))", fontSize: 11, position: "insideTopRight" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="transparent"
                        fill="url(#projectionGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke={projectionStats.effectiveTrend === "cooling" ? "#22c55e" : "#f97316"}
                        strokeWidth={3}
                        dot={{ r: 5, fill: projectionStats.effectiveTrend === "cooling" ? "#22c55e" : "#f97316", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Confidence Note */}
                {timeSeriesResult && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                    <span>Model confidence: {Math.round(timeSeriesResult.metrics.confidence * 100)}%</span>
                    <span className="mx-2">•</span>
                    <span>Spatial adjustment applied: {tempChange > 0 ? "+" : ""}{tempChange.toFixed(2)}°C</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Placeholder when no projection yet */
            <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl border border-dashed border-border p-12">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground mb-2">
                  Temperature Projection
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Adjust the vegetation and urban density sliders below, then click "Predict Temperature" to see a 10-year forecast for {selectedLocation || "your selected location"}.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Powered by CatBoost + XGBoost ML models</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════
            MAIN GRID: Controls + Results + Analytics
            ═══════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Controls & Prediction */}
          <div className="lg:col-span-4 space-y-5">

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
                      className={`px-3 py-2.5 text-left rounded-xl border ${t.border} ${t.bg} hover:opacity-90 transition-all text-xs group`}
                    >
                      <div className={`flex items-center gap-1.5 font-semibold ${t.color}`}>
                        <t.icon className="w-3.5 h-3.5" />
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
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-foreground">Greenery (NDVI)</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${ndviAdjustment[0] >= 0 ? "text-emerald-500" : "text-orange-500"}`}>
                    {ndviAdjustment[0] > 0 ? "+" : ""}{ndviAdjustment[0].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={ndviAdjustment}
                  onValueChange={setNdviAdjustment}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500"
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
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Running ML Models…</>
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
                    <p className="text-xs text-primary-foreground/70">Baseline Temperature</p>
                    <p className="text-3xl font-display font-bold">{baselineTemp?.toFixed(1) || "--"}°C</p>
                  </div>

                  {predictedTemp !== null && (
                    <>
                      <div className="h-px bg-primary-foreground/20" />
                      <div>
                        <p className="text-xs text-primary-foreground/70">Predicted Temperature</p>
                        <p className="text-3xl font-display font-bold">{predictedTemp.toFixed(1)}°C</p>
                      </div>
                      <div className={`flex items-center gap-2 text-lg font-bold ${tempChange < 0 ? "text-emerald-300" : "text-red-300"}`}>
                        <TrendIcon className="w-5 h-5" />
                        <span>{tempChange > 0 ? "+" : ""}{tempChange.toFixed(2)}°C</span>
                      </div>
                      <div className={`flex items-center gap-2 p-3 rounded-xl ${
                        tempChange < 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                      }`}>
                        {tempChange < 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-300" />
                        )}
                        <p className="text-xs text-primary-foreground/90">
                          {tempChange < 0
                            ? "Your changes help reduce urban heat!"
                            : "Consider increasing green spaces to reduce heat."}
                        </p>
                      </div>
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

          {/* RIGHT COLUMN: Analytics Charts */}
          <div className="lg:col-span-8 space-y-6">

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: `National Avg (${viewLevel === "states" ? "States" : "Districts"})`,
                  value: kpiData?.nationalAvg,
                  sub: null,
                  icon: Thermometer,
                  iconBg: "bg-primary/10",
                  iconColor: "text-primary",
                  valueColor: "text-foreground",
                },
                {
                  label: `Hottest ${viewLevel === "states" ? "State" : "District"}`,
                  value: kpiData?.hottestDistrict.temp,
                  sub: kpiData?.hottestDistrict.name,
                  icon: TrendingUp,
                  iconBg: "bg-red-500/10",
                  iconColor: "text-red-500",
                  valueColor: "text-red-500",
                },
                {
                  label: `Coolest ${viewLevel === "states" ? "State" : "District"}`,
                  value: kpiData?.coolestDistrict.temp,
                  sub: kpiData?.coolestDistrict.name,
                  icon: TrendingDown,
                  iconBg: "bg-emerald-500/10",
                  iconColor: "text-emerald-500",
                  valueColor: "text-emerald-500",
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Temperature Trend (Historical) */}
              <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
                <h2 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  Historical Trend (2015–2024)
                </h2>
                <div className="h-52">
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

              {/* Top 10 Hottest Locations */}
              <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
                <h2 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  Top 10 Hottest {viewLevel === "states" ? "States" : "Districts"}
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hottestLocations} layout="vertical" margin={{ top: 5, right: 40, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} domain={[28, "dataMax + 2"]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: string) => value.length > 18 ? `${value.slice(0, 16)}...` : value}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Bar
                        dataKey="temperature"
                        radius={[0, 4, 4, 0]}
                        animationDuration={800}
                        activeBar={{ stroke: "none", fill: "currentColor", fillOpacity: 0.9 }}
                      >
                        {hottestLocations.map((_: any, i: number) => (
                          <Cell key={i} fill={i < 3 ? "#ef4444" : i < 6 ? "#f97316" : "#fb923c"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Feature Importance (Full Width) */}
            <div className="bg-card rounded-2xl shadow-card p-5 border border-border">
              <h2 className="font-display font-semibold text-foreground text-sm mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                ML Model Feature Importance
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Random Forest model reveals which factors most impact urban heat in Malaysia.
              </p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 45]} />
                    <YAxis type="category" dataKey="feature" width={130} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Importance"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                    <Bar
                      dataKey="importance"
                      radius={[0, 6, 6, 0]}
                      animationDuration={1000}
                      activeBar={{ stroke: "none", fill: "currentColor", fillOpacity: 0.9 }}
                    >
                      {featureImportance.map((item, i) => (
                        <Cell key={i} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-accent/5 border border-accent/10 rounded-xl">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-accent">Key Insight:</strong> Urban density (NDBI) is the strongest heat driver at 38.2%, followed by vegetation cover (NDVI) at 25%. This validates that greening cities can effectively combat urban heat islands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPage;
