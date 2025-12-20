import { Thermometer, Leaf, Building2 } from 'lucide-react';
import type { LayerType } from './LayerControl';

interface MapLegendProps {
     selectedLayer: LayerType;
}

const LEGENDS = {
     temperature: {
          title: 'Heat Intensity',
          icon: Thermometer,
          items: [
               { color: '#dc2626', label: 'Extreme', range: '> 38°C' },
               { color: '#ea580c', label: 'Hot', range: '36-38°C' },
               { color: '#f59e0b', label: 'Warm', range: '34-36°C' },
               { color: '#eab308', label: 'Mild', range: '32-34°C' },
               { color: '#22c55e', label: 'Cool', range: '< 32°C' },
          ],
     },
     ndvi: {
          title: 'Vegetation Density',
          icon: Leaf,
          items: [
               { color: '#228B22', label: 'Good', range: '≥ 0.24' },
               { color: '#9ACD32', label: 'Moderate', range: '0.18-0.24' },
               { color: '#FFD700', label: 'Sparse', range: '0.12-0.18' },
               { color: '#8B4513', label: 'Very Sparse', range: '< 0.12' },
          ],
     },
     ndbi: {
          title: 'Urban Density',
          icon: Building2,
          items: [
               { color: '#696969', label: 'High Urban', range: '≥ 0.0' },
               { color: '#A9A9A9', label: 'Moderate', range: '-0.04 to 0.0' },
               { color: '#87CEEB', label: 'Low Urban', range: '-0.08 to -0.04' },
               { color: '#0064FF', label: 'Natural', range: '< -0.08' },
          ],
     },
};

export function MapLegend({ selectedLayer }: MapLegendProps) {
     const legend = LEGENDS[selectedLayer];
     const Icon = legend.icon;

     return (
          <div className="space-y-2">
               <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                         {legend.title}
                    </span>
               </div>

               <div className="space-y-1.5">
                    {legend.items.map((item, index) => (
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
     );
}
