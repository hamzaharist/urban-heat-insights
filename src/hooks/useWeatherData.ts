// Custom hook for fetching weather data using React Query
import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getMultipleLocationsWeather } from '@/lib/api/weather';
import type { Coordinates, WeatherData } from '@/types/weather';

/**
 * Hook to fetch current weather for a single location
 */
export function useWeatherData(coordinates: Coordinates) {
     return useQuery({
          queryKey: ['weather', coordinates.latitude, coordinates.longitude],
          queryFn: () => getCurrentWeather(coordinates),
          staleTime: 5 * 60 * 1000, // 5 minutes
          refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
          retry: 3,
     });
}

/**
 * Hook to fetch weather for multiple locations
 */
export function useMultipleWeatherData(locations: Coordinates[]) {
     return useQuery({
          queryKey: ['weather-multiple', JSON.stringify(locations)],
          queryFn: () => getMultipleLocationsWeather(locations),
          staleTime: 5 * 60 * 1000,
          refetchInterval: 10 * 60 * 1000,
          retry: 3,
          enabled: locations.length > 0,
     });
}
