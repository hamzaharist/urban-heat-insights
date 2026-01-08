import { Sliders, Leaf, Building2, RefreshCw } from 'lucide-react';

interface ScenarioControlsProps {
     ndviAdjustment: number;
     ndbiAdjustment: number;
     onNdviChange: (value: number) => void;
     onNdbiChange: (value: number) => void;
     onReset: () => void;
}

export function ScenarioControls({
     ndviAdjustment,
     ndbiAdjustment,
     onNdviChange,
     onNdbiChange,
     onReset
}: ScenarioControlsProps) {

     const formatValue = (value: number) => {
          return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
     };

     const getImpactText = (ndvi: number, ndbi: number) => {
          if (ndvi === 0 && ndbi === 0) return 'No changes applied';

          const impacts = [];
          if (ndvi > 0) impacts.push('More vegetation');
          if (ndvi < 0) impacts.push('Less vegetation');
          if (ndbi > 0) impacts.push('More urban');
          if (ndbi < 0) impacts.push('Less urban');

          return impacts.join(', ');
     };

     return (
          <div className="absolute top-24 right-6 z-10 w-80">
               <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/20 rounded-2xl shadow-2xl p-6 transition-all duration-300 hover:shadow-3xl hover:border-white/30">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                         <div className="flex items-center gap-2">
                              <Sliders className="w-5 h-5 text-teal-400" />
                              <h3 className="font-bold text-base text-white">Scenario Builder</h3>
                         </div>
                         <button
                              onClick={onReset}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                              title="Reset to baseline"
                         >
                              <RefreshCw className="w-4 h-4 text-white/60 group-hover:text-white group-hover:rotate-180 transition-all duration-300" />
                         </button>
                    </div>

                    {/* NDVI Slider */}
                    <div className="mb-6">
                         <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                   <Leaf className="w-4 h-4 text-green-400" />
                                   <label className="text-sm font-semibold text-white">Vegetation (NDVI)</label>
                              </div>
                              <span className={`text-sm font-mono px-2 py-1 rounded-md ${
                                   ndviAdjustment > 0 ? 'bg-green-500/20 text-green-300' :
                                   ndviAdjustment < 0 ? 'bg-red-500/20 text-red-300' :
                                   'bg-white/10 text-white/60'
                              }`}>
                                   {formatValue(ndviAdjustment)}
                              </span>
                         </div>

                         <input
                              type="range"
                              min="-0.3"
                              max="0.3"
                              step="0.01"
                              value={ndviAdjustment}
                              onChange={(e) => onNdviChange(parseFloat(e.target.value))}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb-green"
                              style={{
                                   background: `linear-gradient(to right,
                                        #dc2626 0%,
                                        #ffffff33 ${((ndviAdjustment + 0.3) / 0.6) * 100}%,
                                        #22c55e 100%
                                   )`
                              }}
                         />

                         <div className="flex justify-between text-xs text-white/50 mt-1">
                              <span>Less</span>
                              <span>More</span>
                         </div>
                    </div>

                    {/* NDBI Slider */}
                    <div className="mb-6">
                         <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                   <Building2 className="w-4 h-4 text-orange-400" />
                                   <label className="text-sm font-semibold text-white">Built-Up (NDBI)</label>
                              </div>
                              <span className={`text-sm font-mono px-2 py-1 rounded-md ${
                                   ndbiAdjustment > 0 ? 'bg-orange-500/20 text-orange-300' :
                                   ndbiAdjustment < 0 ? 'bg-blue-500/20 text-blue-300' :
                                   'bg-white/10 text-white/60'
                              }`}>
                                   {formatValue(ndbiAdjustment)}
                              </span>
                         </div>

                         <input
                              type="range"
                              min="-0.3"
                              max="0.3"
                              step="0.01"
                              value={ndbiAdjustment}
                              onChange={(e) => onNdbiChange(parseFloat(e.target.value))}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb-orange"
                              style={{
                                   background: `linear-gradient(to right,
                                        #3b82f6 0%,
                                        #ffffff33 ${((ndbiAdjustment + 0.3) / 0.6) * 100}%,
                                        #f97316 100%
                                   )`
                              }}
                         />

                         <div className="flex justify-between text-xs text-white/50 mt-1">
                              <span>Less</span>
                              <span>More</span>
                         </div>
                    </div>

                    {/* Impact Summary */}
                    <div className="pt-4 border-t border-white/10">
                         <p className="text-xs text-white/70 leading-relaxed">
                              <span className="font-semibold text-teal-300">Scenario:</span>{' '}
                              {getImpactText(ndviAdjustment, ndbiAdjustment)}
                         </p>
                         {(ndviAdjustment !== 0 || ndbiAdjustment !== 0) && (
                              <p className="text-xs text-white/50 mt-2 italic">
                                   Map colors update in real-time to show temperature changes
                              </p>
                         )}
                    </div>

               </div>
          </div>
     );
}
