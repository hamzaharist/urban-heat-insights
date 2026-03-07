import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { ChoroplethMap } from '@/components/choropleth/ChoroplethMap';
import { BloomeeWidget } from '@/components/choropleth/BloomeeWidget';
import { ChoroplethNavbar } from '@/components/choropleth/ChoroplethNavbar';
import { ChoroplethAnalytics } from '@/components/choropleth/ChoroplethAnalytics';
import { ComparisonWidget } from '@/components/choropleth/ComparisonWidget';
import { useStateHeatmap } from '@/hooks/useStateHeatmap';
import { useDistrictHeatmap } from '@/hooks/useDistrictHeatmap';
import { generateAnalysisPDF } from '@/utils/pdfExport';

export function ChoroplethPage() {
     // Data hooks
     const { data: stateGeoJSON, isLoading: isLoadingStates } = useStateHeatmap();
     const { data: districtGeoJSON, isLoading: isLoadingDistricts } = useDistrictHeatmap();

     // View state
     const [viewMode, setViewMode] = useState<'states' | 'districts'>('states');
     const [hoveredRegionData, setHoveredRegionData] = useState<any>(null);
     const [lockedRegionData, setLockedRegionData] = useState<any>(null);
     const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

     // Analytics & comparison state
     const [showAnalytics, setShowAnalytics] = useState(false);
     const [comparisonMode, setComparisonMode] = useState(false);
     const [comparisonLocation, setComparisonLocation] = useState<string | null>(null);

     // Filter state
     const [dataLayer, setDataLayer] = useState<'temperature' | 'ndvi' | 'ndbi'>('temperature');
     const [temperatureFilter, setTemperatureFilter] = useState<[number, number]>([20, 45]);

     // Current data based on view mode
     const currentGeoJSON = viewMode === 'states' ? stateGeoJSON : districtGeoJSON;
     const isLoading = viewMode === 'states' ? isLoadingStates : isLoadingDistricts;

     // Extract locations for search
     const locations = useMemo(() => {
          if (!currentGeoJSON?.features) return [];
          return currentGeoJSON.features
               .map((f: any) => f.properties?.name || f.properties?.state_name || f.properties?.district_name)
               .filter((name: string) => name)
               .sort();
     }, [currentGeoJSON]);

     // Transform data for analytics
     const analyticsData = useMemo(() => {
          if (!currentGeoJSON?.features) return [];
          return currentGeoJSON.features
               .filter((f: any) => f.properties?.avg_temperature > 0)
               .map((f: any) => ({
                    name: f.properties?.name || f.properties?.state_name || f.properties?.district_name || 'Unknown',
                    temperature: f.properties?.avg_temperature || 0,
                    ndvi: f.properties?.avg_ndvi || 0,
                    ndbi: f.properties?.avg_ndbi || 0,
                    hotspots: f.properties?.hotspot_count || 0,
                    population: f.properties?.population || 0,
               }));
     }, [currentGeoJSON]);

     // Get location data by name
     const getLocationData = useCallback((name: string | null) => {
          if (!name) return null;
          return analyticsData.find(d => d.name === name) || null;
     }, [analyticsData]);

     // Helper function to determine risk level from temperature
     const getRiskLevel = (temp: number | undefined): 'Low' | 'Medium' | 'High' | 'Critical' => {
          if (!temp) return 'Low';
          if (temp >= 38) return 'Critical';
          if (temp >= 34) return 'High';
          if (temp >= 30) return 'Medium';
          return 'Low';
     };

     // Active data for BloomeeWidget
     const activeData = hoveredRegionData || lockedRegionData;

     // Transform data for BloomeeWidget
     const bloomeeData = activeData ? {
          name: activeData.name || activeData.state_name || 'Unknown Region',
          temperature: activeData.avg_temperature || 0,
          baselineTemp: activeData.avg_temperature || 0,
          tempChange: 0,
          ndvi: activeData.avg_ndvi || 0,
          ndbi: activeData.avg_ndbi || 0,
          hotspots: activeData.hotspot_count || 0,
          riskLevel: getRiskLevel(activeData.avg_temperature),
          isScenario: false
     } : null;

     // Handle location selection
     const handleLocationSelect = (location: string | null) => {
          setSelectedLocation(location);
          if (location) {
               // Find the feature and lock it
               const feature = currentGeoJSON?.features?.find((f: any) => {
                    const name = f.properties?.name || f.properties?.state_name || f.properties?.district_name;
                    return name === location;
               });
               if (feature) {
                    setLockedRegionData(feature.properties);
               }
          } else {
               setLockedRegionData(null);
          }
     };

     // Handle view level change
     const handleViewLevelChange = (level: 'states' | 'districts') => {
          setViewMode(level);
          setSelectedLocation(null);
          setLockedRegionData(null);
          setHoveredRegionData(null);
          setComparisonLocation(null);
     };

     // Export handler - generates PDF report
     const handleExport = () => {
          try {
               // Include comparison data if comparison mode is active
               const comparisonData = comparisonMode ? {
                    location1: getLocationData(selectedLocation),
                    location2: getLocationData(comparisonLocation),
               } : undefined;

               generateAnalysisPDF(analyticsData, {
                    title: 'Urban Heat Island Analysis Report',
                    viewLevel: viewMode,
                    temperatureFilter: temperatureFilter,
                    selectedLocation: selectedLocation,
                    comparison: comparisonData,
               });

               const message = comparisonData?.location1 && comparisonData?.location2
                    ? 'PDF report with comparison analysis generated'
                    : 'PDF report generated successfully';
               toast.success(message);
          } catch (error) {
               console.error('PDF export error:', error);
               toast.error('Failed to generate PDF report');
          }
     };

     // Share handler
     const handleShare = async () => {
          const url = window.location.href;
          try {
               await navigator.clipboard.writeText(url);
               toast.success('Link copied to clipboard');
          } catch {
               toast.error('Failed to copy link');
          }
     };

     // Fullscreen handler
     const handleFullscreen = () => {
          if (document.fullscreenElement) {
               document.exitFullscreen();
          } else {
               document.documentElement.requestFullscreen();
          }
     };

     return (
          <div className="relative w-full h-screen overflow-hidden bg-background">
               {/* Navbar */}
               <ChoroplethNavbar
                    viewLevel={viewMode}
                    onViewLevelChange={handleViewLevelChange}
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    comparisonMode={comparisonMode}
                    onComparisonModeChange={setComparisonMode}
                    comparisonLocation={comparisonLocation}
                    onComparisonLocationSelect={setComparisonLocation}
                    showAnalytics={showAnalytics}
                    onShowAnalyticsChange={setShowAnalytics}
                    dataLayer={dataLayer}
                    onDataLayerChange={setDataLayer}
                    temperatureFilter={temperatureFilter}
                    onTemperatureFilterChange={setTemperatureFilter}
                    onExport={handleExport}
                    onShare={handleShare}
                    onFullscreen={handleFullscreen}
               />

               {/* Full-Screen Map */}
               <div className={`absolute inset-0 pt-14 ${comparisonMode ? 'pt-[88px]' : 'pt-14'} transition-all`}>
                    <ChoroplethMap
                         level={viewMode}
                         onHoverChange={setHoveredRegionData}
                         highlightedDistrict={selectedLocation}
                         temperatureFilter={temperatureFilter}
                         onLocationClick={(data) => {
                              const locationName = data.name || data.state_name || data.district_name;
                              // Toggle lock: click same region to unlock
                              if (selectedLocation === locationName) {
                                   setSelectedLocation(null);
                                   setLockedRegionData(null);
                              } else {
                                   setSelectedLocation(locationName);
                                   setLockedRegionData(data);
                              }
                         }}
                    />
               </div>

               {/* Bloomee Widget - Premium Floating Card */}
               <div className={`transition-all duration-300 ${showAnalytics ? 'mr-[420px]' : ''}`}>
                    <BloomeeWidget data={bloomeeData} isLoading={isLoading} />
               </div>

               {/* Comparison Widget - Shows when comparison mode is active */}
               {comparisonMode && (
                    <ComparisonWidget
                         location1={getLocationData(selectedLocation)}
                         location2={getLocationData(comparisonLocation)}
                         onClose={() => {
                              setComparisonMode(false);
                              setComparisonLocation(null);
                         }}
                    />
               )}

               {/* Info Panel - Top Left */}
               <div className={`absolute ${comparisonMode ? 'top-28' : 'top-20'} left-6 z-10 transition-all`}>
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
                                   ? 'Click another location to change selection or hover for details.'
                                   : `Explore temperature distribution across Malaysia's ${viewMode === 'states' ? '16 states' : 'districts'}. Click to select and hover for details.`
                              }
                         </p>

                         <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center justify-between text-xs">
                                   <span className="text-white/60">Data Layer:</span>
                                   <span className="font-semibold text-teal-400 capitalize">{dataLayer}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-2">
                                   <span className="text-white/60">Locations:</span>
                                   <span className="font-semibold text-teal-400">{analyticsData.length}</span>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Legend - Bottom Left */}
               <div className={`absolute bottom-6 left-6 z-10 transition-all ${showAnalytics ? 'mr-[420px]' : ''}`}>
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
                                   <div className="w-8 h-5 rounded-md shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: '#94a3b8' }} />
                                   <span className="text-xs text-white/60 font-medium italic">No Data Available</span>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Analytics Panel */}
               {showAnalytics && (
                    <ChoroplethAnalytics
                         data={analyticsData}
                         selectedLocation={getLocationData(selectedLocation)}
                         comparisonLocation={getLocationData(comparisonLocation)}
                         onClose={() => setShowAnalytics(false)}
                    />
               )}
          </div>
     );
}
