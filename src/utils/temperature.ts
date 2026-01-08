/**
 * Temperature utility functions for LST (Land Surface Temperature) classification
 */

export type LSTIntensity = 'low' | 'mild' | 'medium' | 'warm' | 'high' | 'hot' | 'critical' | 'extreme';

export interface LSTLegendItem {
     label: string;
     color: string;
     range: string;
     desc?: string;
     minTemp: number;
     maxTemp?: number;
}

export const LST_LEGEND = {
     low: {
          label: 'Low Heat',
          color: '#22c55e',
          range: '< 30°C',
          desc: 'Cool zones with good vegetation',
          minTemp: -Infinity,
          maxTemp: 30
     },
     medium: {
          label: 'Medium Heat',
          color: '#eab308',
          range: '30-35°C',
          desc: 'Moderate urban heat',
          minTemp: 30,
          maxTemp: 35
     },
     high: {
          label: 'High Heat',
          color: '#f97316',
          range: '35-40°C',
          desc: 'Significant heat buildup',
          minTemp: 35,
          maxTemp: 40
     },
     critical: {
          label: 'Critical Heat',
          color: '#dc2626',
          range: '≥ 40°C',
          desc: 'Extreme heat zones',
          minTemp: 40,
          maxTemp: Infinity
     },
};

/**
 * Get LST intensity classification based on temperature
 */
export function getLSTIntensity(temperature: number): LSTIntensity {
     if (temperature >= 43) return 'extreme';
     if (temperature >= 40) return 'critical';
     if (temperature >= 37) return 'hot';
     if (temperature >= 34) return 'high';
     if (temperature >= 31) return 'warm';
     if (temperature >= 28) return 'medium';
     if (temperature >= 25) return 'mild';
     return 'low';
}

/**
 * Get color for a given temperature
 */
export function getTemperatureColor(temperature: number): string {
     if (temperature >= 40) return LST_LEGEND.critical.color;
     if (temperature >= 35) return LST_LEGEND.high.color;
     if (temperature >= 30) return LST_LEGEND.medium.color;
     return LST_LEGEND.low.color;
}

/**
 * Get risk level based on temperature
 */
export function getRiskLevel(temperature: number): 'Low' | 'Medium' | 'High' | 'Critical' {
     if (temperature >= 40) return 'Critical';
     if (temperature >= 35) return 'High';
     if (temperature >= 30) return 'Medium';
     return 'Low';
}
