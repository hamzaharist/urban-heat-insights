// Custom hook to fetch ML model insights
import { useQuery } from '@tanstack/react-query';

interface ModelInsights {
     keyFactors: {
          urbanExpansion: number;
          vegetationLoss: number;
          climateBaseline: number;
          historicalPatterns: number;
     };
     riskProbability: number;
     modelPerformance: {
          r2Score: number;
          confidence: number;
     };
}

/**
 * Hook to fetch ML model insights (feature importance, risk metrics)
 */
export function useModelInsights() {
     return useQuery({
          queryKey: ['model-insights'],
          queryFn: async (): Promise<ModelInsights> => {
               const response = await fetch('/environmental_trends.json');
               if (!response.ok) {
                    throw new Error('Failed to fetch model insights');
               }
               return response.json();
          },
          staleTime: Infinity, // Environmental trends don't change unless recalculated
          retry: 1,
     });
}
