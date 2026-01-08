import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Thermometer,
  Leaf,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  Activity,
  BarChart3,
  Target
} from "lucide-react";
import { ChoroplethMap } from "@/components/choropleth/ChoroplethMap";
import { useDistrictHeatmap } from "@/hooks/useDistrictHeatmap";

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

interface TrendData {
  year: number;
  temperature: number;
}

interface HottestDistrict {
  name: string;
  temperature: number;
}

const ScenarioPage = () => {
  const navigate = useNavigate();

  // Fetch district heatmap data from Supabase
  const { data: districtGeoJSON, isLoading: isLoadingDistricts } = useDistrictHeatmap();

  // State Management
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulation Controls
  const [ndviAdjustment, setNdviAdjustment] = useState(0);
  const [ndbiAdjustment, setNdbiAdjustment] = useState(0);

  // Simulation Results
  const [baselineTemp, setBaselineTemp] = useState<number | null>(null);
  const [predictedTemp, setPredictedTemp] = useState<number | null>(null);
  const [tempChange, setTempChange] = useState<number>(0);

  // Map Data
  const [mapData, setMapData] = useState<Record<string, any>>({});

  // KPI Data - calculated from districtGeoJSON
  const kpiData: KPIData = (() => {
    if (!districtGeoJSON || !districtGeoJSON.features || districtGeoJSON.features.length === 0) {
      return {
        nationalAvg: 0,
        hottestDistrict: { name: "", temp: 0 },
        coolestDistrict: { name: "", temp: 0 }
      };
    }

    const validDistricts = districtGeoJSON.features
      .filter(f => f.properties.avg_temperature != null && !isNaN(f.properties.avg_temperature))
      .map(f => ({
        name: f.properties.name || 'Unknown',
        temp: f.properties.avg_temperature!
      }));

    if (validDistricts.length === 0) {
      return {
        nationalAvg: 0,
        hottestDistrict: { name: "", temp: 0 },
        coolestDistrict: { name: "", temp: 0 }
      };
    }

    const avgTemp = validDistricts.reduce((sum, d) => sum + d.temp, 0) / validDistricts.length;
    const sorted = [...validDistricts].sort((a, b) => b.temp - a.temp);

    return {
      nationalAvg: avgTemp,
      hottestDistrict: sorted[0],
      coolestDistrict: sorted[sorted.length - 1]
    };
  })();

  // Hottest districts - calculated from districtGeoJSON
  const hottestDistricts: HottestDistrict[] = (() => {
    if (!districtGeoJSON || !districtGeoJSON.features) {
      return [];
    }

    return districtGeoJSON.features
      .filter(f => f.properties.avg_temperature != null && !isNaN(f.properties.avg_temperature))
      .map(f => ({
        name: f.properties.name || 'Unknown',
        temperature: f.properties.avg_temperature!
      }))
      .sort((a, b) => b.temperature - a.temperature)
      .slice(0, 10);
  })();

  // Chart Data
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  // Feature Importance (from model)
  const featureImportance = [
    { feature: "NDBI (Urban Density)", importance: 38.21, color: "#ef4444" },
    { feature: "NDVI (Vegetation)", importance: 24.96, color: "#22c55e" },
    { feature: "Population", importance: 22.57, color: "#f59e0b" },
    { feature: "Elevation", importance: 14.26, color: "#3b82f6" }
  ];

  // Initialize selected district when data loads
  useEffect(() => {
    if (districtGeoJSON?.features && districtGeoJSON.features.length > 0 && !selectedDistrict) {
      const firstDistrict = districtGeoJSON.features[0]?.properties?.name;
      if (firstDistrict) {
        console.log('[ScenarioPage] Setting initial district:', firstDistrict);
        setSelectedDistrict(firstDistrict);
      }
    }
  }, [districtGeoJSON, selectedDistrict]);

  // Fetch district data
  useEffect(() => {
    if (selectedDistrict) {
      console.log('[ScenarioPage] Fetching data for district:', selectedDistrict);
      fetchDistrictData(selectedDistrict);
    }
  }, [selectedDistrict]);

  // Fetch trend data on mount
  useEffect(() => {
    fetchTrendData();
  }, []);

  // Don't auto-run predictions anymore - user must click Predict button

  // Scenario templates for quick selection
  const scenarioTemplates = [
    {
      name: "🌳 Green City",
      description: "Maximize green spaces",
      ndvi: 0.3,
      ndbi: -0.2,
      icon: "🌳"
    },
    {
      name: "🏙️ High Urban",
      description: "Dense urban development",
      ndvi: -0.2,
      ndbi: 0.3,
      icon: "🏙️"
    },
    {
      name: "🌿 Eco District",
      description: "Moderate greening",
      ndvi: 0.15,
      ndbi: -0.1,
      icon: "🌿"
    },
    {
      name: "🏗️ Development",
      description: "Urban expansion",
      ndvi: -0.15,
      ndbi: 0.2,
      icon: "🏗️"
    }
  ];

  const applyScenarioTemplate = (template: typeof scenarioTemplates[0]) => {
    setNdviAdjustment(template.ndvi);
    setNdbiAdjustment(template.ndbi);
    // Don't auto-predict, let user click Predict button
  };

  const fetchDistrictData = async (district: string) => {
    setLoading(true);
    console.log('[ScenarioPage] fetchDistrictData called for:', district);

    try {
      // Get data from already-loaded GeoJSON instead of API call
      if (!districtGeoJSON?.features) {
        console.warn('[ScenarioPage] No district GeoJSON data available');
        setLoading(false);
        return;
      }

      // Find the district in the GeoJSON data
      const feature = districtGeoJSON.features.find((f: any) => {
        const name = f.properties?.name || f.properties?.district_name;
        return name === district;
      });

      if (!feature) {
        console.warn('[ScenarioPage] District not found in GeoJSON:', district);
        setLoading(false);
        return;
      }

      const props = feature.properties;
      console.log('[ScenarioPage] Found district in GeoJSON:', props);

      setDistrictData({
        name: district,
        temperature: props.avg_temperature || 0,
        ndvi: props.avg_ndvi || 0.5,
        ndbi: props.avg_ndbi || 0,
        elevation: (props as any).elevation || 50,
        population: (props as any).population || 0
      });
      setBaselineTemp(props.avg_temperature || 0);
      console.log('[ScenarioPage] District data set successfully');
    } catch (error) {
      console.error("[ScenarioPage] Error fetching district data:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchTrendData = async () => {
    // Mock trend data (2015-2024)
    setTrendData([
      { year: 2015, temperature: 31.5 },
      { year: 2016, temperature: 31.8 },
      { year: 2017, temperature: 32.1 },
      { year: 2018, temperature: 32.4 },
      { year: 2019, temperature: 32.6 },
      { year: 2020, temperature: 32.8 },
      { year: 2021, temperature: 33.0 },
      { year: 2022, temperature: 33.2 },
      { year: 2023, temperature: 33.4 },
      { year: 2024, temperature: 33.6 }
    ]);
  };


  const runSimulation = async () => {
    if (!districtData) {
      console.warn('[ScenarioPage] runSimulation called but no districtData');
      return;
    }

    console.log('[ScenarioPage] Running simulation for:', selectedDistrict);
    console.log('[ScenarioPage] Adjustments:', { ndviAdjustment, ndbiAdjustment });
    console.log('[ScenarioPage] District data:', districtData);

    try {
      const requestBody = {
        city: selectedDistrict,
        ndvi_change: ndviAdjustment,
        ndbi_change: ndbiAdjustment
      };

      console.log('[ScenarioPage] API request body:', requestBody);

      // FIXED: Use correct port (8000) and endpoint (/api/spatial/scenario-single)
      const response = await fetch("http://localhost:8000/api/spatial/scenario-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      console.log('[ScenarioPage] Prediction API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[ScenarioPage] Prediction result:', result);

        setPredictedTemp(result.predicted_temp);
        setTempChange(result.temp_difference);
        console.log('[ScenarioPage] Prediction set:', result.predicted_temp, 'Change:', result.temp_difference);
      } else {
        const errorText = await response.text();
        console.error('[ScenarioPage] Prediction API error:', response.status, errorText);
      }
    } catch (error) {
      console.error("[ScenarioPage] Error running simulation:", error);
    }
  };

  const resetSimulation = () => {
    setNdviAdjustment(0);
    setNdbiAdjustment(0);
    setPredictedTemp(null);
    setTempChange(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Urban Heat Scenario Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-blue-600">Layer 1:</span> What's happening? |
                  <span className="font-semibold text-purple-600 ml-2">Layer 2:</span> What if we intervene?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">RF Model (94% Accurate)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* ========================================
              SIDEBAR: LAYER 2 - "What-If" SIMULATOR
              ======================================== */}
          <div className="col-span-3 space-y-6">
            {/* District Selector */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">Select Location</h2>
              </div>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {districtGeoJSON?.features
                  .map(f => f.properties.name)
                  .filter(name => name)
                  .sort()
                  .map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))
                }
              </select>

              {districtData && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Temp:</span>
                    <span className="font-semibold text-slate-900">{baselineTemp?.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">NDVI:</span>
                    <span className="font-semibold text-emerald-600">{districtData.ndvi.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">NDBI:</span>
                    <span className="font-semibold text-orange-600">{districtData.ndbi.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Control Sliders */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                What-If Controls
              </h2>

              {/* Scenario Templates */}
              <div className="mb-6">
                <p className="text-xs font-medium text-slate-600 mb-3">Quick Scenarios</p>
                <div className="grid grid-cols-2 gap-2">
                  {scenarioTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyScenarioTemplate(template)}
                      className="px-3 py-2 text-left rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-xs group"
                      title={template.description}
                    >
                      <div className="font-semibold text-slate-700 group-hover:text-purple-700">
                        {template.icon} {template.name.replace(/🌳|🏙️|🌿|🏗️/g, '').trim()}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NDVI Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <label className="text-sm font-medium text-slate-700">
                      Greenery (NDVI)
                    </label>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {ndviAdjustment > 0 ? "+" : ""}{ndviAdjustment.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={ndviAdjustment}
                  onChange={(e) => setNdviAdjustment(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-emerald-400 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Less Green</span>
                  <span>More Green</span>
                </div>
              </div>

              {/* NDBI Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <label className="text-sm font-medium text-slate-700">
                      Urban Density (NDBI)
                    </label>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {ndbiAdjustment > 0 ? "+" : ""}{ndbiAdjustment.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={ndbiAdjustment}
                  onChange={(e) => setNdbiAdjustment(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-emerald-200 via-yellow-200 to-orange-400 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Less Urban</span>
                  <span>More Urban</span>
                </div>
              </div>


              {/* Predict Button */}
              <button
                onClick={() => {
                  if (ndviAdjustment !== 0 || ndbiAdjustment !== 0) {
                    runSimulation();
                  }
                }}
                disabled={ndviAdjustment === 0 && ndbiAdjustment === 0}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all mb-3 ${ndviAdjustment === 0 && ndbiAdjustment === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                {ndviAdjustment === 0 && ndbiAdjustment === 0 ? '⚠️ Adjust sliders first' : '🔮 Predict Temperature'}
              </button>

              <button
                onClick={resetSimulation}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                Reset to Baseline
              </button>
            </div>

            {/* Results Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="w-5 h-5" />
                <h3 className="font-semibold">Prediction Result</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-100 mb-1">Baseline Temperature</p>
                    <p className="text-3xl font-bold">{baselineTemp?.toFixed(1) || "--"}°C</p>
                  </div>

                  {predictedTemp !== null && (
                    <>
                      <div className="h-px bg-white/20" />
                      <div>
                        <p className="text-sm text-blue-100 mb-1">Predicted Temperature</p>
                        <p className="text-3xl font-bold">{predictedTemp.toFixed(1)}°C</p>
                      </div>

                      <div className={`flex items-center gap-2 text-lg font-semibold ${tempChange < 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {tempChange < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                        <span>{tempChange > 0 ? "+" : ""}{tempChange.toFixed(2)}°C</span>
                      </div>

                      <p className="text-sm text-blue-100 mt-2">
                        {tempChange < 0 ? "🎉 Cooler!" : "⚠️ Warmer!"}
                        {tempChange < 0 ? " Your changes help reduce heat." : " Consider more green spaces."}
                      </p>
                    </>
                  )}

                  {predictedTemp === null && ndviAdjustment === 0 && ndbiAdjustment === 0 && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                      <p className="text-sm text-blue-100">
                        👆 Move the sliders above to see how changes in greenery and urban density affect temperature.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================
              MAIN PANEL
              ======================================== */}
          <div className="col-span-9 space-y-6">
            {/* ========================================
                TOP: The "SITUATION" Zone
                ======================================== */}
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">National Avg Temp</p>
                      <p className="text-3xl font-bold text-slate-900">{kpiData.nationalAvg.toFixed(1)}°C</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Thermometer className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Hottest District</p>
                      <p className="text-2xl font-bold text-red-600">{kpiData.hottestDistrict.temp.toFixed(1)}°C</p>
                      <p className="text-xs text-slate-500 mt-1">{kpiData.hottestDistrict.name}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Coolest District</p>
                      <p className="text-2xl font-bold text-emerald-600">{kpiData.coolestDistrict.temp.toFixed(1)}°C</p>
                      <p className="text-xs text-slate-500 mt-1">{kpiData.coolestDistrict.name}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Big Map */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  District Temperature Map
                </h2>
                <div className="h-[400px] rounded-lg overflow-hidden bg-slate-50">
                  <ChoroplethMap
                    level="districts"
                    highlightedDistrict={selectedDistrict}
                    onLocationClick={(feature) => {
                      const districtName = feature.properties?.name || feature.properties?.district_name;
                      if (districtName) {
                        setSelectedDistrict(districtName);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ========================================
                BOTTOM: The "INSIGHT" Zone
                ======================================== */}
            <div className="grid grid-cols-2 gap-6">
              {/* Trend Line Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  Temperature Trend (2015-2024)
                </h2>
                <div className="space-y-2">
                  {trendData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-12">{item.year}</span>
                      <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-red-500 flex items-center justify-end px-2"
                          style={{ width: `${((item.temperature - 30) / 5) * 100}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{item.temperature.toFixed(1)}°C</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 10 Hottest Districts */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Top 10 Hottest Districts
                </h2>
                <div className="space-y-2">
                  {hottestDistricts.map((district, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900 w-6">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-700 truncate">{district.name}</span>
                          <span className="text-sm font-semibold text-red-600">{district.temperature.toFixed(1)}°C</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-600"
                            style={{ width: `${((district.temperature - 25) / 15) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Importance */}
              <div className="col-span-2 bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Model Feature Importance (What Drives Temperature?)
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Scientific validation: Our Random Forest model reveals which factors most impact urban heat.
                </p>
                <div className="space-y-4">
                  {featureImportance.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{item.feature}</span>
                        <span className="text-sm font-semibold" style={{ color: item.color }}>
                          {item.importance.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.importance}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <strong>Key Insight:</strong> Urban density (NDBI) is the strongest heat driver at 38.2%,
                    followed by vegetation cover (NDVI) at 25%. This validates that greening cities can
                    effectively combat urban heat!
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
