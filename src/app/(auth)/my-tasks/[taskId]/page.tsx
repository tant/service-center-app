/**
 * Task Detail Page
 * Shows task information and allows attachment upload
 */

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconArrowLeft, IconClock, IconUser, IconFileText, IconChecklist, IconNotes, IconPhoto } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";
import { TaskAttachmentUpload } from "@/components/tasks/task-attachment-upload";
import { TaskNotesSection } from "@/components/tasks/task-notes-section";
import { toast } from "sonner";

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

  const completeTaskMutation = trpc.tasks.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Công việc đã hoàn thành!");
      router.back();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

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
    <div className="container mx-auto py-8 space-y-6">
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

      {/* Task Notes Section */}
      <TaskNotesSection
        taskId={taskId}
        currentNotes={task.task_notes || ""}
        isRequired={requirements?.requiresNotes}
        isCompleted={task.status === "completed"}
      />

      {/* Attachment Upload - Only for in_progress or pending tasks */}
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
  );
}
