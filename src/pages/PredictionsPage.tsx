import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sliders, Brain, RotateCcw } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PredictionsChart } from '@/components/predictions/PredictionsChart';
import { PredictionMetrics } from '@/components/predictions/PredictionMetrics';
import { YearSelector } from '@/components/predictions/YearSelector';
import { CompactScenarioControls } from '@/components/predictions/CompactScenarioControls';
import { MLInsightsPanel } from '@/components/predictions/MLInsightsPanel';
import { BottomControlBar, ControlBarSection, ControlBarGrid } from '@/components/BottomControlBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePredictions } from '@/hooks/usePredictions';
import { useMLPredictions } from '@/hooks/useMLPredictions';

const CITIES = [
     { value: 'Kuala Lumpur', label: 'Kuala Lumpur' },
     { value: 'Johor Bahru', label: 'Johor Bahru' },
     { value: 'Penang', label: 'Penang' },
];

export function PredictionsPage() {
     const navigate = useNavigate();
     const [selectedCity, setSelectedCity] = useState('Kuala Lumpur');
     const [yearRange, setYearRange] = useState<[number, number]>([2026, 2030]);
     const [scenarioAdjustment, setScenarioAdjustment] = useState({
          ndbi: 0,
          ndvi: 0,
          climate: 0,
     });
     const [scenariosExpanded, setScenariosExpanded] = useState(false);

     // Fetch predictions data for metrics
     const { data: predictions } = usePredictions(selectedCity, yearRange);

     // Fetch ML predictions when scenario is adjusted
     const { data: mlPredictions, isLoading: mlLoading } = useMLPredictions({
          city: selectedCity,
          yearRange: yearRange,
          scenarioAdjustment: scenarioAdjustment,
          enabled: true, // Always enabled, the backend handles the default scenario if adjustment is 0
     });

     // Calculate metrics from predictions data (or ML predictions if scenario is active)
     const metrics = useMemo(() => {
          // Use ML predictions if scenario is active and loaded
          if (mlPredictions) {
               return {
                    peakTemp: mlPredictions.metrics.peak_temp,
                    avgIncrease: mlPredictions.metrics.avg_increase,
                    trend: mlPredictions.metrics.trend,
                    confidence: mlPredictions.metrics.confidence,
               };
          }

          // Otherwise use base predictions
          if (!predictions || predictions.length === 0) {
               console.log('No predictions data for', selectedCity);
               return { peakTemp: 0, avgIncrease: 0, trend: 'stable' as const, confidence: 0 };
          }

          // Group by year and calculate averages (same logic as chart)
          const yearGroups = predictions.reduce((acc, pred) => {
               if (!acc[pred.year]) {
                    acc[pred.year] = [];
               }
               acc[pred.year].push(pred.predicted_temp);
               return acc;
          }, {} as Record<number, number[]>);

          // Calculate yearly averages
          const yearlyAverages = Object.entries(yearGroups).map(([year, temps]) => ({
               year: parseInt(year),
               avgTemp: temps.reduce((sum, temp) => sum + temp, 0) / temps.length,
          })).sort((a, b) => a.year - b.year);

          // Get peak from yearly averages (not raw max)
          const peakTemp = Math.max(...yearlyAverages.map(y => y.avgTemp));
          const firstTemp = yearlyAverages[0]?.avgTemp || 0;
          const lastTemp = yearlyAverages[yearlyAverages.length - 1]?.avgTemp || 0;
          const avgIncrease = lastTemp - firstTemp;

          console.log(`Metrics for ${selectedCity}:`, {
               yearlyAverages,
               peakTemp: peakTemp.toFixed(1),
               avgIncrease: avgIncrease.toFixed(1),
               firstYear: yearlyAverages[0]?.year,
               lastYear: yearlyAverages[yearlyAverages.length - 1]?.year,
          });

          let trend: 'rising' | 'stable' | 'falling' = 'stable';
          if (avgIncrease > 0.5) trend = 'rising';
          else if (avgIncrease < -0.5) trend = 'falling';

          const confidence = predictions[0]?.confidence || 94;

          return { peakTemp, avgIncrease, trend, confidence };
     }, [predictions, selectedCity, yearRange, mlPredictions]);

     const handleReset = () => {
          setScenarioAdjustment({ ndbi: 0, ndvi: 0, climate: 0 });
     };

     const isModified = scenarioAdjustment.ndbi !== 0 || scenarioAdjustment.ndvi !== 0 || scenarioAdjustment.climate !== 0;

     return (
          <div className="relative w-full h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419]">
               {/* Animated background gradient overlay */}
               <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-yellow-500/5 animate-pulse" style={{ animationDuration: '8s' }} />

               {/* Back Button */}
               <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-md border border-border/50 rounded-full shadow-lg hover:bg-background transition-colors"
               >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Home</span>
               </button>

               {/* Content Area */}
               <div className="relative flex-1 p-4 pt-20 pb-4 overflow-y-auto">
                    {/* Breadcrumbs */}
                    <div className="max-w-7xl mx-auto mb-4">
                         <Breadcrumbs />
                    </div>

                    {/* Page Title */}
                    <div className="text-center mb-6 animate-in fade-in-50 slide-in-from-top-4 duration-700">
                         <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                              🌡️ Temperature Predictions
                         </h1>
                         <p className="text-muted-foreground text-sm">
                              {selectedCity} • {yearRange[0]} - {yearRange[1]}
                         </p>
                    </div>

                    {/* Metrics Cards */}
                    <PredictionMetrics
                         peakTemp={metrics.peakTemp}
                         avgIncrease={metrics.avgIncrease}
                         trend={metrics.trend}
                         confidence={metrics.confidence}
                    />

                    {/* Chart Area */}
                    <div className="w-full bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-shadow duration-300 relative" style={{ height: 'calc(100vh - 500px)', minHeight: '400px' }}>
                         {/* ML Loading Overlay */}
                         {mlLoading && isModified && (
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                                   <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground">Running ML model...</p>
                                   </div>
                              </div>
                         )}

                         {/* ML Powered Badge */}
                         {isModified && mlPredictions && (
                              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full">
                                   <Brain className="w-3.5 h-3.5 text-primary" />
                                   <span className="text-xs font-medium text-primary">ML Powered</span>
                              </div>
                         )}

                         <PredictionsChart
                              selectedCity={selectedCity}
                              yearRange={yearRange}
                              scenarioAdjustment={
                                   isModified ? scenarioAdjustment : undefined
                              }
                              mlPredictions={mlPredictions}
                         />
                    </div>
               </div>

               {/* Bottom Control Bar */}
               <BottomControlBar>
                    <div className="space-y-4">
                         {/* Primary Controls Row */}
                         <ControlBarGrid columns={4}>
                              {/* City Selector */}
                              <div className="space-y-2">
                                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        City
                                   </label>
                                   <Select value={selectedCity} onValueChange={setSelectedCity}>
                                        <SelectTrigger className="w-full">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {CITIES.map((city) => (
                                                  <SelectItem key={city.value} value={city.value}>
                                                       {city.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              {/* Year Range */}
                              <div className="space-y-2">
                                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Year Range
                                   </label>
                                   <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                             {yearRange[0]} - {yearRange[1]}
                                        </span>
                                        <Dialog>
                                             <DialogTrigger asChild>
                                                  <Button variant="outline" size="sm">
                                                       Adjust
                                                  </Button>
                                             </DialogTrigger>
                                             <DialogContent>
                                                  <DialogHeader>
                                                       <DialogTitle>Select Year Range</DialogTitle>
                                                  </DialogHeader>
                                                  <YearSelector
                                                       yearRange={yearRange}
                                                       onYearRangeChange={setYearRange}
                                                  />
                                             </DialogContent>
                                        </Dialog>
                                   </div>
                              </div>

                              {/* Scenarios Link */}
                              <div className="space-y-2">
                                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Scenarios
                                   </label>
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/scenarios/${selectedCity.toLowerCase().replace(' ', '-')}`)}
                                        className="w-full"
                                   >
                                        <Sliders className="w-4 h-4 mr-2" />
                                        Run What-If Scenario
                                   </Button>
                              </div>

                              {/* ML Insights */}
                              <div className="space-y-2">
                                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Insights
                                   </label>
                                   <Dialog>
                                        <DialogTrigger asChild>
                                             <Button variant="outline" size="sm" className="w-full">
                                                  <Brain className="w-4 h-4 mr-2" />
                                                  View ML Data
                                             </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                             <DialogHeader>
                                                  <DialogTitle>ML Insights</DialogTitle>
                                             </DialogHeader>
                                             <MLInsightsPanel selectedCity={selectedCity} />
                                        </DialogContent>
                                   </Dialog>
                              </div>
                         </ControlBarGrid>

                         {/* Expandable Scenarios Section */}
                         {scenariosExpanded && (
                              <div className="pt-4 border-t border-border/30 animate-in slide-in-from-bottom-4 duration-300">
                                   <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-foreground">Scenario Simulation</h3>
                                        {isModified && (
                                             <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={handleReset}
                                                  className="h-7 text-xs"
                                             >
                                                  <RotateCcw className="w-3 h-3 mr-1" />
                                                  Reset
                                             </Button>
                                        )}
                                   </div>
                                   <CompactScenarioControls
                                        adjustment={scenarioAdjustment}
                                        onAdjustmentChange={setScenarioAdjustment}
                                   />
                              </div>
                         )}
                    </div>
               </BottomControlBar>
          </div>
     );
}
