/**
 * Story 1.17: Dynamic Template Switching During Service
 * Modal for switching task template mid-service
 * Preserves completed tasks and adds new tasks from selected template
 */

"use client";

import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSwitchTemplate } from "@/hooks/use-workflow";

interface SwitchTemplateModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  currentTemplateId: string;
  currentTemplateName?: string;
}

export function SwitchTemplateModal({
  open,
  onClose,
  ticketId,
  currentTemplateId,
  currentTemplateName,
}: SwitchTemplateModalProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");

  const { switchTemplate, isSwitching } = useSwitchTemplate();

  // Fetch available templates
  const { data: workflows, isLoading: workflowsLoading } =
    trpc.workflow.template.list.useQuery({});

  // Fetch selected template details for preview
  const { data: selectedWorkflow } = trpc.workflow.template.getById.useQuery(
    { template_id: selectedWorkflowId },
    { enabled: !!selectedWorkflowId },
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedWorkflowId("");
      setReason("");
      setValidationError("");
    }
  }, [open]);

  const handleSubmit = () => {
    // Validation
    if (!selectedWorkflowId) {
      setValidationError("Vui lòng chọn mẫu quy trình mới");
      return;
    }

    if (reason.trim().length < 10) {
      setValidationError("Lý do phải có ít nhất 10 ký tự");
      return;
    }

    // Clear validation error
    setValidationError("");

    // Switch template
    switchTemplate(
      {
        ticket_id: ticketId,
        new_template_id: selectedWorkflowId,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          // Reset form and close modal
          setSelectedWorkflowId("");
          setReason("");
          onClose();
        },
      },
    );
  };

  const handleCancel = () => {
    setSelectedWorkflowId("");
    setReason("");
    setValidationError("");
    onClose();
  };

  // Filter out current template from list
  const availableWorkflows =
    workflows?.filter((t) => t.id !== currentTemplateId && t.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Chuyển đổi mẫu quy trình</DialogTitle>
          <DialogDescription>
            Thay đổi mẫu quy trình khi chẩn đoán phát hiện vấn đề khác. Các công
            việc đã hoàn thành sẽ được giữ lại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Template Info */}
          <Alert>
            <IconInfoCircle className="h-4 w-4" />
            <AlertTitle>Mẫu quy trình hiện tại</AlertTitle>
            <AlertDescription>
              {currentTemplateName || "Không xác định"}
            </AlertDescription>
          </Alert>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Cảnh báo quan trọng</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>
                  Các công việc đã hoàn thành và đang thực hiện sẽ được giữ lại
                </li>
                <li>Các công việc đang chờ hoặc bị chặn sẽ bị xóa</li>
                <li>Công việc mới từ mẫu quy trình mới sẽ được thêm vào</li>
                <li>Thao tác này sẽ được ghi lại trong lịch sử audit</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template-select">
              Chọn mẫu quy trình mới <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedWorkflowId}
              onValueChange={(value) => {
                setSelectedWorkflowId(value);
                if (validationError) setValidationError("");
              }}
              disabled={workflowsLoading || isSwitching}
            >
              <SelectTrigger id="template-select">
                <SelectValue placeholder="-- Chọn mẫu quy trình --" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkflows.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Không có mẫu quy trình khả dụng
                  </div>
                ) : (
                  availableWorkflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      <div className="flex items-center gap-2">
                        <span>{workflow.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {workflow.service_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedWorkflow && (
            <div className="space-y-2">
              <Label>Xem trước công việc</Label>
              <div className="border rounded-md">
                <div className="h-[200px] overflow-y-auto p-4">
                  <div className="space-y-2">
                    {selectedWorkflow.tasks?.map((task: any, index: number) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Badge
                          variant="outline"
                          className="w-8 justify-center shrink-0"
                        >
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium">
                            {task.tasks?.name || "Unknown Task"}
                          </div>
                          {task.custom_instructions && (
                            <div className="text-muted-foreground text-xs mt-1">
                              {task.custom_instructions}
                            </div>
                          )}
                        </div>
                        {task.is_required && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            Bắt buộc
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng: {selectedWorkflow.tasks?.length || 0} công việc
              </p>
            </div>
          )}

          <Separator />

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Lý do chuyển đổi <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ví dụ: Sau khi chẩn đoán, phát hiện vấn đề là màn hình bị vỡ chứ không phải lỗi phần mềm như báo cáo ban đầu..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError("");
              }}
              rows={4}
              disabled={isSwitching}
              className={validationError ? "border-destructive" : ""}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Tối thiểu 10 ký tự. Lý do này sẽ được lưu vào lịch sử audit và
              thông báo cho quản lý.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSwitching}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSwitching || !selectedWorkflowId || reason.trim().length < 10
            }
          >
            {isSwitching ? "Đang xử lý..." : "Xác nhận chuyển đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
