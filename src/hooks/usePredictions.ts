// Custom hook for fetching prediction data
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PredictionData } from '@/types/weather';

/**
 * Hook to fetch temperature predictions from Supabase
 */
export function usePredictions(city: string = 'Kuala Lumpur', yearRange?: [number, number]) {
     return useQuery({
          queryKey: ['predictions', city, yearRange],
          queryFn: async (): Promise<PredictionData[]> => {
               let query = supabase
                    .from('predictions')
                    .select('*')
                    .like('city', `${city}%`)  // Changed from .eq to .like to match "Kuala Lumpur - District"
                    .order('year', { ascending: true });

               // Filter by year range if provided
               if (yearRange) {
                    query = query.gte('year', yearRange[0]).lte('year', yearRange[1]);
               }

               const { data, error } = await query;

               if (error) throw error;

               return (data || []).map((pred) => ({
                    id: pred.id,
                    city: pred.city,
                    year: pred.year,
                    predicted_temp: pred.predicted_temp,
                    confidence: pred.confidence_level || 94,
                    createdAt: pred.created_at,
               }));
          },
          staleTime: 60 * 60 * 1000, // 1 hour (predictions don't change often)
          retry: 3,
     });
}
