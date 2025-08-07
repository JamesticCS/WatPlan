"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { Warning } from "@/types";

interface CourseWarningIndicatorProps {
  warnings: Warning[];
  onDismiss: (warningType: string) => void;
  onRestore: (warningType: string) => void;
}

export function CourseWarningIndicator({
  warnings,
  onDismiss,
  onRestore,
}: CourseWarningIndicatorProps) {
  const [showDismissed, setShowDismissed] = useState(false);

  const activeWarnings = warnings.filter(w => !w.dismissed);
  const dismissedWarnings = warnings.filter(w => w.dismissed);

  if (activeWarnings.length === 0 && dismissedWarnings.length === 0) return null;

  // Determine icon color: red for antireq, amber for prereq/coreq
  const hasAntireq = activeWarnings.some(w => w.type === 'ANTIREQUISITE');
  const iconColor = activeWarnings.length === 0
    ? 'text-muted-foreground'
    : hasAntireq
      ? 'text-red-500'
      : 'text-amber-500';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex-shrink-0 ${iconColor} hover:opacity-80 transition-opacity cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          draggable={false}
        >
          <AlertTriangle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        side="bottom"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            {activeWarnings.length > 0
              ? `${activeWarnings.length} warning${activeWarnings.length > 1 ? 's' : ''}`
              : 'All warnings dismissed'}
          </h4>

          {/* Active warnings */}
          {activeWarnings.map((w) => (
            <div key={w.type} className="flex items-start gap-2 text-sm">
              <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                w.type === 'ANTIREQUISITE' ? 'text-red-500' : 'text-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{w.message}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{w.details}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(w.type);
                }}
                title="Dismiss (e.g., you have a university override)"
              >
                <ShieldCheck className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Dismissed section */}
          {dismissedWarnings.length > 0 && (
            <div className="border-t pt-2">
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDismissed(!showDismissed);
                }}
              >
                {showDismissed ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {dismissedWarnings.length} dismissed
              </button>
              {showDismissed && (
                <div className="mt-2 space-y-2">
                  {dismissedWarnings.map((w) => (
                    <div key={w.type} className="flex items-start gap-2 text-sm opacity-60">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-through">{w.message}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{w.details}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(w.type);
                        }}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
