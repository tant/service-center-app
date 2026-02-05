"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { IconPlus } from "@tabler/icons-react";
import { Eye } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ValidationSummary } from "@/components/workflows/validation-summary";
import { WorkflowPreview } from "@/components/workflows/workflow-preview";
import {
  validateWorkflow,
  type WorkflowValidationResult,
} from "@/lib/workflow-validation";
import { SortableTaskItem } from "./sortable-task-item";
import { useTemplateTasks } from "./use-template-tasks";

interface TemplateFormData {
  name: string;
  description: string;
  entity_type:
    | "service_ticket"
    | "inventory_receipt"
    | "inventory_issue"
    | "inventory_transfer"
    | "service_request";
  enforce_sequence: boolean;
  notes?: string;
}

interface TemplateFormProps {
  mode: "create" | "edit";
  initialData?: Partial<TemplateFormData>;
  initialTasks?: any[];
  tasks: Array<{ id: string; name: string; category?: string }>;
  isSubmitting: boolean;
  onSubmit: (data: TemplateFormData & { tasks: any[] }) => void;
  onCancel: () => void;
}

export function TemplateForm({
  mode,
  initialData,
  initialTasks = [],
  tasks,
  isSubmitting,
  onSubmit,
  onCancel,
}: TemplateFormProps) {
  const [formData, setFormData] = React.useState<TemplateFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    entity_type: initialData?.entity_type || "service_ticket",
    enforce_sequence: initialData?.enforce_sequence ?? true,
    notes: initialData?.notes || "",
  });

  // Convert initial tasks to TaskItem format with temporary IDs
  const initialTaskItems = React.useMemo(() => {
    if (!initialTasks || initialTasks.length === 0) return [];
    return initialTasks.map((task: any) => ({
      id: task.id || `temp-${Date.now()}-${task.sequence_order}`,
      task_type_id: task.task_id || "",
      sequence_order: task.sequence_order || 0,
      is_required: task.is_required ?? true,
      custom_instructions: task.custom_instructions || "",
    }));
  }, [initialTasks]);

  const {
    tasks: workflowTasks,
    sensors,
    handleDragEnd,
    handleAddTask,
    handleUpdateTask,
    handleRemoveTask,
  } = useTemplateTasks(initialTaskItems);

  // Real-time validation
  const validation = React.useMemo<WorkflowValidationResult>(() => {
    return validateWorkflow({
      name: formData.name,
      description: formData.description,
      entity_type: formData.entity_type,
      enforce_sequence: formData.enforce_sequence,
      tasks: workflowTasks,
    });
  }, [formData, workflowTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check validation before submitting
    if (!validation.isValid) {
      return;
    }

    const workflowData = {
      ...formData,
      tasks: workflowTasks.map(({ id, ...task }) => task), // Remove temporary IDs
    };

    onSubmit(workflowData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin mẫu</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Nhập thông tin cơ bản về mẫu quy trình"
              : "Cập nhật thông tin của mẫu quy trình"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên mẫu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="VD: Bảo hành VGA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả chi tiết về mẫu quy trình này"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú và hướng dẫn</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Thêm ghi chú, hướng dẫn chi tiết, lưu ý đặc biệt..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.notes?.length || 0}/2000 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity_type">Loại tài liệu áp dụng *</Label>
            <Select
              value={formData.entity_type}
              onValueChange={(value: any) =>
                setFormData({ ...formData, entity_type: value })
              }
            >
              <SelectTrigger id="entity_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_ticket">Phiếu sửa chữa</SelectItem>
                <SelectItem value="service_request">
                  Phiếu yêu cầu dịch vụ
                </SelectItem>
                <SelectItem value="inventory_receipt">
                  Phiếu nhập kho
                </SelectItem>
                <SelectItem value="inventory_issue">Phiếu xuất kho</SelectItem>
                <SelectItem value="inventory_transfer">
                  Phiếu chuyển kho
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Quy trình này chỉ có thể được sử dụng cho loại tài liệu đã chọn
            </p>
          </div>

          <Separator />

          {/* Story 1.5: Enforce Sequential Execution Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforce_sequence" className="text-base">
                  Thực hiện theo thứ tự
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.enforce_sequence
                    ? "Công việc phải hoàn thành theo đúng thứ tự (chế độ chặt chẽ)"
                    : "Công việc có thể hoàn thành không theo thứ tự (chế độ linh hoạt)"}
                </div>
              </div>
              <Switch
                id="enforce_sequence"
                checked={formData.enforce_sequence}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enforce_sequence: checked })
                }
              />
            </div>

            {/* Warning when flexible mode is enabled */}
            {!formData.enforce_sequence && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Cảnh báo:</strong> Chế độ linh hoạt cho phép kỹ thuật
                  viên hoàn thành công việc không theo thứ tự. Hệ thống sẽ hiển
                  thị cảnh báo nhưng không chặn việc hoàn thành. Chỉ sử dụng chế
                  độ này khi thứ tự công việc không quan trọng.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Danh sách công việc ({workflowTasks.length})
              </CardTitle>
              <CardDescription>
                Kéo thả để sắp xếp thứ tự công việc
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTask}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Thêm công việc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workflowTasks.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              Chưa có công việc nào. Nhấn "Thêm công việc" để bắt đầu.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={workflowTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {workflowTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      tasks={tasks}
                      onUpdate={handleUpdateTask}
                      onRemove={() => handleRemoveTask(task.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <ValidationSummary validation={validation} />

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Preview Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={workflowTasks.length === 0}
              className="w-full sm:w-auto"
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem trước quy trình
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Xem trước quy trình</DialogTitle>
            </DialogHeader>
            <WorkflowPreview
              name={formData.name}
              description={formData.description}
              entity_type={formData.entity_type}
              enforce_sequence={formData.enforce_sequence}
              notes={formData.notes}
              tasks={workflowTasks.map((t) => ({
                ...t,
                task_name: tasks.find((task) => task.id === t.task_type_id)
                  ?.name,
              }))}
            />
          </DialogContent>
        </Dialog>

        {/* Save/Cancel Buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !validation.isValid}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? mode === "create"
                ? "Đang tạo..."
                : "Đang cập nhật..."
              : mode === "create"
                ? "Tạo mẫu quy trình"
                : "Cập nhật mẫu quy trình"}
          </Button>
        </div>
      </div>
    </form>
  );
}
