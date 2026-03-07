import { useEffect, useState } from 'react';
import { Leaf, Building2, Flame, TrendingUp, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';

interface BloomeeWidgetProps {
  data: {
    name: string;
    temperature: number;
    baselineTemp?: number;
    tempChange?: number;
    ndvi: number;
    ndbi: number;
    hotspots: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    isScenario?: boolean;
  } | null;
  isLoading?: boolean;
}

export function BloomeeWidget({ data, isLoading }: BloomeeWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!!data);
  }, [data]);

  // Calculate risk level and color
  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          color: 'from-red-500 to-orange-500',
          bgGlow: 'shadow-red-500/20',
          icon: <AlertTriangle className="w-5 h-5" />,
          text: 'Critical Heat'
        };
      case 'High':
        return {
          color: 'from-orange-500 to-yellow-500',
          bgGlow: 'shadow-orange-500/20',
          icon: <Flame className="w-5 h-5" />,
          text: 'High Risk'
        };
      case 'Medium':
        return {
          color: 'from-yellow-500 to-green-500',
          bgGlow: 'shadow-yellow-500/20',
          icon: <TrendingUp className="w-5 h-5" />,
          text: 'Moderate'
        };
      default:
        return {
          color: 'from-teal-500 to-green-500',
          bgGlow: 'shadow-teal-500/20',
          icon: <CheckCircle2 className="w-5 h-5" />,
          text: 'Low Risk'
        };
    }
  };

  // Generate smart insight based on data
  const getSmartInsight = (data: BloomeeWidgetProps['data']) => {
    if (!data) return '';

    const { temperature, ndvi, ndbi, riskLevel } = data;

    if (riskLevel === 'Critical') {
      if (ndvi < 0.3) {
        return 'Critical heat risk detected. Vegetation coverage critically low.';
      }
      if (ndbi > 0.5) {
        return 'Extreme urban density contributing to severe heat island effect.';
      }
      return 'Critical temperature levels detected. Immediate attention required.';
    }

    if (riskLevel === 'High') {
      if (ndbi > ndvi) {
        return 'High urbanization exceeds vegetation. Heat mitigation recommended.';
      }
      return 'Elevated temperatures detected. Monitor for potential heat stress.';
    }

    if (riskLevel === 'Medium') {
      return 'Moderate conditions. Balanced urban-vegetation ratio maintained.';
    }

    return 'Optimal environmental conditions. Healthy vegetation coverage.';
  };

  // Calculate percentage for progress bars
  const getPercentage = (value: number, max: number = 1) => {
    return Math.max(0, Math.min(100, (value / max) * 100));
  };

  const riskConfig = data ? getRiskConfig(data.riskLevel) : null;

  if (isLoading) {
    return (
      <div className="absolute top-24 right-6 z-20 w-96 animate-pulse">
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="h-8 bg-white/10 rounded mb-4"></div>
          <div className="h-20 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-white/10 rounded"></div>
            <div className="h-16 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="absolute top-24 right-6 z-20 w-96">
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl p-8 text-center transition-all duration-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-teal-400/60 animate-pulse" />
          <h3 className="text-xl font-semibold text-white/90 mb-2">
            Live Environmental Analysis
          </h3>
          <p className="text-sm text-white/60">
            Hover over a region to view detailed metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute top-24 right-6 z-20 w-96 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      {/* Main Widget Card */}
      <div className={`backdrop-blur-xl bg-gradient-to-br from-black/50 to-black/30 border border-white/10 rounded-2xl shadow-2xl ${riskConfig?.bgGlow} overflow-hidden transition-all duration-300 hover:shadow-3xl hover:border-white/20`}>
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">
                  Live Analysis
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                {data.name}
              </h3>
            </div>

            {/* Risk Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${riskConfig.color} text-white text-xs font-semibold shadow-lg`}>
              {riskConfig.icon}
              {riskConfig.text}
            </div>
          </div>
        </div>

        {/* Temperature Display - Hero Metric */}
        <div className="px-6 py-8 bg-gradient-to-br from-white/5 to-transparent">
          <div className="text-center">
            <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
              {data.isScenario ? 'Scenario Temperature' : 'Average Temperature'}
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                {data.temperature.toFixed(1)}
              </span>
              <span className="text-3xl font-semibold text-white/80">°C</span>
            </div>

            {/* Temperature Change Indicator */}
            {data.isScenario && data.tempChange !== undefined && data.tempChange !== 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${data.tempChange < 0
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                    }`}>
                    <TrendingUp className={`w-4 h-4 ${data.tempChange < 0 ? 'rotate-180' : ''}`} />
                    <span className="text-sm font-bold">
                      {data.tempChange > 0 ? '+' : ''}{data.tempChange.toFixed(2)}°C
                    </span>
                  </div>
                </div>
                <div className="text-xs text-white/50 mt-2">
                  from baseline {data.baselineTemp?.toFixed(1)}°C
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="px-6 py-4 space-y-4">
          {/* Vegetation (NDVI) */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Leaf className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Greenness Score</div>
                  <div className="text-xs text-white/60">NDVI Index</div>
                </div>
              </div>
              <span className="text-lg font-bold text-green-400">
                {(data.ndvi * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${getPercentage(data.ndvi)}%` }}
              />
            </div>
          </div>

          {/* Urban Density (NDBI) */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Built-up Score</div>
                  <div className="text-xs text-white/60">NDBI Index</div>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-400">
                {((data.ndbi + 1) / 2 * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(data.ndbi + 1) / 2 * 100}%` }}
              />
            </div>
          </div>

          {/* Hotspots */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Heat Hotspots</div>
                  <div className="text-xs text-white/60">Critical Areas</div>
                </div>
              </div>
              <span className="text-lg font-bold text-orange-400">
                {data.hotspots.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Smart Insight */}
        <div className="px-6 py-4 border-t border-white/10 bg-gradient-to-br from-teal-500/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 mt-0.5">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-1">
                AI Insight
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                {getSmartInsight(data)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
