import { useState, useRef, useCallback } from "react";
import {
  GitCompare,
  Thermometer,
  Leaf,
  Building2,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ArrowRight,
  GripHorizontal,
} from "lucide-react";

interface LocationData {
  name: string;
  temperature: number;
  ndvi: number;
  ndbi: number;
  hotspots?: number;
}

interface ComparisonWidgetProps {
  location1: LocationData | null;
  location2: LocationData | null;
  onClose: () => void;
}

// Temperature color helper
const getTempColor = (temp: number): string => {
  if (temp < 28) return "#14b8a6";
  if (temp < 30) return "#22c55e";
  if (temp < 32) return "#eab308";
  if (temp < 34) return "#f97316";
  if (temp < 36) return "#ef4444";
  return "#991b1b";
};

// Metric comparison row
const CompareMetric = ({
  icon: Icon,
  label,
  value1,
  value2,
  unit,
  higherIsBetter = false,
  colorFn,
}: {
  icon: any;
  label: string;
  value1: number | undefined;
  value2: number | undefined;
  unit: string;
  higherIsBetter?: boolean;
  colorFn?: (val: number) => string;
}) => {
  const v1 = value1 ?? 0;
  const v2 = value2 ?? 0;
  const diff = v1 - v2;
  const winner = higherIsBetter ? (diff > 0 ? 1 : diff < 0 ? 2 : 0) : (diff < 0 ? 1 : diff > 0 ? 2 : 0);

  return (
    <div className="py-3 border-b border-white/10 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-white/60" />
        <span className="text-xs text-white/60 font-medium">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        {/* Location 1 Value */}
        <div className={`flex items-center gap-1.5 ${winner === 1 ? 'scale-105' : ''} transition-transform`}>
          <span
            className={`text-lg font-bold ${!colorFn ? (winner === 1 ? 'text-green-400' : winner === 2 ? 'text-red-400' : 'text-white') : ''}`}
            style={colorFn ? { color: colorFn(v1) } : undefined}
          >
            {v1.toFixed(1)}
          </span>
          <span className="text-xs text-white/50">{unit}</span>
          {winner === 1 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">
              BETTER
            </span>
          )}
        </div>

        {/* Difference */}
        <div className="flex items-center gap-1">
          {diff > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          ) : diff < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-white/40" />
          )}
          <span className={`text-xs font-semibold ${
            diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-white/40'
          }`}>
            {diff > 0 ? '+' : ''}{diff.toFixed(2)}
          </span>
        </div>

        {/* Location 2 Value */}
        <div className={`flex items-center gap-1.5 ${winner === 2 ? 'scale-105' : ''} transition-transform`}>
          {winner === 2 && (
            <span className="mr-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">
              BETTER
            </span>
          )}
          <span
            className={`text-lg font-bold ${!colorFn ? (winner === 2 ? 'text-green-400' : winner === 1 ? 'text-red-400' : 'text-white') : ''}`}
            style={colorFn ? { color: colorFn(v2) } : undefined}
          >
            {v2.toFixed(1)}
          </span>
          <span className="text-xs text-white/50">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export function ComparisonWidget({ location1, location2, onClose }: ComparisonWidgetProps) {
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasBeenDragged(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position]);

  // Reset position
  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setHasBeenDragged(false);
  };

  // Don't render if we don't have both locations
  if (!location1 || !location2) {
    return (
      <div
        className="absolute bottom-6 left-1/2 z-20"
        style={{
          transform: hasBeenDragged
            ? `translate(calc(-50% + ${position.x}px), ${position.y}px)`
            : 'translateX(-50%)',
        }}
      >
        <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-primary" />
            <p className="text-sm text-white/70">
              Select two locations to compare
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={`absolute bottom-6 left-1/2 z-20 w-[540px] max-w-[90vw] ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        transform: hasBeenDragged
          ? `translate(calc(-50% + ${position.x}px), ${position.y}px)`
          : 'translateX(-50%)',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <div className="backdrop-blur-xl bg-gradient-to-br from-black/70 to-black/50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header - Draggable */}
        <div
          onMouseDown={handleMouseDown}
          className={`px-5 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-white/30" />
            <GitCompare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Location Comparison</h3>
          </div>
          <div className="flex items-center gap-1">
            {hasBeenDragged && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetPosition();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-xs text-white/40 hover:text-white/70"
                title="Reset position"
              >
                Reset
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Location Names */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <span className="px-3 py-1.5 bg-primary/20 text-primary text-sm font-semibold rounded-lg">
                {location1.name}
              </span>
            </div>
            <div className="px-4">
              <ArrowRight className="w-4 h-4 text-white/30" />
            </div>
            <div className="flex-1 text-center">
              <span className="px-3 py-1.5 bg-accent/20 text-accent text-sm font-semibold rounded-lg">
                {location2.name}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="px-5 py-2">
          <CompareMetric
            icon={Thermometer}
            label="Temperature"
            value1={location1.temperature}
            value2={location2.temperature}
            unit="°C"
            higherIsBetter={false}
            colorFn={getTempColor}
          />
          <CompareMetric
            icon={Leaf}
            label="Vegetation (NDVI)"
            value1={location1.ndvi}
            value2={location2.ndvi}
            unit=""
            higherIsBetter={true}
          />
          <CompareMetric
            icon={Building2}
            label="Urban Density (NDBI)"
            value1={location1.ndbi}
            value2={location2.ndbi}
            unit=""
            higherIsBetter={false}
          />
          {(location1.hotspots !== undefined || location2.hotspots !== undefined) && (
            <CompareMetric
              icon={Flame}
              label="Heat Hotspots"
              value1={location1.hotspots}
              value2={location2.hotspots}
              unit=""
              higherIsBetter={false}
            />
          )}
        </div>

        {/* Summary */}
        <div className="px-5 py-3 bg-white/5 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            {location1.temperature < location2.temperature ? (
              <span><strong className="text-green-400">{location1.name}</strong> is <strong>{(location2.temperature - location1.temperature).toFixed(1)}°C cooler</strong> than {location2.name}</span>
            ) : location1.temperature > location2.temperature ? (
              <span><strong className="text-green-400">{location2.name}</strong> is <strong>{(location1.temperature - location2.temperature).toFixed(1)}°C cooler</strong> than {location1.name}</span>
            ) : (
              <span>Both locations have the same temperature</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ComparisonWidget;
