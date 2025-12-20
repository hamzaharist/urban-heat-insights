import { Cloud, Droplets, Wind, Clock } from "lucide-react";
import { useCurrentWeather } from "@/hooks/useCurrentWeather";

interface CurrentWeatherWidgetProps {
     city: string;
}

const CurrentWeatherWidget = ({ city }: CurrentWeatherWidgetProps) => {
     const { data: weather, isLoading, error } = useCurrentWeather(city);

     if (isLoading) {
          return (
               <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20">
                    <div className="animate-pulse">
                         <div className="h-4 bg-blue-500/20 rounded w-32 mb-4"></div>
                         <div className="h-8 bg-blue-500/20 rounded w-24"></div>
                    </div>
               </div>
          );
     }

     if (error || !weather) {
          return null; // Silently fail - weather widget is optional
     }

     const currentTime = new Date(weather.time).toLocaleTimeString('en-MY', {
          hour: '2-digit',
          minute: '2-digit',
     });

     return (
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20 shadow-lg">
               {/* Header */}
               <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                         <Cloud className="w-5 h-5 text-blue-400" />
                         <h3 className="font-semibold text-foreground">Current Weather</h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                         <Clock className="w-3 h-3" />
                         <span>{currentTime}</span>
                    </div>
               </div>

               {/* Temperature */}
               <div className="mb-4">
                    <div className="text-4xl font-bold text-blue-400 mb-1">
                         {weather.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-sm text-muted-foreground">
                         Air Temperature (Real-time)
                    </div>
               </div>

               {/* Additional metrics */}
               <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                         <Droplets className="w-4 h-4 text-cyan-400" />
                         <div>
                              <div className="text-sm font-medium text-foreground">{weather.humidity}%</div>
                              <div className="text-xs text-muted-foreground">Humidity</div>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Wind className="w-4 h-4 text-blue-400" />
                         <div>
                              <div className="text-sm font-medium text-foreground">{weather.windSpeed.toFixed(1)} km/h</div>
                              <div className="text-xs text-muted-foreground">Wind</div>
                         </div>
                    </div>
               </div>

               {/* Data source note */}
               <div className="mt-4 pt-4 border-t border-blue-500/20">
                    <p className="text-xs text-muted-foreground">
                         Live data from Open-Meteo API
                    </p>
               </div>
          </div>
     );
};

export default CurrentWeatherWidget;
