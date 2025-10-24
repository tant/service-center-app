"use client";

import { useState } from "react";
import { useCompleteTask } from "@/hooks/use-workflow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

interface PrerequisiteTask {
  id: string;
  sequence_order: number;
  status: string;
  task_type?: {
    id: string;
    name: string;
  }[] | {
    id: string;
    name: string;
  };
}

interface TaskCompletionModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskName?: string;
  hasWarning?: boolean;
  incompleteTasks?: PrerequisiteTask[];
}

/**
 * Modal for completing a task with required completion notes
 * Story 1.4: Task Execution UI
 * AC: 6 - Task completion modal requires completion_notes (validation)
 *
 * Story 1.5: Task Dependencies and Status Automation
 * AC: 6 - Display warnings when completing tasks out of sequence in flexible mode
 */
export function TaskCompletionModal({
  open,
  onClose,
  taskId,
  taskName,
  hasWarning = false,
  incompleteTasks = [],
}: TaskCompletionModalProps) {
  const [completionNotes, setCompletionNotes] = useState("");
  const [validationError, setValidationError] = useState("");
  const { completeTask, isCompleting } = useCompleteTask();

  // Helper function to get task_type safely (handles both array and object)
  const getTaskType = (task: PrerequisiteTask) => {
    if (!task.task_type) return null;
    return Array.isArray(task.task_type) ? task.task_type[0] : task.task_type;
  };

  const handleSubmit = () => {
    // Validation: minimum 5 characters
    if (completionNotes.trim().length < 5) {
      setValidationError("Ghi chú hoàn thành phải có ít nhất 5 ký tự");
      return;
    }

    // Clear validation error
    setValidationError("");

    // Complete the task
    completeTask(
      {
        task_id: taskId,
        completion_notes: completionNotes.trim(),
      },
      {
        onSuccess: () => {
          // Reset form and close modal
          setCompletionNotes("");
          onClose();
        },
      }
    );
  };

  const handleCancel = () => {
    setCompletionNotes("");
    setValidationError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Hoàn thành công việc</DialogTitle>
          <DialogDescription>
            {taskName
              ? `Vui lòng nhập ghi chú hoàn thành cho công việc: ${taskName}`
              : "Vui lòng nhập ghi chú hoàn thành cho công việc này"}
          </DialogDescription>
        </DialogHeader>

        {/* Story 1.5: Warning when completing out of sequence in flexible mode */}
        {hasWarning && incompleteTasks.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Cảnh báo: Hoàn thành không theo thứ tự</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Bạn đang hoàn thành công việc này trước khi hoàn thành các công việc trước đó.
                Template đang ở chế độ linh hoạt nên hệ thống sẽ cho phép, nhưng khuyến nghị hoàn thành theo thứ tự.
              </p>
              <div className="mt-2">
                <p className="font-medium text-sm mb-1">Các công việc chưa hoàn thành:</p>
                <ul className="space-y-1">
                  {incompleteTasks.map((task) => {
                    const taskType = getTaskType(task);
                    return (
                      <li key={task.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-8 justify-center">
                          #{task.sequence_order}
                        </Badge>
                        <span>{taskType?.name || "Unknown task"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="completion-notes">
              Ghi chú hoàn thành <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="completion-notes"
              placeholder="Mô tả công việc đã thực hiện, kết quả đạt được, vấn đề đã giải quyết..."
              value={completionNotes}
              onChange={(e) => {
                setCompletionNotes(e.target.value);
                if (validationError) setValidationError("");
              }}
              rows={5}
              className={validationError ? "border-destructive" : ""}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Tối thiểu 5 ký tự. Ghi chú này sẽ được lưu vào lịch sử công việc.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isCompleting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isCompleting || completionNotes.trim().length < 5}
          >
            {isCompleting ? "Đang xử lý..." : "Hoàn thành công việc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
