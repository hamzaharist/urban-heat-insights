import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingPanelProps {
     children: ReactNode;
     position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'right';
     collapsible?: boolean;
     defaultCollapsed?: boolean;
     onClose?: () => void;
     className?: string;
     title?: string;
}

export function FloatingPanel({
     children,
     position = 'top-left',
     collapsible = false,
     defaultCollapsed = false,
     onClose,
     className,
     title,
}: FloatingPanelProps) {
     const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

     const positionClasses = {
          'top-left': 'top-4 left-4',
          'top-right': 'top-4 right-4',
          'bottom-left': 'bottom-4 left-4',
          'bottom-right': 'bottom-4 right-4',
          'right': 'top-1/2 -translate-y-1/2 right-4',
     };

     return (
          <div
               className={cn(
                    'absolute z-10 transition-all duration-300',
                    positionClasses[position],
                    className
               )}
          >
               <div
                    className={cn(
                         'backdrop-blur-md bg-background/90 border border-border/50',
                         'rounded-2xl shadow-lg',
                         'transition-all duration-300',
                         isCollapsed ? 'max-h-14' : 'max-h-[600px]'
                    )}
               >
                    {/* Header */}
                    {(title || collapsible || onClose) && (
                         <div className="flex items-center justify-between p-4 border-b border-border/30">
                              {title && (
                                   <h3 className="font-display font-semibold text-foreground text-sm">
                                        {title}
                                   </h3>
                              )}
                              <div className="flex items-center gap-2">
                                   {collapsible && (
                                        <button
                                             onClick={() => setIsCollapsed(!isCollapsed)}
                                             className="p-1 hover:bg-muted rounded-lg transition-colors"
                                             aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                                        >
                                             {isCollapsed ? (
                                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                             ) : (
                                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                             )}
                                        </button>
                                   )}
                                   {onClose && (
                                        <button
                                             onClick={onClose}
                                             className="p-1 hover:bg-muted rounded-lg transition-colors"
                                             aria-label="Close"
                                        >
                                             <X className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                   )}
                              </div>
                         </div>
                    )}

                    {/* Content */}
                    {!isCollapsed && (
                         <div className="p-4">
                              {children}
                         </div>
                    )}
               </div>
          </div>
     );
}
