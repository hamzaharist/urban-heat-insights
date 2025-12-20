import { MapPin, Thermometer, Leaf, Building2, TrendingUp, Calendar, Satellite, Droplets } from 'lucide-react';
import { HotspotData } from '@/types/weather';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HotspotDetailsPanelProps {
     hotspot: HotspotData | null;
     allHotspots?: HotspotData[];
}

export function HotspotDetailsPanel({ hotspot, allHotspots = [] }: HotspotDetailsPanelProps) {
     if (!hotspot) {
          return (
               <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Click on a hotspot marker to view detailed analysis</p>
               </div>
          );
     }

     // Calculate city-wide statistics for comparison
     const cityStats = allHotspots.length > 0 ? {
          avgTemp: allHotspots.reduce((sum, h) => sum + h.temperature, 0) / allHotspots.length,
          maxTemp: Math.max(...allHotspots.map(h => h.temperature)),
          minTemp: Math.min(...allHotspots.map(h => h.temperature)),
     } : null;

     // Calculate this hotspot's ranking
     const sortedByTemp = [...allHotspots].sort((a, b) => b.temperature - a.temperature);
     const ranking = sortedByTemp.findIndex(h => h.id === hotspot.id) + 1;
     const isPeakHotspot = cityStats && hotspot.temperature === cityStats.maxTemp;

     // Temperature difference from city average
     const tempDiff = cityStats ? hotspot.temperature - cityStats.avgTemp : null;

     const getIntensityColor = (intensity: string) => {
          const colors = {
               extreme: 'text-heat-extreme bg-heat-extreme/10 border-heat-extreme/30',
               hot: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
               warm: 'text-heat-warm bg-heat-warm/10 border-heat-warm/30',
               mild: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
               cool: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
          };
          return colors[intensity as keyof typeof colors] || colors.mild;
     };

     // Calculate NDVI status - aligned with map layer colors
     const getNDVIStatus = (ndvi: number) => {
          if (ndvi >= 0.24) return { label: 'Good Vegetation', color: 'text-green-500' };
          if (ndvi >= 0.18) return { label: 'Moderate Vegetation', color: 'text-eco' };
          if (ndvi >= 0.12) return { label: 'Sparse Vegetation', color: 'text-yellow-500' };
          return { label: 'Very Sparse Vegetation', color: 'text-orange-500' };
     };

     const ndviStatus = hotspot.avg_ndvi ? getNDVIStatus(hotspot.avg_ndvi) : null;

     return (
          <div className="space-y-4">
               {/* Header */}
               <div>
                    <div className="flex items-start gap-3 mb-3">
                         <div className="p-2 bg-primary/10 rounded-lg">
                              <MapPin className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex-1">
                              <h4 className="font-display font-semibold text-foreground">
                                   {hotspot.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                   <span>{hotspot.latitude.toFixed(4)}°, {hotspot.longitude.toFixed(4)}°</span>
                              </p>
                         </div>
                    </div>

                    {/* Intensity Badge */}
                    <div
                         className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getIntensityColor(
                              hotspot.intensity
                         )}`}
                    >
                         <TrendingUp className="w-3 h-3" />
                         {hotspot.intensity.charAt(0).toUpperCase() + hotspot.intensity.slice(1)} Heat Intensity
                    </div>
               </div>

               {/* Tabs for different analyses */}
               <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-background/50">
                         <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                         <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                         <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-3 mt-3">
                         {/* Satellite Data */}
                         <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                   <Satellite className="w-3 h-3" />
                                   Satellite Data
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                   <div>
                                        <div className="text-muted-foreground">Source</div>
                                        <div className="font-medium text-foreground">Landsat 8/9</div>
                                   </div>
                                   <div>
                                        <div className="text-muted-foreground">Period</div>
                                        <div className="font-medium text-foreground">2016-2024</div>
                                   </div>
                              </div>
                         </div>

                         {/* Quick Metrics */}
                         <div className="grid grid-cols-2 gap-2">
                              <div className="bg-background/50 border border-border/30 rounded-lg p-3">
                                   <div className="flex items-center gap-2 mb-1">
                                        <Thermometer className="w-4 h-4 text-heat-extreme" />
                                        <span className="text-xs text-muted-foreground">Temperature</span>
                                   </div>
                                   <div className="text-lg font-display font-bold text-heat-extreme">
                                        {hotspot.temperature.toFixed(1)}°C
                                   </div>
                                   {/* Comparison Context */}
                                   {tempDiff !== null && (
                                        <div className="mt-1 text-xs">
                                             <span className={`font-semibold ${tempDiff > 0 ? 'text-orange-500' : 'text-blue-500'}`}>
                                                  {tempDiff > 0 ? '↑' : '↓'} {Math.abs(tempDiff).toFixed(1)}°C
                                             </span>
                                             <span className="text-muted-foreground ml-1">vs city avg</span>
                                        </div>
                                   )}
                                   {/* Peak Indicator */}
                                   {isPeakHotspot && (
                                        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-heat-extreme">
                                             🔥 HOTTEST SPOT
                                        </div>
                                   )}
                                   {/* Ranking */}
                                   {ranking > 0 && allHotspots.length > 0 && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                             Ranked #{ranking} of {allHotspots.length}
                                        </div>
                                   )}
                              </div>
                              <div className="bg-background/50 border border-border/30 rounded-lg p-3">
                                   <div className="flex items-center gap-2 mb-1">
                                        <Leaf className="w-4 h-4 text-eco" />
                                        <span className="text-xs text-muted-foreground">NDVI</span>
                                   </div>
                                   <div className="text-lg font-display font-bold text-eco">
                                        {hotspot.avg_ndvi?.toFixed(3) || 'N/A'}
                                   </div>
                              </div>
                         </div>
                    </TabsContent>

                    {/* Analysis Tab */}
                    <TabsContent value="analysis" className="space-y-3 mt-3">
                         {/* NDVI Analysis */}
                         <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                   <Leaf className="w-3 h-3" />
                                   NDVI Analysis
                              </div>
                              {ndviStatus && (
                                   <>
                                        <div className="flex items-center justify-between">
                                             <span className="text-xs text-muted-foreground">Status</span>
                                             <span className={`text-xs font-semibold ${ndviStatus.color}`}>
                                                  {ndviStatus.label}
                                             </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-xs text-muted-foreground">Mean NDVI</span>
                                             <span className="text-xs font-semibold text-eco">
                                                  {hotspot.avg_ndvi?.toFixed(3)}
                                             </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-xs text-muted-foreground">Range</span>
                                             <span className="text-xs font-medium text-muted-foreground">
                                                  -1.0 to +1.0
                                             </span>
                                        </div>
                                   </>
                              )}
                         </div>

                         {/* Urban Development Analysis */}
                         <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                   <Building2 className="w-3 h-3" />
                                   Urban Development
                              </div>
                              <div className="flex items-center justify-between">
                                   <span className="text-xs text-muted-foreground">NDBI Index</span>
                                   <span className="text-xs font-semibold text-primary">
                                        {hotspot.avg_ndbi?.toFixed(3) || 'N/A'}
                                   </span>
                              </div>
                              <div className="flex items-center justify-between">
                                   <span className="text-xs text-muted-foreground">Built-up Level</span>
                                   <span className="text-xs font-medium text-muted-foreground">
                                        {hotspot.avg_ndbi && hotspot.avg_ndbi > 0 ? 'High' : 'Moderate'}
                                   </span>
                              </div>
                         </div>
                    </TabsContent>

                    {/* Insights Tab */}
                    <TabsContent value="insights" className="space-y-3 mt-3">
                         {/* Recent Events */}
                         <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                   <Calendar className="w-3 h-3" />
                                   Recent Trends
                              </div>
                              <div className="space-y-2">
                                   <div className="flex items-start gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${hotspot.temperature > 35 ? 'bg-heat-extreme' : 'bg-heat-warm'
                                             }`} />
                                        <div className="flex-1">
                                             <div className="text-xs font-medium text-foreground">
                                                  {hotspot.temperature > 35 ? 'High' : 'Moderate'} temperature activity
                                             </div>
                                             <div className="text-xs text-muted-foreground">
                                                  Avg: {hotspot.temperature.toFixed(1)}°C
                                             </div>
                                        </div>
                                   </div>
                                   {hotspot.avg_ndvi && hotspot.avg_ndvi < 0.2 && (
                                        <div className="flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                                             <div className="flex-1">
                                                  <div className="text-xs font-medium text-foreground">
                                                       Low vegetation cover
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                       NDVI: {hotspot.avg_ndvi.toFixed(3)}
                                                  </div>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         </div>

                         {/* Weather Correlation */}
                         <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                   <Droplets className="w-3 h-3" />
                                   Environmental Factors
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                   <div>
                                        <div className="text-muted-foreground mb-1">Vegetation</div>
                                        <div className={`font-semibold ${ndviStatus?.color || 'text-muted-foreground'}`}>
                                             {ndviStatus?.label.split(' ')[0] || 'N/A'}
                                        </div>
                                   </div>
                                   <div>
                                        <div className="text-muted-foreground mb-1">Urban Density</div>
                                        <div className="font-semibold text-primary">
                                             {hotspot.avg_ndbi && hotspot.avg_ndbi > 0 ? 'High' : 'Low'}
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </TabsContent>
               </Tabs>
          </div>
     );
}
