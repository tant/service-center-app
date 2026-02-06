/**
 * Story 1.12: Service Request Tracking Page
 * AC 5: Status timeline showing progress
 */

import { IconCheck, IconCircle } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimelineItem {
  status: string;
  label: string;
  timestamp: string | null;
  completed: boolean;
}

interface RequestStatusTimelineProps {
  timeline: TimelineItem[];
}

export function RequestStatusTimeline({
  timeline,
}: RequestStatusTimelineProps) {
  return (
    <div className="relative py-4">
      {/* Vertical line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-border" />

      <div className="space-y-6">
        {timeline.map((item) => (
          <div key={item.status} className="relative flex items-start gap-4">
            {/* Status icon */}
            <div
              className={cn(
                "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm transition-all",
                item.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/50 bg-background text-muted-foreground",
              )}
            >
              {item.completed ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                <IconCircle className="h-4 w-4" />
              )}
            </div>

            {/* Status details */}
            <div className="flex-1 pt-0.5">
              <h3
                className={cn(
                  "font-semibold",
                  item.completed ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </h3>
              {item.timestamp && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
