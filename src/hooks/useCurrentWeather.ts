// Custom hook for fetching current weather from Open-Meteo API
import { useQuery } from '@tanstack/react-query';

interface WeatherData {
     temperature: number;
     humidity: number;
     windSpeed: number;
     weatherCode: number;
     time: string;
}

interface CityCoordinates {
     latitude: number;
     longitude: number;
}

const CITY_COORDS: Record<string, CityCoordinates> = {
     'Kuala Lumpur': { latitude: 3.1390, longitude: 101.6869 },
     'Johor Bahru': { latitude: 1.4927, longitude: 103.7414 },
     'Penang': { latitude: 5.4164, longitude: 100.3327 },
};

/**
 * Check if a city has dedicated weather coordinates
 */
export function isCitySupported(city: string): boolean {
     return city in CITY_COORDS;
}

/**
 * Hook to fetch current weather data from Open-Meteo API
 */
export function useCurrentWeather(city: string = 'Kuala Lumpur') {
     const coords = CITY_COORDS[city] || CITY_COORDS['Kuala Lumpur'];

     return useQuery({
          queryKey: ['current-weather', city],
          queryFn: async (): Promise<WeatherData> => {
               const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia/Kuala_Lumpur`;

               const response = await fetch(url);
               if (!response.ok) {
                    throw new Error('Failed to fetch weather data');
               }

               const data = await response.json();

               return {
                    temperature: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: data.current.wind_speed_10m,
                    weatherCode: data.current.weather_code,
                    time: data.current.time,
               };
          },
          staleTime: 10 * 60 * 1000, // 10 minutes (weather doesn't change that fast)
          retry: 2,
     });
}
