/**
 * Utility functions for calculating adjusted LST (Land Surface Temperature)
 * based on scenario adjustments (NDBI, NDVI, Climate)
 */

interface ScenarioAdjustment {
  ndbi: number;
  ndvi: number;
  climate: number;
}

/**
 * Calculate adjusted LST for a single location
 * @param baseLST - Baseline land surface temperature in °C
 * @param adjustment - Scenario adjustment factors
 * @returns Adjusted temperature in °C
 */
export function calculateAdjustedLST(
  baseLST: number,
  adjustment: ScenarioAdjustment
): number {
  // Impact coefficients
  const urbanImpact = adjustment.ndbi * 0.35;
  const vegImpact = adjustment.ndvi * 0.30;
  const climateImpact = adjustment.climate * 0.25;

  const totalImpact = urbanImpact + vegImpact + climateImpact;
  const adjustedLST = baseLST + totalImpact;

  // Clamp between realistic temperature bounds
  return Math.max(0, Math.min(60, adjustedLST));
}

/**
 * Apply scenario adjustments to GeoJSON feature collection
 * Works with both state and district data
 */
export function applyScenarioToGeoJSON<T extends {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      avg_temperature?: number;
      [key: string]: any;
    };
    geometry: any;
  }>;
}>(geoJSON: T, adjustment: ScenarioAdjustment): T {
  if (!geoJSON || !geoJSON.features) {
    return geoJSON;
  }

  return {
    ...geoJSON,
    features: geoJSON.features.map(feature => {
      const baseLST = feature.properties.avg_temperature;

      // Skip if no temperature data
      if (baseLST === null || baseLST === undefined) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            adjusted_lst: null,
            baseline_lst: baseLST,
            temperature_change: 0,
          },
        };
      }

      const adjustedLST = calculateAdjustedLST(baseLST, adjustment);
      const temperatureChange = adjustedLST - baseLST;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          adjusted_lst: adjustedLST,
          baseline_lst: baseLST,
          temperature_change: temperatureChange,
          // Individual factor impacts
          urban_impact: adjustment.ndbi * 0.35,
          vegetation_impact: adjustment.ndvi * 0.30,
          climate_impact: adjustment.climate * 0.25,
        },
      };
    }),
  };
}

/**
 * Calculate temperature range from adjusted GeoJSON data
 * Used for dynamic color scale
 */
export function calculateTempRange(geoJSON: {
  features: Array<{
    properties: {
      adjusted_lst?: number | null;
      avg_temperature?: number | null;
    };
  }>;
}): { min: number; max: number } {
  const temps = geoJSON.features
    .map(f => f.properties.adjusted_lst ?? f.properties.avg_temperature)
    .filter((t): t is number => t !== null && t !== undefined);

  if (temps.length === 0) {
    return { min: 20, max: 40 };
  }

  return {
    min: Math.floor(Math.min(...temps)),
    max: Math.ceil(Math.max(...temps)),
  };
}

/**
 * Check if any scenario adjustments are active
 */
export function hasActiveAdjustments(adjustment: ScenarioAdjustment): boolean {
  return adjustment.ndbi !== 0 || adjustment.ndvi !== 0 || adjustment.climate !== 0;
}
