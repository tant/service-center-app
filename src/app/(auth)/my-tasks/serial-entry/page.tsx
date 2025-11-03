"use client";

/**
 * Serial Entry Task Dashboard
 * Shows all serial entry tasks with priority-based organization
 * Supports filtering (Mine/Available/Overdue) and sorting
 */

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { SerialEntryTaskCard } from "@/components/tasks/serial-entry-task-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ClipboardList, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";

type FilterType = "all" | "mine" | "available" | "overdue";
type SortType = "priority" | "date" | "progress" | "age";

export default function SerialEntryTaskDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("mine");
  const [sortBy, setSortBy] = useState<SortType>("priority");

  // Fetch all inventory_receipt tasks
  const { data: tasks, isLoading } = trpc.tasks.myTasks.useQuery({
    entityType: "inventory_receipt",
  });

  // Start task mutation
  const startTaskMutation = trpc.tasks.startTask.useMutation({
    onSuccess: () => {
      toast.success("Đã bắt đầu task");
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Complete task mutation
  const completeTaskMutation = trpc.tasks.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Đã hoàn thành task");
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;

    switch (filter) {
      case "mine":
        result = result.filter((task) => task.assigned_to !== null);
        break;
      case "available":
        result = result.filter((task) => task.assigned_to === null);
        break;
      case "overdue":
        result = result.filter((task) => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate < new Date() && task.status !== "completed";
        });
        break;
      default:
        // all
        break;
    }

    return result;
  }, [tasks, filter]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const taskList = [...filteredTasks];

    switch (sortBy) {
      case "priority":
        // Sort by entity context priority
        taskList.sort((a, b) => {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
          const aPriority = a.entity_context.priority
            ? (priorityOrder[a.entity_context.priority] ?? 2)
            : 2;
          const bPriority = b.entity_context.priority
            ? (priorityOrder[b.entity_context.priority] ?? 2)
            : 2;
          return aPriority - bPriority;
        });
        break;
      case "date":
        taskList.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "progress":
        // Sort by serial completion percentage (from metadata)
        taskList.sort((a, b) => {
          const aPercentage = Number(
            a.entity_context.metadata?.serialCompletionPercentage || 0
          );
          const bPercentage = Number(
            b.entity_context.metadata?.serialCompletionPercentage || 0
          );
          return aPercentage - bPercentage;
        });
        break;
      case "age":
        taskList.sort((a, b) => {
          const aAge = Date.now() - new Date(a.created_at).getTime();
          const bAge = Date.now() - new Date(b.created_at).getTime();
          return bAge - aAge;
        });
        break;
    }

    return taskList;
  }, [filteredTasks, sortBy]);

  // Group tasks by priority
  const groupedTasks = useMemo(() => {
    const urgent: typeof sortedTasks = [];
    const high: typeof sortedTasks = [];
    const normal: typeof sortedTasks = [];
    const low: typeof sortedTasks = [];

    sortedTasks.forEach((task) => {
      const priority = task.entity_context.priority || "normal";
      switch (priority) {
        case "urgent":
          urgent.push(task);
          break;
        case "high":
          high.push(task);
          break;
        case "low":
          low.push(task);
          break;
        default:
          normal.push(task);
      }
    });

    return { urgent, high, normal, low };
  }, [sortedTasks]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, mine: 0, overdue: 0, available: 0 };

    const myTasks = tasks.filter((t) => t.assigned_to !== null);
    const overdueCount = tasks.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== "completed";
    }).length;
    const availableCount = tasks.filter((t) => t.assigned_to === null).length;

    return {
      total: tasks.length,
      mine: myTasks.length,
      overdue: overdueCount,
      available: availableCount,
    };
  }, [tasks]);

  const handleStartTask = (taskId: string) => {
    startTaskMutation.mutate({ taskId });
  };

  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate({
      taskId,
      completionNotes: "Đã hoàn thành nhập serial",
    });
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Serial Entry Tasks" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Serial Entry Tasks" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Stats Summary */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="text-sm text-muted-foreground">Tất cả</div>
                    <div className="text-3xl font-bold">{stats.total}</div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="text-sm text-muted-foreground">Của tôi</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.mine}</div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="text-sm text-muted-foreground">Quá hạn</div>
                    <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="text-sm text-muted-foreground">Có thể hỗ trợ</div>
                    <div className="text-3xl font-bold text-green-600">{stats.available}</div>
                  </CardHeader>
                </Card>
              </div>

              {/* Filters and Sort */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Lọc:</span>
                      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                        <TabsList>
                          <TabsTrigger value="all">
                            Tất cả
                            <Badge variant="secondary" className="ml-2">
                              {stats.total}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger value="mine">
                            Của tôi
                            <Badge variant="secondary" className="ml-2">
                              {stats.mine}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger value="available">
                            Có thể hỗ trợ
                            <Badge variant="secondary" className="ml-2">
                              {stats.available}
                            </Badge>
                          </TabsTrigger>
                          <TabsTrigger value="overdue">
                            Quá hạn
                            <Badge variant="destructive" className="ml-2">
                              {stats.overdue}
                            </Badge>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Sắp xếp:</span>
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="priority">Độ ưu tiên</SelectItem>
                          <SelectItem value="date">Ngày tạo</SelectItem>
                          <SelectItem value="progress">Tiến độ</SelectItem>
                          <SelectItem value="age">Tuổi task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State */}
              {sortedTasks.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Không có task nào
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {filter === "mine"
                        ? "Bạn không có serial entry task nào. Tuyệt vời!"
                        : filter === "available"
                        ? "Không có task nào cần hỗ trợ"
                        : "Không có task quá hạn"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Urgent Tasks (0-49% complete) */}
              {groupedTasks.urgent.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h2 className="text-xl font-semibold text-red-600">
                      CẦN XỬ LÝ NGAY
                    </h2>
                    <Badge variant="destructive">{groupedTasks.urgent.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.urgent.map((task) => (
                      <SerialEntryTaskCard
                        key={task.id}
                        task={task}
                        onStartTask={handleStartTask}
                        onCompleteTask={handleCompleteTask}
                        isLoading={
                          startTaskMutation.isPending ||
                          completeTaskMutation.isPending
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* High Priority Tasks (50-99% complete) */}
              {groupedTasks.high.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h2 className="text-xl font-semibold text-yellow-600">
                      ĐANG XỬ LÝ
                    </h2>
                    <Badge className="bg-yellow-600">{groupedTasks.high.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.high.map((task) => (
                      <SerialEntryTaskCard
                        key={task.id}
                        task={task}
                        onStartTask={handleStartTask}
                        onCompleteTask={handleCompleteTask}
                        isLoading={
                          startTaskMutation.isPending ||
                          completeTaskMutation.isPending
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Normal Tasks */}
              {groupedTasks.normal.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-blue-600">
                      BìNH THƯỜNG
                    </h2>
                    <Badge className="bg-blue-600">{groupedTasks.normal.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.normal.map((task) => (
                      <SerialEntryTaskCard
                        key={task.id}
                        task={task}
                        onStartTask={handleStartTask}
                        onCompleteTask={handleCompleteTask}
                        isLoading={
                          startTaskMutation.isPending ||
                          completeTaskMutation.isPending
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Low Priority Tasks (100% complete) */}
              {groupedTasks.low.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-green-600">
                      ĐÃ HOÀN THÀNH
                    </h2>
                    <Badge className="bg-green-600">{groupedTasks.low.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.low.map((task) => (
                      <SerialEntryTaskCard
                        key={task.id}
                        task={task}
                        onStartTask={handleStartTask}
                        onCompleteTask={handleCompleteTask}
                        isLoading={
                          startTaskMutation.isPending ||
                          completeTaskMutation.isPending
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
