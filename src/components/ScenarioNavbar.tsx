import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  ChevronRight,
  MapPin,
  Thermometer,
  Leaf,
  Building2,
  Activity,
  RotateCcw,
  Info,
  Map,
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  X,
  Sparkles,
  Database,
  Clock,
  Target,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Types ---
interface ScenarioNavbarProps {
  // Location
  selectedLocation: string;
  viewLevel: "states" | "districts";
  onViewLevelChange: (level: "states" | "districts") => void;
  locations: string[];
  onLocationChange: (location: string) => void;

  // Temperature data
  currentTemp: number | null;
  predictedTemp: number | null;
  tempChange: number;

  // Environmental indices
  ndvi: number | null;
  ndbi: number | null;

  // Scenario presets
  onApplyPreset: (preset: { ndvi: number; ndbi: number }) => void;
  onReset: () => void;

  // State
  isLoading: boolean;
  isSimulating: boolean;

  // Historical trend data (for sparkline)
  trendData?: { year: number; temperature: number }[];
}

// --- Scenario Presets ---
const quickPresets = [
  { name: "Green City", icon: Leaf, ndvi: 0.3, ndbi: -0.2, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "+30% vegetation" },
  { name: "Eco District", icon: Sparkles, ndvi: 0.15, ndbi: -0.1, color: "text-teal-500", bg: "bg-teal-500/10", desc: "Balanced approach" },
  { name: "High Urban", icon: Building2, ndvi: -0.2, ndbi: 0.3, color: "text-orange-500", bg: "bg-orange-500/10", desc: "Dense development" },
  { name: "Expansion", icon: TrendingUp, ndvi: -0.15, ndbi: 0.2, color: "text-red-500", bg: "bg-red-500/10", desc: "Urban growth" },
];

// --- Temperature Color Helper ---
const getTempColor = (temp: number | null): string => {
  if (temp === null) return "from-slate-500 to-slate-600";
  if (temp < 28) return "from-teal-500 to-cyan-500";
  if (temp < 30) return "from-green-500 to-emerald-500";
  if (temp < 32) return "from-yellow-500 to-amber-500";
  if (temp < 34) return "from-orange-500 to-amber-600";
  if (temp < 36) return "from-red-500 to-orange-500";
  return "from-red-600 to-rose-700";
};

const getTempLabel = (temp: number | null): string => {
  if (temp === null) return "No data";
  if (temp < 28) return "Cool";
  if (temp < 30) return "Mild";
  if (temp < 32) return "Warm";
  if (temp < 34) return "Hot";
  if (temp < 36) return "Very Hot";
  return "Extreme";
};

