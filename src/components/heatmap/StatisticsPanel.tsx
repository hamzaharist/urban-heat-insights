import { Thermometer, AlertTriangle, Leaf, Building2 } from 'lucide-react';
import { useHotspots } from '@/hooks/useHotspots';

interface StatisticsPanelProps {
     selectedCity: string;
}

export function StatisticsPanel({ selectedCity }: StatisticsPanelProps) {
     const { data: hotspots, isLoading } = useHotspots(selectedCity);

     if (isLoading) {
          return (
               <div className="space-y-3">
                    <div className="animate-pulse space-y-3">
                         <div className="h-4 bg-muted rounded w-24" />
                         <div className="h-16 bg-muted rounded" />
                         <div className="h-16 bg-muted rounded" />
                    </div>
               </div>
          );
     }

     if (!hotspots || hotspots.length === 0) {
          return (
               <div className="text-sm text-muted-foreground">
                    No data available for {selectedCity}
               </div>
          );
     }

     // Calculate statistics - filter out null/undefined values
     const validTemps = hotspots.map(h => h.temperature).filter(t => t != null && !isNaN(t));
     const peakTemp = validTemps.length > 0 ? Math.max(...validTemps) : 0;

     const criticalHotspots = hotspots.filter(h => h.intensity === 'extreme' || h.intensity === 'hot').length;

     const validNDVI = hotspots.map(h => h.avg_ndvi).filter(v => v != null && !isNaN(v));
     const avgNDVI = validNDVI.length > 0 ? validNDVI.reduce((sum, v) => sum + v, 0) / validNDVI.length : 0;

     const validNDBI = hotspots.map(h => h.avg_ndbi).filter(v => v != null && !isNaN(v));
     const avgNDBI = validNDBI.length > 0 ? validNDBI.reduce((sum, v) => sum + v, 0) / validNDBI.length : 0;

     const stats = [
          {
               icon: Thermometer,
               label: 'Peak Temperature',
               value: `${peakTemp.toFixed(1)}°C`,
               color: 'text-heat-extreme',
               bgColor: 'bg-heat-extreme/10',
          },
          {
               icon: AlertTriangle,
               label: 'Critical Hotspots',
               value: criticalHotspots.toString(),
               color: 'text-orange-500',
               bgColor: 'bg-orange-500/10',
          },
          {
               icon: Leaf,
               label: 'Avg Vegetation',
               value: avgNDVI.toFixed(3),
               color: 'text-eco',
               bgColor: 'bg-eco/10',
          },
          {
               icon: Building2,
               label: 'Avg Built-up',
               value: avgNDBI.toFixed(3),
               color: 'text-primary',
               bgColor: 'bg-primary/10',
          },
     ];

     return (
          <div className="space-y-3">
               <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                         Live Statistics
                    </span>
                    <span className="text-xs text-muted-foreground">
                         2016-2024 Avg
                    </span>
               </div>

               <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat) => (
                         <div
                              key={stat.label}
                              className="bg-background/50 border border-border/30 rounded-xl p-3 space-y-2"
                         >
                              <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                                   <stat.icon className={`w-4 h-4 ${stat.color}`} />
                              </div>
                              <div>
                                   <div className={`text-lg font-display font-bold ${stat.color}`}>
                                        {stat.value}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                        {stat.label}
                                   </div>
                              </div>
                         </div>
                    ))}
               </div>
          </div>
     );
}
