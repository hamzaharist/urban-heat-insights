import { Building2, Leaf, Thermometer, TrendingUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface CompactScenarioControlsProps {
     adjustment: {
          ndbi: number;
          ndvi: number;
          climate: number;
     };
     onAdjustmentChange: (adjustment: { ndbi: number; ndvi: number; climate: number }) => void;
}

export function CompactScenarioControls({ adjustment, onAdjustmentChange }: CompactScenarioControlsProps) {
     // Calculate total impact
     const totalImpact = (adjustment.ndbi * 0.45) + (adjustment.ndvi * 0.30) + (adjustment.climate * 0.25);
     const isModified = adjustment.ndbi !== 0 || adjustment.ndvi !== 0 || adjustment.climate !== 0;

     return (
          <div className="space-y-4">
               {/* Presets */}
               <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                         onClick={() => onAdjustmentChange({ ndbi: -2, ndvi: -5, climate: 0 })}
                         className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-eco/50 hover:bg-eco/5 transition-all group"
                    >
                         <div className="w-2.5 h-2.5 rounded-full bg-eco group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Green City</span>
                    </button>
                    <button
                         onClick={() => onAdjustmentChange({ ndbi: 5, ndvi: 2, climate: 0.5 })}
                         className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-heat-warm/50 hover:bg-heat-warm/5 transition-all group"
                    >
                         <div className="w-2.5 h-2.5 rounded-full bg-heat-warm group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Urban Growth</span>
                    </button>
                    <button
                         onClick={() => onAdjustmentChange({ ndbi: 1, ndvi: -1, climate: 0 })}
                         className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                         <div className="w-2.5 h-2.5 rounded-full bg-primary group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Balanced</span>
                    </button>
               </div>

               {/* Total Impact Display */}
               {isModified && (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
                         <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-muted-foreground">Total Impact</span>
                         </div>
                         <span className={`text-xl font-display font-bold ${totalImpact > 0 ? 'text-heat-extreme' : 'text-eco'
                              }`}>
                              {totalImpact > 0 ? '+' : ''}{totalImpact.toFixed(2)}°C
                         </span>
                    </div>
               )}

               {/* Compact Sliders */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Urban Expansion */}
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                   <Building2 className="w-3.5 h-3.5 text-primary" />
                                   <span className="text-xs font-medium text-foreground">Urban</span>
                              </div>
                              <span className="text-xs font-semibold text-primary">
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
                         <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Less</span>
                              <span>45%</span>
                              <span>More</span>
                         </div>
                    </div>

                    {/* Vegetation */}
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                   <Leaf className="w-3.5 h-3.5 text-eco" />
                                   <span className="text-xs font-medium text-foreground">Vegetation</span>
                              </div>
                              <span className="text-xs font-semibold text-eco">
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
                         <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>More</span>
                              <span>30%</span>
                              <span>Less</span>
                         </div>
                    </div>

                    {/* Climate */}
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                   <Thermometer className="w-3.5 h-3.5 text-heat-extreme" />
                                   <span className="text-xs font-medium text-foreground">Climate</span>
                              </div>
                              <span className="text-xs font-semibold text-heat-extreme">
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
                         <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Cooler</span>
                              <span>25%</span>
                              <span>Warmer</span>
                         </div>
                    </div>
               </div>
          </div>
     );
}
