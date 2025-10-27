"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconArrowLeft,
} from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  useTaskTypes,
  useCreateTemplate,
} from "@/hooks/use-workflow";

interface TaskItem {
  id: string; // Temporary ID for UI
  task_type_id: string;
  sequence_order: number;
  is_required: boolean;
  custom_instructions?: string;
}

function SortableTaskItem({
  task,
  taskTypes,
  onUpdate,
  onRemove,
}: {
  task: TaskItem;
  taskTypes: Array<{ id: string; name: string; category?: string }>;
  onUpdate: (task: TaskItem) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskType = taskTypes.find((t) => t.id === task.task_type_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border bg-card p-4"
    >
      <button
        type="button"
        className="mt-2 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{task.sequence_order}</Badge>
          <Select
            value={task.task_type_id}
            onValueChange={(value) =>
              onUpdate({ ...task, task_type_id: value })
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Chọn loại công việc" />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.category && (
                    <span className="text-muted-foreground mr-2">
                      [{type.category}]
                    </span>
                  )}
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={task.is_required}
            onCheckedChange={(checked) =>
              onUpdate({ ...task, is_required: !!checked })
            }
          />
          <Label className="text-sm text-muted-foreground cursor-pointer">
            Công việc bắt buộc
          </Label>
        </div>

        <Textarea
          placeholder="Hướng dẫn tùy chỉnh (không bắt buộc)"
          value={task.custom_instructions || ""}
          onChange={(e) =>
            onUpdate({ ...task, custom_instructions: e.target.value })
          }
          rows={2}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive"
      >
        <IconTrash className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function NewTemplatePage() {
  const router = useRouter();
  const { taskTypes } = useTaskTypes();
  const { createTemplate, isCreating } = useCreateTemplate();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    service_type: "warranty" as "warranty" | "paid" | "replacement",
    enforce_sequence: true, // Story 1.5: Default to true (strict mode)
  });

  const [tasks, setTasks] = React.useState<TaskItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update sequence_order based on new positions
        return newItems.map((item, index) => ({
          ...item,
          sequence_order: index + 1,
        }));
      });
    }
  };

  const handleAddTask = () => {
    const newTask: TaskItem = {
      id: `temp-${Date.now()}`,
      task_type_id: "",
      sequence_order: tasks.length + 1,
      is_required: true,
      custom_instructions: "",
    };
    setTasks([...tasks, newTask]);
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleRemoveTask = (taskId: string) => {
    const newTasks = tasks
      .filter((t) => t.id !== taskId)
      .map((t, index) => ({ ...t, sequence_order: index + 1 }));
    setTasks(newTasks);
  };

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

    createTemplate(templateData, {
      onSuccess: () => {
        router.push("/workflows/templates");
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Tạo mẫu quy trình mới"
        backHref="/workflows/templates"
      />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
              {/* Back button */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>

              {/* Template Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin mẫu</CardTitle>
                  <CardDescription>
                    Nhập thông tin cơ bản về mẫu quy trình
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
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Đang tạo..." : "Tạo mẫu quy trình"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
