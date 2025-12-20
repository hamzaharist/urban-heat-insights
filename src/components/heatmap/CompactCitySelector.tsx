import { MapPin } from 'lucide-react';
import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from '@/components/ui/select';

interface CompactCitySelectorProps {
     selectedCity: string;
     onCityChange: (city: string) => void;
}

const CITIES = [
     { value: 'Kuala Lumpur', label: 'Kuala Lumpur', icon: '🏙️' },
     { value: 'Johor Bahru', label: 'Johor Bahru', icon: '🌆' },
     { value: 'Penang', label: 'Penang', icon: '🏝️' },
];

export function CompactCitySelector({ selectedCity, onCityChange }: CompactCitySelectorProps) {
     return (
          <div className="flex items-center gap-2">
               <MapPin className="w-4 h-4 text-primary" />
               <Select value={selectedCity} onValueChange={onCityChange}>
                    <SelectTrigger className="w-[180px] h-9 border-none bg-transparent shadow-none focus:ring-0">
                         <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                         {CITIES.map((city) => (
                              <SelectItem key={city.value} value={city.value}>
                                   <span className="flex items-center gap-2">
                                        <span>{city.icon}</span>
                                        <span>{city.label}</span>
                                   </span>
                              </SelectItem>
                         ))}
                    </SelectContent>
               </Select>
          </div>
     );
}
