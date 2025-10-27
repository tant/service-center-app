"use client";

import * as React from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { TaskItem } from "./sortable-task-item";

/**
 * Custom hook for managing template tasks with drag-and-drop
 * Handles task state, drag-and-drop, and CRUD operations
 */
export function useTemplateTasks(initialTasks: TaskItem[] = []) {
  const [tasks, setTasks] = React.useState<TaskItem[]>(initialTasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
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
  }, []);

  const handleAddTask = React.useCallback(() => {
    const newTask: TaskItem = {
      id: `temp-${Date.now()}`,
      task_type_id: "",
      sequence_order: tasks.length + 1,
      is_required: true,
      custom_instructions: "",
    };
    setTasks([...tasks, newTask]);
  }, [tasks]);

  const handleUpdateTask = React.useCallback((updatedTask: TaskItem) => {
    setTasks((current) =>
      current.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  }, []);

  const handleRemoveTask = React.useCallback((taskId: string) => {
    setTasks((current) => {
      const newTasks = current
        .filter((t) => t.id !== taskId)
        .map((t, index) => ({ ...t, sequence_order: index + 1 }));
      return newTasks;
    });
  }, []);

  // Update tasks when initialTasks changes (for edit mode)
  React.useEffect(() => {
    if (initialTasks.length > 0) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  return {
    tasks,
    setTasks,
    sensors,
    handleDragEnd,
    handleAddTask,
    handleUpdateTask,
    handleRemoveTask,
  };
}
