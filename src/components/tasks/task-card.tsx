/**
 * Task Card Component
 *
 * Displays a task with entity context, status, and action buttons.
 */

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "./task-status-badge";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, User, Calendar, AlertCircle, ExternalLink } from "lucide-react";
import type { TaskWithContext } from "@/server/services/task-service";

interface TaskCardProps {
  task: TaskWithContext;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onBlockTask?: (taskId: string) => void;
  onUnblockTask?: (taskId: string) => void;
  isLoading?: boolean;
}

export function TaskCard({
  task,
  onStartTask,
  onCompleteTask,
  onBlockTask,
  onUnblockTask,
  isLoading,
}: TaskCardProps) {
  const canStart = task.status === "pending" || task.status === "blocked";
  const canComplete = task.status === "in_progress";
  const canBlock = task.status === "in_progress";
  const canUnblock = task.status === "blocked";

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

  return (
    <Card className={isOverdue ? "border-destructive" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{task.name}</CardTitle>
              {task.is_required && (
                <Badge variant="outline" className="text-xs">
                  Bắt buộc
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {task.description || "Không có mô tả"}
            </CardDescription>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
          {task.entity_context.priority && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Ưu tiên: {task.entity_context.priority}
            </Badge>
          )}
        </div>

        {/* Task Details */}
        <div className="space-y-2 text-sm">
          {task.assigned_to && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{task.assigned_to.full_name}</span>
            </div>
          )}

          {task.estimated_duration_minutes && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Ước tính: {task.estimated_duration_minutes} phút</span>
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
      {(canStart || canComplete || canBlock || canUnblock) && (
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

          {canBlock && onBlockTask && (
            <Button
              onClick={() => onBlockTask(task.id)}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              Báo chặn
            </Button>
          )}

          {canUnblock && onUnblockTask && (
            <Button
              onClick={() => onUnblockTask(task.id)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Bỏ chặn
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
