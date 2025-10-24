"use client";

import * as React from "react";
import {
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconX,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useTaskTypes,
  useTaskTemplate,
  useCreateTemplate,
  useUpdateTemplate,
} from "@/hooks/use-workflow";

interface TaskItem {
  id: string; // Temporary ID for UI
  task_type_id: string;
  sequence_order: number;
  is_required: boolean;
  custom_instructions?: string;
}

interface TemplateEditorModalInterface {
  open: boolean;
  onClose: () => void;
  templateId?: string;
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
      className="flex items-start gap-3 rounded-lg border bg-card p-3"
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
              <SelectValue placeholder="Select task type" />
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
            Required task
          </Label>
        </div>

        <Textarea
          placeholder="Custom instructions (optional)"
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

export function TemplateEditorModal({
  open,
  onClose,
  templateId,
}: TemplateEditorModalInterface) {
  const { taskTypes } = useTaskTypes();
  const { template, isLoading: isLoadingTemplate } = useTaskTemplate(templateId);
  const { createTemplate, isCreating } = useCreateTemplate();
  const { updateTemplate, isUpdating } = useUpdateTemplate();

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

  // Load template data when editing
  React.useEffect(() => {
    if (template && templateId) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        service_type: template.service_type || "warranty",
        enforce_sequence: template.enforce_sequence ?? true, // Story 1.5: Default to true if undefined
      });

      // Convert loaded tasks to TaskItem format with temporary IDs
      if (template.tasks && Array.isArray(template.tasks)) {
        const loadedTasks: TaskItem[] = template.tasks.map((task: any) => ({
          id: task.id || `temp-${Date.now()}-${task.sequence_order}`,
          task_type_id: task.task_type_id || "",
          sequence_order: task.sequence_order || 0,
          is_required: task.is_required ?? true,
          custom_instructions: task.custom_instructions || "",
        }));
        setTasks(loadedTasks);
      }
    }
  }, [template, templateId]);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        service_type: "warranty",
        enforce_sequence: true, // Story 1.5: Default to true (strict mode)
      });
      setTasks([]);
    }
  }, [open]);

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

    if (templateId) {
      updateTemplate(
        { template_id: templateId, ...templateData },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createTemplate(templateData, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {templateId ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          <DialogDescription>
            Define a task template for service tickets. Drag tasks to reorder.
          </DialogDescription>
        </DialogHeader>

        {isLoadingTemplate && templateId ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading template...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., VGA Warranty Repair"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
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
                    <SelectItem value="warranty">Warranty</SelectItem>
                    <SelectItem value="paid">Paid Service</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Story 1.5: Enforce Sequential Execution Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enforce_sequence" className="text-base">
                      Enforce Sequential Execution
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {formData.enforce_sequence
                        ? "Tasks must be completed in order (strict mode)"
                        : "Tasks can be completed in any order (flexible mode)"}
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
                      <strong>Warning:</strong> Flexible mode allows technicians to complete tasks out of order.
                      The UI will display warnings but will not block completion. Use this mode only when task order is not critical.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tasks ({tasks.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTask}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                No tasks added yet. Click "Add Task" to begin.
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : templateId
                  ? "Update Template"
                  : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
