/**
 * Workflow Selection Dialog
 *
 * Allows managers to select and assign workflows to entities.
 * Displays workflow details, task preview, and confirmation.
 */

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import type { EntityType } from "@/server/services/entity-adapters/base-adapter";

interface WorkflowSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  onSuccess?: () => void;
}

interface WorkflowWithTasks {
  id: string;
  name: string;
  description: string | null;
  strict_sequence: boolean;
  entity_type: EntityType | null;
  service_type: string | null;
  workflow_tasks: Array<{
    id: string;
    sequence_order: number;
    is_required: boolean;
    custom_instructions: string | null;
    task: {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      estimated_duration_minutes: number | null;
    };
  }>;
}

export function WorkflowSelectionDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  onSuccess,
}: WorkflowSelectionDialogProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = React.useState<string | null>(null);
  const utils = trpc.useUtils();

  // Fetch workflows for this entity type
  const { data: workflows = [], isLoading } = trpc.workflow.template.getByEntityType.useQuery(
    { entityType },
    { enabled: open }
  );

  // Create tasks from workflow mutation
  const createTasksMutation = trpc.tasks.createTasksFromWorkflow.useMutation({
    onSuccess: (taskCount) => {
      toast.success(`Đã tạo ${taskCount} công việc từ quy trình`);
      utils.tasks.getEntityTasks.invalidate({ entityType, entityId });
      onOpenChange(false);
      setSelectedWorkflowId(null);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

  const handleAssign = () => {
    if (!selectedWorkflowId) return;

    createTasksMutation.mutate({
      entityType,
      entityId,
      workflowId: selectedWorkflowId,
    });
  };

  const handleCancel = () => {
    setSelectedWorkflowId(null);
    onOpenChange(false);
  };

  // Calculate total estimated duration
  const getTotalDuration = (workflow: WorkflowWithTasks) => {
    return workflow.workflow_tasks.reduce((total, wt) => {
      return total + (wt.task.estimated_duration_minutes || 0);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn quy trình công việc</DialogTitle>
          <DialogDescription>
            Chọn quy trình để tạo danh sách công việc cho{" "}
            {entityType === "inventory_receipt" && "phiếu nhập kho"}
            {entityType === "inventory_issue" && "phiếu xuất kho"}
            {entityType === "inventory_transfer" && "phiếu chuyển kho"}
            {entityType === "service_request" && "yêu cầu dịch vụ"}
            {entityType === "service_ticket" && "phiếu sửa chữa"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Chưa có quy trình nào cho loại này.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-4 max-h-[400px]">
            <div className="space-y-4">
              {workflows.map((workflow) => {
                const isSelected = workflow.id === selectedWorkflowId;
                const totalDuration = getTotalDuration(workflow);
                const taskCount = workflow.workflow_tasks.length;

                return (
                  <div
                    key={workflow.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <div className="space-y-3">
                      {/* Workflow Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{workflow.name}</h4>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground">
                              {workflow.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Workflow Metadata */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {taskCount} công việc
                        </Badge>
                        {totalDuration > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            ~{totalDuration} phút
                          </Badge>
                        )}
                        {workflow.strict_sequence && (
                          <Badge variant="outline">
                            Tuân thủ trình tự
                          </Badge>
                        )}
                      </div>

                      {/* Task Preview (if selected) */}
                      {isSelected && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Danh sách công việc:
                            </p>
                            <div className="space-y-1">
                              {workflow.workflow_tasks
                                .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                                .map((wt: any) => (
                                  <div
                                    key={wt.id}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <span className="text-muted-foreground min-w-[24px]">
                                      {wt.sequence_order}.
                                    </span>
                                    <div className="flex-1">
                                      <span className={wt.is_required ? "font-medium" : ""}>
                                        {wt.task.name}
                                      </span>
                                      {!wt.is_required && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Tùy chọn
                                        </Badge>
                                      )}
                                      {wt.custom_instructions && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {wt.custom_instructions}
                                        </p>
                                      )}
                                      {wt.task.estimated_duration_minutes && (
                                        <p className="text-xs text-muted-foreground">
                                          ~{wt.task.estimated_duration_minutes} phút
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={createTasksMutation.isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedWorkflowId || createTasksMutation.isPending}
          >
            {createTasksMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo công việc"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
