import { Badge } from "@/components/ui/badge";

type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "skipped";

interface TaskStatusBadgeProps {
  status: TaskStatus;
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

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
