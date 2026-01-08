import { useState, useMemo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import type { FillLayer } from 'react-map-gl';
import { useStateHeatmap } from '@/hooks/useStateHeatmap';
import { useDistrictHeatmap } from '@/hooks/useDistrictHeatmap';
import { applyScenarioToGeoJSON, hasActiveAdjustments } from '@/utils/lstAdjustment';
import { Loader2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DynamicHeatmapProps {
  level: 'states' | 'districts';
  scenarioAdjustment: {
    ndbi: number;
    ndvi: number;
    climate: number;
  };
  selectedLocation?: string;
  height?: string;
}

export function DynamicHeatmap({
  level,
  scenarioAdjustment,
  selectedLocation,
  height = '600px',
}: DynamicHeatmapProps) {
  const { data: statesData, isLoading: isLoadingStates } = useStateHeatmap();
  const { data: districtsData, isLoading: isLoadingDistricts } = useDistrictHeatmap();

  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    properties: any;
  } | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const isLoading = level === 'states' ? isLoadingStates : isLoadingDistricts;
  const baseData = level === 'states' ? statesData : districtsData;

  // Apply scenario adjustments to the data
  const adjustedData = useMemo(() => {
    if (!baseData) return null;
    return applyScenarioToGeoJSON(baseData, scenarioAdjustment);
  }, [baseData, scenarioAdjustment]);

  const showAdjustments = hasActiveAdjustments(scenarioAdjustment);

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-muted-foreground text-sm">Mapbox token not configured</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-background rounded-lg" style={{ height }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading {level} data...</p>
        </div>
      </div>
    );
  }

  if (!adjustedData || !adjustedData.features || adjustedData.features.length === 0) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <p className="text-muted-foreground text-sm">No {level} data available</p>
      </div>
    );
  }

  // Temperature field to use for coloring
  const tempField = showAdjustments ? 'adjusted_lst' : 'avg_temperature';

  // Create fill layer with data-driven colors
  const fillLayer: FillLayer = {
    id: `${level}-fill`,
    type: 'fill',
    source: level,
    paint: {
      'fill-color': [
        'case',
        ['!=', ['get', tempField], null],
        [
          'interpolate',
          ['linear'],
          ['get', tempField],
          20, '#14b8a6',  // teal
          24, '#10b981',  // green
          26, '#22c55e',
          28, '#84cc16',  // lime
          30, '#eab308',  // yellow
          32, '#f59e0b',  // amber
          34, '#f97316',  // orange
          36, '#dc2626',  // red
          38, '#991b1b',
          40, '#7f1d1d',  // dark red
        ],
        '#475569' // slate gray for no data
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.9,
        0.7
      ],
    },
  };

  const lineLayer: any = {
    id: `${level}-line`,
    type: 'line',
    source: level,
    paint: {
      'line-color': '#ffffff',
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        2.5,
        0.8
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5
      ],
    },
  };

  const onHover = (event: any) => {
    const feature = event.features?.[0];
    if (feature) {
      setHoveredFeature(feature);

      // Get coordinates for popup
      const coordinates = event.lngLat;
      if (coordinates) {
        setPopupInfo({
          longitude: coordinates.lng,
          latitude: coordinates.lat,
          properties: feature.properties,
        });
      }
    } else {
      setHoveredFeature(null);
      setPopupInfo(null);
    }
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ height }}>
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: 101.9758,
          latitude: 4.2105,
          zoom: level === 'states' ? 6 : 7,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        interactiveLayerIds={[`${level}-fill`]}
        onMouseMove={onHover}
        onMouseLeave={() => {
          setHoveredFeature(null);
          setPopupInfo(null);
        }}
        key={level}
      >
        <Source id={level} type="geojson" data={adjustedData}>
          <Layer {...fillLayer} />
          <Layer {...lineLayer} />
        </Source>

        {/* Enhanced Popup with Baseline vs Adjusted */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={10}
            className="scenario-popup"
          >
            <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-xl min-w-[240px]">
              <p className="font-semibold text-foreground mb-2 text-sm">
                {popupInfo.properties.name || popupInfo.properties.state_name || 'Unknown'}
              </p>

              <div className="space-y-2 text-xs">
                {/* Current/Baseline Temperature */}
                <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/30">
                  <span className="text-muted-foreground">Baseline LST:</span>
                  <span className="font-medium text-foreground">
                    {popupInfo.properties.baseline_lst?.toFixed(1) ||
                     popupInfo.properties.avg_temperature?.toFixed(1) || 'N/A'}°C
                  </span>
                </div>

                {/* Adjusted Temperature (if scenarios active) */}
                {showAdjustments && popupInfo.properties.adjusted_lst && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Adjusted LST:</span>
                      <span className={`font-semibold ${
                        popupInfo.properties.temperature_change > 0 ? 'text-red-500' :
                        popupInfo.properties.temperature_change < 0 ? 'text-green-500' :
                        'text-foreground'
                      }`}>
                        {popupInfo.properties.adjusted_lst.toFixed(1)}°C
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                      <span className="text-muted-foreground font-medium">Change:</span>
                      <span className={`font-bold ${
                        popupInfo.properties.temperature_change > 0 ? 'text-red-500' :
                        popupInfo.properties.temperature_change < 0 ? 'text-green-500' :
                        'text-muted-foreground'
                      }`}>
                        {popupInfo.properties.temperature_change >= 0 ? '+' : ''}
                        {popupInfo.properties.temperature_change?.toFixed(2)}°C
                      </span>
                    </div>

                    {/* Individual factor impacts */}
                    <div className="pt-2 mt-2 border-t border-border/30 space-y-1">
                      <p className="text-muted-foreground font-medium mb-1">Impact Breakdown:</p>
                      {popupInfo.properties.urban_impact !== 0 && (
                        <div className="flex items-center justify-between gap-2 pl-2">
                          <span className="text-muted-foreground">• Urban:</span>
                          <span className="text-xs">
                            {popupInfo.properties.urban_impact >= 0 ? '+' : ''}
                            {popupInfo.properties.urban_impact?.toFixed(2)}°C
                          </span>
                        </div>
                      )}
                      {popupInfo.properties.vegetation_impact !== 0 && (
                        <div className="flex items-center justify-between gap-2 pl-2">
                          <span className="text-muted-foreground">• Vegetation:</span>
                          <span className="text-xs">
                            {popupInfo.properties.vegetation_impact >= 0 ? '+' : ''}
                            {popupInfo.properties.vegetation_impact?.toFixed(2)}°C
                          </span>
                        </div>
                      )}
                      {popupInfo.properties.climate_impact !== 0 && (
                        <div className="flex items-center justify-between gap-2 pl-2">
                          <span className="text-muted-foreground">• Climate:</span>
                          <span className="text-xs">
                            {popupInfo.properties.climate_impact >= 0 ? '+' : ''}
                            {popupInfo.properties.climate_impact?.toFixed(2)}°C
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Status Badge */}
      {showAdjustments && (
        <div className="absolute top-4 right-4 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">Scenario Active</span>
        </div>
      )}
    </div>
  );
}
