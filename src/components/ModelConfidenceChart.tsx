import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface ValidationDataPoint {
     district: string;
     actual_temp: number;
     predicted_temp: number;
     error: number;
}

interface ModelConfidenceChartProps {
     data: ValidationDataPoint[];
     r2_score: number;
     rmse: number;
     mae: number;
     sampleSize: number;
}

export const ModelConfidenceChart = ({ data, r2_score, rmse, mae, sampleSize }: ModelConfidenceChartProps) => {
     // Transform data for scatter plot
     const chartData = data.map(d => ({
          ...d,
          // Size based on error (larger = bigger error)
          size: Math.max(20, d.error * 10),
          // Color intensity based on error
          errorCategory: d.error < 1 ? 'low' : d.error < 2 ? 'medium' : 'high'
     }));

     // Calculate min/max for axes
     const allTemps = [...data.map(d => d.actual_temp), ...data.map(d => d.predicted_temp)];
     const minTemp = Math.floor(Math.min(...allTemps)) - 1;
     const maxTemp = Math.ceil(Math.max(...allTemps)) + 1;

     return (
          <div className="space-y-6">
               {/* Metrics Cards */}
               <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                         <div className="text-sm text-blue-600 font-medium mb-1">R² Score</div>
                         <div className="text-3xl font-bold text-blue-900">{(r2_score * 100).toFixed(1)}%</div>
                         <div className="text-xs text-blue-600 mt-1">Model Accuracy</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                         <div className="text-sm text-purple-600 font-medium mb-1">RMSE</div>
                         <div className="text-3xl font-bold text-purple-900">{rmse.toFixed(2)}°C</div>
                         <div className="text-xs text-purple-600 mt-1">Root Mean Square Error</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                         <div className="text-sm text-emerald-600 font-medium mb-1">MAE</div>
                         <div className="text-3xl font-bold text-emerald-900">{mae.toFixed(2)}°C</div>
                         <div className="text-xs text-emerald-600 mt-1">Mean Absolute Error</div>
                    </Card>
               </div>

               {/* Scatter Plot */}
               <Card className="p-6">
                    <div className="mb-4">
                         <h3 className="text-lg font-semibold text-slate-900">Predicted vs Actual Temperature</h3>
                         <p className="text-sm text-slate-600">
                              Each point represents a district. Points closer to the diagonal line indicate better predictions.
                         </p>
                    </div>

                    <ResponsiveContainer width="100%" height={400}>
                         <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis
                                   type="number"
                                   dataKey="actual_temp"
                                   name="Actual Temperature"
                                   domain={[minTemp, maxTemp]}
                                   label={{ value: 'Actual Temperature (°C)', position: 'bottom', offset: 0 }}
                                   stroke="#64748b"
                              />
                              <YAxis
                                   type="number"
                                   dataKey="predicted_temp"
                                   name="Predicted Temperature"
                                   domain={[minTemp, maxTemp]}
                                   label={{ value: 'Predicted Temperature (°C)', angle: -90, position: 'left', offset: 0 }}
                                   stroke="#64748b"
                              />
                              <ZAxis type="number" dataKey="size" range={[20, 200]} />
                              <Tooltip
                                   cursor={{ strokeDasharray: '3 3' }}
                                   content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                             const data = payload[0].payload;
                                             return (
                                                  <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                                                       <p className="font-semibold text-slate-900">{data.district}</p>
                                                       <p className="text-sm text-slate-600">Actual: {data.actual_temp}°C</p>
                                                       <p className="text-sm text-slate-600">Predicted: {data.predicted_temp}°C</p>
                                                       <p className="text-sm font-medium text-red-600">Error: {data.error.toFixed(2)}°C</p>
                                                  </div>
                                             );
                                        }
                                        return null;
                                   }}
                              />
                              <Legend />

                              {/* Perfect prediction line (diagonal) */}
                              <ReferenceLine
                                   segment={[{ x: minTemp, y: minTemp }, { x: maxTemp, y: maxTemp }]}
                                   stroke="#94a3b8"
                                   strokeWidth={2}
                                   strokeDasharray="5 5"
                                   label={{ value: 'Perfect Prediction', position: 'top', fill: '#64748b' }}
                              />

                              {/* Scatter points colored by error */}
                              <Scatter
                                   name="Districts"
                                   data={chartData}
                                   fill="#3b82f6"
                                   fillOpacity={0.6}
                                   stroke="#2563eb"
                                   strokeWidth={1}
                              />
                         </ScatterChart>
                    </ResponsiveContainer>

                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                         <p className="text-sm text-slate-700">
                              <strong>Sample Size:</strong> {sampleSize} districts analyzed •
                              <strong className="ml-2">Interpretation:</strong> Points near the diagonal line indicate accurate predictions.
                              The scatter shows our model performs consistently across different temperature ranges.
                         </p>
                    </div>
               </Card>
          </div>
     );
};
