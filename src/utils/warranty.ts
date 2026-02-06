/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Warranty calculation and status utility functions
 */

export type WarrantyStatus =
  | "active"
  | "expired"
  | "expiring_soon"
  | "no_warranty";

/**
 * Calculate warranty end date from start date and warranty months
 * @param startDate - Warranty start date (Date or ISO string)
 * @param warrantyMonths - Number of warranty months
 * @returns Warranty end date
 */
export function calculateWarrantyEndDate(
  startDate: Date | string,
  warrantyMonths: number,
): Date {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + warrantyMonths);
  return endDate;
}

/**
 * Get warranty status based on warranty end date
 * @param warrantyEndDate - Warranty end date (Date, ISO string, or null)
 * @returns Warranty status: active, expired, expiring_soon, or no_warranty
 */
export function getWarrantyStatus(
  warrantyEndDate: Date | string | null,
): WarrantyStatus {
  if (!warrantyEndDate) return "no_warranty";

  const endDate = new Date(warrantyEndDate);
  const today = new Date();
  const daysRemaining = Math.floor(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 30) return "expiring_soon";
  return "active";
}

/**
 * Get number of remaining days for warranty
 * @param warrantyEndDate - Warranty end date (Date or ISO string)
 * @returns Number of days remaining (can be negative if expired)
 */
export function getRemainingDays(warrantyEndDate: Date | string): number {
  const endDate = new Date(warrantyEndDate);
  const today = new Date();
  return Math.floor(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Format warranty status for display
 * @param status - Warranty status
 * @returns Vietnamese label for warranty status
 */
export function formatWarrantyStatus(status: WarrantyStatus): string {
  const labels: Record<WarrantyStatus, string> = {
    active: "Còn bảo hành",
    expired: "Hết bảo hành",
    expiring_soon: "Sắp hết bảo hành",
    no_warranty: "Không bảo hành",
  };
  return labels[status];
}

/**
 * Get color variant for warranty status badge
 * @param status - Warranty status
 * @returns Badge color variant
 */
export function getWarrantyStatusColor(
  status: WarrantyStatus,
): "default" | "destructive" | "warning" | "secondary" {
  const colors: Record<
    WarrantyStatus,
    "default" | "destructive" | "warning" | "secondary"
  > = {
    active: "default",
    expired: "destructive",
    expiring_soon: "warning",
    no_warranty: "secondary",
  };
  return colors[status];
}
