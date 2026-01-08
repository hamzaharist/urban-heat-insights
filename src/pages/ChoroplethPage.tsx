import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ChoroplethMap } from '@/components/choropleth/ChoroplethMap';
import { BloomeeWidget } from '@/components/choropleth/BloomeeWidget';

export function ChoroplethPage() {
     const navigate = useNavigate();
     const [viewMode, setViewMode] = useState<'states' | 'districts'>('states');
     const [hoveredRegionData, setHoveredRegionData] = useState<any>(null);
     const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

     // Helper function to determine risk level from temperature
     const getRiskLevel = (temp: number | undefined): 'Low' | 'Medium' | 'High' | 'Critical' => {
          if (!temp) return 'Low';
          if (temp >= 38) return 'Critical';
          if (temp >= 34) return 'High';
          if (temp >= 30) return 'Medium';
          return 'Low';
     };

     // Transform hovered data for BloomeeWidget
     const bloomeeData = hoveredRegionData ? {
          name: hoveredRegionData.name || hoveredRegionData.state_name || 'Unknown Region',
          temperature: hoveredRegionData.avg_temperature || 0,
          baselineTemp: hoveredRegionData.avg_temperature || 0,
          tempChange: 0,
          ndvi: hoveredRegionData.avg_ndvi || 0,
          ndbi: hoveredRegionData.avg_ndbi || 0,
          hotspots: hoveredRegionData.hotspot_count || 0,
          riskLevel: getRiskLevel(hoveredRegionData.avg_temperature),
          isScenario: false
     } : null;

     return (
          <div className="relative w-full h-screen overflow-hidden bg-background">
               {/* Top Navigation Bar */}
               <div className="absolute top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
                    <div className="container mx-auto px-4 py-3">
                         <div className="flex items-center justify-between">
                              {/* Left: Back Button + Breadcrumbs */}
                              <div className="flex items-center gap-4">
                                   <button
                                        onClick={() => navigate('/')}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-lg transition-colors"
                                   >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span className="text-sm font-medium">Back</span>
                                   </button>

                                   <div className="h-6 w-px bg-border" />

                                   <Breadcrumbs
                                        items={[
                                             { label: 'Choropleth Map' }
                                        ]}
                                   />
                              </div>

                              {/* Right: View Mode Toggle */}
                              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                                   <button
                                        onClick={() => setViewMode('states')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'states'
                                             ? 'bg-background shadow-sm text-foreground'
                                             : 'text-muted-foreground hover:text-foreground'
                                             }`}
                                   >
                                        <Map className="w-4 h-4" />
                                        <span className="text-sm font-medium">States</span>
                                   </button>

                                   <button
                                        onClick={() => setViewMode('districts')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'districts'
                                             ? 'bg-background shadow-sm text-foreground'
                                             : 'text-muted-foreground hover:text-foreground'
                                             }`}
                                   >
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Districts</span>
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Full-Screen Map */}
               <div className="absolute inset-0 pt-16">
                    <ChoroplethMap
                         level={viewMode}
                         onHoverChange={setHoveredRegionData}
                         onLocationClick={(data) => {
                              const locationName = data.name || data.state_name || data.district_name;
                              setSelectedLocation(locationName);
                         }}
                    />
               </div>

               {/* Bloomee Widget - Premium Floating Card */}
               <BloomeeWidget data={bloomeeData} />

               {/* Info Panel - Top Left */}
               <div className="absolute top-24 left-6 z-10">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-black/50 to-black/30 border border-white/10 rounded-2xl shadow-2xl p-5 max-w-sm transition-all duration-300 hover:shadow-3xl hover:border-white/20">
                         <h3 className="font-bold text-sm mb-3 text-white">
                              {viewMode === 'states' ? 'State' : 'District'} Temperature Analysis
                         </h3>
                         {selectedLocation && (
                              <div className="mb-3 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                                   <p className="text-xs text-yellow-300 font-semibold">
                                        Selected: {selectedLocation}
                                   </p>
                              </div>
                         )}
                         <p className="text-xs text-white/70 leading-relaxed">
                              {selectedLocation
                                   ? 'Click another location to change selection or hover to see details.'
                                   : `Explore temperature distribution across Malaysia's ${viewMode === 'states' ? '16 states' : 'districts'}. Click to select and hover for details.`
                              }
                         </p>

                         <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center justify-between text-xs">
                                   <span className="text-white/60">Data Source:</span>
                                   <span className="font-semibold text-teal-400">Supabase Aggregations</span>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Legend - Bottom Left (Relocated) */}
               <div className="absolute bottom-6 left-6 z-10">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-black/50 to-black/30 border border-white/10 rounded-2xl shadow-2xl p-5 transition-all duration-300 hover:shadow-3xl hover:border-white/20">
                         <h4 className="font-bold text-sm mb-4 text-white">Temperature Scale (°C)</h4>
                         <div className="space-y-2.5">
                              <div className="flex items-center gap-3 group">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#14b8a6' }} />
                                   <span className="text-xs text-white/80 font-medium">≤ 24°C (Cool)</span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#22c55e' }} />
                                   <span className="text-xs text-white/80 font-medium">24 - 28°C (Moderate)</span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#eab308' }} />
                                   <span className="text-xs text-white/80 font-medium">28 - 32°C (Warm)</span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#f97316' }} />
                                   <span className="text-xs text-white/80 font-medium">32 - 36°C (Hot)</span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#dc2626' }} />
                                   <span className="text-xs text-white/80 font-medium">36 - 40°C (Very Hot)</span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#7f1d1d' }} />
                                   <span className="text-xs text-white/80 font-medium">≥ 40°C (Extreme)</span>
                              </div>
                              <div className="flex items-center gap-3 group pt-2 mt-2 border-t border-white/10">
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#475569' }} />
                                   <span className="text-xs text-white/60 font-medium italic">No Data Available</span>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
