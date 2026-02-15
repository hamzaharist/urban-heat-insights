import { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp } from 'lucide-react';
import { ModelConfidenceChart } from './ModelConfidenceChart';

interface ValidationDataPoint {
     district: string;
     actual_temp: number;
     predicted_temp: number;
     error: number;
}

interface ModelValidationResponse {
     validation_data: ValidationDataPoint[];
     metrics: {
          r2_score: number;
          rmse: number;
          mae: number;
          sample_size: number;
     };
     model_info: {
          model_type: string;
          training_r2: number;
          training_rmse: number;
     };
}

interface ModelConfidenceModalProps {
     isOpen: boolean;
     onClose: () => void;
}

export const ModelConfidenceModal = ({ isOpen, onClose }: ModelConfidenceModalProps) => {
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [data, setData] = useState<ModelValidationResponse | null>(null);

     useEffect(() => {
          if (isOpen) {
               fetchValidationData();
          }
     }, [isOpen]);

     const fetchValidationData = async () => {
          setLoading(true);
          setError(null);

          try {
               const response = await fetch('http://localhost:8000/api/spatial/model-validation');

               if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
               }

               const result = await response.json();

               if (result.error) {
                    throw new Error(result.error);
               }

               setData(result);
          } catch (err) {
               setError(err instanceof Error ? err.message : 'Failed to load validation data');
               console.error('Error fetching validation data:', err);
          } finally {
               setLoading(false);
          }
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                              <TrendingUp className="w-6 h-6" />
                              <div>
                                   <h2 className="text-2xl font-bold">Model Confidence Analysis</h2>
                                   <p className="text-sm text-blue-100">Validating prediction accuracy against real data</p>
                              </div>
                         </div>
                         <button
                              onClick={onClose}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                              aria-label="Close modal"
                         >
                              <X className="w-6 h-6" />
                         </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                         {loading && (
                              <div className="flex flex-col items-center justify-center py-20">
                                   <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                                   <p className="text-slate-600">Loading validation data...</p>
                              </div>
                         )}

                         {error && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                   <p className="text-red-800 font-semibold mb-2">Failed to Load Data</p>
                                   <p className="text-red-600 text-sm">{error}</p>
                                   <button
                                        onClick={fetchValidationData}
                                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                   >
                                        Retry
                                   </button>
                              </div>
                         )}

                         {data && !loading && !error && (
                              <div className="space-y-6">
                                   {/* Explanation */}
                                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-blue-900 mb-2">📊 What is this showing?</h3>
                                        <p className="text-sm text-blue-800">
                                             This chart compares our Random Forest model's temperature predictions against actual observed temperatures
                                             from {data.metrics.sample_size} districts. Points close to the diagonal line indicate accurate predictions.
                                             An R² score of <strong>{(data.metrics.r2_score * 100).toFixed(1)}%</strong> means our model explains
                                             {' '}{(data.metrics.r2_score * 100).toFixed(1)}% of the temperature variance!
                                        </p>
                                   </div>

                                   {/* Chart */}
                                   <ModelConfidenceChart
                                        data={data.validation_data}
                                        r2_score={data.metrics.r2_score}
                                        rmse={data.metrics.rmse}
                                        mae={data.metrics.mae}
                                        sampleSize={data.metrics.sample_size}
                                   />

                                   {/* Model Info */}
                                   <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-slate-900 mb-2">🤖 Model Information</h3>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                             <div>
                                                  <span className="text-slate-600">Model Type:</span>
                                                  <p className="font-semibold text-slate-900">{data.model_info.model_type}</p>
                                             </div>
                                             <div>
                                                  <span className="text-slate-600">Training R²:</span>
                                                  <p className="font-semibold text-slate-900">{(data.model_info.training_r2 * 100).toFixed(2)}%</p>
                                             </div>
                                             <div>
                                                  <span className="text-slate-600">Training RMSE:</span>
                                                  <p className="font-semibold text-slate-900">{data.model_info.training_rmse}°C</p>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};
