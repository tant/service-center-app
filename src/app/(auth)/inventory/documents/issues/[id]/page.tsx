"use client";

/**
 * Issue Detail Page
 * Allows viewing and editing stock issue details
 */

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { PageHeader } from "@/components/page-header";
import { IssueDetailHeader } from "@/components/inventory/documents/issue-detail-header";
import { IssueItemsTable } from "@/components/inventory/documents/issue-items-table";
import { WorkflowSelectionDialog } from "@/components/workflows/workflow-selection-dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { CompleteTaskDialog, BlockTaskDialog } from "@/components/tasks/task-action-dialogs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, ListTodo } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);

  // Task action dialog state
  const [completeTaskDialog, setCompleteTaskDialog] = useState<{ open: boolean; taskId: string | null; taskName: string }>({
    open: false,
    taskId: null,
    taskName: "",
  });
  const [blockTaskDialog, setBlockTaskDialog] = useState<{ open: boolean; taskId: string | null; taskName: string }>({
    open: false,
    taskId: null,
    taskName: "",
  });

  const { data: issue, isLoading, refetch } = trpc.inventory.issues.getById.useQuery({ id });
  const { data: taskData, refetch: refetchTasks } = trpc.tasks.getEntityTasks.useQuery(
    { entityType: "inventory_issue", entityId: id },
    { refetchInterval: 30000 }
  );
  const tasks = taskData?.tasks || [];

  // Task mutations
  const startTaskMutation = trpc.tasks.startTask.useMutation();
  const completeTaskMutation = trpc.tasks.completeTask.useMutation();
  const blockTaskMutation = trpc.tasks.blockTask.useMutation();
  const unblockTaskMutation = trpc.tasks.unblockTask.useMutation();

  // Task action handlers
  const handleStartTask = async (taskId: string) => {
    try {
      await startTaskMutation.mutateAsync({ taskId });
      toast.success("Đã bắt đầu công việc");
      refetchTasks();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể bắt đầu công việc");
    }
  };

  const handleCompleteTask = (taskId: string, taskName: string) => {
    setCompleteTaskDialog({ open: true, taskId, taskName });
  };

  const handleCompleteTaskConfirm = async (notes: string) => {
    if (!completeTaskDialog.taskId) return;

    try {
      await completeTaskMutation.mutateAsync({
        taskId: completeTaskDialog.taskId,
        completionNotes: notes,
      });
      toast.success("Đã hoàn thành công việc");
      setCompleteTaskDialog({ open: false, taskId: null, taskName: "" });
      refetchTasks();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể hoàn thành công việc");
    }
  };

  const handleBlockTask = (taskId: string, taskName: string) => {
    setBlockTaskDialog({ open: true, taskId, taskName });
  };

  const handleBlockTaskConfirm = async (reason: string) => {
    if (!blockTaskDialog.taskId) return;

    try {
      await blockTaskMutation.mutateAsync({
        taskId: blockTaskDialog.taskId,
        blockedReason: reason,
      });
      toast.success("Đã báo chặn công việc");
      setBlockTaskDialog({ open: false, taskId: null, taskName: "" });
      refetchTasks();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể báo chặn công việc");
    }
  };

  const handleUnblockTask = async (taskId: string) => {
    try {
      await unblockTaskMutation.mutateAsync({ taskId });
      toast.success("Đã bỏ chặn công việc");
      refetchTasks();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể bỏ chặn công việc");
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu xuất" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu xuất" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy phiếu xuất
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Check if all items have complete serials
  const allItemsComplete = issue.items?.every(
    (item) => (item.serials?.length || 0) === item.quantity
  );

  return (
    <>
      <PageHeader title="Chi tiết phiếu xuất" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Back Button and Actions */}
            <div className="flex items-center justify-between px-4 lg:px-6">
              <Link href="/inventory/documents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWorkflowDialogOpen(true)}
                >
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden lg:inline">Tạo công việc</span>
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-6 space-y-4">
              <IssueDetailHeader issue={issue} />

              {/* Tasks Section */}
              {tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      Công việc ({tasks.filter((t: any) => t.status === "completed").length}/{tasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStartTask={handleStartTask}
                        onCompleteTask={(taskId) => handleCompleteTask(taskId, task.name)}
                        onBlockTask={(taskId) => handleBlockTask(taskId, task.name)}
                        onUnblockTask={handleUnblockTask}
                        isLoading={
                          startTaskMutation.isPending ||
                          completeTaskMutation.isPending ||
                          blockTaskMutation.isPending ||
                          unblockTaskMutation.isPending
                        }
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              <IssueItemsTable issue={issue} onSerialsSelected={() => refetch()} />
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Selection Dialog */}
      <WorkflowSelectionDialog
        open={isWorkflowDialogOpen}
        onOpenChange={setIsWorkflowDialogOpen}
        entityType="inventory_issue"
        entityId={id}
        onSuccess={() => {
          refetchTasks();
          refetch();
        }}
      />

      {/* Task Action Dialogs */}
      <CompleteTaskDialog
        open={completeTaskDialog.open}
        onOpenChange={(open) =>
          !open && setCompleteTaskDialog({ open: false, taskId: null, taskName: "" })
        }
        onConfirm={handleCompleteTaskConfirm}
        taskName={completeTaskDialog.taskName}
        isLoading={completeTaskMutation.isPending}
      />

      <BlockTaskDialog
        open={blockTaskDialog.open}
        onOpenChange={(open) =>
          !open && setBlockTaskDialog({ open: false, taskId: null, taskName: "" })
        }
        onConfirm={handleBlockTaskConfirm}
        taskName={blockTaskDialog.taskName}
        isLoading={blockTaskMutation.isPending}
      />

    </>
  );
}
