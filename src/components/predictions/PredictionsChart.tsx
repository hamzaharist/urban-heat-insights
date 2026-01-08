import React from 'react';
import {
     LineChart,
     Line,
     Area,
     XAxis,
     YAxis,
     CartesianGrid,
     Tooltip,
     Legend,
     ResponsiveContainer,
     ComposedChart,
} from 'recharts';
import { usePredictions } from '@/hooks/usePredictions';
import type { ScenarioPredictionResponse } from '@/services/predictionApi';

interface PredictionsChartProps {
     selectedCity: string;
     yearRange?: [number, number];
     scenarioAdjustment?: {
          ndbi: number;
          ndvi: number;
          climate: number;
     };
     mlPredictions?: ScenarioPredictionResponse;
}

export function PredictionsChart({
     selectedCity,
     yearRange = [2026, 2030],
     scenarioAdjustment,
     mlPredictions,
}: PredictionsChartProps) {
     const { data: predictions, isLoading } = usePredictions(selectedCity, yearRange);

     // Group by year and calculate average - MUST be before early returns
     const yearlyData = React.useMemo(() => {
          // If ML predictions are available, use them
          if (mlPredictions) {
               // Use the baseline temperature from the metrics
               const baselineTemp = mlPredictions.metrics.baseline_temp;

               return mlPredictions.predictions.map(pred => ({
                    year: pred.year,
                    temperature: pred.temperature,
                    baseline: baselineTemp, // Use actual baseline from database
                    confidence: mlPredictions.metrics.confidence,
                    upperBound: pred.temperature + 2,
                    lowerBound: pred.temperature - 2,
               }));
          }

          // Otherwise use database predictions
          if (!predictions || predictions.length === 0) {
               return [];
          }

          const grouped = predictions.reduce((acc, pred) => {
               if (!acc[pred.year]) {
                    acc[pred.year] = {
                         temps: [],
                         confidences: [],
                    };
               }
               acc[pred.year].temps.push(pred.predicted_temp);
               acc[pred.year].confidences.push(pred.confidence);
               return acc;
          }, {} as Record<number, { temps: number[]; confidences: number[] }>);

          return Object.entries(grouped)
               .map(([year, data]) => ({
                    year: parseInt(year),
                    temperature: data.temps.reduce((a, b) => a + b, 0) / data.temps.length,
                    confidence: data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length,
               }))
               .filter(item => item.year >= yearRange[0] && item.year <= yearRange[1])
               .sort((a, b) => a.year - b.year)
               .map(item => {
                    const avgTemp = item.temperature;
                    const avgConfidence = item.confidence / 100;
                    let adjustedTemp = avgTemp;

                    // Apply scenario adjustments (only if no ML predictions)
                    if (scenarioAdjustment) {
                         const urbanImpact = scenarioAdjustment.ndbi * 0.35;
                         const vegImpact = scenarioAdjustment.ndvi * 0.30;
                         const climateImpact = scenarioAdjustment.climate * 0.25;
                         adjustedTemp = avgTemp + urbanImpact + vegImpact + climateImpact;
                    }

                    // Calculate confidence interval
                    const margin = (1 - avgConfidence) * 2;

                    return {
                         year: item.year,
                         temperature: parseFloat(adjustedTemp.toFixed(2)),
                         baseline: parseFloat(avgTemp.toFixed(2)),
                         confidence: parseFloat((avgConfidence * 100).toFixed(1)),
                         upperBound: parseFloat((adjustedTemp + margin).toFixed(2)),
                         lowerBound: parseFloat((adjustedTemp - margin).toFixed(2)),
                    };
               });
     }, [predictions, yearRange, scenarioAdjustment, mlPredictions]);

     if (isLoading) {
          return (
               <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                         <p className="text-muted-foreground">Loading predictions...</p>
                    </div>
               </div>
          );
     }

     if (yearlyData.length === 0) {
          return (
               <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No predictions available for {selectedCity}</p>
               </div>
          );
     }

     const CustomTooltip = ({ active, payload }: any) => {
          if (active && payload && payload.length) {
               const data = payload[0].payload;
               return (
                    <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-lg">
                         <p className="font-semibold text-foreground mb-2">{data.year}</p>
                         <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between gap-4">
                                   <span className="text-muted-foreground">Temperature:</span>
                                   <span className="font-semibold text-heat-extreme">{data.temperature}°C</span>
                              </div>
                              {data.baseline !== undefined && data.baseline !== data.temperature && (
                                   <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">Baseline:</span>
                                        <span className="font-medium text-muted-foreground">{data.baseline}°C</span>
                                   </div>
                              )}
                              <div className="flex items-center justify-between gap-4">
                                   <span className="text-muted-foreground">Confidence:</span>
                                   <span className="font-medium text-primary">{data.confidence}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs">
                                   <span className="text-muted-foreground">Range:</span>
                                   <span className="text-muted-foreground">
                                        {data.lowerBound}°C - {data.upperBound}°C
                                   </span>
                              </div>
                         </div>
                    </div>
               );
          }
          return null;
     };

     return (
          <ResponsiveContainer width="100%" height="100%">
               <ComposedChart
                    data={yearlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
               >
                    <defs>
                         <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                         </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />

                    <XAxis
                         dataKey="year"
                         stroke="hsl(var(--muted-foreground))"
                         tick={{ fill: 'hsl(var(--muted-foreground))' }}
                         tickLine={{ stroke: 'hsl(var(--border))' }}
                    />

                    <YAxis
                         stroke="hsl(var(--muted-foreground))"
                         tick={{ fill: 'hsl(var(--muted-foreground))' }}
                         tickLine={{ stroke: 'hsl(var(--border))' }}
                         label={{
                              value: 'Temperature (°C)',
                              angle: -90,
                              position: 'insideLeft',
                              style: { fill: 'hsl(var(--muted-foreground))' },
                         }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Legend
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="line"
                    />

                    {/* Confidence interval area */}
                    <Area
                         type="monotone"
                         dataKey="upperBound"
                         stroke="none"
                         fill="url(#confidenceGradient)"
                         fillOpacity={0.4}
                         name="Confidence Range"
                    />
                    <Area
                         type="monotone"
                         dataKey="lowerBound"
                         stroke="none"
                         fill="url(#confidenceGradient)"
                         fillOpacity={0.4}
                    />

                    {/* Baseline line (if scenario adjustment is active) */}
                    {scenarioAdjustment && (
                         <Line
                              type="monotone"
                              dataKey="baseline"
                              stroke="hsl(var(--muted-foreground))"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                              name="Baseline"
                         />
                    )}

                    {/* Main temperature line */}
                    <Line
                         type="monotone"
                         dataKey="temperature"
                         stroke="hsl(var(--heat-extreme))"
                         strokeWidth={3}
                         dot={{ fill: 'hsl(var(--heat-extreme))', r: 5 }}
                         activeDot={{ r: 7 }}
                         name={scenarioAdjustment ? 'Adjusted Temperature' : 'Predicted Temperature'}
                    />
               </ComposedChart>
          </ResponsiveContainer>
     );
}
