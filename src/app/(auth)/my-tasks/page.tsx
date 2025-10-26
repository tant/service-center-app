"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useMyTasks } from "@/hooks/use-workflow";
import { TaskExecutionCard } from "@/components/shared/task-execution-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";

interface Task {
  id: string;
  sequence_order: number;
  status: TaskStatus;
  is_required: boolean;
  custom_instructions?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  started_at?: string | null;
  completed_at?: string | null;
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
  ticket?: {
    id: string;
    ticket_number: string;
    status: string;
    customer?: {
      name: string;
      phone?: string;
    };
  };
}

/**
 * My Tasks Page - Show all tasks assigned to current user
 * Story 1.4: Task Execution UI
 * AC: 2 - Build /dashboard/my-tasks page showing all assigned tasks grouped by ticket
 * AC: 8 - Real-time updates via TanStack Query (30-second polling)
 */
export default function MyTasksPage() {
  const { tasks, isLoading, error } = useMyTasks();

  // Group tasks by ticket
  const groupedTasks = React.useMemo(() => {
    const groups = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (!task.ticket) return;

      const ticketId = task.ticket.id;
      if (!groups.has(ticketId)) {
        groups.set(ticketId, []);
      }
      groups.get(ticketId)?.push(task);
    });

    // Sort tasks within each group by sequence_order
    groups.forEach((taskList) => {
      taskList.sort((a, b) => a.sequence_order - b.sequence_order);
    });

    return Array.from(groups.entries());
  }, [tasks]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;

    return { total, completed, inProgress, pending, blocked };
  }, [tasks]);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Công việc của tôi" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Công việc của tôi" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="text-destructive">Lỗi: {error.message}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Công việc của tôi" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tổng số công việc</CardDescription>
                  <CardTitle className="text-3xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Chờ xử lý</CardDescription>
                  <CardTitle className="text-3xl text-gray-500">{stats.pending}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Đang xử lý</CardDescription>
                  <CardTitle className="text-3xl text-blue-500">{stats.inProgress}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Hoàn thành</CardDescription>
                  <CardTitle className="text-3xl text-green-500">{stats.completed}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Bị chặn</CardDescription>
                  <CardTitle className="text-3xl text-red-500">{stats.blocked}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Empty State */}
            {groupedTasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Không có công việc nào được gán
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Bạn chưa được gán công việc nào. Kiểm tra lại sau.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Grouped Tasks by Ticket */}
            {groupedTasks.map(([ticketId, ticketTasks]) => {
              const firstTask = ticketTasks[0];
              if (!firstTask?.ticket) return null;

              const ticket = firstTask.ticket;
              const completedCount = ticketTasks.filter(
                (t) => t.status === "completed"
              ).length;
              const totalCount = ticketTasks.length;
              const progress = Math.round((completedCount / totalCount) * 100);

              return (
                <Card key={ticketId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {ticket.ticket_number}
                          {ticket.customer && (
                            <span className="ml-2 font-normal text-muted-foreground">
                              - {ticket.customer.name}
                            </span>
                          )}
                        </CardTitle>
                        {ticket.customer?.phone && (
                          <CardDescription className="mt-1">
                            SĐT: {ticket.customer.phone}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Tiến độ
                          </div>
                          <div className="text-lg font-semibold">
                            {completedCount}/{totalCount}
                          </div>
                        </div>
                        <Badge variant={progress === 100 ? "default" : "secondary"}>
                          {progress}%
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {ticketTasks.map((task) => (
                      <TaskExecutionCard key={task.id} task={task} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
