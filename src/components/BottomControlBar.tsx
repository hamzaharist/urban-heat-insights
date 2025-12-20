import { useState } from 'react';
import { ChevronUp, ChevronDown, Sliders, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomControlBarProps {
     children: React.ReactNode;
     className?: string;
}

export function BottomControlBar({ children, className }: BottomControlBarProps) {
     const [isExpanded, setIsExpanded] = useState(false);

     return (
          <div
               className={cn(
                    'fixed bottom-0 left-0 right-0 z-20 transition-all duration-300',
                    className
               )}
          >
               {/* Main Control Bar */}
               <div className="bg-background/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
                    <div className="container mx-auto px-4 py-3">
                         {children}
                    </div>
               </div>
          </div>
     );
}

interface ControlBarSectionProps {
     title: string;
     icon?: React.ReactNode;
     children: React.ReactNode;
     expandable?: boolean;
     defaultExpanded?: boolean;
     onToggle?: (expanded: boolean) => void;
}

export function ControlBarSection({
     title,
     icon,
     children,
     expandable = false,
     defaultExpanded = false,
     onToggle,
}: ControlBarSectionProps) {
     const [isExpanded, setIsExpanded] = useState(defaultExpanded);

     const handleToggle = () => {
          const newState = !isExpanded;
          setIsExpanded(newState);
          onToggle?.(newState);
     };

     if (!expandable) {
          return (
               <div className="flex items-center gap-3">
                    {icon && <div className="text-muted-foreground">{icon}</div>}
                    <div className="flex-1">{children}</div>
               </div>
          );
     }

     return (
          <div className="space-y-3">
               {/* Toggle Button */}
               <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggle}
                    className="w-full justify-between"
               >
                    <div className="flex items-center gap-2">
                         {icon}
                         <span className="font-medium">{title}</span>
                    </div>
                    {isExpanded ? (
                         <ChevronDown className="w-4 h-4" />
                    ) : (
                         <ChevronUp className="w-4 h-4" />
                    )}
               </Button>

               {/* Expandable Content */}
               <div
                    className={cn(
                         'overflow-hidden transition-all duration-300',
                         isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}
               >
                    <div className="pt-2">{children}</div>
               </div>
          </div>
     );
}

interface ControlBarGridProps {
     children: React.ReactNode;
     columns?: number;
}

export function ControlBarGrid({ children, columns = 4 }: ControlBarGridProps) {
     return (
          <div
               className={cn(
                    'grid gap-4',
                    columns === 2 && 'grid-cols-1 md:grid-cols-2',
                    columns === 3 && 'grid-cols-1 md:grid-cols-3',
                    columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
               )}
          >
               {children}
          </div>
     );
}
