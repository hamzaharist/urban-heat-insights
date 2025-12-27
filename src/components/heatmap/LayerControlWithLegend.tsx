import { Layers, Thermometer, Leaf, Building2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LST_LEGEND } from '@/utils/temperature';

export type LayerType = 'temperature' | 'ndvi' | 'ndbi';

interface LayerControlWithLegendProps {
     selectedLayer: LayerType;
     onLayerChange: (layer: LayerType) => void;
}

const LAYERS = [
     {
          value: 'temperature' as LayerType,
          label: 'Surface Heat (LST)',
          description: 'Land Surface Temperature (Higher than Air Temp)',
          color: 'text-heat-extreme',
          icon: Thermometer,
          legend: [
               { color: LST_LEGEND.critical.color, label: LST_LEGEND.critical.label, range: LST_LEGEND.critical.range, desc: LST_LEGEND.critical.desc },
               { color: LST_LEGEND.high.color, label: LST_LEGEND.high.label, range: LST_LEGEND.high.range, desc: LST_LEGEND.high.desc },
               { color: LST_LEGEND.medium.color, label: LST_LEGEND.medium.label, range: LST_LEGEND.medium.range, desc: LST_LEGEND.medium.desc },
               { color: LST_LEGEND.low.color, label: LST_LEGEND.low.label, range: LST_LEGEND.low.range, desc: LST_LEGEND.low.desc },
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
                                   <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                             <span className="font-medium text-foreground">
                                                  {item.label}
                                             </span>
                                             <span className="text-muted-foreground">
                                                  {item.range}
                                             </span>
                                        </div>
                                        {/* Inline Description */}
                                        {'desc' in item && (
                                             <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                                  {item.desc}
                                             </div>
                                        )}
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>
          </div>
     );
}
