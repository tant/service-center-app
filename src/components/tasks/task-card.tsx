/**
 * Task Card Component
 *
 * Displays a task with entity context, status, and action buttons.
 */

"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Ellipsis,
  ExternalLink,
  Eye,
  PauseCircle,
  Play,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TaskWithContext } from "@/server/services/task-service";
import { TaskStatusBadge } from "./task-status-badge";

interface TaskCardProps {
  task: TaskWithContext;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onBlockTask?: (taskId: string) => void;
  onUnblockTask?: (taskId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TaskCard({
  task,
  onStartTask,
  onCompleteTask,
  onBlockTask,
  onUnblockTask,
  isLoading,
  disabled = false,
}: TaskCardProps) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(
    Boolean(task.blocked_reason || task.completion_notes),
  );
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
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  const hasAdditionalDetails = Boolean(
    task.assigned_to ||
      task.estimated_duration_minutes ||
      task.started_at ||
      task.completed_at ||
      task.due_date,
  );

  const statusChipConfig: Record<
    TaskWithContext["status"],
    { label: string; className: string; icon: ReactNode }
  > = {
    pending: {
      label: "Chưa bắt đầu",
      className: "bg-[#F9BE6F]/10 text-[#F9BE6F]",
      icon: <Play className="h-3.5 w-3.5" />,
    },
    in_progress: {
      label: "Đang xử lý",
      className: "bg-[#3B82F6]/10 text-[#3B82F6]",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    completed: {
      label: "Đã hoàn thành",
      className: "bg-[#4AD08C]/10 text-[#4AD08C]",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    },
    blocked: {
      label: "Đang bị chặn",
      className: "bg-[#EB002B]/10 text-[#EB002B]",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    skipped: {
      label: "Đã bỏ qua",
      className: "bg-[#6F787F]/10 text-[#6F787F]",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
  };

  const statusChip = statusChipConfig[task.status];

  const timeHint = (() => {
    if (task.status === "in_progress" && task.estimated_duration_minutes) {
      return `Ước tính còn ${task.estimated_duration_minutes} phút`;
    }

    if (task.due_date) {
      const label = isOverdue ? "Đã quá hạn" : "Hạn";
      return `${label}: ${formatDate(task.due_date)}`;
    }

    if (task.completed_at) {
      return `Hoàn thành: ${formatDate(task.completed_at)}`;
    }

    if (task.started_at) {
      return `Bắt đầu: ${formatDate(task.started_at)}`;
    }

    return "";
  })();

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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Mở liên kết liên quan"
              >
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

        {hasAdditionalDetails && (
          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            className="rounded-lg border bg-muted/40"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium">
              <span>Chi tiết công việc</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  detailsOpen ? "rotate-180" : "rotate-0",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t px-3 pb-3 pt-2 space-y-2 text-sm text-muted-foreground">
              {task.assigned_to && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{task.assigned_to.full_name}</span>
                </div>
              )}

              {task.estimated_duration_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Ước tính: {task.estimated_duration_minutes} phút</span>
                </div>
              )}

              {task.due_date && (
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isOverdue
                      ? "text-destructive font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isOverdue ? "Quá hạn: " : "Hạn: "}
                    {formatDate(task.due_date)}
                  </span>
                </div>
              )}

              {task.started_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Bắt đầu: {formatDate(task.started_at)}</span>
                </div>
              )}

              {task.completed_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Hoàn thành: {formatDate(task.completed_at)}</span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Blocked Reason */}
        {task.status === "blocked" && task.blocked_reason && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-destructive">
                  Lý do bị chặn:
                </p>
                <p className="text-sm text-destructive/90 mt-1">
                  {task.blocked_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Notes */}
        {task.status === "completed" && task.completion_notes && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium text-sm">Ghi chú hoàn thành:</p>
            <p className="text-sm text-muted-foreground mt-1">
              {task.completion_notes}
            </p>
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {statusChip && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                statusChip.className,
              )}
            >
              {statusChip.icon}
              {statusChip.label}
            </span>
          )}
          {timeHint && (
            <span className="text-xs text-muted-foreground">{timeHint}</span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={() => router.push(`/my-tasks/${task.id}`)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </Button>
          <ActionButtons
            task={task}
            canStart={canStart}
            canComplete={canComplete}
            canBlock={canBlock}
            canUnblock={canUnblock}
            disabled={disabled}
            isLoading={isLoading}
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
            onBlockTask={onBlockTask}
            onUnblockTask={onUnblockTask}
          />
        </div>
      </CardFooter>
    </Card>
  );
}

interface ActionButtonsProps {
  task: TaskWithContext;
  canStart: boolean;
  canComplete: boolean;
  canBlock: boolean;
  canUnblock: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onBlockTask?: (taskId: string) => void;
  onUnblockTask?: (taskId: string) => void;
}

function ActionButtons({
  task,
  canStart,
  canComplete,
  canBlock,
  canUnblock,
  disabled,
  isLoading,
  onStartTask,
  onCompleteTask,
  onBlockTask,
  onUnblockTask,
}: ActionButtonsProps) {
  const isBusy = disabled || isLoading;

  const handleStart = () => {
    if (onStartTask) {
      onStartTask(task.id);
    }
  };

  const handleComplete = () => {
    if (onCompleteTask) {
      onCompleteTask(task.id);
    }
  };

  const handleBlock = () => {
    if (onBlockTask) {
      onBlockTask(task.id);
    }
  };

  const handleUnblock = () => {
    if (onUnblockTask) {
      onUnblockTask(task.id);
    } else if (onStartTask) {
      onStartTask(task.id);
    }
  };

  type PrimaryActionKey = "start" | "complete" | "unblock" | null;
  let primaryActionKey: PrimaryActionKey = null;

  const primaryAction = (() => {
    if (canComplete && onCompleteTask && task.status === "in_progress") {
      primaryActionKey = "complete";
      return (
        <Button onClick={handleComplete} disabled={isBusy} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Hoàn thành
        </Button>
      );
    }

    if (canStart && onStartTask && task.status === "pending") {
      primaryActionKey = "start";
      return (
        <Button onClick={handleStart} disabled={isBusy} className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Bắt đầu
        </Button>
      );
    }

    if (
      canUnblock &&
      (onUnblockTask || onStartTask) &&
      task.status === "blocked"
    ) {
      primaryActionKey = "unblock";
      return (
        <Button
          onClick={handleUnblock}
          disabled={isBusy}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          Tiếp tục
        </Button>
      );
    }

    return null;
  })();

  type MoreActionItem = {
    key: string;
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    variant?: "default" | "destructive";
  };

  const moreActions: MoreActionItem[] = [];

  if (onStartTask && canStart && primaryActionKey !== "start") {
    moreActions.push({
      key: "start",
      label: task.status === "blocked" ? "Bắt đầu lại" : "Bắt đầu",
      icon: <Play className="h-4 w-4" />,
      onSelect: handleStart,
    });
  }

  if (onCompleteTask && canComplete && primaryActionKey !== "complete") {
    moreActions.push({
      key: "complete",
      label: "Hoàn thành",
      icon: <CheckCircle className="h-4 w-4" />,
      onSelect: handleComplete,
    });
  }

  if (onBlockTask && canBlock) {
    moreActions.push({
      key: "block",
      label: "Báo chặn",
      icon: <PauseCircle className="h-4 w-4" />,
      onSelect: handleBlock,
      variant: "destructive",
    });
  }

  if (onUnblockTask && canUnblock && primaryActionKey !== "unblock") {
    moreActions.push({
      key: "unblock",
      label: "Bỏ chặn",
      icon: <XCircle className="h-4 w-4" />,
      onSelect: handleUnblock,
    });
  }

  if (!primaryAction && moreActions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2",
        !primaryAction ? "justify-end" : "",
      )}
    >
      {primaryAction}
      {moreActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={isBusy}
              aria-label="Thao tác khác"
            >
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Thao tác khác
            </DropdownMenuLabel>
            {moreActions.map((action, index) => (
              <Fragment key={action.key}>
                <DropdownMenuItem
                  variant={action.variant}
                  onSelect={(event) => {
                    event.preventDefault();
                    if (!isBusy) {
                      action.onSelect();
                    }
                  }}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
                {index !== moreActions.length - 1 && <DropdownMenuSeparator />}
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
