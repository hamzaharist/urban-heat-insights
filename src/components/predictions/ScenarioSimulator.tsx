import { Sliders, RotateCcw, Building2, Leaf, Thermometer } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ScenarioSimulatorProps {
     adjustment: {
          ndbi: number;
          ndvi: number;
          climate: number;
     };
     onAdjustmentChange: (adjustment: { ndbi: number; ndvi: number; climate: number }) => void;
}

export function ScenarioSimulator({ adjustment, onAdjustmentChange }: ScenarioSimulatorProps) {
     const handleReset = () => {
          onAdjustmentChange({ ndbi: 0, ndvi: 0, climate: 0 });
     };

     const isModified = adjustment.ndbi !== 0 || adjustment.ndvi !== 0 || adjustment.climate !== 0;

     // Calculate total impact
     const totalImpact = (adjustment.ndbi * 0.45) + (adjustment.ndvi * 0.30) + (adjustment.climate * 0.25);

     return (
          <div className="space-y-4">
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Sliders className="w-4 h-4 text-primary" />
                         <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Scenario Simulation
                         </span>
                    </div>
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

               {/* Total Impact Display */}
               {isModified && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                         <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Total Impact</span>
                              <span className={`text-lg font-display font-bold ${totalImpact > 0 ? 'text-heat-extreme' : 'text-eco'
                                   }`}>
                                   {totalImpact > 0 ? '+' : ''}{totalImpact.toFixed(2)}°C
                              </span>
                         </div>
                    </div>
               )}

               {/* Urban Expansion (NDBI) */}
               <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">Urban Expansion</span>
                         </div>
                         <span className="text-sm font-semibold text-primary">
                              {adjustment.ndbi > 0 ? '+' : ''}{adjustment.ndbi.toFixed(1)}°C
                         </span>
                    </div>
                    <Slider
                         min={-5}
                         max={5}
                         step={0.1}
                         value={[adjustment.ndbi]}
                         onValueChange={(values) =>
                              onAdjustmentChange({ ...adjustment, ndbi: values[0] })
                         }
                         className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>Less Built-up</span>
                         <span className="text-xs text-muted-foreground">45% impact</span>
                         <span>More Built-up</span>
                    </div>
               </div>

               {/* Vegetation Changes (NDVI) */}
               <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-eco" />
                              <span className="text-sm font-medium text-foreground">Vegetation Changes</span>
                         </div>
                         <span className="text-sm font-semibold text-eco">
                              {adjustment.ndvi > 0 ? '+' : ''}{adjustment.ndvi.toFixed(1)}°C
                         </span>
                    </div>
                    <Slider
                         min={-5}
                         max={5}
                         step={0.1}
                         value={[adjustment.ndvi]}
                         onValueChange={(values) =>
                              onAdjustmentChange({ ...adjustment, ndvi: values[0] })
                         }
                         className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>More Vegetation</span>
                         <span className="text-xs text-muted-foreground">30% impact</span>
                         <span>Less Vegetation</span>
                    </div>
               </div>

               {/* Climate Baseline */}
               <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Thermometer className="w-4 h-4 text-heat-extreme" />
                              <span className="text-sm font-medium text-foreground">Climate Baseline</span>
                         </div>
                         <span className="text-sm font-semibold text-heat-extreme">
                              {adjustment.climate > 0 ? '+' : ''}{adjustment.climate.toFixed(1)}°C
                         </span>
                    </div>
                    <Slider
                         min={-5}
                         max={5}
                         step={0.1}
                         value={[adjustment.climate]}
                         onValueChange={(values) =>
                              onAdjustmentChange({ ...adjustment, climate: values[0] })
                         }
                         className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>Cooler Climate</span>
                         <span className="text-xs text-muted-foreground">25% impact</span>
                         <span>Warmer Climate</span>
                    </div>
               </div>

               {/* Info */}
               <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>
                         Adjust sliders to simulate different scenarios. Impact percentages are based on ML feature importance.
                    </p>
               </div>
          </div>
     );
}
