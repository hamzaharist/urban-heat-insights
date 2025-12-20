import React from "react";
import { TrendingUp, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { usePredictions } from "@/hooks/usePredictions";
import { useModelInsights } from "@/hooks/useModelInsights";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PredictionSectionProps {
  selectedCity: string;
}

const PredictionSection = ({ selectedCity }: PredictionSectionProps) => {
  const { data: predictions, isLoading, error } = usePredictions(selectedCity);
  const { data: modelInsights } = useModelInsights();

  // Aggregate predictions by year (average across all districts)
  const aggregatedData = React.useMemo(() => {
    if (!predictions || predictions.length === 0) return { years: [], temps: [] };

    // Group by year
    const yearGroups = predictions.reduce((acc, pred) => {
      if (!acc[pred.year]) {
        acc[pred.year] = [];
      }
      acc[pred.year].push(pred.predicted_temp);
      return acc;
    }, {} as Record<number, number[]>);

    // Calculate average for each year
    const years = Object.keys(yearGroups).map(Number).sort();
    const temps = years.map(year => {
      const yearTemps = yearGroups[year];
      return yearTemps.reduce((sum, temp) => sum + temp, 0) / yearTemps.length;
    });

    return { years, temps };
  }, [predictions]);

  // Extract data for visualization
  const predictionYears = aggregatedData.years;
  const temperatureData = aggregatedData.temps;

  // Calculate temperature range with padding for better visualization
  const dataMax = temperatureData.length > 0 ? Math.max(...temperatureData) : 40;
  const dataMin = temperatureData.length > 0 ? Math.min(...temperatureData) : 38;
  const maxTemp = Math.ceil(dataMax + 1); // Add 1°C padding at top
  const minTemp = Math.floor(dataMin - 1); // Add 1°C padding at bottom

  // Calculate temperature increase
  const tempIncrease = temperatureData.length >= 2
    ? (temperatureData[temperatureData.length - 1] - temperatureData[0]).toFixed(1)
    : '2.4';

  return (
    <section id="predictions-section" className="py-20 bg-muted/50">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Future Projections
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Anticipating Tomorrow's Heat Risks Today
          </h2>
          <p className="text-lg text-muted-foreground">
            Machine learning models project urban heat trends over the next decade,
            enabling proactive planning and targeted mitigation strategies.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Chart Area */}
          <div className="lg:col-span-3 bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Projected Peak LST Trend
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{predictionYears.length > 0 ? `${predictionYears[0]}-${predictionYears[predictionYears.length - 1]}` : '2025-2035'}</span>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading predictions...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load prediction data. Please try again later.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Chart Visualization */}
            {!isLoading && !error && temperatureData.length > 0 && (
              <div className="relative h-64 md:h-80">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-muted-foreground">
                  <span>{Math.ceil(maxTemp)}°C</span>
                  <span>{Math.ceil(maxTemp - (maxTemp - minTemp) * 0.25)}°C</span>
                  <span>{Math.ceil(maxTemp - (maxTemp - minTemp) * 0.5)}°C</span>
                  <span>{Math.ceil(maxTemp - (maxTemp - minTemp) * 0.75)}°C</span>
                  <span>{Math.floor(minTemp)}°C</span>
                </div>

                {/* Chart Area */}
                <div className="absolute left-14 right-0 top-0 bottom-8 border-l border-b border-border">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    {[0, 25, 50, 75, 100].map((pos) => (
                      <div
                        key={pos}
                        className="absolute w-full border-t border-border/50"
                        style={{ top: `${pos}%` }}
                      />
                    ))}
                  </div>

                  {/* Data points and line */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {/* Gradient area fill */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Area path */}
                    <path
                      d={`M ${temperatureData.map((temp, i) => {
                        const x = (i / (temperatureData.length - 1)) * 100;
                        const y = 100 - ((temp - minTemp) / (maxTemp - minTemp)) * 100;
                        return `${x} ${y}`;
                      }).join(' L ')} L 100 100 L 0 100 Z`}
                      fill="url(#areaGradient)"
                    />

                    {/* Line path */}
                    <path
                      d={`M ${temperatureData.map((temp, i) => {
                        const x = (i / (temperatureData.length - 1)) * 100;
                        const y = 100 - ((temp - minTemp) / (maxTemp - minTemp)) * 100;
                        return `${x} ${y}`;
                      }).join(' L ')}`}
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {/* Data point markers */}
                  {temperatureData.map((temp, i) => {
                    const x = (i / (temperatureData.length - 1)) * 100;
                    const y = 100 - ((temp - minTemp) / (maxTemp - minTemp)) * 100;
                    return (
                      <div
                        key={i}
                        className="absolute w-4 h-4 bg-accent rounded-full border-2 border-card shadow-lg transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer hover:scale-125 transition-transform"
                        style={{ left: `${x}%`, top: `${y}%` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="bg-foreground text-background text-xs rounded px-2 py-1 font-medium">
                            {temp.toFixed(1)}°C
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between text-xs text-muted-foreground">
                  {predictionYears.map((year) => (
                    <span key={year}>{year}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Trend indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <TrendingUp className="w-5 h-5 text-heat-hot" />
              <span className="text-sm text-muted-foreground">
                Projected increase: <span className="font-semibold text-foreground">+{tempIncrease}°C</span> by {predictionYears[predictionYears.length - 1] || 2035} under current trends
              </span>
            </div>
          </div>

          {/* Insights Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-card rounded-2xl p-6 shadow-card flex-1">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-heat-extreme/10 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-heat-extreme" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-2">
                    High-Risk Projection
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Without intervention, peak temperatures in urban cores could exceed
                    thermal comfort thresholds for extended periods by 2030.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-heat-warm to-heat-extreme rounded-full"
                        style={{ width: `${modelInsights?.riskProbability || 75}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-heat-extreme">
                      {modelInsights?.riskProbability || 75}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Risk probability</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card flex-1">
              <h4 className="font-display font-semibold text-foreground mb-4">
                Key Factors Driving Increase
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Urban Expansion</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${modelInsights?.keyFactors.urbanExpansion || 80}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {modelInsights?.keyFactors.urbanExpansion || 80}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vegetation Loss</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-eco rounded-full"
                        style={{ width: `${modelInsights?.keyFactors.vegetationLoss || 60}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {modelInsights?.keyFactors.vegetationLoss || 60}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Climate Baseline</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${modelInsights?.keyFactors.climateBaseline || 40}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {modelInsights?.keyFactors.climateBaseline || 40}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-eco/10 border border-eco/20 rounded-2xl p-6">
              <h4 className="font-display font-semibold text-eco mb-2">
                Mitigation Potential
              </h4>
              <p className="text-sm text-muted-foreground">
                Strategic greening interventions could reduce projected temperatures
                by <span className="font-semibold text-eco">1.5-2.5°C</span> in targeted zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PredictionSection;
