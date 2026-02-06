/**
 * Story 1.9: Warehouse Stock Levels and Low Stock Alerts
 * Badge component for displaying stock status
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StockStatusBadgeProps {
  status: "ok" | "warning" | "critical";
  currentStock: number;
  threshold: number;
  className?: string;
}

const STATUS_CONFIG = {
  ok: {
    label: "Đủ hàng",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  warning: {
    label: "Sắp hết",
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  critical: {
    label: "Hết hàng",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function StockStatusBadge({
  status,
  currentStock,
  threshold,
  className,
}: StockStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={config.variant}
        className={cn(config.className, className)}
      >
        {config.label}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {currentStock}/{threshold}
      </span>
    </div>
  );
}
