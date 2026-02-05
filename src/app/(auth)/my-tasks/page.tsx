"use client";

import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/components/providers/trpc-provider";
import {
  BlockTaskDialog,
  CompleteTaskDialog,
} from "@/components/tasks/task-action-dialogs";
import { TaskCard } from "@/components/tasks/task-card";
import {
  TaskFilters,
  type TaskFilterValues,
} from "@/components/tasks/task-filters";
import { TasksTable } from "@/components/tasks/tasks-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskWithContext } from "@/server/services/task-service";

/**
 * My Tasks Page - Polymorphic Task Management
 *
 * Shows all tasks assigned to current user from all entity types
 * (service tickets, inventory receipts, transfers, etc.)
 *
 * Features:
 * - Filtering by status, entity type, overdue, required
 * - Task actions: start, complete, block, unblock
 * - Real-time updates via polling
 * - Mobile responsive design
 */
export default function MyTasksPage() {
  const utils = trpc.useUtils();

  // Filters state
  const [filters, setFilters] = React.useState<TaskFilterValues>({
    status: "all",
    entityType: "all",
    assignedTo: "me", // Default: show only tasks assigned to me
    overdue: false,
    requiredOnly: false,
  });

  // Dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] =
    React.useState<TaskWithContext | null>(null);

  // Build query filters
  const queryFilters = React.useMemo(() => {
    const queryFilters: any = {};

    // Handle assignedTo filter
    if (filters.assignedTo === "me") {
      // Don't set assignedToId - let backend default to current user
      // (backend logic at task-service.ts:170-179)
    } else {
      // assignedTo === "all" - explicitly pass null to skip filtering
      queryFilters.assignedToId = null;
    }

    if (filters.status !== "all") {
      queryFilters.status = filters.status;
    } else {
      // Show all tasks when "all" is selected
      queryFilters.status = [
        "pending",
        "in_progress",
        "blocked",
        "completed",
        "skipped",
      ];
    }

    if (filters.entityType !== "all") {
      queryFilters.entityType = filters.entityType;
    }

    if (filters.overdue) {
      queryFilters.overdue = true;
    }

    if (filters.requiredOnly) {
      queryFilters.requiredOnly = true;
    }

    return queryFilters;
  }, [filters]);

  // Fetch tasks with polling every 30 seconds
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = trpc.tasks.myTasks.useQuery(queryFilters, {
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Sort tasks: prioritize in_progress and pending first
  const sortedTasks = React.useMemo(() => {
    const statusPriority: Record<string, number> = {
      in_progress: 0,
      pending: 1,
      blocked: 2,
      completed: 3,
      skipped: 4,
    };

    return [...tasks].sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 5;
      const priorityB = statusPriority[b.status] ?? 5;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Secondary sort by due_date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
  }, [tasks]);

  // Mutations
  const startTaskMutation = trpc.tasks.startTask.useMutation({
    onSuccess: () => {
      toast.success("Đã bắt đầu công việc");
      utils.tasks.myTasks.invalidate();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const completeTaskMutation = trpc.tasks.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Đã hoàn thành công việc");
      utils.tasks.myTasks.invalidate();
      setCompleteDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const blockTaskMutation = trpc.tasks.blockTask.useMutation({
    onSuccess: () => {
      toast.success("Đã báo chặn công việc - Manager sẽ được thông báo");
      utils.tasks.myTasks.invalidate();
      setBlockDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const unblockTaskMutation = trpc.tasks.unblockTask.useMutation({
    onSuccess: () => {
      toast.success("Đã bỏ chặn công việc");
      utils.tasks.myTasks.invalidate();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Action handlers
  const handleStartTask = (taskId: string) => {
    startTaskMutation.mutate({ taskId });
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setCompleteDialogOpen(true);
    }
  };

  const handleBlockTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setBlockDialogOpen(true);
    }
  };

  const handleUnblockTask = (taskId: string) => {
    unblockTaskMutation.mutate({ taskId });
  };

  const handleCompleteConfirm = (notes: string) => {
    if (selectedTask) {
      completeTaskMutation.mutate({
        taskId: selectedTask.id,
        completionNotes: notes,
      });
    }
  };

  const handleBlockConfirm = (reason: string) => {
    if (selectedTask) {
      blockTaskMutation.mutate({
        taskId: selectedTask.id,
        blockedReason: reason,
      });
    }
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const overdue = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== "completed",
    ).length;

    return { total, completed, inProgress, pending, blocked, overdue };
  }, [tasks]);

  const isActionLoading =
    startTaskMutation.isPending ||
    completeTaskMutation.isPending ||
    blockTaskMutation.isPending ||
    unblockTaskMutation.isPending;

  if (error) {
    return (
      <>
        <PageHeader title="Quản lý công việc" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="text-destructive">Lỗi: {error.message}</p>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Quản lý công việc">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </PageHeader>

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            {/* Stats Summary */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Tổng số</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-500">
                    {stats.pending}
                  </div>
                  <p className="text-xs text-muted-foreground">Chờ xử lý</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-500">
                    {stats.inProgress}
                  </div>
                  <p className="text-xs text-muted-foreground">Đang xử lý</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">
                    {stats.completed}
                  </div>
                  <p className="text-xs text-muted-foreground">Hoàn thành</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-500">
                    {stats.blocked}
                  </div>
                  <p className="text-xs text-muted-foreground">Bị chặn</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-500">
                    {stats.overdue}
                  </div>
                  <p className="text-xs text-muted-foreground">Quá hạn</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <TaskFilters filters={filters} onChange={setFilters} />
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && tasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Không có công việc nào
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Không tìm thấy công việc nào với bộ lọc hiện tại.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Task List - Switch between Card and Table UI */}
            {!isLoading && tasks.length > 0 && (
              <>
                {filters.assignedTo === "me" ? (
                  // Card UI - For "My Tasks" view
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sortedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStartTask={handleStartTask}
                        onCompleteTask={handleCompleteTask}
                        onBlockTask={handleBlockTask}
                        onUnblockTask={handleUnblockTask}
                        isLoading={isActionLoading}
                      />
                    ))}
                  </div>
                ) : (
                  // Table UI - For "All Tasks" view
                  <TasksTable tasks={sortedTasks} isLoading={false} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Dialogs */}
      {selectedTask && (
        <>
          <CompleteTaskDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            onConfirm={handleCompleteConfirm}
            taskName={selectedTask.name}
            isLoading={completeTaskMutation.isPending}
          />

          <BlockTaskDialog
            open={blockDialogOpen}
            onOpenChange={setBlockDialogOpen}
            onConfirm={handleBlockConfirm}
            taskName={selectedTask.name}
            isLoading={blockTaskMutation.isPending}
          />
        </>
      )}
    </>
  );
}
