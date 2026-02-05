/**
 * Single task item component for workflow detail
 */

import { IconCheck } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import type { WorkflowTaskItem } from "./types";

interface WorkflowTaskItemProps {
  task: WorkflowTaskItem;
  index: number;
}

export function WorkflowTaskItemCard({ task, index }: WorkflowTaskItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">
            {task.task_type?.name || "Unknown Task"}
          </h4>
          {task.task_type?.category && (
            <Badge variant="outline" className="text-xs">
              {task.task_type.category}
            </Badge>
          )}
          {task.is_required && (
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <IconCheck className="h-3 w-3" />
              Bắt buộc
            </Badge>
          )}
        </div>

        {task.custom_instructions && (
          <p className="text-sm text-muted-foreground">
            {task.custom_instructions}
          </p>
        )}
      </div>
    </div>
  );
}
