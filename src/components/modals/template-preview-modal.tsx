"use client";

import * as React from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  template: {
    name: string;
    description?: string | null;
    service_type: string;
    enforce_sequence: boolean; // API field (mapped from DB's strict_sequence)
    is_active: boolean;
    tasks?: Array<{
      id: string;
      sequence_order: number;
      is_required: boolean;
      custom_instructions?: string | null;
      task_type: {
        name: string;
        category?: string | null;
      };
    }>;
  } | null;
}

export function TemplatePreviewModal({
  open,
  onClose,
  template,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const serviceTypeLabels: Record<string, string> = {
    warranty: "Bảo hành",
    paid: "Trả phí",
    replacement: "Thay thế",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xem trước mẫu quy trình</DialogTitle>
          <DialogDescription>
            Xem trước chi tiết mẫu quy trình trước khi kích hoạt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Tên mẫu
              </h3>
              <p className="text-base font-semibold">{template.name}</p>
            </div>

            {template.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Mô tả
                </h3>
                <p className="text-sm">{template.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Loại dịch vụ
                </h3>
                <Badge variant="outline">
                  {serviceTypeLabels[template.service_type] || template.service_type}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Trạng thái
                </h3>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? "Đang hoạt động" : "Không hoạt động"}
                </Badge>
              </div>

              {template.enforce_sequence && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Thứ tự
                  </h3>
                  <Badge variant="outline">Thứ tự bắt buộc</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Danh sách công việc ({template.tasks?.length || 0})
              </h3>
            </div>

            {!template.tasks || template.tasks.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                Không có công việc nào
              </div>
            ) : (
              <div className="space-y-2">
                {template.tasks
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{task.task_type.name}</h4>
                          {task.task_type.category && (
                            <Badge variant="outline" className="text-xs">
                              {task.task_type.category}
                            </Badge>
                          )}
                          {task.is_required && (
                            <Badge
                              variant="secondary"
                              className="text-xs flex items-center gap-1"
                            >
                              <IconCheck className="h-3 w-3" />
                              Bắt buộc
                            </Badge>
                          )}
                        </div>

                        {task.custom_instructions && (
                          <p className="text-sm text-muted-foreground">
                            {task.custom_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {template.enforce_sequence && template.tasks && template.tasks.length > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Lưu ý:</strong> Mẫu này yêu cầu thực hiện công việc theo thứ tự nghiêm ngặt.
                Các công việc phải được hoàn thành theo đúng trình tự từ 1 đến {template.tasks.length}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <IconX className="h-4 w-4 mr-2" />
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
