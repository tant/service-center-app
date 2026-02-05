"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface TaskItem {
  id: string; // Temporary ID for UI
  task_type_id: string;
  sequence_order: number;
  is_required: boolean;
  custom_instructions?: string;
}

interface SortableTaskItemProps {
  task: TaskItem;
  tasks: Array<{ id: string; name: string; category?: string }>;
  onUpdate: (task: TaskItem) => void;
  onRemove: () => void;
}

export function SortableTaskItem({
  task,
  tasks,
  onUpdate,
  onRemove,
}: SortableTaskItemProps) {
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

  const selectedTask = tasks.find((t) => t.id === task.task_type_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border bg-card p-3 sm:gap-3 sm:p-4"
    >
      <button
        type="button"
        className="mt-2 cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Badge variant="outline" className="w-fit">
            {task.sequence_order}
          </Badge>
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
              {tasks.map((type) => (
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
        className="text-destructive shrink-0"
      >
        <IconTrash className="h-4 w-4" />
      </Button>
    </div>
  );
}
