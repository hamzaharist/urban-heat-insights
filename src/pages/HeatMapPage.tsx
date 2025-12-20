import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import { FloatingPanel } from '@/components/FloatingPanel';
import { CitySelector } from '@/components/heatmap/CitySelector';
import { CompactCitySelector } from '@/components/heatmap/CompactCitySelector';
import { StatisticsPanel } from '@/components/heatmap/StatisticsPanel';
import { LayerControlWithLegend, LayerType } from '@/components/heatmap/LayerControlWithLegend';
import { HotspotDetailsPanel } from '@/components/heatmap/HotspotDetailsPanel';
import { MiniFloatingLegend } from '@/components/heatmap/MiniFloatingLegend';
import { useAllHotspots } from '@/hooks/useHotspots';
import { HotspotData } from '@/types/weather';

export function HeatMapPage() {
     const navigate = useNavigate();
     const [selectedCity, setSelectedCity] = useState('Kuala Lumpur');
     const [selectedLayer, setSelectedLayer] = useState<LayerType>('temperature');
     const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);

     const { data: allHotspots } = useAllHotspots();

     const handleHotspotClick = (hotspot: HotspotData) => {
          setSelectedHotspot(hotspot);
     };

     return (
          <div className="relative w-full h-screen overflow-hidden bg-background">
               {/* Top Center: Back Button + City Selector */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                    {/* Back Button */}
                    <button
                         onClick={() => navigate('/')}
                         className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-md border border-border/50 rounded-full shadow-lg hover:bg-background transition-colors"
                    >
                         <ArrowLeft className="w-4 h-4" />
                         <span className="text-sm font-medium">Back to Home</span>
                    </button>

                    {/* City Selector */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-md border border-border/50 rounded-full shadow-lg">
                         <CompactCitySelector
                              selectedCity={selectedCity}
                              onCityChange={setSelectedCity}
                         />
                    </div>
               </div>

               {/* Full-Screen Map */}
               <div className="absolute inset-0">
                    <InteractiveMap
                         hotspots={allHotspots || []}
                         selectedCity={selectedCity}
                         selectedLayer={selectedLayer}
                         onHotspotClick={handleHotspotClick}
                         showLegend={false}
                    />
               </div>

               {/* Floating Widgets */}

               {/* Top-Left: Layers & Legend */}
               <FloatingPanel position="top-left" title="Map Layers & Legend" className="w-80 mt-16">
                    <LayerControlWithLegend
                         selectedLayer={selectedLayer}
                         onLayerChange={setSelectedLayer}
                    />
               </FloatingPanel>

               {/* Top-Right: Statistics */}
               <FloatingPanel position="top-right" title="Statistics" collapsible className="w-96 mt-16">
                    <StatisticsPanel selectedCity={selectedCity} />
               </FloatingPanel>

               {/* Right: Hotspot Details - Positioned below Statistics to avoid overlap */}
               {selectedHotspot && (
                    <FloatingPanel
                         key={selectedHotspot.id} // Force re-render when hotspot changes
                         position="right"
                         title={`Hotspot: ${selectedHotspot.name}`}
                         collapsible
                         defaultCollapsed={false}
                         onClose={() => setSelectedHotspot(null)}
                         className="w-96 top-[280px] max-h-[calc(100vh-300px)] overflow-y-auto"
                    >
                         <HotspotDetailsPanel
                              hotspot={selectedHotspot}
                              allHotspots={allHotspots || []}
                         />
                    </FloatingPanel>
               )}
          </div>
     );
}
