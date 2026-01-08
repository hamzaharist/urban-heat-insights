import React, { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import {
  TreeDeciduous,
  Building2,
  CloudSun,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Info,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { DynamicHeatmap } from './DynamicHeatmap';
import type { ScenarioPredictionResponse } from '@/services/predictionApi';

interface InteractiveScenarioBuilderProps {
  selectedCity: string;
  yearRange: [number, number];
  scenarioAdjustment: {
    ndbi: number;
    ndvi: number;
    climate: number;
  };
  onScenarioChange: (adjustment: { ndbi: number; ndvi: number; climate: number }) => void;
  mlPredictions?: ScenarioPredictionResponse;
  baselineTemp?: number;
  viewMode?: 'states' | 'districts';
}

interface ImpactIndicator {
  factor: string;
  icon: React.ReactNode;
  value: number;
  impact: string;
  color: string;
  description: string;
}

export function InteractiveScenarioBuilder({
  selectedCity,
  yearRange,
  scenarioAdjustment,
  onScenarioChange,
  mlPredictions,
  baselineTemp,
  viewMode = 'districts',
}: InteractiveScenarioBuilderProps) {

  // Calculate real-time impact metrics
  const impactMetrics = useMemo(() => {
    const urbanImpact = scenarioAdjustment.ndbi * 0.35;
    const vegImpact = scenarioAdjustment.ndvi * 0.30;
    const climateImpact = scenarioAdjustment.climate * 0.25;
    const totalImpact = urbanImpact + vegImpact + climateImpact;

    return {
      urbanImpact,
      vegImpact,
      climateImpact,
      totalImpact,
      projectedChange: totalImpact,
    };
  }, [scenarioAdjustment]);

  // Impact indicators with real-time calculations
  const indicators: ImpactIndicator[] = [
    {
      factor: 'Urban Development',
      icon: <Building2 className="w-5 h-5" />,
      value: scenarioAdjustment.ndbi,
      impact: impactMetrics.urbanImpact >= 0
        ? `+${impactMetrics.urbanImpact.toFixed(2)}°C`
        : `${impactMetrics.urbanImpact.toFixed(2)}°C`,
      color: scenarioAdjustment.ndbi > 0
        ? 'from-orange-500/20 to-red-500/20 border-orange-500/40'
        : scenarioAdjustment.ndbi < 0
        ? 'from-blue-500/20 to-cyan-500/20 border-blue-500/40'
        : 'from-gray-500/20 to-slate-500/20 border-gray-500/40',
      description: scenarioAdjustment.ndbi > 0
        ? 'Increased urbanization raises temperatures'
        : scenarioAdjustment.ndbi < 0
        ? 'Reduced urban sprawl helps cooling'
        : 'No change in urban development',
    },
    {
      factor: 'Vegetation Cover',
      icon: <TreeDeciduous className="w-5 h-5" />,
      value: scenarioAdjustment.ndvi,
      impact: impactMetrics.vegImpact >= 0
        ? `+${impactMetrics.vegImpact.toFixed(2)}°C`
        : `${impactMetrics.vegImpact.toFixed(2)}°C`,
      color: scenarioAdjustment.ndvi > 0
        ? 'from-green-500/20 to-emerald-500/20 border-green-500/40'
        : scenarioAdjustment.ndvi < 0
        ? 'from-red-500/20 to-orange-500/20 border-red-500/40'
        : 'from-gray-500/20 to-slate-500/20 border-gray-500/40',
      description: scenarioAdjustment.ndvi > 0
        ? 'More vegetation provides natural cooling'
        : scenarioAdjustment.ndvi < 0
        ? 'Vegetation loss increases heat'
        : 'No change in vegetation cover',
    },
    {
      factor: 'Climate Change',
      icon: <CloudSun className="w-5 h-5" />,
      value: scenarioAdjustment.climate,
      impact: impactMetrics.climateImpact >= 0
        ? `+${impactMetrics.climateImpact.toFixed(2)}°C`
        : `${impactMetrics.climateImpact.toFixed(2)}°C`,
      color: scenarioAdjustment.climate > 0
        ? 'from-red-500/20 to-pink-500/20 border-red-500/40'
        : scenarioAdjustment.climate < 0
        ? 'from-green-500/20 to-teal-500/20 border-green-500/40'
        : 'from-gray-500/20 to-slate-500/20 border-gray-500/40',
      description: scenarioAdjustment.climate > 0
        ? 'Accelerated warming scenario'
        : scenarioAdjustment.climate < 0
        ? 'Mitigation scenario (slower warming)'
        : 'Baseline climate projection',
    },
  ];

  const handleReset = () => {
    onScenarioChange({ ndbi: 0, ndvi: 0, climate: 0 });
  };

  const isModified = scenarioAdjustment.ndbi !== 0 ||
                     scenarioAdjustment.ndvi !== 0 ||
                     scenarioAdjustment.climate !== 0;

  return (
    <div className="space-y-6">
      {/* Header with Total Impact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-md border border-border/30 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Interactive Scenario Builder</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Adjust factors below to see real-time impact on future temperatures
            </p>
          </div>
          {isModified && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-background/80 hover:bg-background border border-border rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        {/* Total Impact Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-4 transition-all duration-500 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg transition-all duration-300">
                <Thermometer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Temperature Impact</p>
                <p className={`text-2xl font-bold transition-all duration-500 ${
                  impactMetrics.totalImpact > 0 ? 'text-red-500' :
                  impactMetrics.totalImpact < 0 ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {impactMetrics.totalImpact >= 0 ? '+' : ''}{impactMetrics.totalImpact.toFixed(2)}°C
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-4 transition-all duration-500 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg transition-all duration-300">
                {impactMetrics.totalImpact >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-accent transition-transform duration-300" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-green-500 transition-transform duration-300" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected by {yearRange[1]}</p>
                <p className="text-2xl font-bold text-foreground transition-all duration-500">
                  {baselineTemp && mlPredictions
                    ? (mlPredictions.predictions[mlPredictions.predictions.length - 1]?.temperature || 0).toFixed(1)
                    : '--'
                  }°C
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-4 transition-all duration-500 hover:scale-[1.02] animate-in fade-in-50 slide-in-from-bottom-2" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg transition-all duration-300">
                <Info className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Baseline Temperature</p>
                <p className="text-2xl font-bold text-foreground transition-all duration-500">
                  {baselineTemp ? baselineTemp.toFixed(1) : '--'}°C
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {indicators.map((indicator, index) => (
          <Card
            key={indicator.factor}
            className={`relative overflow-hidden bg-gradient-to-br ${indicator.color} backdrop-blur-md border p-6 transition-all duration-300`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  indicator.value > 0 ? 'bg-red-500/20' :
                  indicator.value < 0 ? 'bg-green-500/20' :
                  'bg-gray-500/20'
                }`}>
                  {indicator.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{indicator.factor}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{indicator.description}</p>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Adjustment</span>
                <span className="text-sm font-semibold text-foreground">
                  {indicator.value > 0 ? '+' : ''}{indicator.value.toFixed(2)}
                </span>
              </div>
              <div className="py-2">
                <Slider
                  value={[indicator.value]}
                  onValueChange={([value]) => {
                    console.log('Slider changed:', indicator.factor, value);
                    if (indicator.factor === 'Urban Development') {
                      onScenarioChange({ ...scenarioAdjustment, ndbi: value });
                    } else if (indicator.factor === 'Vegetation Cover') {
                      onScenarioChange({ ...scenarioAdjustment, ndvi: value });
                    } else if (indicator.factor === 'Climate Change') {
                      onScenarioChange({ ...scenarioAdjustment, climate: value });
                    }
                  }}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-full cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-1.0</span>
                <span>0</span>
                <span>+1.0</span>
              </div>
            </div>

            {/* Impact Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              parseFloat(indicator.impact) > 0
                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                : parseFloat(indicator.impact) < 0
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
            }`}>
              <Thermometer className="w-4 h-4" />
              {indicator.impact}
            </div>

            {/* Decorative gradient */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
          </Card>
        ))}
      </div>

      {/* Dynamic Temperature Impact Map */}
      <Card className="bg-card/30 backdrop-blur-md border-border/30 p-6 shadow-2xl">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-foreground mb-1">
            Temperature Impact Map
          </h4>
          <p className="text-sm text-muted-foreground">
            {isModified
              ? 'Showing adjusted LST based on your scenario'
              : 'Baseline LST distribution across Malaysia'
            }
          </p>
        </div>
        <DynamicHeatmap
          level={viewMode}
          scenarioAdjustment={scenarioAdjustment}
          selectedLocation={selectedCity}
          height="600px"
        />
      </Card>
    </div>
  );
}
