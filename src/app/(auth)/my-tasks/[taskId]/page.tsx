/**
 * Task Detail Page
 * Shows task information and allows attachment upload
 */

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconArrowLeft, IconClock, IconUser, IconFileText, IconChecklist, IconNotes, IconPhoto, IconCheck } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";
import { TaskAttachmentUpload } from "@/components/tasks/task-attachment-upload";
import { TaskNotesSection } from "@/components/tasks/task-notes-section";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TaskDetailPageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = use(params);
  const router = useRouter();

  const taskQuery = trpc.tasks.getTask.useQuery({ taskId });
  const { data: requirements } = trpc.tasks.getTaskRequirements.useQuery({ taskId });
  const { data: attachments } = trpc.tasks.getTaskAttachments.useQuery({ taskId });

  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionErrors, setCompletionErrors] = useState<string[]>([]);

  const completeTaskMutation = trpc.tasks.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Công việc đã hoàn thành!");
      router.back();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCompletionDialogChange = (open: boolean) => {
    setIsCompletionDialogOpen(open);
    if (!open) {
      setCompletionNotes("");
      setCompletionErrors([]);
    }
  };

  const handleSubmitCompletion = () => {
    const errors: string[] = [];
    const trimmedNotes = completionNotes.trim();

    if (trimmedNotes.length < 5) {
      errors.push("Ghi chú hoàn thành phải có ít nhất 5 ký tự");
    }

    if (requirements?.requiresNotes && (!task?.task_notes || task.task_notes.trim().length === 0)) {
      errors.push("Vui lòng bổ sung ghi chú công việc trước khi hoàn thành");
    }

    if (requirements?.requiresPhoto && (!attachments || attachments.length === 0)) {
      errors.push("Phải upload ít nhất 1 ảnh/tài liệu cho loại công việc này");
    }

    if (errors.length > 0) {
      setCompletionErrors(errors);
      return;
    }

    setCompletionErrors([]);
    completeTaskMutation.mutate(
      {
        taskId,
        completionNotes: trimmedNotes,
      },
      {
        onSuccess: () => handleCompletionDialogChange(false),
      }
    );
  };

  if (taskQuery.isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  if (taskQuery.error || !taskQuery.data) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-destructive">Không tìm thấy công việc</p>
      </div>
    );
  }

  const task = taskQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Chờ xử lý</Badge>;
      case "in_progress":
        return <Badge variant="default">Đang thực hiện</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bị chặn</Badge>;
      case "skipped":
        return <Badge variant="outline">Bỏ qua</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto space-y-6 pb-32 pt-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold flex-1">{task.name}</h1>
        <div className="flex items-center gap-2">
          {requirements?.requiresNotes && (
            <Badge variant="outline">
              <IconNotes className="h-3 w-3 mr-1" />
              Yêu cầu ghi chú
            </Badge>
          )}
          {requirements?.requiresPhoto && (
            <Badge variant="outline">
              <IconPhoto className="h-3 w-3 mr-1" />
              Yêu cầu ảnh
            </Badge>
          )}
          {getStatusBadge(task.status)}
        </div>
      </div>

      {/* Task Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Thông tin công việc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
              <p className="text-sm mt-1">{task.description}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Thời gian ước tính</p>
                <p className="text-sm font-medium">
                  {task.estimated_duration_minutes ? `${task.estimated_duration_minutes} phút` : "Chưa xác định"}
                </p>
              </div>
            </div>

            {task.assigned_to && (
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Người thực hiện</p>
                  <p className="text-sm font-medium">{task.assigned_to.full_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <IconChecklist className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Bắt buộc</p>
                <p className="text-sm font-medium">{task.is_required ? "Có" : "Không"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconFileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Thứ tự</p>
                <p className="text-sm font-medium">Công việc #{task.sequence_order}</p>
              </div>
            </div>
          </div>

          {task.completion_notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ghi chú hoàn thành</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{task.completion_notes}</p>
              </div>
            </>
          )}

          {task.blocked_reason && (
            <>
              <Separator />
              <div className="border-l-4 border-destructive pl-4">
                <p className="text-sm font-medium text-destructive">Lý do bị chặn</p>
                <p className="text-sm mt-1">{task.blocked_reason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attachment Upload - Only for in_progress or pending tasks */}
      <div id="attachments-section">
        {(task.status === "in_progress" || task.status === "pending") && (
          <TaskAttachmentUpload
            taskId={taskId}
            onUploadComplete={() => taskQuery.refetch()}
          />
        )}

        {/* Completed Task - Show attachments read-only */}
        {task.status === "completed" && (
          <TaskAttachmentUpload
            taskId={taskId}
            onUploadComplete={() => taskQuery.refetch()}
          />
        )}
      </div>

      {/* Task Notes Section */}
      <div id="notes-section">
        <TaskNotesSection
          taskId={taskId}
          currentNotes={task.task_notes || ""}
          isRequired={requirements?.requiresNotes}
          isCompleted={task.status === "completed"}
        />
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Trạng thái: {task.status === "completed" ? "Đã hoàn thành" : task.status === "in_progress" ? "Đang xử lý" : task.status === "pending" ? "Chờ thực hiện" : task.status}</p>
            <p className="text-xs text-muted-foreground">
              {requirements?.requiresNotes ? "Bắt buộc ghi chú" : "Ghi chú không bắt buộc"}
              {requirements?.requiresPhoto ? " • Bắt buộc ảnh/tài liệu" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScrollToSection("notes-section")}
            >
              <IconNotes className="h-4 w-4 mr-1" />
              Ghi chú
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScrollToSection("attachments-section")}
            >
              <IconPhoto className="h-4 w-4 mr-1" />
              Ảnh/Tài liệu
            </Button>
            <Button
              size="sm"
              disabled={task.status === "completed" || task.status === "skipped" || completeTaskMutation.isPending}
              onClick={() => handleCompletionDialogChange(true)}
            >
              {completeTaskMutation.isPending ? "Đang hoàn thành..." : (
                <>
                  <IconCheck className="h-4 w-4 mr-1" />
                  Hoàn thành
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isCompletionDialogOpen} onOpenChange={handleCompletionDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành công việc</DialogTitle>
            <DialogDescription>Nhập ghi chú hoàn thành để đóng công việc này.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {completionErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {completionErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Textarea
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              placeholder="Mô tả ngắn gọn quá trình hoặc kết quả thực hiện (ít nhất 5 ký tự)"
              minLength={5}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCompletionDialogChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={completeTaskMutation.isPending}
              onClick={handleSubmitCompletion}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
