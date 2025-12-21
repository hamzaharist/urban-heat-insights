import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Leaf, 
  Building2, 
  Sparkles,
  Thermometer,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TreePine,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ScenarioType = "green" | "urban" | "balanced";

interface CityResult {
  name: string;
  state: string;
  tempBefore: number;
  tempAfter: number;
  gbiBefore: number;
  gbiAfter: number;
  sdgBefore: number;
  sdgAfter: number;
  propertyValue: string;
  propertyChange: string;
}

const cityData: CityResult[] = [
  { name: "Tawau", state: "Sabah", tempBefore: 31.1, tempAfter: 28.6, gbiBefore: 73, gbiAfter: 78, sdgBefore: 85, sdgAfter: 86, propertyValue: "RM 0K", propertyChange: "↑ RM 2K" },
  { name: "Lubok Antu", state: "Sarawak", tempBefore: 31.3, tempAfter: 29.5, gbiBefore: 100, gbiAfter: 100, sdgBefore: 74, sdgAfter: 85, propertyValue: "RM 1K", propertyChange: "↓ RM 0K" },
  { name: "Sarikei", state: "Sarawak", tempBefore: 31.8, tempAfter: 30.2, gbiBefore: 100, gbiAfter: 100, sdgBefore: 74, sdgAfter: 84, propertyValue: "RM 3K", propertyChange: "↓ RM 1K" },
  { name: "Belaga", state: "Sarawak", tempBefore: 27.8, tempAfter: 26.2, gbiBefore: 100, gbiAfter: 100, sdgBefore: 88, sdgAfter: 90, propertyValue: "RM 0K", propertyChange: "↑ RM 0K" },
  { name: "Ulu Langat", state: "Selangor", tempBefore: 33.9, tempAfter: 32.4, gbiBefore: 100, gbiAfter: 100, sdgBefore: 100, sdgAfter: 90, propertyValue: "RM 0K", propertyChange: "↑ RM 151K" },
  { name: "Labuk & Sugut", state: "Sabah", tempBefore: 32.0, tempAfter: 30.4, gbiBefore: 100, gbiAfter: 100, sdgBefore: 70, sdgAfter: 83, propertyValue: "RM 1K", propertyChange: "↑ RM 0K" },
  { name: "Kuala Kangsar", state: "Perak", tempBefore: 30.7, tempAfter: 29.1, gbiBefore: 100, gbiAfter: 100, sdgBefore: 69, sdgAfter: 80, propertyValue: "RM 2K", propertyChange: "↓ RM 1K" },
  { name: "Kuching", state: "Sarawak", tempBefore: 32.5, tempAfter: 31.0, gbiBefore: 85, gbiAfter: 90, sdgBefore: 78, sdgAfter: 85, propertyValue: "RM 5K", propertyChange: "↑ RM 3K" },
];

