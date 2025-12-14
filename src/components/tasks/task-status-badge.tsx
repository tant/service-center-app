/**
 * Task Status Badge Component
 *
 * Displays task status with appropriate color coding and Vietnamese labels.
 */

import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/server/services/entity-adapters/base-adapter";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "Chờ xử lý",
    variant: "secondary",
  },
  in_progress: {
    label: "Đang xử lý",
    variant: "default",
  },
  completed: {
    label: "Hoàn thành",
    variant: "outline",
  },
  blocked: {
    label: "Bị chặn",
    variant: "destructive",
  },
  skipped: {
    label: "Bỏ qua",
    variant: "outline",
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
