// Custom hook for fetching hotspot data
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HotspotData } from '@/types/weather';

/**
 * Hook to fetch ALL hotspots from Supabase (no city filter)
 */
export function useAllHotspots() {
     return useQuery({
          queryKey: ['hotspots', 'all'],
          queryFn: async (): Promise<HotspotData[]> => {
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
          },
          staleTime: 15 * 60 * 1000, // 15 minutes
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
