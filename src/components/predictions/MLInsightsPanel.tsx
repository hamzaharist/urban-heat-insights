import { Brain, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface MLInsightsPanelProps {
     selectedCity: string;
}

interface EnvironmentalTrends {
     keyFactors: {
          urbanExpansion: number;
          vegetationLoss: number;
          climateBaseline: number;
     };
     riskProbability: number;
}

export function MLInsightsPanel({ selectedCity }: MLInsightsPanelProps) {
     const { data: trends } = useQuery<EnvironmentalTrends>({
          queryKey: ['environmental-trends'],
          queryFn: async () => {
               const response = await fetch('/environmental_trends.json');
               return response.json();
          },
          staleTime: Infinity,
     });

     const modelMetrics = {
          type: 'Gradient Boosting',
          r2Score: 0.621,
          mae: 3.29,
     };

     const confidenceLevels = [
          { year: 2026, confidence: 92 },
          { year: 2027, confidence: 84 },
          { year: 2028, confidence: 76 },
          { year: 2029, confidence: 68 },
          { year: 2030, confidence: 60 },
     ];

     return (
          <div className="space-y-4">
               <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                         ML Insights
                    </span>
               </div>

               {/* Model Info */}
               <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                    <div className="text-sm font-semibold text-foreground">Model Information</div>
                    <div className="space-y-1 text-xs">
                         <div className="flex justify-between">
                              <span className="text-muted-foreground">Type</span>
                              <span className="font-medium text-foreground">{modelMetrics.type}</span>
                         </div>
                         <div className="flex justify-between">
                              <span className="text-muted-foreground">R² Score</span>
                              <span className="font-medium text-primary">{modelMetrics.r2Score.toFixed(3)}</span>
                         </div>
                         <div className="flex justify-between">
                              <span className="text-muted-foreground">MAE</span>
                              <span className="font-medium text-primary">{modelMetrics.mae}°C</span>
                         </div>
                    </div>
               </div>

               {/* Risk Probability */}
               {trends && (
                    <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                         <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-heat-extreme" />
                              <span className="text-sm font-semibold text-foreground">Risk Probability</span>
                         </div>
                         <div className="text-center py-2">
                              <div className="text-3xl font-display font-bold text-heat-extreme">
                                   {trends.riskProbability}%
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                   High heat risk probability
                              </div>
                         </div>
                    </div>
               )}

               {/* Key Factors */}
               {trends && (
                    <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                         <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">Key Factors</span>
                         </div>
                         <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                   <span className="text-xs text-muted-foreground">Urban Expansion</span>
                                   <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                             <div
                                                  className="h-full bg-primary"
                                                  style={{ width: `${trends.keyFactors.urbanExpansion}%` }}
                                             />
                                        </div>
                                        <span className="text-xs font-semibold text-primary w-8 text-right">
                                             {trends.keyFactors.urbanExpansion}%
                                        </span>
                                   </div>
                              </div>
                              <div className="flex items-center justify-between">
                                   <span className="text-xs text-muted-foreground">Vegetation Loss</span>
                                   <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                             <div
                                                  className="h-full bg-eco"
                                                  style={{ width: `${trends.keyFactors.vegetationLoss}%` }}
                                             />
                                        </div>
                                        <span className="text-xs font-semibold text-eco w-8 text-right">
                                             {trends.keyFactors.vegetationLoss}%
                                        </span>
                                   </div>
                              </div>
                              <div className="flex items-center justify-between">
                                   <span className="text-xs text-muted-foreground">Climate Baseline</span>
                                   <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                             <div
                                                  className="h-full bg-heat-extreme"
                                                  style={{ width: `${trends.keyFactors.climateBaseline}%` }}
                                             />
                                        </div>
                                        <span className="text-xs font-semibold text-heat-extreme w-8 text-right">
                                             {trends.keyFactors.climateBaseline}%
                                        </span>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}

               {/* Confidence Levels */}
               <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                         <AlertCircle className="w-4 h-4 text-primary" />
                         <span className="text-sm font-semibold text-foreground">Confidence by Year</span>
                    </div>
                    <div className="space-y-1">
                         {confidenceLevels.map((level) => (
                              <div key={level.year} className="flex items-center justify-between text-xs">
                                   <span className="text-muted-foreground">{level.year}</span>
                                   <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                             <div
                                                  className="h-full bg-primary"
                                                  style={{ width: `${level.confidence}%` }}
                                             />
                                        </div>
                                        <span className="font-medium text-foreground w-8 text-right">
                                             {level.confidence}%
                                        </span>
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>
          </div>
     );
}
