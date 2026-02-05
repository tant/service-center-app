/**
 * Duration Utilities
 *
 * Helper functions for calculating and formatting task durations
 */

import {
  differenceInHours,
  differenceInMinutes,
  format,
  formatDistanceStrict,
} from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Calculate duration between two dates in hours
 */
export function calculateDurationInHours(
  startedAt: Date | string,
  completedAt: Date | string,
): number {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const end =
    typeof completedAt === "string" ? new Date(completedAt) : completedAt;

  const minutes = differenceInMinutes(end, start);
  return Math.round((minutes / 60) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format duration in human-readable format
 * Examples: "2h 30m", "45m", "1h"
 */
export function formatDuration(
  startedAt: Date | string | null,
  completedAt: Date | string | null,
): string {
  if (!startedAt || !completedAt) {
    return "—";
  }

  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const end =
    typeof completedAt === "string" ? new Date(completedAt) : completedAt;

  const totalMinutes = differenceInMinutes(end, start);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Format duration with distance (relative time)
 * Example: "2 giờ trước"
 */
export function formatDurationDistance(
  startedAt: Date | string,
  completedAt?: Date | string,
): string {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const end = completedAt
    ? typeof completedAt === "string"
      ? new Date(completedAt)
      : completedAt
    : new Date();

  return formatDistanceStrict(start, end, {
    locale: vi,
    addSuffix: true,
  });
}

/**
 * Format average duration in hours with proper rounding
 */
export function formatAverageDuration(avgHours: number | null): string {
  if (avgHours === null || avgHours === undefined) {
    return "—";
  }

  if (avgHours < 1) {
    const minutes = Math.round(avgHours * 60);
    return `${minutes}m`;
  }

  if (avgHours >= 24) {
    const days = Math.floor(avgHours / 24);
    const hours = Math.round(avgHours % 24);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  const hours = Math.floor(avgHours);
  const minutes = Math.round((avgHours - hours) * 60);

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Get duration color based on comparison to average
 * Green if faster, yellow if similar, red if slower
 */
export function getDurationColor(
  actualHours: number,
  avgHours: number | null,
): "green" | "yellow" | "red" | "gray" {
  if (!avgHours) {
    return "gray";
  }

  const ratio = actualHours / avgHours;

  if (ratio <= 0.8) {
    return "green"; // 20% faster
  } else if (ratio <= 1.2) {
    return "yellow"; // Within 20%
  } else {
    return "red"; // More than 20% slower
  }
}

/**
 * Check if task is taking longer than expected
 */
export function isOvertime(
  startedAt: Date | string,
  estimatedMinutes: number | null,
  now: Date = new Date(),
): boolean {
  if (!estimatedMinutes) {
    return false;
  }

  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const elapsed = differenceInMinutes(now, start);

  return elapsed > estimatedMinutes;
}

/**
 * Calculate progress percentage for in-progress tasks
 */
export function calculateProgress(
  startedAt: Date | string,
  estimatedMinutes: number | null,
  now: Date = new Date(),
): number {
  if (!estimatedMinutes) {
    return 0;
  }

  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const elapsed = differenceInMinutes(now, start);

  const progress = Math.min((elapsed / estimatedMinutes) * 100, 100);
  return Math.round(progress);
}
