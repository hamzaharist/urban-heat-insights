import { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Source, Layer, MapRef, Popup } from 'react-map-gl';
import type { FillLayer } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { useStateHeatmap } from '@/hooks/useStateHeatmap';
import { useDistrictHeatmap } from '@/hooks/useDistrictHeatmap';
import { Loader2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Create a diagonal stripe pattern image
const createStripePattern = (): HTMLCanvasElement => {
     const size = 16;
     const canvas = document.createElement('canvas');
     canvas.width = size;
     canvas.height = size;
     const ctx = canvas.getContext('2d')!;

     // Transparent background
     ctx.clearRect(0, 0, size, size);

     // Draw diagonal stripes
     ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)'; // slate color
     ctx.lineWidth = 2;

     // Draw multiple diagonal lines
     for (let i = -size; i < size * 2; i += 6) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + size, size);
          ctx.stroke();
     }

     return canvas;
};

interface ChoroplethMapProps {
     level: 'states' | 'districts';
     onHoverChange?: (data: any) => void;
     onLocationClick?: (data: any) => void;
     highlightedDistrict?: string | null;
     temperatureFilter?: [number, number];
}

export function ChoroplethMap({ level, onHoverChange, onLocationClick, highlightedDistrict, temperatureFilter = [20, 45] }: ChoroplethMapProps) {
     const { data: statesData, isLoading: isLoadingStates } = useStateHeatmap();
     const { data: districtsData, isLoading: isLoadingDistricts } = useDistrictHeatmap();

     const [hoveredFeature, setHoveredFeature] = useState<any>(null);
     const [selectedFeature, setSelectedFeature] = useState<any>(null);
     const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
     const [stripePatternReady, setStripePatternReady] = useState(false);
     const [popupInfo, setPopupInfo] = useState<{ longitude: number; latitude: number; name: string; temp: number } | null>(null);
     const mapRef = useRef<MapRef>(null);

     // Add stripe pattern to map
     const addStripePattern = useCallback((map: mapboxgl.Map) => {
          if (map.hasImage('stripe-pattern')) {
               setStripePatternReady(true);
               return;
          }

          const canvas = createStripePattern();
          const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);

          map.addImage('stripe-pattern', {
               width: canvas.width,
               height: canvas.height,
               data: imageData.data
          });
          setStripePatternReady(true);
     }, []);

     const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

     const data = level === 'states' ? statesData : districtsData;
     const isLoading = level === 'states' ? isLoadingStates : isLoadingDistricts;

     // Update feature state when selection changes
     useEffect(() => {
          const map = mapRef.current?.getMap();
          if (!map || !data?.features || !mapStyleLoaded) return;

          try {
               // Check if style is actually loaded
               if (!map.isStyleLoaded()) return;

               // Clear previous selection
               data.features.forEach((feature: any) => {
                    map.setFeatureState(
                         { source: level, id: feature.id },
                         { selected: false }
                    );
               });

               // Set new selection
               if (selectedFeature) {
                    map.setFeatureState(
                         { source: level, id: selectedFeature.id },
                         { selected: true }
                    );
               }
          } catch (error) {
               // Feature state error - non-critical
          }
     }, [selectedFeature, level, data, mapStyleLoaded]);

     // Sync external highlightedDistrict with internal selection AND fly to it
     useEffect(() => {
          if (!highlightedDistrict || !data?.features) {
               setSelectedFeature(null);
               setPopupInfo(null); // Clear popup
               return;
          }

          // Find the feature matching the highlighted district name
          const feature = data.features.find((f: any) => {
               const name = f.properties?.name || f.properties?.district_name || f.properties?.state_name;
               return name === highlightedDistrict;
          });

          if (feature) {
               setSelectedFeature(feature);

               // Fly to the selected district with smooth animation
               const map = mapRef.current?.getMap();
               if (map && map.isStyleLoaded() && feature.geometry) {
                    try {
                         // Calculate the center of the feature (simple bbox center)
                         const bounds = new mapboxgl.LngLatBounds();

                         // Handle different geometry types
                         if (feature.geometry.type === 'Polygon') {
                              feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
                                   bounds.extend(coord);
                              });
                         } else if (feature.geometry.type === 'MultiPolygon') {
                              feature.geometry.coordinates.forEach((polygon: any) => {
                                   polygon[0].forEach((coord: [number, number]) => {
                                        bounds.extend(coord);
                                   });
                              });
                         }

                         // Get center coordinates for popup
                         const center = bounds.getCenter();
                         const props = feature.properties as any;
                         const districtName = props?.district_name || props?.name || props?.state_name || 'Unknown';
                         const temperature = props?.avg_temperature || 0;

                         setPopupInfo({
                              longitude: center.lng,
                              latitude: center.lat,
                              name: districtName,
                              temp: temperature
                         });

                         // Fly to the bounding box with padding
                         map.fitBounds(bounds, {
                              padding: { top: 100, bottom: 100, left: 100, right: 100 },
                              duration: 1500, // 1.5 seconds smooth animation
                              essential: true,
                              maxZoom: 10 // Don't zoom in too close
                         });

                    } catch (error) {
                         // Fly-to error - non-critical
                    }
               }
          }
     }, [highlightedDistrict, data, mapStyleLoaded]);

     // Clear selection when switching between states/districts
     useEffect(() => {
          setSelectedFeature(null);
          setMapStyleLoaded(false);
     }, [level]);

     if (!mapboxToken) {
          return (
               <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Mapbox token not configured</p>
               </div>
          );
     }

     if (isLoading) {
          return (
               <div className="flex items-center justify-center h-full bg-background">
                    <div className="flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 animate-spin text-primary" />
                         <p className="text-sm text-muted-foreground">Loading {level} data...</p>
                    </div>
               </div>
          );
     }

     if (!data || !data.features || data.features.length === 0) {
          return (
               <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">No {level} data available</p>
               </div>
          );
     }

     // Always use baseline temperature
     const temperatureProperty = 'avg_temperature';

     // Ensure all features have numeric temperature values
     const enrichedData = {
          ...data,
          type: 'FeatureCollection' as const,
          features: data.features.map((feature: any) => {
               const temp = feature.properties?.avg_temperature;
               return {
                    ...feature,
                    properties: {
                         ...feature.properties,
                         avg_temperature: typeof temp === 'number' ? temp : null
                    }
               };
          })
     };

     // Create fill layer with data-driven colors and temperature filter
     const [minTemp, maxTemp] = temperatureFilter;

     const fillLayer: FillLayer = {
          id: `${level}-fill`,
          type: 'fill',
          source: level,
          paint: {
               'fill-color': [
                    'case',
                    // No data: distinct lighter color visible against dark map
                    ['==', ['coalesce', ['get', 'avg_temperature'], 0], 0],
                    '#94a3b8',     // light slate for no-data (clearly distinguishable)
                    // Outside filter range: gray out
                    ['any',
                         ['<', ['get', 'avg_temperature'], minTemp],
                         ['>', ['get', 'avg_temperature'], maxTemp]
                    ],
                    '#475569',     // darker slate for filtered out regions
                    // Temperature color ramp for valid data within filter range
                    ['interpolate',
                         ['linear'],
                         ['get', 'avg_temperature'],
                         24, '#14b8a6',    // teal - coolest
                         26, '#10b981',    // green
                         28, '#22c55e',
                         30, '#84cc16',    // lime
                         32, '#eab308',    // yellow
                         34, '#f59e0b',    // amber
                         36, '#f97316',    // orange
                         38, '#dc2626',    // red
                         40, '#991b1b',
                         42, '#7f1d1d',    // dark red - hottest
                    ]],
               'fill-opacity': [
                    'case',
                    // Outside filter range: lower opacity
                    ['any',
                         ['==', ['coalesce', ['get', 'avg_temperature'], 0], 0],
                         ['<', ['get', 'avg_temperature'], minTemp],
                         ['>', ['get', 'avg_temperature'], maxTemp]
                    ],
                    0.3,
                    ['boolean', ['feature-state', 'selected'], false],
                    0.9,  // Higher opacity for selected
                    ['boolean', ['feature-state', 'hover'], false],
                    0.8,
                    0.7
               ],
          },
     };

     const lineLayer: FillLayer['type'] extends 'fill' ? any : never = {
          id: `${level}-line`,
          type: 'line',
          source: level,
          paint: {
               'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    '#FFD700',  // Gold border for selected
                    '#fff'  // White border otherwise
               ],
               'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    3,  // Thick border for selected
                    ['boolean', ['feature-state', 'hover'], false],
                    2,
                    0.5
               ],
          },
     };

     // Stripe pattern overlay for filtered-out regions
     const stripeLayer: FillLayer = {
          id: `${level}-stripes`,
          type: 'fill',
          source: level,
          paint: {
               'fill-pattern': 'stripe-pattern',
               'fill-opacity': [
                    'case',
                    // Only show stripes for regions outside filter range (with valid data)
                    ['all',
                         ['!=', ['coalesce', ['get', 'avg_temperature'], 0], 0],
                         ['any',
                              ['<', ['get', 'avg_temperature'], minTemp],
                              ['>', ['get', 'avg_temperature'], maxTemp]
                         ]
                    ],
                    0.5,
                    0  // Hide stripes for regions within filter range or no data
               ],
          },
     };

     const onHover = (event: any) => {
          const feature = event.features?.[0];
          if (feature) {
               setHoveredFeature(feature);

               // Notify parent component of hover data
               if (onHoverChange && feature.properties) {
                    onHoverChange(feature.properties);
               }
          } else {
               setHoveredFeature(null);
               if (onHoverChange) {
                    onHoverChange(null);
               }
          }
     };

     const onClick = (event: any) => {
          const feature = event.features?.[0];
          if (feature && onLocationClick && feature.properties) {
               setSelectedFeature(feature);
               onLocationClick(feature.properties);
          }
     };

     return (
          <Map
               ref={mapRef}
               mapboxAccessToken={mapboxToken}
               initialViewState={{
                    longitude: 101.9758,
                    latitude: 4.2105,
                    zoom: level === 'states' ? 6 : 7,
               }}
               style={{ width: '100%', height: '100%' }}
               mapStyle="mapbox://styles/mapbox/dark-v11"
               interactiveLayerIds={[`${level}-fill`]}
               onMouseMove={onHover}
               onMouseLeave={() => {
                    setHoveredFeature(null);
                    if (onHoverChange) {
                         onHoverChange(null);
                    }
               }}
               onClick={onClick}
               onLoad={() => {
                    setMapStyleLoaded(true);
                    const map = mapRef.current?.getMap();
                    if (map) {
                         addStripePattern(map);
                    }
               }}
               key={level}
          >
               <Source id={level} type="geojson" data={enrichedData}>
                    <Layer {...fillLayer} />
                    {stripePatternReady && <Layer {...stripeLayer} />}
                    <Layer {...lineLayer} />
               </Source>

               {/* Show popup for selected district */}
               {popupInfo && (
                    <Popup
                         longitude={popupInfo.longitude}
                         latitude={popupInfo.latitude}
                         anchor="bottom"
                         onClose={() => setPopupInfo(null)}
                         closeButton={false}
                         className="district-popup"
                    >
                         <div className="backdrop-blur-xl bg-gradient-to-br from-black/50 to-black/30 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
                              {/* Header Section */}
                              <div className="px-3 pt-3 pb-1.5">
                                   <div className="flex items-center gap-1.5 mb-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50"></div>
                                        <span className="text-[10px] font-medium text-teal-400 uppercase tracking-wider">
                                             Selected
                                        </span>
                                   </div>
                                   <h3 className="text-base font-bold text-white">
                                        {popupInfo.name}
                                   </h3>
                              </div>

                              {/* Temperature Display - Compact */}
                              <div className="px-3 py-3 bg-gradient-to-br from-white/5 to-transparent">
                                   <div className="text-center">
                                        <div className="text-[9px] font-medium text-white/60 uppercase tracking-wider mb-1">
                                             Average Temp
                                        </div>
                                        <div className="flex items-baseline justify-center gap-1.5">
                                             <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                                                  {popupInfo.temp.toFixed(1)}
                                             </span>
                                             <span className="text-lg font-semibold text-white/80">°C</span>
                                        </div>
                                   </div>
                              </div>

                              {/* Subtle bottom accent */}
                              <div className="h-0.5 bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-orange-500/20"></div>
                         </div>
                    </Popup>
               )}
          </Map>
     );
}
