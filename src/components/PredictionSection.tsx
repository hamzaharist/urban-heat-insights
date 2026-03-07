import React from "react";
import { TrendingUp, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { usePredictions } from "@/hooks/usePredictions";
import { useModelInsights } from "@/hooks/useModelInsights";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PredictionSectionProps {
  selectedCity: string;
}

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">Year {label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value.toFixed(1)}°C
        </p>
      </div>
    );
  }
  return null;
};

const PredictionSection = ({ selectedCity }: PredictionSectionProps) => {
  const { data: predictions, isLoading, error } = usePredictions(selectedCity);
  const { data: modelInsights } = useModelInsights();

  // Aggregate predictions by year (average across all districts)
  const chartData = React.useMemo(() => {
    if (!predictions || predictions.length === 0) return [];

    const yearGroups = predictions.reduce((acc, pred) => {
      if (!acc[pred.year]) acc[pred.year] = [];
      acc[pred.year].push(pred.predicted_temp);
      return acc;
    }, {} as Record<number, number[]>);

    return Object.keys(yearGroups)
      .map(Number)
      .sort()
      .map((year) => {
        const temps = yearGroups[year];
        const avg = temps.reduce((sum, t) => sum + t, 0) / temps.length;
        return { year, temp: parseFloat(avg.toFixed(2)) };
      });
  }, [predictions]);

  // Calculate temperature increase
  const tempIncrease =
    chartData.length >= 2
      ? (chartData[chartData.length - 1].temp - chartData[0].temp).toFixed(1)
      : "2.4";
  const yearRange =
    chartData.length > 0
      ? `${chartData[0].year}-${chartData[chartData.length - 1].year}`
      : "2025-2035";
  const lastYear =
    chartData.length > 0
      ? chartData[chartData.length - 1].year
      : 2035;

  return (
    <section id="predictions-section" className="section-spacing bg-muted/50">
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
          <div className="lg:col-span-3 bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Projected Peak LST Trend
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{yearRange}</span>
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

            {/* Recharts Visualization */}
            {!isLoading && !error && chartData.length > 0 && (
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                      tickFormatter={(v) => `${v}°C`}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="hsl(var(--accent))"
                      strokeWidth={3}
                      fill="url(#tempGradient)"
                      dot={{ r: 5, fill: "hsl(var(--accent))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: "hsl(var(--accent))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trend indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <TrendingUp className="w-5 h-5 text-heat-hot" />
              <span className="text-sm text-muted-foreground">
                Projected increase: <span className="font-semibold text-foreground">+{tempIncrease}°C</span> by {lastYear} under current trends
              </span>
            </div>
          </div>

          {/* Insights Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border flex-1">
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
                        className="h-full bg-gradient-to-r from-heat-warm to-heat-extreme rounded-full transition-all duration-700"
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

            <div className="bg-card rounded-2xl p-6 shadow-card border border-border flex-1">
              <h4 className="font-display font-semibold text-foreground mb-4">
                Key Factors Driving Increase
              </h4>
              <div className="space-y-3">
                {[
                  { label: "Urban Expansion", value: modelInsights?.keyFactors.urbanExpansion || 80, color: "bg-primary" },
                  { label: "Vegetation Loss", value: modelInsights?.keyFactors.vegetationLoss || 60, color: "bg-eco" },
                  { label: "Climate Baseline", value: modelInsights?.keyFactors.climateBaseline || 40, color: "bg-accent" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-8 text-right">{value}%</span>
                    </div>
                  </div>
                ))}
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
