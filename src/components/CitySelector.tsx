import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface CitySelectorProps {
     selectedCity: string;
     onCityChange: (city: string) => void;
}

const MALAYSIAN_CITIES = [
     "Kuala Lumpur",
     "Penang",
     "Johor Bahru",
     "Ipoh",
     "Malacca",
     "Seremban",
     "Kuching",
     "Kota Kinabalu",
];

export default function CitySelector({ selectedCity, onCityChange }: CitySelectorProps) {
     return (
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
               <MapPin className="w-5 h-5 text-accent" />
               <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">
                         Select City
                    </label>
                    <Select value={selectedCity} onValueChange={onCityChange}>
                         <SelectTrigger className="w-[200px] h-8 border-0 bg-transparent p-0 focus:ring-0">
                              <SelectValue placeholder="Select a city" />
                         </SelectTrigger>
                         <SelectContent>
                              {MALAYSIAN_CITIES.map((city) => (
                                   <SelectItem key={city} value={city}>
                                        {city}
                                   </SelectItem>
                              ))}
                         </SelectContent>
                    </Select>
               </div>
          </div>
     );
}
