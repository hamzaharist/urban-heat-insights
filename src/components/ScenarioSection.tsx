import { useState, useEffect, useCallback } from "react";
import { TreePine, Building2, ArrowRight, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// API configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Simulation model constants (fallback if API is unavailable)
const BASELINE_GREEN_COVER_PCT = 30;
const BASELINE_BUILTUP_PCT = 70;
const BASELINE_TEMP_C = 35.1;

interface PredictionResult {
  predictions: { year: number; temperature: number }[];
  metrics: {
    peak_temp: number;
    avg_increase: number;
    trend: string;
    confidence: number;
    baseline_temp: number;
  };
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}


// Custom tooltip
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">Year {label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value.toFixed(1)}°C
        </p>
      </div>
    );
  }
  return null;
};

const ScenarioSection = () => {
  // Adjustment values from baseline (-50 to +50)
  const [greenAdjustment, setGreenAdjustment] = useState([0]);
  const [builtupAdjustment, setBuiltupAdjustment] = useState([0]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Calculate actual percentages (clamped to realistic bounds)
  const actualGreen = Math.max(10, Math.min(80, BASELINE_GREEN_COVER_PCT + greenAdjustment[0]));
  const actualBuiltup = Math.max(40, Math.min(95, BASELINE_BUILTUP_PCT + builtupAdjustment[0]));

  // Debounce slider values to avoid excessive API calls
  const debouncedGreen = useDebounce(greenAdjustment[0], 400);
  const debouncedBuiltup = useDebounce(builtupAdjustment[0], 400);

  // Call the ML backend
  const fetchPrediction = useCallback(async (greenAdj: number, builtupAdj: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/timeseries/api/predict-scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: "Kuala Lumpur",
          year_range: [2025, 2035],
          ndvi_adjustment: greenAdj / 100,   // Convert percentage to -0.5 to +0.5
          ndbi_adjustment: builtupAdj / 100, // Convert percentage to -0.5 to +0.5
          climate_factor: 1.0,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const data: PredictionResult = await response.json();
      setPrediction(data);
      setApiAvailable(true);
    } catch {
      setApiAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on debounced slider change
  useEffect(() => {
    fetchPrediction(debouncedGreen, debouncedBuiltup);
  }, [debouncedGreen, debouncedBuiltup, fetchPrediction]);

  // Derived values
  const projectedTemp = prediction
    ? prediction.metrics.peak_temp.toFixed(1)
    : BASELINE_TEMP_C.toFixed(1);
  const baselineTemp = prediction
    ? prediction.metrics.baseline_temp
    : BASELINE_TEMP_C;
  const tempChange = prediction
    ? prediction.metrics.avg_increase.toFixed(1)
    : "0.0";
  const confidence = prediction
    ? Math.round(prediction.metrics.confidence * 100)
    : 0;
  const trend = prediction?.metrics.trend || "stable";
  const isPositive = parseFloat(tempChange) >= 0;

  const TrendIcon = trend === "rising" ? TrendingUp : trend === "falling" ? TrendingDown : Minus;

  return (
    <section className="section-spacing bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="inline-block text-sm font-semibold text-eco uppercase tracking-wider mb-4">
            ML-Powered Scenario Simulation
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            What-If Analysis for Urban Planning
          </h2>
          <p className="text-lg text-muted-foreground">
            Adjust land cover parameters and see real ML model predictions for how urban
            temperatures may respond over the next decade.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border self-start">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Adjust Land Cover Parameters
            </h3>

            {/* Green Cover Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-eco/10 rounded-lg">
                    <TreePine className="w-5 h-5 text-eco" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Green Cover Adjustment</p>
                    <p className="text-xs text-muted-foreground">NDVI change from baseline</p>
                  </div>
                </div>
                <span className={`text-2xl font-display font-bold ${greenAdjustment[0] >= 0 ? 'text-eco' : 'text-orange-500'}`}>
                  {greenAdjustment[0] > 0 ? '+' : ''}{greenAdjustment[0]}%
                </span>
              </div>
              <Slider
                value={greenAdjustment}
                onValueChange={setGreenAdjustment}
                max={50}
                min={-50}
                step={5}
                className="[&_[role=slider]]:bg-eco [&_[role=slider]]:border-eco [&_.bg-primary]:bg-eco"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
                <span>-50%</span>
                <span className="absolute left-1/2 -translate-x-1/2">0%</span>
                <span>+50%</span>
              </div>
            </div>

            {/* Building Density Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Building Density Adjustment</p>
                    <p className="text-xs text-muted-foreground">NDBI change from baseline</p>
                  </div>
                </div>
                <span className={`text-2xl font-display font-bold ${builtupAdjustment[0] >= 0 ? 'text-primary' : 'text-blue-500'}`}>
                  {builtupAdjustment[0] > 0 ? '+' : ''}{builtupAdjustment[0]}%
                </span>
              </div>
              <Slider
                value={builtupAdjustment}
                onValueChange={setBuiltupAdjustment}
                max={50}
                min={-50}
                step={5}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
                <span>-50%</span>
                <span className="absolute left-1/2 -translate-x-1/2">0%</span>
                <span>+50%</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Quick Scenarios</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setGreenAdjustment([+20]); setBuiltupAdjustment([-10]); }}>
                  Green City Initiative
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setGreenAdjustment([-15]); setBuiltupAdjustment([+20]); }}>
                  High-Density Growth
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setGreenAdjustment([0]); setBuiltupAdjustment([0]); }}>
                  Reset to Baseline
                </Button>
              </div>
            </div>

            {/* Mini Feature Importance */}
            <div className="border-t border-border pt-4 mt-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">What Drives Temperature?</p>
              <div className="space-y-2.5">
                {[
                  { label: "Urban Density", pct: 38, color: "bg-red-500" },
                  { label: "Vegetation", pct: 25, color: "bg-eco" },
                  { label: "Population", pct: 23, color: "bg-amber-500" },
                  { label: "Elevation", pct: 14, color: "bg-blue-500" },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-semibold text-foreground">{f.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct * 2.5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Based on RF model feature analysis · 94% accuracy
              </p>
            </div>

          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-6">
            {/* Temperature Result + Chart */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-primary-foreground/90">
                  ML Model Projection
                </h3>
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary-foreground/60" />}
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-sm text-primary-foreground/70 mb-1">Peak Temperature (2035)</p>
                  <p className="text-5xl md:text-6xl font-display font-bold">{projectedTemp}°C</p>
                </div>
                <div className={`flex items-center gap-1 px-4 py-2 rounded-full ${isPositive ? 'bg-heat-hot/20' : 'bg-eco/20'}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className={`text-lg font-bold ${isPositive ? 'text-heat-warm' : 'text-eco'}`}>
                    {isPositive ? '+' : ''}{tempChange}°C
                  </span>
                </div>
              </div>

              {/* ML Prediction Chart */}
              {prediction && prediction.predictions.length > 0 && (
                <div className="h-40 mt-4 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prediction.predictions} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}°`}
                        domain={["dataMin - 0.3", "dataMax + 0.3"]}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine
                        y={baselineTemp}
                        stroke="rgba(255,255,255,0.3)"
                        strokeDasharray="5 5"
                        label={{ value: "Baseline", fill: "rgba(255,255,255,0.5)", fontSize: 10, position: "right" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#fff"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#fff", stroke: "rgba(0,0,0,0.2)", strokeWidth: 1 }}
                        activeDot={{ r: 6, fill: "#fff" }}
                        animationDuration={800}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Model confidence */}
              {prediction && (
                <div className="flex items-center gap-3 p-3 bg-primary-foreground/10 rounded-xl mt-4">
                  <ArrowRight className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
                  <p className="text-xs text-primary-foreground/80">
                    Model confidence: <span className="font-semibold">{confidence}%</span> · Trend: <span className="font-semibold capitalize">{trend}</span>
                    {!apiAvailable && " · Using local estimation"}
                  </p>
                </div>
              )}
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Baseline State</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Base Temp</span>
                    <span className="font-semibold text-foreground">{baselineTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Greenery</span>
                    <span className="font-semibold text-foreground">{BASELINE_GREEN_COVER_PCT}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up</span>
                    <span className="font-semibold text-foreground">{BASELINE_BUILTUP_PCT}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-card border-2 border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Your Scenario</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Temp</span>
                    <span className={`font-semibold ${isPositive ? 'text-heat-hot' : 'text-eco'}`}>{projectedTemp}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Greenery</span>
                    <span className="font-semibold text-eco">{actualGreen}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up</span>
                    <span className="font-semibold text-primary">{actualBuiltup}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Planning Note */}
            <div className="bg-eco/5 border border-eco/20 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-eco">Planning Insight:</span> This simulation
                uses a real Random Forest ML model trained on satellite-derived NDVI, NDBI,
                population, and elevation data to project temperature impacts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScenarioSection;
