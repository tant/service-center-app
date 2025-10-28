"use client";

/**
 * Task Card Component
 * Display serial entry task in task dashboard
 * Supports different variants: mine, available, overdue
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, AlertTriangle, Info, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export type TaskPriority = "normal" | "warning" | "critical";
export type TaskVariant = "mine" | "available";

interface Task {
  id: string;
  receiptNumber: string;
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

interface TaskCardProps {
  task: Task;
  variant: TaskVariant;
  isMine: boolean;
  onContinue: () => void;
  onReassign?: () => void;
}

export function TaskCard({
  task,
  variant,
  isMine,
  onContinue,
  onReassign,
}: TaskCardProps) {
  const percentage = task.progress.total > 0
    ? Math.round((task.progress.current / task.progress.total) * 100)
    : 0;

  // Determine priority based on age and progress
  const getPriority = (): TaskPriority => {
    if (task.ageInDays > 7) return "critical";
    if (task.ageInDays > 3) return "warning";
    return "normal";
  };

  const priority = getPriority();

  // Get styles based on priority
  const getStyles = () => {
    switch (priority) {
      case "critical":
        return {
          border: "border-red-200 dark:border-red-800",
          bg: "bg-red-50 dark:bg-red-950/30",
          icon: <Flame className="h-5 w-5 text-red-600" />,
          iconBg: "bg-red-100 dark:bg-red-900/50",
          badge: "bg-red-600",
        };
      case "warning":
        return {
          border: "border-yellow-200 dark:border-yellow-800",
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
          badge: "bg-yellow-600",
        };
      default:
        return {
          border: "border-border",
          bg: "bg-background",
          icon: <Info className="h-5 w-5 text-blue-600" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/50",
          badge: "bg-blue-600",
        };
    }
  };

  const styles = getStyles();

  // Get age display
  const getAgeDisplay = () => {
    if (task.ageInDays === 0) return "Hôm nay";
    if (task.ageInDays === 1) return "1 ngày trước";
    return `${task.ageInDays} ngày trước`;
  };

  // Get priority label
  const getPriorityLabel = () => {
    switch (priority) {
      case "critical":
        return "QUÁ HẠN NGHIÊM TRỌNG";
      case "warning":
        return "ĐANG QUÁ HẠN";
      default:
        return "ĐANG TIẾN HÀNH";
    }
  };

  return (
    <Card className={`${styles.border} ${styles.bg} transition-colors hover:shadow-md`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{task.receiptNumber}</h4>
                {priority !== "normal" && (
                  <Badge variant="destructive" className={styles.badge}>
                    {getPriorityLabel()}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getAgeDisplay()}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {task.progress.current}/{task.progress.total} serials
            </span>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${
                percentage === 100
                  ? "bg-green-600"
                  : percentage > 50
                  ? "bg-yellow-600"
                  : "bg-red-600"
              } transition-all`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Task Info */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Người phụ trách:</span>
            <span className="font-medium flex items-center gap-1">
              {!isMine && <Users className="h-3 w-3" />}
              {task.assignedTo.full_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trạng thái phiếu:</span>
            <span className="font-medium capitalize">{task.receiptStatus}</span>
          </div>
        </div>

        {/* Warning Message for Critical Tasks */}
        {priority === "critical" && (
          <div className="rounded-md bg-red-100 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            <p className="flex items-start gap-2">
              <Flame className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Cần xử lý gấp!</strong>
                {task.receiptStatus === "completed" && (
                  <> Stock đã được cập nhật nhưng còn {task.progress.total - task.progress.current} serial chưa nhập.</>
                )}
              </span>
            </p>
          </div>
        )}

        {/* Impact Message for Available Tasks */}
        {variant === "available" && percentage < 50 && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
            <p>🤝 Hỗ trợ đồng đội hoàn thành task này</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onContinue}
            className="flex-1"
            variant={priority === "critical" ? "destructive" : "default"}
          >
            {isMine ? (
              percentage === 0 ? "Bắt đầu" : "Tiếp tục"
            ) : (
              "Hỗ trợ hoàn thành"
            )}
          </Button>

          {isMine && onReassign && (
            <Button variant="outline" onClick={onReassign}>
              Chuyển giao
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