const ScenarioPage = () => {
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("green");
  const [greenCover, setGreenCover] = useState([4]);
  const [buildingDensity, setBuildingDensity] = useState([0]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1500);
  };

  const handleScenarioChange = (scenario: ScenarioType) => {
    setActiveScenario(scenario);
    switch (scenario) {
      case "green":
        setGreenCover([20]);
        setBuildingDensity([-10]);
        break;
      case "urban":
        setGreenCover([-15]);
        setBuildingDensity([25]);
        break;
      case "balanced":
        setGreenCover([5]);
        setBuildingDensity([5]);
        break;
    }
  };

  const avgTempChange = -0.1;
  const citiesImproved = 70;
  const totalCities = 131;
  const valueSaved = "RM 0.3M";
  const avgGbiChange = 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Scenario Simulator</h1>
              <p className="text-sm text-muted-foreground">Explore what-if scenarios across all cities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container py-3">
        <nav className="flex items-center gap-2 text-sm">
          <Button variant="link" size="sm" className="p-0 h-auto gap-1 text-primary" onClick={() => navigate('/')}>
            <Home className="w-3.5 h-3.5" />
            Home
          </Button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Scenarios</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container pb-12">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Sidebar - Parameters */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="font-display font-semibold text-lg mb-4">Scenario Parameters</h2>
              
              {/* Quick Scenarios */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">Quick Scenarios</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleScenarioChange("green")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeScenario === "green" 
                        ? "border-eco bg-eco/5" 
                        : "border-border hover:border-eco/50"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${activeScenario === "green" ? "bg-eco" : "bg-eco/50"}`} />
                    <span className="text-xs font-medium">Green City</span>
                  </button>
                  <button
                    onClick={() => handleScenarioChange("urban")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeScenario === "urban" 
                        ? "border-heat-warm bg-heat-warm/5" 
                        : "border-border hover:border-heat-warm/50"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${activeScenario === "urban" ? "bg-heat-warm" : "bg-heat-warm/50"}`} />
                    <span className="text-xs font-medium">Urban Growth</span>
                  </button>
                  <button
                    onClick={() => handleScenarioChange("balanced")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeScenario === "balanced" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${activeScenario === "balanced" ? "bg-primary" : "bg-primary/50"}`} />
                    <span className="text-xs font-medium">Balanced</span>
                  </button>
                </div>
              </div>

              {/* Green Cover Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-eco" />
                    <span className="text-sm font-medium">Green Cover Adjustment</span>
                  </div>
                  <span className={`text-sm font-semibold ${greenCover[0] >= 0 ? "text-eco" : "text-heat-hot"}`}>
                    {greenCover[0] >= 0 ? "+" : ""}{greenCover[0]}%
                  </span>
                </div>
                <Slider
                  value={greenCover}
                  onValueChange={setGreenCover}
                  min={-50}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* Building Density Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Building Density Adjustment</span>
                  </div>
                  <span className={`text-sm font-semibold ${buildingDensity[0] <= 0 ? "text-eco" : "text-heat-hot"}`}>
                    {buildingDensity[0] >= 0 ? "+" : ""}{buildingDensity[0]}%
                  </span>
                </div>
                <Slider
                  value={buildingDensity}
                  onValueChange={setBuildingDensity}
                  min={-50}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* Run Simulation Button */}
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleRunSimulation}
                disabled={isSimulating}
              >
                <Sparkles className="w-4 h-4" />
                {isSimulating ? "Running..." : "Run Simulation"}
              </Button>
            </div>
          </div>

          {/* Right Content - Results */}
          <div className="space-y-6">
            {/* Impact Summary */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌡️</span>
                  <h2 className="font-display font-semibold text-lg">Scenario Impact Summary</h2>
                </div>
                <span className="text-sm text-muted-foreground">{totalCities} cities analyzed</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-xs">Avg Temp Change</span>
                  </div>
                  <span className={`text-2xl font-bold ${avgTempChange <= 0 ? "text-primary" : "text-heat-hot"}`}>
                    {avgTempChange}°C
                  </span>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs">Cities Improved</span>
                  </div>
                  <span className="text-2xl font-bold text-eco">
                    {citiesImproved}/{totalCities}
                  </span>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs">Value Saved</span>
                  </div>
                  <span className="text-2xl font-bold text-heat-warm">
                    {valueSaved}
                  </span>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Avg GBI Δ</span>
                  </div>
                  <span className={`text-2xl font-bold ${avgGbiChange >= 0 ? "text-eco" : "text-heat-hot"}`}>
                    +{avgGbiChange}
                  </span>
                </div>
              </div>
            </div>

            {/* City Results Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-display font-semibold text-lg">City-by-City Results</h3>
                <p className="text-sm text-muted-foreground">Click any city to view detailed simulation</p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">CITY</TableHead>
                      <TableHead className="font-semibold">TEMPERATURE</TableHead>
                      <TableHead className="font-semibold text-center">GBI SCORE</TableHead>
                      <TableHead className="font-semibold text-center">SDG 11 SCORE</TableHead>
                      <TableHead className="font-semibold text-right">PROPERTY VALUE</TableHead>
                      <TableHead className="font-semibold text-center">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cityData.map((city) => {
                      const tempChange = city.tempAfter - city.tempBefore;
                      const sdgChange = city.sdgAfter - city.sdgBefore;
                      const gbiChange = city.gbiAfter - city.gbiBefore;
                      
                      return (
                        <TableRow key={city.name} className="hover:bg-muted/30 cursor-pointer">
                          <TableCell>
                            <div>
                              <div className="font-medium">{city.name}</div>
                              <div className="text-xs text-muted-foreground">{city.state}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span>{city.tempBefore}°C → {city.tempAfter}°C</span>
                              <div className={`text-xs font-medium ${tempChange <= 0 ? "text-eco" : "text-heat-hot"}`}>
                                ({tempChange > 0 ? "+" : ""}{tempChange.toFixed(1)}°C)
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <span>{city.gbiBefore} → {city.gbiAfter}</span>
                              {gbiChange !== 0 && (
                                <div className={`text-xs font-medium ${gbiChange > 0 ? "text-eco" : "text-heat-hot"}`}>
                                  ({gbiChange > 0 ? "+" : ""}{gbiChange})
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <span>{city.sdgBefore} → {city.sdgAfter}</span>
                              <div className={`text-xs font-medium ${sdgChange >= 0 ? "text-eco" : "text-heat-hot"}`}>
                                ({sdgChange >= 0 ? "+" : ""}{sdgChange})
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span>{city.propertyValue}</span>
                              <div className={`text-xs font-medium ${city.propertyChange.includes("↑") ? "text-eco" : "text-heat-hot"}`}>
                                {city.propertyChange}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScenarioPage;
