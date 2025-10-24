import { Badge } from "@/components/ui/badge";

type TaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-gray-500 hover:bg-gray-600",
  },
  in_progress: {
    label: "Đang xử lý",
    className: "bg-blue-500 hover:bg-blue-600",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-green-500 hover:bg-green-600",
  },
  blocked: {
    label: "Bị chặn",
    className: "bg-red-500 hover:bg-red-600",
  },
  skipped: {
    label: "Bỏ qua",
    className: "bg-orange-500 hover:bg-orange-600",
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
