/**
 * Hook for ML-based scenario predictions
 * Calls the backend ML API when scenario parameters change
 */

import { useQuery } from '@tanstack/react-query';
import { predictScenario, type ScenarioPredictionRequest, type ScenarioPredictionResponse } from '@/services/predictionApi';

interface UseMLPredictionsOptions {
     city: string;
     yearRange: [number, number];
     scenarioAdjustment?: {
          ndbi: number;
          ndvi: number;
          climate: number;
     };
     enabled?: boolean;
}

export function useMLPredictions({
     city,
     yearRange,
     scenarioAdjustment,
     enabled = true,
}: UseMLPredictionsOptions) {
     return useQuery<ScenarioPredictionResponse>({
          queryKey: ['ml-predictions', city, yearRange, scenarioAdjustment],
          queryFn: async () => {
               const request: ScenarioPredictionRequest = {
                    city,
                    year_range: yearRange,
                    ndvi_adjustment: scenarioAdjustment?.ndvi || 0,
                    ndbi_adjustment: scenarioAdjustment?.ndbi || 0,
                    climate_factor: 1 + (scenarioAdjustment?.climate || 0),
               };

               return await predictScenario(request);
          },
          enabled: enabled && !!scenarioAdjustment,
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 2,
     });
}
