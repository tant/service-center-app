/**
 * Document Status Badge Component
 * Displays color-coded badge for stock document statuses
 */

import type { StockDocumentStatus, TransferStatus } from "@/types/inventory";

interface DocumentStatusBadgeProps {
  status: StockDocumentStatus | TransferStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className = "" }: DocumentStatusBadgeProps) {
  const styles = {
    draft: "bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    pending_approval: "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    approved: "bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    in_transit: "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    completed: "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    cancelled: "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };

  const labels = {
    draft: "Bản nháp",
    pending_approval: "Chờ duyệt",
    approved: "Đã duyệt",
    in_transit: "Đang chuyển",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]} ${className}`}
    >
      {labels[status]}
    </span>
  );
}
