// Weather and climate data types

export interface WeatherData {
     temperature: number;
     feelsLike: number;
     humidity: number;
     windSpeed: number;
     timestamp: string;
}

export interface Coordinates {
     latitude: number;
     longitude: number;
}

export interface HotspotData {
     id: string;
     name: string;
     city?: string; // City name (e.g., "Kuala Lumpur")
     district?: string; // District name (e.g., "Mont Kiara")
     latitude: number;
     longitude: number;
     temperature: number;
     intensity: 'extreme' | 'hot' | 'warm' | 'mild' | 'cool';
     avg_ndvi?: number; // Average NDVI from satellite data
     avg_ndbi?: number; // Average NDBI from satellite data
     x?: number; // For map positioning
     y?: number; // For map positioning
}

export interface TemperatureReading {
     id: string;
     city: string;
     locationName?: string;
     latitude: number;
     longitude: number;
     temperature: number;
     feelsLike?: number;
     humidity?: number;
     recordedAt: string;
     source: string;
}

export interface PredictionData {
     id: string;
     city: string;
     year: number;
     predicted_temp: number;
     confidence: number;
     createdAt: string;
}

export interface CityData {
     name: string;
     latitude: number;
     longitude: number;
     country: string;
}

// Open-Meteo API response types
export interface OpenMeteoResponse {
     latitude: number;
     longitude: number;
     current: {
          time: string;
          temperature_2m: number;
          relative_humidity_2m: number;
          apparent_temperature: number;
          wind_speed_10m: number;
     };
     hourly?: {
          time: string[];
          temperature_2m: number[];
     };
}

// Google Earth Engine types
export interface GEEImageData {
     type: string;
     bands: string[];
     id: string;
     properties: Record<string, any>;
}

export interface LSTData {
     latitude: number;
     longitude: number;
     temperature: number;
     date: string;
     satellite: string;
}
