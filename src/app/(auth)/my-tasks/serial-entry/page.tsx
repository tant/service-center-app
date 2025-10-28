"use client";

/**
 * Serial Entry Task Dashboard
 * Shows all serial entry tasks with priority-based organization
 * Supports filtering (Mine/Available/Overdue) and sorting
 */

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { TaskCard, TaskPriority } from "@/components/inventory/serials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// Mock data interface - will be replaced with tRPC query
interface SerialTask {
  id: string;
  receiptNumber: string;
  receiptId: string;
  progress: {
    current: number;
    total: number;
  };
  assignedTo: {
    id: string;
    full_name: string;
  };
  receiptStatus: string;
  createdAt: Date;
  ageInDays: number;
}

type FilterType = "all" | "mine" | "available" | "overdue";
type SortType = "priority" | "date" | "progress" | "age";

export default function SerialEntryTaskDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("mine");
  const [sortBy, setSortBy] = useState<SortType>("priority");

  // TODO: Replace with actual tRPC query
  const isLoading = false;
  const currentUserId = "current-user-id"; // TODO: Get from session

  // Mock data - will be replaced with tRPC query
  const mockTasks: SerialTask[] = [
    {
      id: "1",
      receiptNumber: "PN-2025-045",
      receiptId: "receipt-1",
      progress: { current: 5, total: 20 },
      assignedTo: { id: currentUserId, full_name: "Nguyễn Văn A" },
      receiptStatus: "completed",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      ageInDays: 15,
    },
    {
      id: "2",
      receiptNumber: "PN-2025-032",
      receiptId: "receipt-2",
      progress: { current: 2, total: 30 },
      assignedTo: { id: currentUserId, full_name: "Nguyễn Văn A" },
      receiptStatus: "approved",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      ageInDays: 12,
    },
    {
      id: "3",
      receiptNumber: "PN-2025-078",
      receiptId: "receipt-3",
      progress: { current: 12, total: 15 },
      assignedTo: { id: currentUserId, full_name: "Nguyễn Văn A" },
      receiptStatus: "approved",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      ageInDays: 4,
    },
    {
      id: "4",
      receiptNumber: "PN-2025-089",
      receiptId: "receipt-4",
      progress: { current: 0, total: 8 },
      assignedTo: { id: currentUserId, full_name: "Nguyễn Văn A" },
      receiptStatus: "approved",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      ageInDays: 1,
    },
    {
      id: "5",
      receiptNumber: "PN-2025-091",
      receiptId: "receipt-5",
      progress: { current: 5, total: 10 },
      assignedTo: { id: "other-user", full_name: "Trần Thị B" },
      receiptStatus: "approved",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      ageInDays: 2,
    },
  ];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = mockTasks;

    switch (filter) {
      case "mine":
        result = result.filter((task) => task.assignedTo.id === currentUserId);
        break;
      case "available":
        result = result.filter((task) => task.assignedTo.id !== currentUserId);
        break;
      case "overdue":
        result = result.filter((task) => task.ageInDays > 3);
        break;
      default:
        // all
        break;
    }

    return result;
  }, [mockTasks, filter, currentUserId]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const tasks = [...filteredTasks];

    switch (sortBy) {
      case "priority":
        // Sort by age (oldest first), then by completion percentage (lowest first)
        tasks.sort((a, b) => {
          const aPriority = a.ageInDays > 7 ? 3 : a.ageInDays > 3 ? 2 : 1;
          const bPriority = b.ageInDays > 7 ? 3 : b.ageInDays > 3 ? 2 : 1;
          if (aPriority !== bPriority) return bPriority - aPriority;

          const aPercentage = (a.progress.current / a.progress.total) * 100;
          const bPercentage = (b.progress.current / b.progress.total) * 100;
          return aPercentage - bPercentage;
        });
        break;
      case "date":
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "progress":
        tasks.sort((a, b) => {
          const aPercentage = (a.progress.current / a.progress.total) * 100;
          const bPercentage = (b.progress.current / b.progress.total) * 100;
          return aPercentage - bPercentage;
        });
        break;
      case "age":
        tasks.sort((a, b) => b.ageInDays - a.ageInDays);
        break;
    }

    return tasks;
  }, [filteredTasks, sortBy]);

  // Group tasks by priority
  const groupedTasks = useMemo(() => {
    const critical: SerialTask[] = [];
    const warning: SerialTask[] = [];
    const normal: SerialTask[] = [];

    sortedTasks.forEach((task) => {
      if (task.ageInDays > 7) {
        critical.push(task);
      } else if (task.ageInDays > 3) {
        warning.push(task);
      } else {
        normal.push(task);
      }
    });

    return { critical, warning, normal };
  }, [sortedTasks]);

  // Calculate stats
  const stats = useMemo(() => {
    const myTasks = mockTasks.filter((t) => t.assignedTo.id === currentUserId);
    const overdueCount = mockTasks.filter((t) => t.ageInDays > 3).length;
    const availableCount = mockTasks.filter((t) => t.assignedTo.id !== currentUserId).length;

    return {
      total: mockTasks.length,
      mine: myTasks.length,
      overdue: overdueCount,
      available: availableCount,
    };
  }, [mockTasks, currentUserId]);

  const handleContinue = (receiptId: string) => {
    router.push(`/inventory/documents/receipts/${receiptId}`);
  };

  const handleReassign = (taskId: string) => {
    // TODO: Implement reassignment modal
    console.log("Reassign task:", taskId);
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

              {/* Critical Tasks */}
              {groupedTasks.critical.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h2 className="text-xl font-semibold text-red-600">
                      QUÁ HẠN NGHIÊM TRỌNG
                    </h2>
                    <Badge variant="destructive">{groupedTasks.critical.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.critical.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        variant={task.assignedTo.id === currentUserId ? "mine" : "available"}
                        isMine={task.assignedTo.id === currentUserId}
                        onContinue={() => handleContinue(task.receiptId)}
                        onReassign={
                          task.assignedTo.id === currentUserId
                            ? () => handleReassign(task.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Tasks */}
              {groupedTasks.warning.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h2 className="text-xl font-semibold text-yellow-600">
                      ĐANG QUÁ HẠN
                    </h2>
                    <Badge className="bg-yellow-600">{groupedTasks.warning.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.warning.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        variant={task.assignedTo.id === currentUserId ? "mine" : "available"}
                        isMine={task.assignedTo.id === currentUserId}
                        onContinue={() => handleContinue(task.receiptId)}
                        onReassign={
                          task.assignedTo.id === currentUserId
                            ? () => handleReassign(task.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Normal Tasks */}
              {groupedTasks.normal.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-blue-600">
                      ĐANG TIẾN HÀNH
                    </h2>
                    <Badge className="bg-blue-600">{groupedTasks.normal.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedTasks.normal.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        variant={task.assignedTo.id === currentUserId ? "mine" : "available"}
                        isMine={task.assignedTo.id === currentUserId}
                        onContinue={() => handleContinue(task.receiptId)}
                        onReassign={
                          task.assignedTo.id === currentUserId
                            ? () => handleReassign(task.id)
                            : undefined
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
