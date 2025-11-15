/**
 * Tasks Table Component
 *
 * Displays tasks in table format for "All Tasks" view.
 * Provides overview for managers to monitor all team tasks.
 */

"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { TaskWithContext } from "@/server/services/task-service";
import { cn } from "@/lib/utils";

interface TasksTableProps {
  tasks: TaskWithContext[];
  isLoading?: boolean;
}

export function TasksTable({ tasks, isLoading }: TasksTableProps) {
  const router = useRouter();

  const getEntityTypeBadge = (entityType: string) => {
    const badges = {
      service_ticket: {
        label: "🎫 Phiếu sửa",
        className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
      },
      inventory_receipt: {
        label: "📦 Phiếu nhập",
        className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      },
      inventory_issue: {
        label: "📤 Phiếu xuất",
        className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
      },
      inventory_transfer: {
        label: "🔄 Phiếu chuyển",
        className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
      },
      service_request: {
        label: "📋 Yêu cầu DV",
        className: "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
      },
    };

    const badge = badges[entityType as keyof typeof badges] || {
      label: entityType,
      className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700",
    };

    return (
      <Badge variant="outline" className={cn("border", badge.className)}>
        {badge.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        label: "Chờ xử lý",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
      },
      in_progress: {
        label: "Đang làm",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      },
      completed: {
        label: "Hoàn thành",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      },
      blocked: {
        label: "Bị chặn",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      },
      skipped: {
        label: "Bỏ qua",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
    };

    const badge = badges[status as keyof typeof badges] || {
      label: status,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    };

    return (
      <Badge variant="secondary" className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRowClick = (task: TaskWithContext) => {
    // Navigate to entity detail page based on entity type
    const routes = {
      service_ticket: `/operations/tickets/${task.entity_id}`,
      inventory_receipt: `/inventory/documents/receipts/${task.entity_id}`,
      inventory_issue: `/inventory/documents/issues/${task.entity_id}`,
      inventory_transfer: `/inventory/documents/transfers/${task.entity_id}`,
      service_request: `/operations/service-requests/${task.entity_id}`,
    };

    const route = routes[task.entity_type as keyof typeof routes];
    if (route) {
      router.push(route);
    }
  };

  const isOverdue = (task: TaskWithContext) => {
    return (
      task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== "completed"
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Công việc</TableHead>
              <TableHead>Liên quan</TableHead>
              <TableHead>Phân công</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Hạn chót</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Đang tải...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Công việc</TableHead>
              <TableHead>Liên quan</TableHead>
              <TableHead>Phân công</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Hạn chót</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Không tìm thấy công việc nào.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Công việc</TableHead>
            <TableHead>Liên quan</TableHead>
            <TableHead>Phân công</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-[70px]">Thứ tự</TableHead>
            <TableHead className="w-[120px]">Hạn chót</TableHead>
            <TableHead className="text-right w-[80px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                isOverdue(task) && "bg-red-50 dark:bg-red-950/20"
              )}
              onClick={() => handleRowClick(task)}
            >
              {/* Task Name */}
              <TableCell className="font-medium max-w-[300px]">
                <div className="flex flex-col gap-1">
                  <span className="truncate">{task.name}</span>
                  {task.is_required && (
                    <Badge variant="outline" className="w-fit text-xs">
                      Bắt buộc
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Entity Type + Number */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getEntityTypeBadge(task.entity_type)}
                  {task.entity_context.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {task.entity_context.subtitle}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Assigned To */}
              <TableCell>
                {task.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(task.assigned_to.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[120px]">
                      {task.assigned_to.full_name}
                    </span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Chưa phân công
                  </Badge>
                )}
              </TableCell>

              {/* Status */}
              <TableCell>{getStatusBadge(task.status)}</TableCell>

              {/* Sequence Order */}
              <TableCell className="text-center text-muted-foreground">
                #{task.sequence_order}
              </TableCell>

              {/* Due Date */}
              <TableCell>
                {task.due_date ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      {format(new Date(task.due_date), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </span>
                    {isOverdue(task) && <span className="text-red-500">⚠️</span>}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(task);
                  }}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
