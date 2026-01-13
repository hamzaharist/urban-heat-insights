import { useState, useRef, useEffect } from "react";
import { MapPin, Search, ChevronDown, X } from "lucide-react";

interface SearchableLocationSelectorProps {
     locations: string[];
     selectedLocation: string;
     onLocationChange: (location: string) => void;
}

export const SearchableLocationSelector = ({
     locations,
     selectedLocation,
     onLocationChange,
}: SearchableLocationSelectorProps) => {
     const [isOpen, setIsOpen] = useState(false);
     const [searchQuery, setSearchQuery] = useState("");
     const [highlightedIndex, setHighlightedIndex] = useState(0);
     const dropdownRef = useRef<HTMLDivElement>(null);
     const inputRef = useRef<HTMLInputElement>(null);

     // Filter locations based on search query
     const filteredLocations = locations.filter((location) =>
          location.toLowerCase().includes(searchQuery.toLowerCase())
     );

     // Close dropdown when clicking outside
     useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
               if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target as Node)
               ) {
                    setIsOpen(false);
               }
          };

          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
     }, []);

     // Reset highlighted index when search changes
     useEffect(() => {
          setHighlightedIndex(0);
     }, [searchQuery]);

     // Keyboard navigation
     const handleKeyDown = (e: React.KeyboardEvent) => {
          if (!isOpen) {
               if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                    setIsOpen(true);
                    e.preventDefault();
               }
               return;
          }

          switch (e.key) {
               case "ArrowDown":
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                         prev < filteredLocations.length - 1 ? prev + 1 : prev
                    );
                    break;
               case "ArrowUp":
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                    break;
               case "Enter":
                    e.preventDefault();
                    if (filteredLocations[highlightedIndex]) {
                         onLocationChange(filteredLocations[highlightedIndex]);
                         setIsOpen(false);
                         setSearchQuery("");
                    }
                    break;
               case "Escape":
                    setIsOpen(false);
                    setSearchQuery("");
                    break;
          }
     };

     const handleLocationSelect = (location: string) => {
          onLocationChange(location);
          setIsOpen(false);
          setSearchQuery("");
     };

     const handleClearSearch = () => {
          setSearchQuery("");
          inputRef.current?.focus();
     };

     return (
          <div ref={dropdownRef} className="relative">
               {/* Trigger Button */}
               <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-300 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 group"
                    onKeyDown={handleKeyDown}
               >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                         <span className="text-slate-900 font-medium truncate">
                              {selectedLocation || "Select location..."}
                         </span>
                    </div>
                    <ChevronDown
                         className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""
                              }`}
                    />
               </button>

               {/* Dropdown Panel */}
               {isOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                         {/* Search Input */}
                         <div className="p-3 border-b border-slate-200 bg-slate-50">
                              <div className="relative">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                   <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search districts..."
                                        className="w-full pl-10 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        autoFocus
                                   />
                                   {searchQuery && (
                                        <button
                                             onClick={handleClearSearch}
                                             className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                                        >
                                             <X className="w-3 h-3 text-slate-500" />
                                        </button>
                                   )}
                              </div>
                         </div>

                         {/* Location List */}
                         <div className="max-h-[300px] overflow-y-auto">
                              {filteredLocations.length > 0 ? (
                                   <div className="py-1">
                                        {filteredLocations.map((location, index) => {
                                             const isSelected = location === selectedLocation;
                                             const isHighlighted = index === highlightedIndex;

                                             return (
                                                  <button
                                                       key={location}
                                                       onClick={() => handleLocationSelect(location)}
                                                       onMouseEnter={() => setHighlightedIndex(index)}
                                                       className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-150 ${isHighlighted
                                                                 ? "bg-blue-50 border-l-2 border-blue-600"
                                                                 : ""
                                                            } ${isSelected
                                                                 ? "bg-blue-100 font-semibold text-blue-900"
                                                                 : "hover:bg-slate-50 text-slate-700"
                                                            }`}
                                                  >
                                                       <MapPin
                                                            className={`w-4 h-4 flex-shrink-0 ${isSelected
                                                                      ? "text-blue-600"
                                                                      : isHighlighted
                                                                           ? "text-blue-500"
                                                                           : "text-slate-400"
                                                                 }`}
                                                       />
                                                       <span className="truncate">{location}</span>
                                                       {isSelected && (
                                                            <div className="ml-auto flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                                       )}
                                                  </button>
                                             );
                                        })}
                                   </div>
                              ) : (
                                   <div className="px-4 py-8 text-center">
                                        <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">
                                             No districts found matching "{searchQuery}"
                                        </p>
                                        <button
                                             onClick={handleClearSearch}
                                             className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                             Clear search
                                        </button>
                                   </div>
                              )}
                         </div>

                         {/* Footer Info */}
                         <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                              <span>{filteredLocations.length} districts</span>
                              <span className="text-slate-400">Use ↑↓ to navigate</span>
                         </div>
                    </div>
               )}
          </div>
     );
};
