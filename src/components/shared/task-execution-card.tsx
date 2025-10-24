"use client";

import { useState } from "react";
import { useUpdateTaskStatus, useTaskDependencies } from "@/hooks/use-workflow";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskCompletionModal } from "@/components/modals/task-completion-modal";
import { TaskDependencyIndicator } from "./task-dependency-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Play, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";

interface Task {
  id: string;
  sequence_order: number;
  status: TaskStatus;
  is_required: boolean;
  custom_instructions?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  started_at?: string | null;
  completed_at?: string | null;
  task_type: {
    id: string;
    name: string;
    description?: string;
    category?: string;
  };
  assigned_to?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

interface TaskExecutionCardProps {
  task: Task;
}

/**
 * Interactive task card with action buttons for task execution
 * Story 1.4: Task Execution UI
 * AC: 4, 5 - Task card shows details and quick action buttons
 *
 * Story 1.5: Task Dependencies and Status Automation
 * AC: 3, 4, 5 - Integrate dependency checks, lock tasks in strict mode, show warnings in flexible mode
 */
export function TaskExecutionCard({ task }: TaskExecutionCardProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const { updateStatus, isUpdating } = useUpdateTaskStatus();

  // Story 1.5: Fetch task dependencies
  const { dependencies } = useTaskDependencies(task.id);

  // Calculate if task is locked or has warning
  const incompleteTasks = dependencies?.prerequisites?.filter(
    (prereq) => prereq.status !== "completed" && prereq.status !== "skipped"
  ) || [];

  const enforceSequence = dependencies?.enforce_sequence ?? true;
  const isLocked = enforceSequence && incompleteTasks.length > 0;
  const hasWarning = !enforceSequence && incompleteTasks.length > 0;

  const handleStartTask = () => {
    updateStatus({
      task_id: task.id,
      status: "in_progress",
    });
  };

  const handleBlockTask = () => {
    updateStatus({
      task_id: task.id,
      status: "blocked",
    });
  };

  const handleCompleteTask = () => {
    setShowCompletionModal(true);
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (task.status) {
      case "pending":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{task.sequence_order}
                  </span>
                  <h3 className="font-semibold">{task.task_type.name}</h3>
                  {/* Story 1.5: Task dependency indicator */}
                  <TaskDependencyIndicator
                    taskId={task.id}
                    isLocked={isLocked}
                    hasWarning={hasWarning}
                    prerequisiteTasks={dependencies?.prerequisites}
                  />
                  {task.is_required && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                      Bắt buộc
                    </span>
                  )}
                  {task.task_type.category && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {task.task_type.category}
                    </span>
                  )}
                </div>
                {task.task_type.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.task_type.description}
                  </p>
                )}
              </div>
              <TaskStatusBadge status={task.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Task metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.estimated_duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Ước tính: {task.estimated_duration_minutes} phút
                </span>
              </div>
            )}
            {task.actual_duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Thực tế: {task.actual_duration_minutes} phút
                </span>
              </div>
            )}
          </div>

          {/* Custom instructions */}
          {task.custom_instructions && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Ghi chú:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.custom_instructions}
              </p>
            </div>
          )}

          {/* Assigned to */}
          {task.assigned_to && (
            <div className="text-sm text-muted-foreground">
              Phân công cho: <span className="font-medium">{task.assigned_to.full_name}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {task.status === "pending" && (
              <Button
                onClick={handleStartTask}
                disabled={isUpdating}
                size="sm"
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Bắt đầu công việc
              </Button>
            )}

            {task.status === "in_progress" && (
              <>
                <Button
                  onClick={handleCompleteTask}
                  disabled={isUpdating || isLocked}
                  size="sm"
                  className="flex-1"
                  title={isLocked ? "Hoàn thành các công việc trước đó để mở khóa" : ""}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Hoàn thành
                </Button>
                <Button
                  onClick={handleBlockTask}
                  disabled={isUpdating}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Bị chặn
                </Button>
              </>
            )}

            {task.status === "blocked" && (
              <Button
                onClick={handleStartTask}
                disabled={isUpdating}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Tiếp tục công việc
              </Button>
            )}

            {task.status === "completed" && (
              <div className="text-sm text-muted-foreground italic">
                Đã hoàn thành {task.completed_at && `vào ${new Date(task.completed_at).toLocaleString('vi-VN')}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completion Modal - Story 1.5: Pass dependency warnings */}
      <TaskCompletionModal
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        taskId={task.id}
        taskName={task.task_type.name}
        hasWarning={hasWarning}
        incompleteTasks={incompleteTasks}
      />
    </>
  );
}
