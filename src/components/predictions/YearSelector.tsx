import { Calendar } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface YearSelectorProps {
     yearRange: [number, number];
     onYearRangeChange: (range: [number, number]) => void;
}

const MIN_YEAR = 2026;
const MAX_YEAR = 2030;

export function YearSelector({ yearRange, onYearRangeChange }: YearSelectorProps) {
     const handleRangeChange = (values: number[]) => {
          onYearRangeChange([values[0], values[1]]);
     };

     const presets = [
          { label: '1 Year', range: [2026, 2026] as [number, number] },
          { label: '3 Years', range: [2026, 2028] as [number, number] },
          { label: '5 Years', range: [2026, 2030] as [number, number] },
     ];

     return (
          <div className="space-y-4">
               <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                         Year Range
                    </span>
               </div>

               {/* Selected Range Display */}
               <div className="bg-background/50 border border-border/30 rounded-lg p-4">
                    <div className="text-center">
                         <div className="text-2xl font-display font-bold text-foreground">
                              {yearRange[0]} - {yearRange[1]}
                         </div>
                         <div className="text-xs text-muted-foreground mt-1">
                              {yearRange[1] - yearRange[0] + 1} year{yearRange[1] - yearRange[0] > 0 ? 's' : ''} selected
                         </div>
                    </div>
               </div>

               {/* Range Slider */}
               <div className="space-y-3">
                    <Slider
                         min={MIN_YEAR}
                         max={MAX_YEAR}
                         step={1}
                         value={[yearRange[0], yearRange[1]]}
                         onValueChange={handleRangeChange}
                         className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>{MIN_YEAR}</span>
                         <span>{MAX_YEAR}</span>
                    </div>
               </div>

               {/* Quick Presets */}
               <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                         Quick Select
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                         {presets.map((preset) => (
                              <button
                                   key={preset.label}
                                   onClick={() => onYearRangeChange(preset.range)}
                                   className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${yearRange[0] === preset.range[0] && yearRange[1] === preset.range[1]
                                             ? 'bg-primary text-primary-foreground'
                                             : 'bg-background/50 border border-border/30 hover:bg-background/70 text-foreground'
                                        }`}
                              >
                                   {preset.label}
                              </button>
                         ))}
                    </div>
               </div>
          </div>
     );
}
