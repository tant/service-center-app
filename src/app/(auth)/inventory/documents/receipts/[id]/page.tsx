"use client";

/**
 * Receipt Detail Page
 * Allows viewing and editing stock receipt details
 */

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { PageHeader } from "@/components/page-header";
import { ReceiptDetailHeader } from "@/components/inventory/documents/receipt-detail-header";
import { ReceiptItemsTable } from "@/components/inventory/documents/receipt-items-table";
import { SerialEntryCard, SerialEntryStatus } from "@/components/inventory/serials";
import { WorkflowSelectionDialog } from "@/components/workflows/workflow-selection-dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { CompleteTaskDialog, BlockTaskDialog } from "@/components/tasks/task-action-dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, CheckCircle, Trash2, X, ListTodo } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ReceiptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReceiptDetailPage({ params }: ReceiptDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
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

  const { data: receipt, isLoading, refetch } = trpc.inventory.receipts.getById.useQuery({ id });
  const { data: taskData, refetch: refetchTasks } = trpc.tasks.getEntityTasks.useQuery(
    { entityType: "inventory_receipt", entityId: id },
    { refetchInterval: 30000 }
  );
  const tasks = taskData?.tasks || [];
  const submitForApproval = trpc.inventory.receipts.submitForApproval.useMutation();
  const approveReceipt = trpc.inventory.receipts.approve.useMutation();
  const rejectReceipt = trpc.inventory.receipts.reject.useMutation();
  const deleteReceipt = trpc.inventory.receipts.delete.useMutation();

  // Task mutations
  const startTaskMutation = trpc.tasks.startTask.useMutation();
  const completeTaskMutation = trpc.tasks.completeTask.useMutation();
  const blockTaskMutation = trpc.tasks.blockTask.useMutation();
  const unblockTaskMutation = trpc.tasks.unblockTask.useMutation();

  const utils = trpc.useUtils();

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval.mutateAsync({ id });
      toast.success("Đã gửi phiếu nhập để duyệt");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi phiếu nhập");
    }
  };

  const handleApprove = async () => {
    if (!confirm("Bạn có chắc chắn muốn duyệt phiếu nhập này?")) {
      return;
    }

    try {
      await approveReceipt.mutateAsync({ id });
      toast.success("Đã duyệt phiếu nhập");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể duyệt phiếu nhập");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await rejectReceipt.mutateAsync({ id, reason: rejectionReason });
      toast.success("Đã từ chối phiếu nhập");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể từ chối phiếu nhập");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu nhập này?")) {
      return;
    }

    try {
      await deleteReceipt.mutateAsync({ id });
      toast.success("Đã xóa phiếu nhập");
      router.push("/inventory/documents");
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa phiếu nhập");
    }
  };

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
        <PageHeader title="Chi tiết phiếu nhập" />
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

  if (!receipt) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu nhập" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy phiếu nhập
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Calculate serial entry progress
  const totalDeclaredQuantity = receipt.items?.reduce((sum, item) => sum + item.declared_quantity, 0) || 0;
  const totalSerialCount = receipt.items?.reduce((sum, item) => sum + (item.serials?.length || 0), 0) || 0;
  const allItemsComplete = totalDeclaredQuantity > 0 && totalSerialCount === totalDeclaredQuantity;

  // Allow submission even with partial serials (business requirement change)
  const canSubmitForApproval = receipt.status === "draft";
  const canDelete = receipt.status === "draft";
  const canApprove = receipt.status === "pending_approval";
  const canReject = receipt.status === "pending_approval";

  // Determine serial entry status
  const getSerialEntryStatus = (): SerialEntryStatus => {
    if (allItemsComplete) return "complete";
    if (totalSerialCount === 0) return "pending";
    // Check if task is overdue (> 7 days) - placeholder logic
    const createdAt = new Date(receipt.created_at);
    const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > 7 && !allItemsComplete) return "overdue";
    return "in-progress";
  };

  const serialEntryStatus = getSerialEntryStatus();
  const showSerialEntryCard = (receipt.status === "approved" || receipt.status === "completed") && !allItemsComplete;

  return (
    <>
      <PageHeader title="Chi tiết phiếu nhập" />
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

                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteReceipt.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden lg:inline">Xóa phiếu</span>
                  </Button>
                )}

                {canSubmitForApproval && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSubmitForApproval}
                    disabled={submitForApproval.isPending}
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden lg:inline">Gửi duyệt</span>
                  </Button>
                )}

                {canReject && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={rejectReceipt.isPending}
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden lg:inline">Từ chối</span>
                  </Button>
                )}

                {canApprove && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApprove}
                    disabled={approveReceipt.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden lg:inline">Duyệt phiếu</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-6 space-y-4">
              <ReceiptDetailHeader receipt={receipt} />

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

              {/* Serial Entry Status Card - shown after approval if serials incomplete */}
              {showSerialEntryCard && receipt.created_by && (
                <SerialEntryCard
                  receiptId={receipt.id}
                  status={serialEntryStatus}
                  progress={{
                    current: totalSerialCount,
                    total: totalDeclaredQuantity,
                  }}
                  lastUpdated={receipt.updated_at ? new Date(receipt.updated_at) : undefined}
                  assignedTo={{
                    id: typeof receipt.created_by === 'string' ? receipt.created_by : receipt.created_by?.id || "",
                    full_name: typeof receipt.created_by === 'object' && receipt.created_by?.full_name ? receipt.created_by.full_name : "Unknown User",
                  }}
                  taskAge={Math.floor((Date.now() - new Date(receipt.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  onContinue={() => {
                    // Scroll to items table where serials can be added
                    document.querySelector('[data-serial-entry]')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  canEdit={receipt.status === "approved" || receipt.status === "completed"}
                />
              )}

              <div data-serial-entry>
                <ReceiptItemsTable receipt={receipt} onSerialsAdded={() => refetch()} />
              </div>

              {!allItemsComplete && receipt.status === "draft" && totalDeclaredQuantity > 0 && (
                <div className="rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700 p-4">
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Lưu ý:</strong> Bạn có thể gửi duyệt ngay cả khi chưa nhập đủ serial.
                    Stock sẽ được cập nhật ngay sau khi duyệt, còn serial có thể nhập tiếp sau.
                    Tiến độ: {totalSerialCount}/{totalDeclaredQuantity} serial ({Math.round((totalSerialCount / totalDeclaredQuantity) * 100)}%)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối phiếu nhập</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối phiếu nhập này. Lý do sẽ được lưu lại để tham khảo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Lý do từ chối *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectReceipt.isPending || !rejectionReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Selection Dialog */}
      <WorkflowSelectionDialog
        open={isWorkflowDialogOpen}
        onOpenChange={setIsWorkflowDialogOpen}
        entityType="inventory_receipt"
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
