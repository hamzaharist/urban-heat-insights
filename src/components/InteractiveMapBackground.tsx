/**
 * Interactive Heat Map with Gradient Overlay
 * Fixed version with proper container sizing
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { HotspotData } from '@/types/weather';

interface InteractiveMapWithMarkersProps {
     hotspots: HotspotData[];
     center?: [number, number];
     zoom?: number;
}

export default function InteractiveMapWithMarkers({
     hotspots,
     center = [4.2105, 101.9758],
     zoom = 6
}: InteractiveMapWithMarkersProps) {
     const mapRef = useRef<HTMLDivElement>(null);
     const mapInstanceRef = useRef<any>(null);
     const markersRef = useRef<any[]>([]);
     const heatLayerRef = useRef<any>(null);
     const [isMapReady, setIsMapReady] = useState(false);

     useEffect(() => {
          if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return;

          const initMap = async () => {
               try {
                    const L = (await import('leaflet')).default;
                    // @ts-ignore
                    await import('leaflet.heat');

                    // Fix default marker icons
                    delete (L.Icon.Default.prototype as any)._getIconUrl;
                    L.Icon.Default.mergeOptions({
                         iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                         iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                         shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    });

                    if (mapRef.current) {
                         // Create map
                         const map = L.map(mapRef.current, {
                              preferCanvas: true,
                              zoomControl: true,
                         }).setView(center, zoom);

                         // Dark map tiles
                         L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                              subdomains: 'abcd',
                              maxZoom: 20,
                              minZoom: 5,
                         }).addTo(map);

                         mapInstanceRef.current = map;

                         // Wait for tiles to load
                         map.whenReady(() => {
                              setTimeout(() => {
                                   map.invalidateSize();
                                   setIsMapReady(true);
                              }, 100);
                         });

                         // Create heat layer data
                         const heatData = hotspots.map(h => {
                              const intensity = Math.min(1, Math.max(0, (h.temperature - 25) / 15));
                              return [h.latitude, h.longitude, intensity];
                         });

                         // Add heat layer
                         // @ts-ignore
                         if (L.heatLayer) {
                              // @ts-ignore
                              const heatLayer = L.heatLayer(heatData, {
                                   radius: 50,
                                   blur: 40,
                                   maxZoom: 13,
                                   max: 1.0,
                                   gradient: {
                                        0.0: '#0000ff',
                                        0.3: '#00ffff',
                                        0.5: '#00ff00',
                                        0.7: '#ffff00',
                                        0.9: '#ff0000',
                                   }
                              }).addTo(map);
                              heatLayerRef.current = heatLayer;
                         }

                         // Add markers
                         hotspots.forEach((hotspot) => {
                              const color = getIntensityColor(hotspot.intensity);

                              const icon = L.divIcon({
                                   className: 'custom-hotspot-marker',
                                   html: `
                <div style="position: relative;">
                  <div style="
                    position: absolute;
                    background-color: ${color};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    margin-left: -4px;
                    margin-top: -4px;
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                    opacity: 0.4;
                  "></div>
                  <div style="
                    position: relative;
                    background-color: ${color};
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <div style="
                      width: 8px;
                      height: 8px;
                      background-color: white;
                      border-radius: 50%;
                    "></div>
                  </div>
                </div>
              `,
                                   iconSize: [24, 24],
                                   iconAnchor: [12, 12],
                                   popupAnchor: [0, -12],
                              });

                              const marker = L.marker([hotspot.latitude, hotspot.longitude], { icon })
                                   .addTo(map);

                              marker.bindPopup(`
              <div style="padding: 8px; min-width: 180px; background: #1a1a1a; color: white; border-radius: 8px;">
                <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">${hotspot.name}</h3>
                <div style="font-size: 13px;">
                  <p style="margin: 3px 0;">
                    <strong>Temperature:</strong> 
                    <span style="color: #ff4444; font-weight: bold;">${hotspot.temperature.toFixed(1)}°C</span>
                  </p>
                  <p style="margin: 3px 0;">
                    <strong>Intensity:</strong> 
                    <span style="text-transform: capitalize;">${getIntensityLabel(hotspot.intensity)}</span>
                  </p>
                </div>
              </div>
            `);

                              markersRef.current.push(marker);
                         });

                         // Fit bounds
                         if (hotspots.length > 0) {
                              const bounds = L.latLngBounds(hotspots.map(h => [h.latitude, h.longitude]));
                              map.fitBounds(bounds, { padding: [50, 50] });
                         }
                    }
               } catch (error) {
                    console.error('Map initialization error:', error);
               }
          };

          // Delay initialization slightly
          const timer = setTimeout(initMap, 100);
          return () => clearTimeout(timer);
     }, [hotspots, center, zoom]);

     // Cleanup
     useEffect(() => {
          return () => {
               if (heatLayerRef.current) {
                    heatLayerRef.current.remove();
               }
               markersRef.current.forEach(marker => marker.remove());
               markersRef.current = [];
               if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
               }
          };
     }, []);

     return (
          <div
               ref={mapRef}
               style={{
                    width: '100%',
                    height: 600,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
               }}
          />
     );
}

// Helper functions
function getIntensityColor(intensity: string): string {
     const colors: Record<string, string> = {
          extreme: '#dc2626',
          hot: '#ea580c',
          warm: '#f59e0b',
          mild: '#eab308',
          cool: '#22c55e',
     };
     return colors[intensity] || colors.mild;
}

function getIntensityLabel(intensity: string): string {
     const labels: Record<string, string> = {
          extreme: 'Extreme Heat',
          hot: 'High Heat',
          warm: 'Moderate Heat',
          mild: 'Mild Heat',
          cool: 'Cool',
     };
     return labels[intensity] || 'Unknown';
}
