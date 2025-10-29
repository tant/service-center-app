/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Warranty status badge component with color coding
 */

import { Badge } from "@/components/ui/badge";
import {
  getWarrantyStatus,
  formatWarrantyStatus,
  getRemainingDays,
  type WarrantyStatus,
} from "@/utils/warranty";

interface WarrantyStatusBadgeProps {
  userWarrantyEndDate?: string | Date | null;
  manufacturerWarrantyEndDate?: string | Date | null;
  showRemainingDays?: boolean;
  className?: string;
}

export function WarrantyStatusBadge({
  userWarrantyEndDate,
  manufacturerWarrantyEndDate,
  showRemainingDays = true,
  className,
}: WarrantyStatusBadgeProps) {
  // Prioritize user warranty, fallback to manufacturer warranty
  const warrantyEndDate = userWarrantyEndDate || manufacturerWarrantyEndDate || null;

  const status = getWarrantyStatus(warrantyEndDate);
  const label = formatWarrantyStatus(status);

  // Determine badge variant based on status
  const variant = getStatusVariant(status);

  // Calculate remaining days if warranty is active or expiring soon
  let remainingText = label;
  if (warrantyEndDate && showRemainingDays && (status === "active" || status === "expiring_soon")) {
    const days = getRemainingDays(warrantyEndDate);
    if (days >= 0) {
      remainingText = `${label} (${days} ngày)`;
    }
  }

  return (
    <Badge variant={variant} className={className}>
      {remainingText}
    </Badge>
  );
}

function getStatusVariant(status: WarrantyStatus): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "active":
      return "default"; // Green/primary color
    case "expiring_soon":
      return "outline"; // Yellow/warning would be ideal, but outline is neutral
    case "expired":
      return "destructive"; // Red
    case "no_warranty":
      return "secondary"; // Gray
    default:
      return "secondary";
  }
}
