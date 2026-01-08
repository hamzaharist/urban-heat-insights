import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface DistrictFeature {
     type: 'Feature';
     id: string;
     properties: {
          name: string;
          state?: string;
          code_state?: string;
          state_name?: string;
          state_code?: string;
          avg_temperature?: number;
          min_temperature?: number;
          max_temperature?: number;
          hotspot_count?: number;
          avg_ndvi?: number;
          avg_ndbi?: number;
     };
     geometry: any;
}

interface DistrictGeoJSON {
     type: 'FeatureCollection';
     features: DistrictFeature[];
}

export function useDistrictHeatmap() {
     return useQuery<DistrictGeoJSON>({
          queryKey: ['district-heatmap'],
          queryFn: async () => {
               const response = await fetch(`${API_BASE}/api/geojson/districts?enrich=true`);
               if (!response.ok) {
                    throw new Error('Failed to fetch district data');
               }
               return response.json();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 2,
     });
}

export type { DistrictFeature, DistrictGeoJSON };
