"use client";

import {
  IconAlertCircle,
  IconAlertTriangle,
  IconNotes,
  IconPhoto,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteTask } from "@/hooks/use-workflow";

interface PrerequisiteTask {
  id: string;
  sequence_order: number;
  status: string;
  task_type?:
    | {
        id: string;
        name: string;
      }[]
    | {
        id: string;
        name: string;
      };
}

interface TaskCompletionModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskName?: string;
  currentTaskNotes?: string;
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
 *
 * Updated 2025-11-15: Added task_notes and photo requirements validation
 */
export function TaskCompletionModal({
  open,
  onClose,
  taskId,
  taskName,
  currentTaskNotes = "",
  hasWarning = false,
  incompleteTasks = [],
}: TaskCompletionModalProps) {
  const [completionNotes, setCompletionNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { completeTask, isCompleting } = useCompleteTask();

  // Fetch task requirements
  const { data: requirements, isLoading: loadingReqs } =
    trpc.tasks.getTaskRequirements.useQuery({ taskId }, { enabled: open });

  // Fetch attachments
  const { data: attachments } = trpc.tasks.getTaskAttachments.useQuery(
    { taskId },
    { enabled: open },
  );

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setCompletionNotes("");
      setValidationErrors([]);
    }
  }, [open]);

  // Helper function to get task_type safely (handles both array and object)
  const getTaskType = (task: PrerequisiteTask) => {
    if (!task.task_type) return null;
    return Array.isArray(task.task_type) ? task.task_type[0] : task.task_type;
  };

  const handleSubmit = () => {
    const errors: string[] = [];

    // Validate completion notes (always required)
    if (completionNotes.trim().length < 5) {
      errors.push("Ghi chú hoàn thành phải có ít nhất 5 ký tự");
    }

    // Validate task notes (conditional)
    if (
      requirements?.requiresNotes &&
      (!currentTaskNotes || currentTaskNotes.trim().length === 0)
    ) {
      errors.push("Ghi chú công việc là bắt buộc cho loại công việc này");
    }

    // Validate attachments (conditional)
    if (
      requirements?.requiresPhoto &&
      (!attachments || attachments.length === 0)
    ) {
      errors.push("Phải upload ít nhất 1 ảnh/tài liệu cho loại công việc này");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear validation errors
    setValidationErrors([]);

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
      },
    );
  };

  const handleCancel = () => {
    setCompletionNotes("");
    setValidationErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px]"
        data-testid="task-completion-dialog"
      >
        <DialogHeader>
          <DialogTitle>Hoàn thành công việc</DialogTitle>
          <DialogDescription>
            {taskName
              ? `Vui lòng nhập ghi chú hoàn thành cho công việc: ${taskName}`
              : "Vui lòng nhập ghi chú hoàn thành cho công việc này"}
          </DialogDescription>
        </DialogHeader>

        {loadingReqs ? (
          <div className="py-8 text-center text-muted-foreground">
            Đang tải yêu cầu...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Story 1.5: Warning when completing out of sequence in flexible mode */}
            {hasWarning && incompleteTasks.length > 0 && (
              <Alert variant="destructive">
                <IconAlertTriangle className="h-4 w-4" />
                <AlertTitle>Cảnh báo: Hoàn thành không theo thứ tự</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    Bạn đang hoàn thành công việc này trước khi hoàn thành các
                    công việc trước đó. Template đang ở chế độ linh hoạt nên hệ
                    thống sẽ cho phép, nhưng khuyến nghị hoàn thành theo thứ tự.
                  </p>
                  <div className="mt-2">
                    <p className="font-medium text-sm mb-1">
                      Các công việc chưa hoàn thành:
                    </p>
                    <ul className="space-y-1">
                      {incompleteTasks.map((task) => {
                        const taskType = getTaskType(task);
                        return (
                          <li
                            key={task.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Badge
                              variant="outline"
                              className="w-8 justify-center"
                            >
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

            {/* Task Notes Requirements Warning */}
            {requirements?.requiresNotes &&
              (!currentTaskNotes || currentTaskNotes.trim().length === 0) && (
                <Alert variant="destructive">
                  <IconNotes className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">Chưa có ghi chú công việc</p>
                    <p className="text-sm mt-1">
                      Loại công việc này yêu cầu ghi chú chi tiết về quá trình
                      thực hiện. Vui lòng thêm ghi chú công việc trước khi hoàn
                      thành.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

            {/* Task Notes Success */}
            {requirements?.requiresNotes &&
              currentTaskNotes &&
              currentTaskNotes.trim().length > 0 && (
                <Alert>
                  <IconNotes className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Đã có ghi chú công việc
                  </AlertDescription>
                </Alert>
              )}

            {/* Photo Requirements Warning */}
            {requirements?.requiresPhoto &&
              (!attachments || attachments.length === 0) && (
                <Alert variant="destructive">
                  <IconPhoto className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">Chưa có ảnh/tài liệu đính kèm</p>
                    <p className="text-sm mt-1">
                      Loại công việc này yêu cầu upload ít nhất 1 ảnh hoặc tài
                      liệu. Vui lòng upload trước khi hoàn thành.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

            {/* Photo Requirements Success */}
            {requirements?.requiresPhoto &&
              attachments &&
              attachments.length > 0 && (
                <Alert>
                  <IconPhoto className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Đã có {attachments.length} ảnh/tài liệu đính kèm
                  </AlertDescription>
                </Alert>
              )}

            {/* Completion Notes (Always Required) */}
            <div className="space-y-2">
              <Label htmlFor="completion-notes">
                Ghi chú hoàn thành <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="completion-notes"
                placeholder="Mô tả kết quả công việc, những gì đã hoàn thành..."
                value={completionNotes}
                onChange={(e) => {
                  setCompletionNotes(e.target.value);
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
                rows={4}
                className={
                  validationErrors.length > 0 ? "border-destructive" : ""
                }
              />
              <p className="text-sm text-muted-foreground">
                Tối thiểu 5 ký tự. Ghi chú này sẽ được lưu vào lịch sử công
                việc.
              </p>
            </div>
          </div>
        )}

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
            {isCompleting ? "Đang xử lý..." : "Hoàn thành"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
