import { MapPin, Layers, Info, Loader2 } from "lucide-react";
import { useHotspots, useAllHotspots } from "@/hooks/useHotspots";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Suspense, lazy } from 'react';
import CitySelector from './CitySelector';
import CurrentWeatherWidget from './CurrentWeatherWidget';

// Lazy load map component
const InteractiveMap = lazy(() => import('./InteractiveMap'));

interface MapSectionProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const MapSection = ({ selectedCity, onCityChange }: MapSectionProps) => {
  // Fetch ALL hotspots for map display (no filtering)
  const { data: allHotspots, isLoading: isLoadingAll, error: errorAll } = useAllHotspots();

  // Fetch city-filtered hotspots for statistics only
  const { data: cityHotspots } = useHotspots(selectedCity);

  // Calculate stats from city-filtered data
  const stats = cityHotspots ? {
    peakTemp: Math.max(...cityHotspots.map(h => h.temperature)),
    criticalHotspots: cityHotspots.filter(h => h.intensity === 'extreme' || h.intensity === 'hot').length,
    avgNDVI: cityHotspots.reduce((sum, h) => sum + (h.avg_ndvi || 0), 0) / cityHotspots.length,
    builtUpIndex: cityHotspots.reduce((sum, h) => sum + (h.avg_ndbi || 0), 0) / cityHotspots.length,
  } : null;

  return (
    <section id="map-section" className="py-20 bg-background">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-4">
            Real-Time Visualization
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            UHI Hotspot Distribution Map
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore neighborhood-level heat distribution across Malaysian cities.
          </p>
        </div>

        {/* City Selector */}
        <div className="flex justify-center mb-6">
          <CitySelector
            selectedCity={selectedCity}
            onCityChange={onCityChange}
          />
        </div>

        {/* Interactive Map Container */}
        <div className="relative bg-card rounded-2xl shadow-lg overflow-hidden" style={{ height: 600 }}>
          {/* Loading State */}
          {isLoadingAll && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[1000]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading hotspot data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {errorAll && (
            <div className="absolute inset-0 flex items-center justify-center p-8 z-[1000]">
              <Alert variant="destructive">
                <AlertDescription>
                  <div>
                    <p className="font-semibold mb-2">Failed to load hotspot data</p>
                    <p className="text-sm">{errorAll.message}</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* No Data State */}
          {!isLoadingAll && !errorAll && (!allHotspots || allHotspots.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <Alert>
                <AlertDescription>
                  <div className="text-center">
                    <p className="font-semibold mb-2">No hotspot data found</p>
                    <p className="text-sm">No data available for Kuala Lumpur</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Interactive Mapbox Map */}
          {!isLoadingAll && !errorAll && allHotspots && allHotspots.length > 0 && (
            <Suspense fallback={
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }>
              <InteractiveMap
                hotspots={allHotspots}
                selectedCity={selectedCity} />
            </Suspense>
          )}
        </div>

        {/* Current Weather Widget */}
        <div className="mt-8">
          <CurrentWeatherWidget city={selectedCity} />
        </div>

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-heat-extreme/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-heat-extreme" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.peakTemp.toFixed(1)}°C</p>
                  <p className="text-sm text-muted-foreground">Peak Temperature</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.criticalHotspots}</p>
                  <p className="text-sm text-muted-foreground">Critical Hotspots</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgNDVI.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Avg NDVI</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.builtUpIndex.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Built-up Index</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MapSection;
