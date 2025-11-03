/**
 * Serial Entry Task Card Component
 *
 * Specialized task card for serial entry tasks with:
 * - Color-coded progress bar (red/yellow/green)
 * - Serial count tracking (X / Y entered)
 * - Quick navigation to serial entry page
 * - Product-specific information
 *
 * @module components/tasks/serial-entry-task-card
 */

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TaskStatusBadge } from "./task-status-badge";
import Link from "next/link";
import { Clock, User, Calendar, AlertCircle, ExternalLink, Package, CheckCircle2 } from "lucide-react";
import type { TaskWithContext } from "@/server/services/task-service";

interface SerialEntryTaskCardProps {
  task: TaskWithContext;
  serialProgress?: {
    product_id: string;
    product_name: string;
    expected_quantity: number;
    serial_count: number;
    percentage: number;
    task_id: string;
    task_status: string;
  };
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  isLoading?: boolean;
}

/**
 * Get progress bar color based on completion percentage
 * - Red (0-49%): Urgent - needs immediate attention
 * - Yellow (50-99%): In progress
 * - Green (100%): Complete
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "bg-green-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Get priority badge variant based on completion percentage
 */
function getPriorityBadge(percentage: number): { label: string; variant: "destructive" | "default" | "secondary" } {
  if (percentage >= 100) return { label: "Hoàn thành", variant: "secondary" };
  if (percentage >= 50) return { label: "Đang xử lý", variant: "default" };
  return { label: "Cần xử lý ngay", variant: "destructive" };
}

export function SerialEntryTaskCard({
  task,
  serialProgress,
  onStartTask,
  onCompleteTask,
  isLoading,
}: SerialEntryTaskCardProps) {
  const canStart = task.status === "pending" || task.status === "blocked";
  const canComplete = task.status === "in_progress";

  // Extract product info from task metadata
  const productName = task.metadata?.product_name as string | undefined;
  const expectedQuantity = task.metadata?.expected_quantity as number | undefined;

  // Use serial progress if available, otherwise calculate from metadata
  const serialCount = serialProgress?.serial_count ?? 0;
  const totalExpected = serialProgress?.expected_quantity ?? expectedQuantity ?? 0;
  const percentage = serialProgress?.percentage ?? 0;

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if overdue
  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  const progressColor = getProgressColor(percentage);
  const priorityBadge = getPriorityBadge(percentage);

  return (
    <Card className={isOverdue ? "border-destructive" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{task.name}</CardTitle>
              {task.is_required && (
                <Badge variant="outline" className="text-xs">
                  Bắt buộc
                </Badge>
              )}
              <Badge variant={priorityBadge.variant} className="text-xs">
                {priorityBadge.label}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {task.description || "Nhập serial cho sản phẩm"}
            </CardDescription>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Product Information */}
        {productName && (
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{productName}</span>
          </div>
        )}

        {/* Serial Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tiến độ nhập serial</span>
            <span className="text-muted-foreground">
              {serialCount} / {totalExpected} ({Math.round(percentage)}%)
            </span>
          </div>
          <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />
          {percentage >= 100 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã nhập đủ serial</span>
            </div>
          )}
        </div>

        {/* Entity Context */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <p className="font-medium text-sm">{task.entity_context.title}</p>
              {task.entity_context.subtitle && (
                <p className="text-sm text-muted-foreground">
                  {task.entity_context.subtitle}
                </p>
              )}
            </div>
            <Link href={task.entity_context.url} target="_blank">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Task Details */}
        <div className="space-y-2 text-sm">
          {task.assigned_to && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{task.assigned_to.full_name}</span>
            </div>
          )}

          {task.due_date && (
            <div
              className={`flex items-center gap-2 ${
                isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>
                {isOverdue ? "Quá hạn: " : "Hạn: "}
                {formatDate(task.due_date)}
              </span>
            </div>
          )}

          {task.started_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Bắt đầu: {formatDate(task.started_at)}</span>
            </div>
          )}

          {task.completed_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Hoàn thành: {formatDate(task.completed_at)}</span>
            </div>
          )}
        </div>

        {/* Blocked Reason */}
        {task.status === "blocked" && task.blocked_reason && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-destructive">Lý do bị chặn:</p>
                <p className="text-sm text-destructive/90 mt-1">{task.blocked_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Notes */}
        {task.status === "completed" && task.completion_notes && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium text-sm">Ghi chú hoàn thành:</p>
            <p className="text-sm text-muted-foreground mt-1">{task.completion_notes}</p>
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      {(canStart || canComplete) && (
        <CardFooter className="gap-2">
          {canStart && onStartTask && (
            <Button
              onClick={() => onStartTask(task.id)}
              disabled={isLoading}
              className="flex-1"
            >
              Bắt đầu
            </Button>
          )}

          {canComplete && onCompleteTask && (
            <Button
              onClick={() => onCompleteTask(task.id)}
              disabled={isLoading}
              className="flex-1"
            >
              Hoàn thành
            </Button>
          )}

          {/* Quick Link to Receipt */}
          <Link href={task.entity_context.url} className="flex-1">
            <Button variant="outline" className="w-full">
              Nhập Serial
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
