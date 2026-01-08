// Custom hook for fetching hotspot data
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HotspotData } from '@/types/weather';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Hook to fetch hotspots with toggle between ACTUAL data and AI PREDICTIONS
 * @param useAI - If true, uses ML predictions. If false, uses Supabase actual data.
 */
export function useAllHotspots(useAI: boolean = false) {
     return useQuery({
          queryKey: ['hotspots', useAI ? 'ai-predictions' : 'actual-data'],
          queryFn: async (): Promise<HotspotData[]> => {
               if (useAI) {
                    // Fetch AI predictions from ML model
                    const response = await fetch(`${API_BASE}/api/heatmap/predictions`);

                    if (!response.ok) {
                         throw new Error('Failed to fetch AI predictions');
                    }

                    const predictions = await response.json();

                    // Transform ML predictions to HotspotData format
                    return predictions.map((pred: any) => ({
                         id: pred.id,
                         name: pred.name,
                         city: pred.name.replace(' (AI Predicted)', ''),
                         district: pred.name.replace(' (AI Predicted)', ''),
                         latitude: pred.latitude,
                         longitude: pred.longitude,
                         temperature: pred.temperature,
                         intensity: pred.intensity as HotspotData['intensity'],
                         avg_ndvi: pred.ndvi,
                         avg_ndbi: pred.ndbi,
                    }));
               } else {
                    // Fetch actual data from Supabase
                    const { data, error } = await supabase
                         .from('hotspots')
                         .select('*')
                         .order('avg_temperature', { ascending: false });

                    if (error) throw error;

                    return (data || []).map((spot) => ({
                         id: spot.id,
                         name: spot.name,
                         city: spot.city,
                         district: spot.district,
                         latitude: spot.latitude,
                         longitude: spot.longitude,
                         temperature: spot.avg_temperature,
                         intensity: spot.intensity as HotspotData['intensity'],
                         avg_ndvi: spot.avg_ndvi,
                         avg_ndbi: spot.avg_ndbi,
                    }));
               }
          },
          staleTime: 5 * 60 * 1000,
          retry: 3,
     });
}

/**
 * Hook to fetch hotspots from Supabase filtered by city
 */
export function useHotspots(city: string = 'Kuala Lumpur') {
     return useQuery({
          queryKey: ['hotspots', city],
          queryFn: async (): Promise<HotspotData[]> => {
               const { data, error } = await supabase
                    .from('hotspots')
                    .select('*')
                    .eq('city', city)
                    .order('avg_temperature', { ascending: false });

               if (error) throw error;

               return (data || []).map((spot) => ({
                    id: spot.id,
                    name: spot.name,
                    city: spot.city,
                    district: spot.district,
                    latitude: spot.latitude,
                    longitude: spot.longitude,
                    temperature: spot.avg_temperature,
                    intensity: spot.intensity as HotspotData['intensity'],
                    avg_ndvi: spot.avg_ndvi,
                    avg_ndbi: spot.avg_ndbi,
               }));
          },
          staleTime: 15 * 60 * 1000, // 15 minutes
          retry: 3,
     });
}

/**
 * Hook to fetch and subscribe to real-time hotspot updates
 */
export function useHotspotsRealtime(city: string = 'Kuala Lumpur') {
     const query = useHotspots(city);

     // Set up real-time subscription
     // useEffect(() => {
     //   const channel = supabase
     //     .channel('hotspots-changes')
     //     .on(
     //       'postgres_changes',
     //       {
     //         event: '*',
     //         schema: 'public',
     //         table: 'hotspots',
     //         filter: `city=eq.${city}`,
     //       },
     //       () => {
     //         query.refetch();
     //       }
     //     )
     //     .subscribe();

     //   return () => {
     //     supabase.removeChannel(channel);
     //   };
     // }, [city, query]);

     return query;
}
