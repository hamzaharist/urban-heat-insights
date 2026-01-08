import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface StateFeature {
     type: 'Feature';
     id: string;
     properties: {
          name: string;
          state: string;
          state_id?: string;
          avg_temperature?: number;
          min_temperature?: number;
          max_temperature?: number;
          hotspot_count?: number;
          avg_ndvi?: number;
          avg_ndbi?: number;
     };
     geometry: any;
}

interface StateGeoJSON {
     type: 'FeatureCollection';
     features: StateFeature[];
}

export function useStateHeatmap() {
     return useQuery<StateGeoJSON>({
          queryKey: ['state-heatmap'],
          queryFn: async () => {
               const response = await fetch(`${API_BASE}/api/geojson/states?enrich=true`);
               if (!response.ok) {
                    throw new Error('Failed to fetch state data');
               }
               return response.json();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 2,
     });
}

export type { StateFeature, StateGeoJSON };
