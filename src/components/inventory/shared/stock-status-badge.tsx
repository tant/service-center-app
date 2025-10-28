/**
 * Stock Status Badge Component
 * Displays color-coded badge for stock levels: ok (green), warning (yellow), critical (red)
 */

import type { StockStatus } from "@/types/inventory";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className = "" }: StockStatusBadgeProps) {
  const styles = {
    ok: "bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    critical: "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };

  const labels = {
    ok: "Bình thường",
    warning: "Cảnh báo",
    critical: "Nguy hiểm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]} ${className}`}
    >
      {labels[status]}
    </span>
  );
}
