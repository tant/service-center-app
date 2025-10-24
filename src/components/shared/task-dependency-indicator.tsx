"use client";

import * as React from "react";
import { IconLock, IconAlertTriangle } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface PrerequisiteTask {
  id: string;
  sequence_order: number;
  status: string;
  task_type?: {
    id: string;
    name: string;
    category?: string;
  }[] | {
    id: string;
    name: string;
    category?: string;
  };
}

interface TaskDependencyIndicatorProps {
  taskId: string;
  isLocked: boolean;
  hasWarning: boolean;
  prerequisiteTasks?: PrerequisiteTask[];
}

/**
 * Story 1.5: Task Dependency Indicator Component
 *
 * Displays lock icon for locked tasks (strict mode, prerequisites incomplete)
 * or warning icon for out-of-sequence tasks (flexible mode)
 */
export function TaskDependencyIndicator({
  taskId,
  isLocked,
  hasWarning,
  prerequisiteTasks = [],
}: TaskDependencyIndicatorProps) {
  // Don't render anything if neither locked nor has warning
  if (!isLocked && !hasWarning) return null;

  const incompleteTasks = prerequisiteTasks.filter(
    (task) => task.status !== "completed" && task.status !== "skipped"
  );

  // Helper function to get task_type safely (handles both array and object)
  const getTaskType = (task: PrerequisiteTask) => {
    if (!task.task_type) return null;
    return Array.isArray(task.task_type) ? task.task_type[0] : task.task_type;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {isLocked && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <IconLock className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Công việc bị khóa</p>
                <p className="text-sm">
                  Bạn phải hoàn thành các công việc sau trước:
                </p>
                <ul className="text-sm space-y-1">
                  {incompleteTasks.map((prereq) => {
                    const taskType = getTaskType(prereq);
                    return (
                      <li key={prereq.id} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-8 justify-center">
                          #{prereq.sequence_order}
                        </Badge>
                        <span>{taskType?.name || "Unknown task"}</span>
                        <Badge
                          variant={
                            prereq.status === "in_progress"
                              ? "default"
                              : prereq.status === "blocked"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {prereq.status === "pending"
                            ? "Chờ"
                            : prereq.status === "in_progress"
                              ? "Đang làm"
                              : prereq.status === "blocked"
                                ? "Bị chặn"
                                : prereq.status}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Template đang ở chế độ chặt chẽ (enforce_sequence = true)
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {hasWarning && !isLocked && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium text-yellow-600">Cảnh báo: Thực hiện không theo thứ tự</p>
                <p className="text-sm">
                  Template đang ở chế độ linh hoạt. Bạn có thể hoàn thành công việc này nhưng nên hoàn thành các công việc trước đó:
                </p>
                {incompleteTasks.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {incompleteTasks.map((prereq) => {
                      const taskType = getTaskType(prereq);
                      return (
                        <li key={prereq.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="w-8 justify-center">
                            #{prereq.sequence_order}
                          </Badge>
                          <span>{taskType?.name || "Unknown task"}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
