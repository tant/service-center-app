/**
 * Serial Progress Bar Component
 * Shows progress of serial entry: current/total with percentage
 * Features: color-coded progress, multiple variants, customizable display
 */

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressVariant = "linear" | "compact" | "minimal";

interface SerialProgressBarProps {
  current: number;
  total: number;
  variant?: ProgressVariant;
  showPercentage?: boolean;
  showCount?: boolean;
  showMessage?: boolean;
  className?: string;
}

export function SerialProgressBar({
  current,
  total,
  variant = "linear",
  showPercentage = true,
  showCount = true,
  showMessage = true,
  className = "",
}: SerialProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current >= total && total > 0;

  // Get color based on percentage
  const getColorClass = () => {
    if (percentage === 0) return "bg-red-600";
    if (percentage < 50) return "bg-red-500";
    if (percentage < 100) return "bg-yellow-600";
    return "bg-green-600";
  };

  // Get status icon and color
  const getStatusIcon = () => {
    if (isComplete) {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: "text-green-600",
      };
    }
    if (percentage === 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "text-red-600",
      };
    }
    if (percentage < 50) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-red-500",
      };
    }
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-yellow-600",
    };
  };

  const status = getStatusIcon();

  // Compact variant - single line
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={status.color}>{status.icon}</div>
        {showCount && (
          <span className="text-sm font-medium">
            {current}/{total}
          </span>
        )}
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", getColorClass())}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage && (
          <span className="text-sm font-medium tabular-nums w-10 text-right">
            {percentage}%
          </span>
        )}
      </div>
    );
  }

  // Minimal variant - just the bar
  if (variant === "minimal") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", getColorClass())}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {(showCount || showPercentage) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {showCount && (
              <span>
                {current}/{total}
              </span>
            )}
            {showPercentage && <span>{percentage}%</span>}
          </div>
        )}
      </div>
    );
  }

  // Linear variant - full details (default)
  return (
    <div className={cn("space-y-2", className)}>
      {(showCount || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {showCount && (
            <span className="font-medium">
              {current} / {total} số serial
            </span>
          )}
          {showPercentage && (
            <span
              className={cn(
                "font-medium tabular-nums",
                isComplete
                  ? "text-green-600"
                  : percentage < 50
                  ? "text-red-600"
                  : "text-yellow-600"
              )}
            >
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", getColorClass())}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {isComplete && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        )}
      </div>
      {showMessage && (
        <>
          {isComplete ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Đã hoàn thành tất cả số serial!
            </p>
          ) : percentage === 0 ? (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Chưa nhập serial nào. Còn lại {total} số.
            </p>
          ) : (
            <p
              className={cn(
                "text-xs flex items-center gap-1",
                percentage < 50 ? "text-red-500" : "text-yellow-600"
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              Còn lại {total - current} số ({100 - percentage}%)
            </p>
          )}
        </>
      )}
    </div>
  );
}
