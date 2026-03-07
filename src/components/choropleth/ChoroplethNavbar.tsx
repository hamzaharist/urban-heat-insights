import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  ChevronRight,
  Map,
  Layers,
  Search,
  Filter,
  Download,
  Share2,
  Maximize2,
  BarChart3,
  GitCompare,
  X,
  SlidersHorizontal,
  Thermometer,
  Leaf,
  Building2,
  Info,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";

interface ChoroplethNavbarProps {
  viewLevel: "states" | "districts";
  onViewLevelChange: (level: "states" | "districts") => void;
  locations: string[];
  selectedLocation: string | null;
  onLocationSelect: (location: string | null) => void;
  comparisonMode: boolean;
  onComparisonModeChange: (enabled: boolean) => void;
  comparisonLocation: string | null;
  onComparisonLocationSelect: (location: string | null) => void;
  showAnalytics: boolean;
  onShowAnalyticsChange: (show: boolean) => void;
  dataLayer: "temperature" | "ndvi" | "ndbi";
  onDataLayerChange: (layer: "temperature" | "ndvi" | "ndbi") => void;
  temperatureFilter: [number, number];
  onTemperatureFilterChange: (range: [number, number]) => void;
  onExport: () => void;
  onShare: () => void;
  onFullscreen: () => void;
}

const dataLayers = [
  { id: "temperature", label: "Temperature", icon: Thermometer, color: "text-orange-500" },
  { id: "ndvi", label: "Vegetation (NDVI)", icon: Leaf, color: "text-green-500" },
  { id: "ndbi", label: "Urban Density (NDBI)", icon: Building2, color: "text-blue-500" },
] as const;

export function ChoroplethNavbar({
  viewLevel,
  onViewLevelChange,
  locations,
  selectedLocation,
  onLocationSelect,
  comparisonMode,
  onComparisonModeChange,
  comparisonLocation,
  onComparisonLocationSelect,
  showAnalytics,
  onShowAnalyticsChange,
  dataLayer,
  onDataLayerChange,
  temperatureFilter,
  onTemperatureFilterChange,
  onExport,
  onShare,
  onFullscreen,
}: ChoroplethNavbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredLocations = locations.filter(loc =>
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDataLayer = dataLayers.find(l => l.id === dataLayer);

  return (
    <TooltipProvider>
      <header className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-[2000px] mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Navigation */}
            <div className="flex items-center gap-3">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-sm">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="px-2 py-1 font-medium text-foreground">Choropleth</span>
              </nav>

              <div className="h-5 w-px bg-border" />

              {/* View Level Toggle */}
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
            </div>

            {/* Center Section: Search & Data Layer */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {selectedLocation || "Search location..."}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="center">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {selectedLocation && (
                      <button
                        onClick={() => {
                          onLocationSelect(null);
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                      >
                        <X className="w-4 h-4" />
                        Clear selection
                      </button>
                    )}
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          onLocationSelect(loc);
                          setIsSearchOpen(false);
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
                    ))}
                    {filteredLocations.length === 0 && (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                        No locations found
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Data Layer Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors">
                    {currentDataLayer && (
                      <currentDataLayer.icon className={`w-4 h-4 ${currentDataLayer.color}`} />
                    )}
                    <span className="text-sm font-medium">{currentDataLayer?.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  {dataLayers.map((layer) => (
                    <DropdownMenuItem
                      key={layer.id}
                      onClick={() => onDataLayerChange(layer.id)}
                      className="flex items-center gap-2"
                    >
                      <layer.icon className={`w-4 h-4 ${layer.color}`} />
                      <span>{layer.label}</span>
                      {layer.id === dataLayer && (
                        <span className="ml-auto text-xs text-primary">Active</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Temperature Filter */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <button className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl transition-colors ${
                    temperatureFilter[0] > 20 || temperatureFilter[1] < 45
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-muted/50 hover:bg-muted border-border text-muted-foreground"
                  }`}>
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filter</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Temperature Range</span>
                      <button
                        onClick={() => onTemperatureFilterChange([20, 45])}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Slider
                        value={temperatureFilter}
                        onValueChange={(value) => onTemperatureFilterChange(value as [number, number])}
                        min={20}
                        max={45}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="px-2 py-1 bg-muted rounded">{temperatureFilter[0]}°C</span>
                        <span className="text-muted-foreground">to</span>
                        <span className="px-2 py-1 bg-muted rounded">{temperatureFilter[1]}°C</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-1">
              {/* Comparison Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onComparisonModeChange(!comparisonMode)}
                    className={`p-2 rounded-lg transition-colors ${
                      comparisonMode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <GitCompare className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {comparisonMode ? "Exit comparison" : "Compare locations"}
                </TooltipContent>
              </Tooltip>

              {/* Analytics Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onShowAnalyticsChange(!showAnalytics)}
                    className={`p-2 rounded-lg transition-colors ${
                      showAnalytics
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {showAnalytics ? "Hide analytics" : "Show analytics"}
                </TooltipContent>
              </Tooltip>

              <div className="h-5 w-px bg-border mx-1" />

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onExport}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Export data</TooltipContent>
              </Tooltip>

              {/* Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onShare}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Share view</TooltipContent>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onFullscreen}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Comparison Mode Bar */}
          {comparisonMode && (
            <div className="mt-2 pt-2 border-t border-border flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Comparing:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                  selectedLocation ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {selectedLocation || "Select first location"}
                </span>
                <span className="text-xs text-muted-foreground">vs</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`px-2 py-1 text-xs font-medium rounded-lg ${
                      comparisonLocation ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}>
                      {comparisonLocation || "Select second location"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-1 max-h-48 overflow-y-auto">
                    {locations.filter(l => l !== selectedLocation).map((loc) => (
                      <button
                        key={loc}
                        onClick={() => onComparisonLocationSelect(loc)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          loc === comparisonLocation
                            ? "bg-accent/10 text-accent font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              <button
                onClick={() => {
                  onComparisonModeChange(false);
                  onComparisonLocationSelect(null);
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}

export default ChoroplethNavbar;
