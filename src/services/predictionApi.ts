/**
 * ML Prediction API Service
 * Handles real-time ML-based temperature predictions with scenario adjustments
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface ScenarioPredictionRequest {
     city: string;
     year_range: [number, number];
     ndvi_adjustment: number;  // -1.0 to 1.0
     ndbi_adjustment: number;  // -1.0 to 1.0
     climate_factor: number;   // 0.9 to 1.1
}

export interface YearPrediction {
     year: number;
     temperature: number;
}

export interface PredictionMetrics {
     peak_temp: number;
     avg_increase: number;
     trend: 'rising' | 'stable' | 'falling';
     confidence: number;
}

export interface ScenarioPredictionResponse {
     predictions: YearPrediction[];
     metrics: PredictionMetrics;
}

/**
 * Get ML-based predictions for a scenario
 */
export async function predictScenario(
     request: ScenarioPredictionRequest
): Promise<ScenarioPredictionResponse> {
     try {
          const response = await fetch(`${API_BASE_URL}/api/predict-scenario`, {
               method: 'POST',
               headers: {
                    'Content-Type': 'application/json',
               },
               body: JSON.stringify(request),
          });

          if (!response.ok) {
               const error = await response.json();
               throw new Error(error.detail || 'Failed to get predictions');
          }

          return await response.json();
     } catch (error) {
          console.error('Prediction API error:', error);
          throw error;
     }
}
