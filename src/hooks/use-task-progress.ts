/**
 * Story 1.16: Manager Task Progress Dashboard
 * React hooks for task progress and workload metrics
 */

import { trpc } from "@/components/providers/trpc-provider";

/**
 * Hook to fetch overall task progress summary
 * Returns metrics: active tickets, tasks pending/in_progress/blocked, avg completion time
 */
export function useTaskProgressSummary() {
  return trpc.workflow.getTaskProgressSummary.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch tickets with blocked tasks
 * Returns list of tickets that have tasks in blocked status
 */
export function useTicketsWithBlockedTasks() {
  return trpc.workflow.getTicketsWithBlockedTasks.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch technician workload metrics
 * Supports optional filtering by technician ID
 */
export function useTechnicianWorkload(technicianId?: string) {
  return trpc.workflow.getTechnicianWorkload.useQuery(
    technicianId ? { technicianId } : undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
}

/**
 * Hook to fetch task completion timeline
 * Default: last 7 days, configurable up to 90 days
 */
export function useTaskCompletionTimeline(daysBack: number = 7) {
  return trpc.workflow.getTaskCompletionTimeline.useQuery(
    { daysBack },
    {
      refetchInterval: 60000, // Refetch every 60 seconds
    }
  );
}
