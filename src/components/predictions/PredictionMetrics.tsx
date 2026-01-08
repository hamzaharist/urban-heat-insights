import { TrendingUp, TrendingDown, Minus, Thermometer, Activity, CheckCircle2, Target } from 'lucide-react';

interface PredictionMetricsProps {
     peakTemp: number;
     avgIncrease: number;
     trend: 'rising' | 'stable' | 'falling';
     confidence: number;
     baselineTemp?: number;
     firstYearTemp?: number;
}

export function PredictionMetrics({ peakTemp, avgIncrease, trend, confidence, baselineTemp, firstYearTemp }: PredictionMetricsProps) {
     const getTrendIcon = () => {
          switch (trend) {
               case 'rising': return <TrendingUp className="w-5 h-5" />;
               case 'falling': return <TrendingDown className="w-5 h-5" />;
               default: return <Minus className="w-5 h-5" />;
          }
     };

     const getTrendColor = () => {
          switch (trend) {
               case 'rising': return 'text-red-500';
               case 'falling': return 'text-green-500';
               default: return 'text-yellow-500';
          }
     };

     // Calculate baseline change if both values are provided
     const baselineChange = baselineTemp && firstYearTemp ? firstYearTemp - baselineTemp : null;

     const metrics = [
          {
               icon: <Thermometer className="w-5 h-5" />,
               label: 'Peak Temperature',
               value: `${peakTemp.toFixed(1)}°C`,
               color: 'from-red-500/20 to-orange-500/20 border-red-500/30',
               iconColor: 'text-red-500',
          },
          {
               icon: <Activity className="w-5 h-5" />,
               label: 'Average Increase',
               value: avgIncrease >= 0 ? `+${avgIncrease.toFixed(1)}°C` : `${avgIncrease.toFixed(1)}°C`,
               color: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
               iconColor: 'text-orange-500',
          },
          {
               icon: getTrendIcon(),
               label: 'Trend Direction',
               value: trend.charAt(0).toUpperCase() + trend.slice(1),
               color: 'from-blue-500/20 to-purple-500/20 border-blue-500/30',
               iconColor: getTrendColor(),
          },
          {
               icon: <CheckCircle2 className="w-5 h-5" />,
               label: 'Model Confidence',
               value: `${(confidence * 100).toFixed(0)}%`,
               color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
               iconColor: 'text-green-500',
          },
     ];

     // Add baseline comparison if available
     if (baselineChange !== null) {
          metrics.push({
               icon: <Target className="w-5 h-5" />,
               label: 'Change from Baseline',
               value: baselineChange >= 0 ? `+${baselineChange.toFixed(1)}°C` : `${baselineChange.toFixed(1)}°C`,
               color: baselineChange >= 0
                    ? 'from-red-500/20 to-pink-500/20 border-red-500/30'
                    : 'from-green-500/20 to-teal-500/20 border-green-500/30',
               iconColor: baselineChange >= 0 ? 'text-red-500' : 'text-green-500',
          });
     }

     return (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${baselineChange !== null ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-6`}>
               {metrics.map((metric, index) => (
                    <div
                         key={index}
                         className={`relative overflow-hidden bg-gradient-to-br ${metric.color} backdrop-blur-md border rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in-50 slide-in-from-bottom-4`}
                         style={{ animationDelay: `${index * 100}ms` }}
                    >
                         <div className="flex items-start justify-between mb-2">
                              <div className={`${metric.iconColor}`}>
                                   {metric.icon}
                              </div>
                         </div>
                         <div className="space-y-1">
                              <p className="text-2xl font-bold text-foreground">
                                   {metric.value}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium">
                                   {metric.label}
                              </p>
                         </div>
                         {/* Decorative gradient overlay */}
                         <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
                    </div>
               ))}
          </div>
     );
}
