import { MapPin } from 'lucide-react';
import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from '@/components/ui/select';

interface CitySelectorProps {
     selectedCity: string;
     onCityChange: (city: string) => void;
     districtCount?: number;
}

const CITIES = [
     { value: 'Kuala Lumpur', label: 'Kuala Lumpur', districts: 10 },
     { value: 'Johor Bahru', label: 'Johor Bahru', districts: 10 },
     { value: 'Penang', label: 'Penang', districts: 10 },
];

export function CitySelector({ selectedCity, onCityChange, districtCount }: CitySelectorProps) {
     const currentCity = CITIES.find(c => c.value === selectedCity);

     return (
          <div className="space-y-3">
               <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                         Location
                    </span>
               </div>

               <Select value={selectedCity} onValueChange={onCityChange}>
                    <SelectTrigger className="w-full bg-background/50 border-border/50">
                         <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                         {CITIES.map((city) => (
                              <SelectItem key={city.value} value={city.value}>
                                   <div className="flex flex-col">
                                        <span className="font-medium">{city.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                             {city.districts} districts
                                        </span>
                                   </div>
                              </SelectItem>
                         ))}
                    </SelectContent>
               </Select>

               {currentCity && (
                    <div className="pt-2 border-t border-border/30">
                         <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-display font-bold text-foreground">
                                   {currentCity.label}
                              </span>
                         </div>
                         <p className="text-xs text-muted-foreground mt-1">
                              {districtCount || currentCity.districts} monitoring stations
                         </p>
                    </div>
               )}
          </div>
     );
}
