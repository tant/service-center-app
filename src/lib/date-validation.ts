/**
 * Date validation utilities for inventory documents
 * Issue #11, #16: Block future dates, allow back-dating up to 7 days
 */

/**
 * Validates if a date is within allowed range for inventory documents
 * - Blocks future dates
 * - Allows back-dating up to maximum 7 days
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Object with isValid boolean and optional error message
 */
export function validateInventoryDocumentDate(dateString: string): {
  isValid: boolean;
  error?: string;
} {
  if (!dateString) {
    return { isValid: false, error: "Vui lòng chọn ngày" };
  }

  const selectedDate = new Date(dateString);
  const today = new Date();

  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  // Check if future date
  if (selectedDate > today) {
    return {
      isValid: false,
      error: "Không được chọn ngày trong tương lai",
    };
  }

  // Calculate days difference
  const diffTime = today.getTime() - selectedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Check if more than 7 days in the past
  if (diffDays > 7) {
    return {
      isValid: false,
      error: "Chỉ được chọn ngày trong vòng 7 ngày gần nhất",
    };
  }

  return { isValid: true };
}

/**
 * Gets the minimum allowed date (7 days ago from today)
 * @returns Date string in YYYY-MM-DD format
 */
export function getMinAllowedDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}

/**
 * Gets the maximum allowed date (today)
 * @returns Date string in YYYY-MM-DD format
 */
export function getMaxAllowedDate(): string {
  return new Date().toISOString().split("T")[0];
}
