import { Thermometer, Leaf, Building2 } from 'lucide-react';
import type { LayerType } from './LayerControlWithLegend';

interface MiniFloatingLegendProps {
     selectedLayer: LayerType;
}

const LEGENDS = {
     temperature: {
          icon: Thermometer,
          items: [
               { color: '#dc2626', label: 'Extreme' },
               { color: '#ea580c', label: 'Hot' },
               { color: '#f59e0b', label: 'Warm' },
               { color: '#eab308', label: 'Mild' },
               { color: '#22c55e', label: 'Cool' },
          ],
     },
     ndvi: {
          icon: Leaf,
          items: [
               { color: '#228B22', label: 'Good' },
               { color: '#9ACD32', label: 'Moderate' },
               { color: '#FFD700', label: 'Sparse' },
               { color: '#8B4513', label: 'Very Sparse' },
          ],
     },
     ndbi: {
          icon: Building2,
          items: [
               { color: '#696969', label: 'High Urban' },
               { color: '#A9A9A9', label: 'Moderate' },
               { color: '#87CEEB', label: 'Low Urban' },
               { color: '#0064FF', label: 'Natural' },
          ],
     },
};

export function MiniFloatingLegend({ selectedLayer }: MiniFloatingLegendProps) {
     const legend = LEGENDS[selectedLayer];
     const Icon = legend.icon;

     return (
          <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg p-3 space-y-2">
               {/* Header */}
               <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                         Legend
                    </span>
               </div>

               {/* Legend Items */}
               <div className="space-y-1">
                    {legend.items.map((item, index) => (
                         <div
                              key={index}
                              className="flex items-center gap-2"
                         >
                              <div
                                   className="w-3 h-3 rounded-sm border border-border/30 flex-shrink-0"
                                   style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs font-medium text-foreground">
                                   {item.label}
                              </span>
                         </div>
                    ))}
               </div>
          </div>
     );
}
