import { useMemo } from "react";
import {
  Thermometer,
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  Users,
  AlertTriangle,
  Leaf,
  Building2,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LocationData {
  name: string;
  temperature: number;
  ndvi: number;
  ndbi: number;
  hotspots: number;
  population?: number;
}

interface ChoroplethAnalyticsProps {
  data: LocationData[];
  selectedLocation: LocationData | null;
  comparisonLocation: LocationData | null;
  onClose: () => void;
}

// Temperature color helper
const getTempColor = (temp: number): string => {
  if (temp < 28) return "#14b8a6";
  if (temp < 30) return "#22c55e";
  if (temp < 32) return "#eab308";
  if (temp < 34) return "#f97316";
  if (temp < 36) return "#ef4444";
  return "#991b1b";
};

// Risk level helper
const getRiskLevel = (temp: number): { level: string; color: string; bg: string } => {
  if (temp >= 38) return { level: "Critical", color: "text-red-500", bg: "bg-red-500/10" };
  if (temp >= 34) return { level: "High", color: "text-orange-500", bg: "bg-orange-500/10" };
  if (temp >= 30) return { level: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  return { level: "Low", color: "text-green-500", bg: "bg-green-500/10" };
};

// Stat Card Component
const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  iconColor = "text-primary",
  iconBg = "bg-primary/10"
}: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  iconColor?: string;
  iconBg?: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-xs font-medium ${
          trend === "up" ? "text-red-500" : trend === "down" ? "text-green-500" : "text-muted-foreground"
        }`}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> :
           trend === "down" ? <ArrowDownRight className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
        </div>
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {subValue && <p className="text-xs text-muted-foreground/70 mt-1">{subValue}</p>}
    </div>
  </div>
);

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-medium">{label || payload[0]?.payload?.name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0]?.fill || payload[0]?.color }}>
          {payload[0]?.value?.toFixed?.(1) ?? payload[0]?.value}
          {payload[0]?.dataKey === "temperature" && "°C"}
        </p>
      </div>
    );
  }
  return null;
};

export function ChoroplethAnalytics({
  data,
  selectedLocation,
  comparisonLocation,
  onClose,
}: ChoroplethAnalyticsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    if (!data.length) return null;

    const temps = data.map(d => d.temperature).filter(t => t > 0);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const stdDev = Math.sqrt(temps.reduce((sum, t) => sum + Math.pow(t - avgTemp, 2), 0) / temps.length);

    const sortedByTemp = [...data].filter(d => d.temperature > 0).sort((a, b) => b.temperature - a.temperature);
    const hottestLocations = sortedByTemp.slice(0, 5);
    const coolestLocations = sortedByTemp.slice(-5).reverse();

    const sortedByNDVI = [...data].filter(d => d.ndvi > 0).sort((a, b) => b.ndvi - a.ndvi);
    const greenestLocations = sortedByNDVI.slice(0, 5);

    const sortedByNDBI = [...data].filter(d => d.ndbi !== undefined).sort((a, b) => b.ndbi - a.ndbi);
    const mostUrbanLocations = sortedByNDBI.slice(0, 5);

    const totalHotspots = data.reduce((sum, d) => sum + (d.hotspots || 0), 0);

    // Risk distribution
    const riskDistribution = {
      critical: data.filter(d => d.temperature >= 38).length,
      high: data.filter(d => d.temperature >= 34 && d.temperature < 38).length,
      medium: data.filter(d => d.temperature >= 30 && d.temperature < 34).length,
      low: data.filter(d => d.temperature > 0 && d.temperature < 30).length,
    };

    // Temperature distribution for histogram
    const tempBuckets = [
      { range: "24-26", count: data.filter(d => d.temperature >= 24 && d.temperature < 26).length, color: "#14b8a6" },
      { range: "26-28", count: data.filter(d => d.temperature >= 26 && d.temperature < 28).length, color: "#22c55e" },
      { range: "28-30", count: data.filter(d => d.temperature >= 28 && d.temperature < 30).length, color: "#84cc16" },
      { range: "30-32", count: data.filter(d => d.temperature >= 30 && d.temperature < 32).length, color: "#eab308" },
      { range: "32-34", count: data.filter(d => d.temperature >= 32 && d.temperature < 34).length, color: "#f97316" },
      { range: "34-36", count: data.filter(d => d.temperature >= 34 && d.temperature < 36).length, color: "#ef4444" },
      { range: "36+", count: data.filter(d => d.temperature >= 36).length, color: "#991b1b" },
    ];

    // Scatter data for correlation
    const scatterData = data
      .filter(d => d.temperature > 0 && d.ndvi > 0)
      .map(d => ({
        name: d.name,
        ndvi: d.ndvi,
        temperature: d.temperature,
      }));

    return {
      avgTemp,
      minTemp,
      maxTemp,
      stdDev,
      hottestLocations,
      coolestLocations,
      greenestLocations,
      mostUrbanLocations,
      totalHotspots,
      riskDistribution,
      tempBuckets,
      scatterData,
      totalLocations: data.length,
    };
  }, [data]);

  if (!stats) return null;

  const riskPieData = [
    { name: "Critical", value: stats.riskDistribution.critical, fill: "#ef4444" },
    { name: "High", value: stats.riskDistribution.high, fill: "#f97316" },
    { name: "Medium", value: stats.riskDistribution.medium, fill: "#eab308" },
    { name: "Low", value: stats.riskDistribution.low, fill: "#22c55e" },
  ].filter(d => d.value > 0);

  return (
    <TooltipProvider>
      <div className="absolute top-16 right-0 bottom-0 w-[420px] bg-background/95 backdrop-blur-xl border-l border-border shadow-xl z-20 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Analytics Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Key Statistics */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Key Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Thermometer}
                label="Average Temperature"
                value={`${stats.avgTemp.toFixed(1)}°C`}
                iconColor="text-orange-500"
                iconBg="bg-orange-500/10"
              />
              <StatCard
                icon={Flame}
                label="Highest Temperature"
                value={`${stats.maxTemp.toFixed(1)}°C`}
                subValue={stats.hottestLocations[0]?.name}
                iconColor="text-red-500"
                iconBg="bg-red-500/10"
              />
              <StatCard
                icon={Snowflake}
                label="Lowest Temperature"
                value={`${stats.minTemp.toFixed(1)}°C`}
                subValue={stats.coolestLocations[0]?.name}
                iconColor="text-cyan-500"
                iconBg="bg-cyan-500/10"
              />
              <StatCard
                icon={AlertTriangle}
                label="Total Heat Hotspots"
                value={stats.totalHotspots.toLocaleString()}
                iconColor="text-amber-500"
                iconBg="bg-amber-500/10"
              />
            </div>
          </section>

          {/* Risk Distribution */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Risk Distribution
            </h3>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        paddingAngle={2}
                      >
                        {riskPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Critical (38°C+)", value: stats.riskDistribution.critical, color: "bg-red-500" },
                    { label: "High (34-38°C)", value: stats.riskDistribution.high, color: "bg-orange-500" },
                    { label: "Medium (30-34°C)", value: stats.riskDistribution.medium, color: "bg-yellow-500" },
                    { label: "Low (<30°C)", value: stats.riskDistribution.low, color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Temperature Distribution Histogram */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Temperature Distribution
            </h3>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.tempBuckets} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.tempBuckets.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Distribution of locations by temperature range (°C)
              </p>
            </div>
          </section>

          {/* NDVI vs Temperature Correlation */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-500" />
              Vegetation vs Temperature
              <UITooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-48">
                    Shows relationship between vegetation (NDVI) and temperature.
                    Higher NDVI typically correlates with lower temperatures.
                  </p>
                </TooltipContent>
              </UITooltip>
            </h3>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="ndvi"
                      type="number"
                      domain={[0, 1]}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "NDVI", position: "bottom", fontSize: 10, offset: -5 }}
                    />
                    <YAxis
                      dataKey="temperature"
                      type="number"
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}°`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Scatter data={stats.scatterData} fill="#22c55e" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Rankings */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Top 5 Hottest Locations
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {stats.hottestLocations.map((loc, i) => (
                <div
                  key={loc.name}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i !== stats.hottestLocations.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-red-500 text-white" :
                      i === 1 ? "bg-orange-500 text-white" :
                      i === 2 ? "bg-amber-500 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[180px]">{loc.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: getTempColor(loc.temperature) }}>
                    {loc.temperature.toFixed(1)}°C
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-500" />
              Top 5 Coolest Locations
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {stats.coolestLocations.map((loc, i) => (
                <div
                  key={loc.name}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i !== stats.coolestLocations.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-cyan-500 text-white" :
                      i === 1 ? "bg-teal-500 text-white" :
                      i === 2 ? "bg-emerald-500 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[180px]">{loc.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: getTempColor(loc.temperature) }}>
                    {loc.temperature.toFixed(1)}°C
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-500" />
              Top 5 Greenest Locations
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {stats.greenestLocations.map((loc, i) => (
                <div
                  key={loc.name}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i !== stats.greenestLocations.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-green-500 text-white" :
                      i === 1 ? "bg-emerald-500 text-white" :
                      i === 2 ? "bg-teal-500 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[180px]">{loc.name}</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">
                    {loc.ndvi.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Panel */}
          {selectedLocation && comparisonLocation && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Location Comparison
              </h3>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="text-sm font-medium text-primary truncate">{selectedLocation.name}</div>
                  <div className="text-xs text-muted-foreground">vs</div>
                  <div className="text-sm font-medium text-accent truncate">{comparisonLocation.name}</div>
                </div>

                {/* Temperature */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Temperature</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="text-lg font-bold" style={{ color: getTempColor(selectedLocation.temperature) }}>
                      {selectedLocation.temperature.toFixed(1)}°C
                    </div>
                    <div className={`text-sm font-medium ${
                      selectedLocation.temperature < comparisonLocation.temperature ? "text-green-500" : "text-red-500"
                    }`}>
                      {(selectedLocation.temperature - comparisonLocation.temperature).toFixed(1)}°
                    </div>
                    <div className="text-lg font-bold" style={{ color: getTempColor(comparisonLocation.temperature) }}>
                      {comparisonLocation.temperature.toFixed(1)}°C
                    </div>
                  </div>
                </div>

                {/* NDVI */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Vegetation (NDVI)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="text-lg font-bold text-green-500">
                      {selectedLocation.ndvi.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium ${
                      selectedLocation.ndvi > comparisonLocation.ndvi ? "text-green-500" : "text-red-500"
                    }`}>
                      {(selectedLocation.ndvi - comparisonLocation.ndvi).toFixed(2)}
                    </div>
                    <div className="text-lg font-bold text-green-500">
                      {comparisonLocation.ndvi.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* NDBI */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Urban Density (NDBI)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="text-lg font-bold text-orange-500">
                      {selectedLocation.ndbi.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium ${
                      selectedLocation.ndbi < comparisonLocation.ndbi ? "text-green-500" : "text-red-500"
                    }`}>
                      {(selectedLocation.ndbi - comparisonLocation.ndbi).toFixed(2)}
                    </div>
                    <div className="text-lg font-bold text-orange-500">
                      {comparisonLocation.ndbi.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Analyzing {stats.totalLocations} locations · Data from Landsat 8/9
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ChoroplethAnalytics;
