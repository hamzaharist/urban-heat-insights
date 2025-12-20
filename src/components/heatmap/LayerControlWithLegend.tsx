import { Layers, Thermometer, Leaf, Building2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type LayerType = 'temperature' | 'ndvi' | 'ndbi';

interface LayerControlWithLegendProps {
     selectedLayer: LayerType;
     onLayerChange: (layer: LayerType) => void;
}

const LAYERS = [
     {
          value: 'temperature' as LayerType,
          label: 'Temperature',
          description: 'Land Surface Temperature',
          color: 'text-heat-extreme',
          icon: Thermometer,
          legend: [
               { color: '#dc2626', label: 'Extreme', range: '> 38°C' },
               { color: '#ea580c', label: 'Hot', range: '36-38°C' },
               { color: '#f59e0b', label: 'Warm', range: '34-36°C' },
               { color: '#eab308', label: 'Mild', range: '32-34°C' },
               { color: '#22c55e', label: 'Cool', range: '< 32°C' },
          ],
     },
     {
          value: 'ndvi' as LayerType,
          label: 'Vegetation',
          description: 'NDVI Index',
          color: 'text-eco',
          icon: Leaf,
          legend: [
               { color: '#228B22', label: 'Good', range: '≥ 0.24' },
               { color: '#9ACD32', label: 'Moderate', range: '0.18-0.24' },
               { color: '#FFD700', label: 'Sparse', range: '0.12-0.18' },
               { color: '#8B4513', label: 'Very Sparse', range: '< 0.12' },
          ],
     },
     {
          value: 'ndbi' as LayerType,
          label: 'Built-up',
          description: 'NDBI Index',
          color: 'text-primary',
          icon: Building2,
          legend: [
               { color: '#696969', label: 'High Urban', range: '≥ 0.0' },
               { color: '#A9A9A9', label: 'Moderate', range: '-0.04 to 0.0' },
               { color: '#87CEEB', label: 'Low Urban', range: '-0.08 to -0.04' },
               { color: '#0064FF', label: 'Natural', range: '< -0.08' },
          ],
     },
];

export function LayerControlWithLegend({ selectedLayer, onLayerChange }: LayerControlWithLegendProps) {
     const currentLayer = LAYERS.find(l => l.value === selectedLayer) || LAYERS[0];
     const Icon = currentLayer.icon;

     return (
          <div className="space-y-4">
               {/* Layer Selection */}
               <div className="space-y-3">
                    <div className="flex items-center gap-2">
                         <Layers className="w-4 h-4 text-primary" />
                         <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Map Layer
                         </span>
                    </div>

                    <RadioGroup value={selectedLayer} onValueChange={onLayerChange}>
                         <div className="space-y-2">
                              {LAYERS.map((layer) => (
                                   <div
                                        key={layer.value}
                                        className="flex items-center space-x-2 bg-background/50 border border-border/30 rounded-lg p-3 hover:bg-background/70 transition-colors cursor-pointer"
                                   >
                                        <RadioGroupItem value={layer.value} id={layer.value} />
                                        <Label
                                             htmlFor={layer.value}
                                             className="flex-1 cursor-pointer"
                                        >
                                             <div className="flex items-center justify-between">
                                                  <div>
                                                       <div className={`font-medium ${layer.color}`}>
                                                            {layer.label}
                                                       </div>
                                                       <div className="text-xs text-muted-foreground">
                                                            {layer.description}
                                                       </div>
                                                  </div>
                                             </div>
                                        </Label>
                                   </div>
                              ))}
                         </div>
                    </RadioGroup>
               </div>

               {/* Divider */}
               <div className="border-t border-border/30" />

               {/* Legend for Selected Layer */}
               <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <Icon className="w-4 h-4 text-primary" />
                         <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Legend
                         </span>
                    </div>

                    <div className="space-y-1.5">
                         {currentLayer.legend.map((item, index) => (
                              <div
                                   key={index}
                                   className="flex items-center gap-2 text-xs"
                              >
                                   <div
                                        className="w-4 h-4 rounded border border-border/30 flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                   />
                                   <div className="flex-1 flex items-center justify-between">
                                        <span className="font-medium text-foreground">
                                             {item.label}
                                        </span>
                                        <span className="text-muted-foreground">
                                             {item.range}
                                        </span>
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>
          </div>
     );
}
