"use client";

import * as React from "react";
import { IconPlus } from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SortableTaskItem } from "./sortable-task-item";
import { useTemplateTasks } from "./use-template-tasks";

interface TemplateFormData {
  name: string;
  description: string;
  service_type: "warranty" | "paid" | "replacement";
  enforce_sequence: boolean;
}

interface TemplateFormProps {
  mode: "create" | "edit";
  initialData?: Partial<TemplateFormData>;
  initialTasks?: any[];
  taskTypes: Array<{ id: string; name: string; category?: string }>;
  isSubmitting: boolean;
  onSubmit: (data: TemplateFormData & { tasks: any[] }) => void;
  onCancel: () => void;
}

export function TemplateForm({
  mode,
  initialData,
  initialTasks = [],
  taskTypes,
  isSubmitting,
  onSubmit,
  onCancel,
}: TemplateFormProps) {
  const [formData, setFormData] = React.useState<TemplateFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    service_type: initialData?.service_type || "warranty",
    enforce_sequence: initialData?.enforce_sequence ?? true,
  });

  // Convert initial tasks to TaskItem format with temporary IDs
  const initialTaskItems = React.useMemo(() => {
    if (!initialTasks || initialTasks.length === 0) return [];
    return initialTasks.map((task: any) => ({
      id: task.id || `temp-${Date.now()}-${task.sequence_order}`,
      task_type_id: task.task_type_id || "",
      sequence_order: task.sequence_order || 0,
      is_required: task.is_required ?? true,
      custom_instructions: task.custom_instructions || "",
    }));
  }, [initialTasks]);

  const {
    tasks,
    sensors,
    handleDragEnd,
    handleAddTask,
    handleUpdateTask,
    handleRemoveTask,
  } = useTemplateTasks(initialTaskItems);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.name.trim()) {
      return;
    }

    if (tasks.length === 0) {
      return;
    }

    if (tasks.some((t) => !t.task_type_id)) {
      return;
    }

    const templateData = {
      ...formData,
      tasks: tasks.map(({ id, ...task }) => task), // Remove temporary IDs
    };

    onSubmit(templateData);
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
            <Label htmlFor="service_type">Loại dịch vụ *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value: any) =>
                setFormData({ ...formData, service_type: value })
              }
            >
              <SelectTrigger id="service_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warranty">Bảo hành</SelectItem>
                <SelectItem value="paid">Trả phí</SelectItem>
                <SelectItem value="replacement">Thay thế</SelectItem>
              </SelectContent>
            </Select>
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
                  <strong>Cảnh báo:</strong> Chế độ linh hoạt cho phép kỹ thuật viên hoàn thành công việc không theo thứ tự.
                  Hệ thống sẽ hiển thị cảnh báo nhưng không chặn việc hoàn thành. Chỉ sử dụng chế độ này khi thứ tự công việc không quan trọng.
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
              <CardTitle>Danh sách công việc ({tasks.length})</CardTitle>
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
          {tasks.length === 0 ? (
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
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      taskTypes={taskTypes}
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

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting
            ? mode === "create"
              ? "Đang tạo..."
              : "Đang cập nhật..."
            : mode === "create"
              ? "Tạo mẫu quy trình"
              : "Cập nhật mẫu quy trình"}
        </Button>
      </div>
    </form>
  );
}
