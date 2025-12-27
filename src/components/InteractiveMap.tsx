/**
 * Interactive Mapbox Map Component
 * Following official Mapbox GL JS with React pattern
 * Uses useRef and useEffect (not react-map-gl)
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { HotspotData } from '@/types/weather';
import type { LayerType } from '@/components/heatmap/LayerControl';
import { getLSTIntensity } from '@/utils/temperature';

interface InteractiveMapProps {
     hotspots: HotspotData[];
     selectedCity?: string;
     selectedLayer?: LayerType;
     onHotspotClick?: (hotspot: HotspotData) => void;
     showLegend?: boolean;
}

// City center coordinates for zoom
const CITY_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
     'Kuala Lumpur': { center: [101.6869, 3.1390], zoom: 11 },
     'Johor Bahru': { center: [103.7414, 1.4927], zoom: 11 },
     'Penang': { center: [100.3327, 5.4164], zoom: 11 },
};

export default function InteractiveMap({ hotspots, selectedCity, selectedLayer = 'temperature', onHotspotClick, showLegend = true }: InteractiveMapProps) {
     const mapContainer = useRef<HTMLDivElement>(null);
     const map = useRef<mapboxgl.Map | null>(null);
     const [mapLoaded, setMapLoaded] = useState(false);

     const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

     // Initialize map
     useEffect(() => {
          if (!mapContainer.current || map.current) return;

          if (!mapboxToken) {
               console.error('Mapbox token not found');
               return;
          }

          mapboxgl.accessToken = mapboxToken;

          // Create map instance
          map.current = new mapboxgl.Map({
               container: mapContainer.current,
               style: 'mapbox://styles/mapbox/dark-v11',
               center: [101.9758, 4.2105], // Malaysia center
               zoom: 6,
          });

          // Add navigation controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

          map.current.on('load', () => {
               setMapLoaded(true);
          });

          // Cleanup
          return () => {
               if (map.current) {
                    map.current.remove();
                    map.current = null;
               }
          };
     }, [mapboxToken]);

     // Zoom to selected city when it changes
     useEffect(() => {
          if (!map.current || !mapLoaded || !selectedCity) return;

          const cityConfig = CITY_CENTERS[selectedCity];
          if (cityConfig) {
               map.current.flyTo({
                    center: cityConfig.center,
                    zoom: cityConfig.zoom,
                    duration: 1500,
                    essential: true,
               });
          }
     }, [selectedCity, mapLoaded]);

     // Add hotspot markers and heat layer
     useEffect(() => {
          if (!map.current || !mapLoaded || !hotspots || hotspots.length === 0) return;

          // Create GeoJSON from hotspots
          const geojsonData: GeoJSON.FeatureCollection = {
               type: 'FeatureCollection',
               features: hotspots.map(h => ({
                    type: 'Feature',
                    properties: {
                         name: h.name,
                         temperature: h.temperature,
                         intensity: getLSTIntensity(h.temperature), // Dynamic LST calc
                         avg_ndvi: h.avg_ndvi,
                         avg_ndbi: h.avg_ndbi,
                    },
                    geometry: {
                         type: 'Point',
                         coordinates: [h.longitude, h.latitude],
                    },
               })),
          };

          // Add hotspots source
          if (!map.current.getSource('hotspots')) {
               map.current.addSource('hotspots', {
                    type: 'geojson',
                    data: geojsonData,
               });
          } else {
               (map.current.getSource('hotspots') as mapboxgl.GeoJSONSource).setData(geojsonData);
          }

          // Add heatmap layer
          if (!map.current.getLayer('hotspots-heat')) {
               map.current.addLayer({
                    id: 'hotspots-heat',
                    type: 'heatmap',
                    source: 'hotspots',
                    maxzoom: 15,
                    paint: {
                         // Increase weight as temperature increases
                         'heatmap-weight': [
                              'interpolate',
                              ['linear'],
                              ['get', 'temperature'],
                              25, 0,
                              40, 1
                         ],
                         // Color ramp: blue -> cyan -> green -> yellow -> red
                         'heatmap-color': [
                              'interpolate',
                              ['linear'],
                              ['heatmap-density'],
                              0, 'rgba(0, 0, 255, 0)',
                              0.2, 'rgb(0, 0, 255)',
                              0.4, 'rgb(0, 255, 255)',
                              0.6, 'rgb(0, 255, 0)',
                              0.8, 'rgb(255, 255, 0)',
                              1, 'rgb(255, 0, 0)',
                         ],
                         // Adjust radius by zoom level
                         'heatmap-radius': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              0, 20,
                              15, 40
                         ],
                         // Transition from heatmap to circle layer
                         'heatmap-opacity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              7, 1,
                              15, 0
                         ],
                    },
               });
          }

          // Add circle layer for individual points
          if (!map.current.getLayer('hotspots-point')) {
               map.current.addLayer({
                    id: 'hotspots-point',
                    type: 'circle',
                    source: 'hotspots',
                    minzoom: 5, // Changed from 7 to 5 for earlier visibility
                    paint: {
                         // Size circles by zoom level - larger sizes for better visibility
                         'circle-radius': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              5, 6,   // Bigger at zoom 5
                              7, 8,   // Bigger at zoom 7
                              10, 12, // Bigger at zoom 10
                              15, 16  // Bigger at zoom 15
                         ],
                         // Color circles by intensity
                         'circle-color': [
                              'match',
                              ['get', 'intensity'],
                              'extreme', '#dc2626',
                              'critical', '#dc2626', // Alias for extreme
                              'hot', '#ea580c',
                              'high', '#ea580c',     // Alias for hot
                              'warm', '#f59e0b',
                              'medium', '#f59e0b',   // Alias for warm
                              'mild', '#eab308',
                              'cool', '#22c55e',
                              'low', '#22c55e',      // Alias for cool
                              '#eab308' // default
                         ],
                         'circle-stroke-color': '#ffffff',
                         'circle-stroke-width': 2,
                         'circle-opacity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              5, 0.8,  // More visible at zoom 5
                              7, 0.9,  // More visible at zoom 7
                              15, 1    // Fully visible at zoom 15
                         ],
                    },
               });
          }

          // ========== NDVI LAYERS (Vegetation) ==========

          // Add NDVI heatmap layer
          if (!map.current.getLayer('ndvi-heat')) {
               map.current.addLayer({
                    id: 'ndvi-heat',
                    type: 'heatmap',
                    source: 'hotspots',
                    maxzoom: 15,
                    layout: {
                         visibility: 'none' // Hidden by default
                    },
                    paint: {
                         'heatmap-weight': [
                              'interpolate',
                              ['linear'],
                              ['coalesce', ['get', 'avg_ndvi'], 0],
                              -1, 0,
                              1, 1
                         ],
                         'heatmap-intensity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              0, 1,
                              15, 3
                         ],
                         // Green color ramp for vegetation
                         'heatmap-color': [
                              'interpolate',
                              ['linear'],
                              ['heatmap-density'],
                              0, 'rgba(139, 69, 19, 0)',      // Transparent brown
                              0.2, 'rgb(139, 69, 19)',         // Brown (barren)
                              0.4, 'rgb(255, 255, 0)',         // Yellow (sparse)
                              0.6, 'rgb(144, 238, 144)',       // Light green (moderate)
                              0.8, 'rgb(34, 139, 34)',         // Green (dense)
                              1, 'rgb(0, 100, 0)',             // Dark green (very dense)
                         ],
                         'heatmap-radius': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              0, 20,
                              15, 40
                         ],
                         'heatmap-opacity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              7, 1,
                              15, 0
                         ],
                    },
               });
          }

          // Add NDVI circle layer
          if (!map.current.getLayer('ndvi-point')) {
               map.current.addLayer({
                    id: 'ndvi-point',
                    type: 'circle',
                    source: 'hotspots',
                    minzoom: 5,
                    layout: {
                         visibility: 'none' // Hidden by default
                    },
                    paint: {
                         'circle-radius': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              5, 6,
                              7, 8,
                              10, 12,
                              15, 16
                         ],
                         // Color by NDVI - 4 clear categories like temperature
                         'circle-color': [
                              'step',
                              ['coalesce', ['get', 'avg_ndvi'], 0],
                              '#8B4513',      // Brown: Very sparse (< 0.12)
                              0.12, '#FFD700',  // Gold: Sparse (0.12-0.18)
                              0.18, '#9ACD32',  // Yellow-green: Moderate (0.18-0.24)
                              0.24, '#228B22'   // Forest green: Good (>= 0.24)
                         ],
                         'circle-stroke-color': '#ffffff',
                         'circle-stroke-width': 2,
                         'circle-opacity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              5, 0.8,
                              7, 0.9,
                              15, 1
                         ],
                    },
               });
          }

          // ========== NDBI LAYERS (Built-up) ==========

          // Add NDBI heatmap layer
          if (!map.current.getLayer('ndbi-heat')) {
               map.current.addLayer({
                    id: 'ndbi-heat',
                    type: 'heatmap',
                    source: 'hotspots',
                    maxzoom: 15,
                    layout: {
                         visibility: 'none' // Hidden by default
                    },
                    paint: {
                         'heatmap-weight': [
                              'interpolate',
                              ['linear'],
                              ['coalesce', ['get', 'avg_ndbi'], 0],
                              -1, 0,
                              1, 1
                         ],
                         'heatmap-intensity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              0, 1,
                              15, 3
                         ],
                         // Gray color ramp for built-up areas
                         'heatmap-color': [
                              'interpolate',
                              ['linear'],
                              ['heatmap-density'],
                              0, 'rgba(0, 100, 255, 0)',       // Transparent blue
                              0.2, 'rgb(0, 100, 255)',         // Blue (natural)
                              0.4, 'rgb(135, 206, 250)',       // Light blue (low urban)
                              0.6, 'rgb(169, 169, 169)',       // Gray (moderate urban)
                              0.8, 'rgb(105, 105, 105)',       // Dark gray (high urban)
                              1, 'rgb(64, 64, 64)',            // Very dark gray (dense urban)
                         ],
                         'heatmap-radius': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              0, 20,
                              15, 40
                         ],
                         'heatmap-opacity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              7, 1,
                              15, 0
                         ],
                    },
               });
          }

          // Add NDBI circle layer
          if (!map.current.getLayer('ndbi-point')) {
               map.current.addLayer({
                    id: 'ndbi-point',
                    type: 'circle',
                    source: 'hotspots',
                    minzoom: 5,
                    layout: {
                         visibility: 'none' // Hidden by default
                    },
                    paint: {
                         'circle-radius': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              5, 6,
                              7, 8,
                              10, 12,
                              15, 16
                         ],
                         // Color by NDBI - 4 clear categories like temperature
                         'circle-color': [
                              'step',
                              ['coalesce', ['get', 'avg_ndbi'], 0],
                              '#0064FF',      // Blue: Natural (< -0.08)
                              -0.08, '#87CEEB',  // Light blue: Low urban (-0.08 to -0.04)
                              -0.04, '#A9A9A9',  // Gray: Moderate urban (-0.04 to 0.0)
                              0.0, '#696969'     // Dark gray: High urban (>= 0.0)
                         ],
                         'circle-stroke-color': '#ffffff',
                         'circle-stroke-width': 2,
                         'circle-opacity': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              5, 0.8,
                              7, 0.9,
                              15, 1
                         ],
                    },
               });
          }

          // Add click handler to show hotspot details
          map.current.on('click', 'hotspots-point', (e) => {
               if (!e.features || !e.features[0]) return;

               const feature = e.features[0];
               const { name, temperature, intensity } = feature.properties as {
                    name: string;
                    temperature: number;
                    intensity: string;
               };

               // Find the full hotspot data from the hotspots array
               const clickedHotspot = hotspots.find(h =>
                    h.name === name && h.temperature === temperature
               );

               if (clickedHotspot && onHotspotClick) {
                    onHotspotClick(clickedHotspot);
               }
          });

          // Change cursor on hover
          map.current.on('mouseenter', 'hotspots-point', () => {
               if (map.current) {
                    map.current.getCanvas().style.cursor = 'pointer';
               }
          });

          map.current.on('mouseleave', 'hotspots-point', () => {
               if (map.current) {
                    map.current.getCanvas().style.cursor = '';
               }
          });

          // Add click handlers for NDVI and NDBI layers
          ['ndvi-point', 'ndbi-point'].forEach(layerId => {
               map.current!.on('click', layerId, (e) => {
                    if (!e.features || !e.features[0]) return;

                    const feature = e.features[0];
                    const { name, temperature } = feature.properties as {
                         name: string;
                         temperature: number;
                    };

                    const clickedHotspot = hotspots.find(h =>
                         h.name === name && h.temperature === temperature
                    );

                    if (clickedHotspot && onHotspotClick) {
                         onHotspotClick(clickedHotspot);
                    }
               });

               map.current!.on('mouseenter', layerId, () => {
                    if (map.current) {
                         map.current.getCanvas().style.cursor = 'pointer';
                    }
               });

               map.current!.on('mouseleave', layerId, () => {
                    if (map.current) {
                         map.current.getCanvas().style.cursor = '';
                    }
               });
          });

     }, [mapLoaded, hotspots]);

     // Handle layer switching
     useEffect(() => {
          if (!map.current || !mapLoaded) return;

          // Update layer visibility based on selected layer
          const layers = {
               temperature: ['hotspots-heat', 'hotspots-point'],
               ndvi: ['ndvi-heat', 'ndvi-point'],
               ndbi: ['ndbi-heat', 'ndbi-point'],
          };

          // Hide all layers first
          Object.values(layers).flat().forEach(layerId => {
               if (map.current!.getLayer(layerId)) {
                    map.current!.setLayoutProperty(layerId, 'visibility', 'none');
               }
          });

          // Show selected layer
          layers[selectedLayer].forEach(layerId => {
               if (map.current!.getLayer(layerId)) {
                    map.current!.setLayoutProperty(layerId, 'visibility', 'visible');
               }
          });

     }, [mapLoaded, selectedLayer]);

     if (!mapboxToken) {
          return (
               <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Mapbox token not configured</p>
               </div>
          );
     }

     return (
          <div className="relative w-full h-full">
               <div
                    ref={mapContainer}
                    className="w-full h-full"
                    style={{ minHeight: '500px' }}
               />

               {/* Glassmorphism Legend - Only show if showLegend is true */}
               {showLegend && (
                    <div className="absolute bottom-8 left-8 bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-white/10">
                         <div className="flex items-center gap-2 mb-4">
                              <div className="w-1 h-6 bg-gradient-to-b from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                              <h4 className="text-sm font-bold text-white">Heat Intensity</h4>
                         </div>
                         <div className="space-y-2.5">
                              <div className="flex items-center gap-3 group">
                                   <div className="w-3 h-3 rounded-full border border-white/50 shadow-lg animate-pulse" style={{ backgroundColor: '#dc2626' }}></div>
                                   <span className="text-xs text-white/90 font-medium">Critical <span className="text-white/60">≥35°C</span></span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-3 h-3 rounded-full border border-white/50 shadow-lg" style={{ backgroundColor: '#ea580c' }}></div>
                                   <span className="text-xs text-white/90 font-medium">High <span className="text-white/60">32-35°C</span></span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-3 h-3 rounded-full border border-white/50 shadow-lg" style={{ backgroundColor: '#f59e0b' }}></div>
                                   <span className="text-xs text-white/90 font-medium">Medium <span className="text-white/60">29-32°C</span></span>
                              </div>
                              <div className="flex items-center gap-3 group">
                                   <div className="w-3 h-3 rounded-full border border-white/50 shadow-lg" style={{ backgroundColor: '#22c55e' }}></div>
                                   <span className="text-xs text-white/90 font-medium">Low <span className="text-white/60">&lt;29°C</span></span>
                              </div>
                         </div>
                    </div>
               )}

               {/* CSS for marker animations */}
               <style>{`
                    @keyframes marker-pulse {
                         0%, 100% {
                              opacity: 1;
                              transform: scale(1);
                         }
                         50% {
                              opacity: 0.7;
                              transform: scale(1.1);
                         }
                    }
                    
                    @keyframes ripple {
                         0% {
                              opacity: 0.6;
                              transform: scale(1);
                         }
                         100% {
                              opacity: 0;
                              transform: scale(3);
                         }
                    }
                    
                    .mapboxgl-marker {
                         animation: marker-pulse 2s ease-in-out infinite;
                    }
                    
                    /* Ripple effect for markers */
                    .mapboxgl-marker::before {
                         content: '';
                         position: absolute;
                         top: 50%;
                         left: 50%;
                         width: 100%;
                         height: 100%;
                         border-radius: 50%;
                         border: 2px solid currentColor;
                         transform: translate(-50%, -50%);
                         animation: ripple 2s ease-out infinite;
                    }
                    
                    .mapboxgl-marker::after {
                         content: '';
                         position: absolute;
                         top: 50%;
                         left: 50%;
                         width: 100%;
                         height: 100%;
                         border-radius: 50%;
                         border: 2px solid currentColor;
                         transform: translate(-50%, -50%);
                         animation: ripple 2s ease-out infinite 1s;
                    }
               `}</style>
          </div>
     );
}
