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
  {
    label: string;
    variant: "pending" | "processing" | "ready" | "resolved" | "closed";
  }
> = {
  pending: {
    label: "Chờ xử lý",
    variant: "processing",
  },
  in_progress: {
    label: "Đang xử lý",
    variant: "ready",
  },
  completed: {
    label: "Hoàn thành",
    variant: "resolved",
  },
  blocked: {
    label: "Bị chặn",
    variant: "pending",
  },
  skipped: {
    label: "Bỏ qua",
    variant: "closed",
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
