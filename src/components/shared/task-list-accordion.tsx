"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TaskStatusBadge } from "./task-status-badge";

type TaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";

interface Task {
  id: string;
  sequence_order: number;
  status: TaskStatus;
  is_required: boolean;
  custom_instructions?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  task_type: {
    id: string;
    name: string;
    description?: string;
    category?: string;
  };
  assigned_to?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

interface TaskListAccordionProps {
  tasks: Task[];
}

export function TaskListAccordion({ tasks }: TaskListAccordionProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4 border rounded-lg bg-muted/50">
        Không có mẫu quy trình công việc nào được gán cho phiếu này.
      </div>
    );
  }

  const completedCount = tasks.filter(
    (t) => t.status === "completed"
  ).length;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="tasks">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-semibold">
              Công việc quy trình
            </span>
            <span className="text-sm text-muted-foreground">
              ({completedCount}/{tasks.length} hoàn thành)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                    {task.sequence_order}.
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.task_type.name}</p>
                      {task.is_required && (
                        <span className="text-xs text-destructive">*</span>
                      )}
                      {task.task_type.category && (
                        <span className="text-xs text-muted-foreground">
                          [{task.task_type.category}]
                        </span>
                      )}
                    </div>
                    {task.task_type.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.task_type.description}
                      </p>
                    )}
                    {task.custom_instructions && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        Ghi chú: {task.custom_instructions}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.estimated_duration_minutes && (
                        <span>Ước tính: {task.estimated_duration_minutes} phút</span>
                      )}
                      {task.actual_duration_minutes && (
                        <span>
                          Thực tế: {task.actual_duration_minutes} phút
                        </span>
                      )}
                      {task.assigned_to && (
                        <span>Phân công cho: {task.assigned_to.full_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
