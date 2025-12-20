/**
 * Mapbox Interactive Heat Map Component
 * Uses react-map-gl for reliable rendering
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, Layer, Source } from 'react-map-gl';
import type { HotspotData } from '@/types/weather';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxHeatMapProps {
     hotspots: HotspotData[];
}

export default function MapboxHeatMap({ hotspots }: MapboxHeatMapProps) {
     const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);
     const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

     if (!mapboxToken) {
          return (
               <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Mapbox token not configured</p>
               </div>
          );
     }

     // Create GeoJSON for heat layer
     const heatmapData = {
          type: 'FeatureCollection' as const,
          features: hotspots.map(h => ({
               type: 'Feature' as const,
               properties: {
                    temperature: h.temperature,
                    intensity: (h.temperature - 25) / 15, // Normalize 25-40°C to 0-1
               },
               geometry: {
                    type: 'Point' as const,
                    coordinates: [h.longitude, h.latitude],
               },
          })),
     };

     // Heat layer style
     const heatmapLayer = {
          id: 'heatmap-layer',
          type: 'heatmap' as const,
          source: 'hotspots',
          maxzoom: 15,
          paint: {
               // Increase weight as temperature increases
               'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
               // Increase intensity as zoom level increases
               'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
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
               'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 15, 40],
               // Transition from heatmap to circle layer
               'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0],
          },
     };

     const getMarkerColor = (intensity: string): string => {
          const colors: Record<string, string> = {
               extreme: '#dc2626',
               hot: '#ea580c',
               warm: '#f59e0b',
               mild: '#eab308',
               cool: '#22c55e',
          };
          return colors[intensity] || colors.mild;
     };

     return (
          <Map
               mapboxAccessToken={mapboxToken}
               initialViewState={{
                    longitude: 101.9758,
                    latitude: 4.2105,
                    zoom: 6,
               }}
               style={{ width: '100%', height: '100%' }}
               mapStyle="mapbox://styles/mapbox/dark-v11"
          >
               {/* Heat Layer */}
               <Source id="hotspots" type="geojson" data={heatmapData}>
                    <Layer {...heatmapLayer} />
               </Source>

               {/* Markers */}
               {hotspots.map((hotspot) => (
                    <Marker
                         key={hotspot.id}
                         longitude={hotspot.longitude}
                         latitude={hotspot.latitude}
                         anchor="center"
                         onClick={(e) => {
                              e.originalEvent.stopPropagation();
                              setSelectedHotspot(hotspot);
                         }}
                    >
                         <div className="relative cursor-pointer">
                              {/* Pulse ring */}
                              <div
                                   className="absolute inset-0 rounded-full animate-ping opacity-40"
                                   style={{
                                        backgroundColor: getMarkerColor(hotspot.intensity),
                                        width: '32px',
                                        height: '32px',
                                        marginLeft: '-4px',
                                        marginTop: '-4px',
                                   }}
                              />
                              {/* Main marker */}
                              <div
                                   className="relative w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                                   style={{ backgroundColor: getMarkerColor(hotspot.intensity) }}
                              >
                                   <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                         </div>
                    </Marker>
               ))}

               {/* Popup */}
               {selectedHotspot && (
                    <Popup
                         longitude={selectedHotspot.longitude}
                         latitude={selectedHotspot.latitude}
                         anchor="bottom"
                         onClose={() => setSelectedHotspot(null)}
                         closeButton={true}
                         closeOnClick={false}
                    >
                         <div className="p-2 min-w-[180px]">
                              <h3 className="font-bold text-sm mb-2">{selectedHotspot.name}</h3>
                              <div className="text-xs space-y-1">
                                   <p>
                                        <strong>Temperature:</strong>{' '}
                                        <span className="text-red-500 font-bold">
                                             {selectedHotspot.temperature.toFixed(1)}°C
                                        </span>
                                   </p>
                                   <p>
                                        <strong>Intensity:</strong>{' '}
                                        <span className="capitalize">{selectedHotspot.intensity}</span>
                                   </p>
                              </div>
                         </div>
                    </Popup>
               )}
          </Map>
     );
}