// --- Mini Sparkline Component ---
const MiniSparkline = ({ data }: { data: { year: number; temperature: number }[] }) => {
  if (!data || data.length < 2) return null;

  const temps = data.map(d => d.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;

  const width = 60;
  const height = 20;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.temperature - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const trend = temps[temps.length - 1] - temps[0];
  const strokeColor = trend > 0 ? "#ef4444" : "#22c55e";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg cursor-help">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                points={points}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`text-xs font-medium ${trend > 0 ? "text-red-500" : "text-green-500"}`}>
              {trend > 0 ? "+" : ""}{trend.toFixed(1)}°
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Temperature trend (2015-2024)</p>
          <p className="text-xs text-muted-foreground">
            {data[0].temperature.toFixed(1)}°C → {data[data.length - 1].temperature.toFixed(1)}°C
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// --- Color Scale Legend ---
const ColorScaleLegend = () => (
  <div className="flex items-center gap-1">
    <span className="text-[10px] text-muted-foreground">24°</span>
    <div className="flex h-2 w-24 rounded-full overflow-hidden">
      <div className="flex-1 bg-teal-500" />
      <div className="flex-1 bg-green-500" />
      <div className="flex-1 bg-yellow-500" />
      <div className="flex-1 bg-orange-500" />
      <div className="flex-1 bg-red-500" />
      <div className="flex-1 bg-red-700" />
    </div>
    <span className="text-[10px] text-muted-foreground">42°</span>
  </div>
);

// --- Model Info Dialog ---
const ModelInfoDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors group">
        <Activity className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-semibold text-emerald-500">94%</span>
        <Info className="w-3 h-3 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
      </button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          Model Information
        </DialogTitle>
        <DialogDescription>
          Details about the prediction model used in this dashboard
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Model Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Model Type</p>
            <p className="font-semibold text-sm">Random Forest</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">R² Score</p>
            <p className="font-semibold text-sm text-emerald-500">0.9415</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">RMSE</p>
            <p className="font-semibold text-sm">1.38°C</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Training Samples</p>
            <p className="font-semibold text-sm">62,134</p>
          </div>
        </div>

        {/* Feature Importance */}
        <div>
          <p className="text-sm font-medium mb-2">Feature Importance</p>
          <div className="space-y-2">
            {[
              { name: "Urban Density (NDBI)", value: 38.2, color: "bg-red-500" },
              { name: "Vegetation (NDVI)", value: 25.0, color: "bg-green-500" },
              { name: "Population", value: 22.6, color: "bg-amber-500" },
              { name: "Elevation", value: 14.3, color: "bg-blue-500" },
            ].map((feature) => (
              <div key={feature.name} className="flex items-center gap-2">
                <div className="w-24 text-xs text-muted-foreground truncate">{feature.name}</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${feature.color} rounded-full transition-all duration-500`}
                    style={{ width: `${feature.value}%` }}
                  />
                </div>
                <div className="w-10 text-xs font-medium text-right">{feature.value}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="p-3 bg-muted/30 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">Data Sources</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Landsat 8/9 satellite imagery (LST, NDVI, NDBI)</li>
            <li>• Malaysia Department of Statistics (Population)</li>
            <li>• SRTM Digital Elevation Model</li>
          </ul>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Model last trained: January 2025</span>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// --- Main Navbar Component ---
export function ScenarioNavbar({
  selectedLocation,
  viewLevel,
  onViewLevelChange,
  locations,
  onLocationChange,
  currentTemp,
  predictedTemp,
  tempChange,
  ndvi,
  ndbi,
  onApplyPreset,
  onReset,
  isLoading,
  isSimulating,
  trendData,
}: ScenarioNavbarProps) {
  const navigate = useNavigate();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLocations = locations.filter(loc =>
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayTemp = predictedTemp !== null ? predictedTemp : currentTemp;
  const hasChange = tempChange !== 0;

  return (
    <TooltipProvider>
      <header className="bg-card/95 backdrop-blur-xl border-b border-border shadow-sm sticky top-0 z-40">
        {/* === TOP ROW === */}
        <div className="border-b border-border/50">
          <div className="max-w-[1800px] mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Left: Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-sm">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="px-2 py-1 text-foreground font-medium">Scenarios</span>
                {selectedLocation && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium truncate max-w-[150px]">
                      {selectedLocation}
                    </span>
                  </>
                )}
              </nav>

              {/* Right: Meta Info */}
              <div className="flex items-center gap-3">
                {/* Trend Sparkline */}
                {trendData && trendData.length > 0 && (
                  <div className="hidden lg:block">
                    <MiniSparkline data={trendData} />
                  </div>
                )}

                {/* Color Scale */}
                <div className="hidden md:block">
                  <ColorScaleLegend />
                </div>

                {/* Model Info */}
                <ModelInfoDialog />
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN ROW === */}
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Location & Level */}
            <div className="flex items-center gap-3">
              {/* States/Districts Toggle */}
              <div className="flex items-center p-0.5 bg-muted rounded-lg">
                <button
                  onClick={() => onViewLevelChange("states")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewLevel === "states"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  States
                </button>
                <button
                  onClick={() => onViewLevelChange("districts")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewLevel === "districts"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Districts
                </button>
              </div>

              {/* Location Selector */}
              <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors min-w-[180px]">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm truncate flex-1 text-left">
                      {selectedLocation || "Select location"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isLocationOpen ? "rotate-180" : ""}`} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => {
                            onLocationChange(loc);
                            setIsLocationOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            loc === selectedLocation
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {loc}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                        No locations found
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Center Section: Temperature Display */}
            <div className="hidden md:flex items-center gap-4">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${getTempColor(displayTemp)} text-white shadow-lg`}>
                <Thermometer className="w-5 h-5" />
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">
                    {displayTemp?.toFixed(1) ?? "--"}
                  </span>
                  <span className="text-sm opacity-90">°C</span>
                </div>
                <div className="w-px h-6 bg-white/30" />
                <span className="text-xs font-medium opacity-90">
                  {getTempLabel(displayTemp)}
                </span>
              </div>

              {/* Change Indicator */}
              {hasChange && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  tempChange < 0
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}>
                  {tempChange < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  <span className="text-sm font-bold tabular-nums">
                    {tempChange > 0 ? "+" : ""}{tempChange.toFixed(2)}°C
                  </span>
                </div>
              )}

              {/* NDVI/NDBI Quick Stats */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 rounded-lg cursor-help">
                      <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-500 tabular-nums">
                        {ndvi?.toFixed(2) ?? "--"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">NDVI (Vegetation Index)</p>
                    <p className="text-xs text-muted-foreground">Higher = More greenery</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-orange-500/10 rounded-lg cursor-help">
                      <Building2 className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-500 tabular-nums">
                        {ndbi?.toFixed(2) ?? "--"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">NDBI (Built-up Index)</p>
                    <p className="text-xs text-muted-foreground">Higher = More urban</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Right Section: Quick Presets & Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Presets */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
                {quickPresets.map((preset) => (
                  <Tooltip key={preset.name}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onApplyPreset({ ndvi: preset.ndvi, ndbi: preset.ndbi })}
                        className={`p-2 rounded-lg ${preset.bg} hover:opacity-80 transition-all`}
                      >
                        <preset.icon className={`w-4 h-4 ${preset.color}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="font-medium text-xs">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Reset Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to baseline</TooltipContent>
              </Tooltip>

              {/* Loading Indicator */}
              {(isLoading || isSimulating) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg animate-pulse">
                  <Zap className="w-4 h-4 animate-bounce" />
                  <span className="text-xs font-medium">
                    {isSimulating ? "Predicting..." : "Loading..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === MOBILE BOTTOM ROW (Temperature & Stats) === */}
        <div className="md:hidden border-t border-border/50 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Temperature */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getTempColor(displayTemp)} text-white`}>
              <Thermometer className="w-4 h-4" />
              <span className="text-lg font-bold tabular-nums">
                {displayTemp?.toFixed(1) ?? "--"}°C
              </span>
              {hasChange && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  tempChange < 0 ? "bg-white/20" : "bg-white/20"
                }`}>
                  {tempChange > 0 ? "+" : ""}{tempChange.toFixed(1)}°
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg">
                <Leaf className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-500">{ndvi?.toFixed(2) ?? "--"}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-lg">
                <Building2 className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-semibold text-orange-500">{ndbi?.toFixed(2) ?? "--"}</span>
              </div>
            </div>

            {/* Quick Presets (Mobile) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Presets</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onApplyPreset({ ndvi: preset.ndvi, ndbi: preset.ndbi })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <preset.icon className={`w-4 h-4 ${preset.color}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.desc}</p>
                    </div>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

export default ScenarioNavbar;
