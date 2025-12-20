import { Layers } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type LayerType = 'temperature' | 'ndvi' | 'ndbi';

interface LayerControlProps {
     selectedLayer: LayerType;
     onLayerChange: (layer: LayerType) => void;
}

const LAYERS = [
     {
          value: 'temperature' as LayerType,
          label: 'Temperature',
          description: 'Land Surface Temperature',
          color: 'text-heat-extreme',
     },
     {
          value: 'ndvi' as LayerType,
          label: 'Vegetation',
          description: 'NDVI Index',
          color: 'text-eco',
     },
     {
          value: 'ndbi' as LayerType,
          label: 'Built-up',
          description: 'NDBI Index',
          color: 'text-primary',
     },
];

export function LayerControl({ selectedLayer, onLayerChange }: LayerControlProps) {
     return (
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
     );
}
