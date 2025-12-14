/**
 * Entity Tasks Hooks
 *
 * Custom hooks for task execution in service tickets and other entities.
 * Provides hooks for fetching tasks and performing task actions.
 */

'use client';

import { toast } from 'sonner';
import { trpc } from '@/components/providers/trpc-provider';
import type { EntityType } from '@/server/services/entity-adapters/base-adapter';

/**
 * Hook for fetching tasks of a specific entity
 * Auto-refresh every 30 seconds for real-time updates
 *
 * @param entityType - Type of entity (service_ticket, inventory_receipt, etc.)
 * @param entityId - ID of the entity
 * @returns Tasks, progress, loading state, and refetch function
 */
export function useEntityTasks(entityType: EntityType, entityId: string) {
  const { data, isLoading, error, refetch } = trpc.tasks.getEntityTasks.useQuery(
    { entityType, entityId },
    {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      refetchOnWindowFocus: true, // Refresh when user returns to tab
    }
  );

  return {
    tasks: data?.tasks ?? [],
    progress: data?.progress,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for starting a task
 * Transitions task from 'pending' or 'blocked' to 'in_progress'
 *
 * @returns Mutation function and loading state
 */
export function useStartTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.startTask.useMutation({
    onSuccess: () => {
      // Invalidate task queries to trigger refresh
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Đã bắt đầu công việc');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể bắt đầu công việc');
    },
  });

  return {
    startTask: mutation.mutate,
    isStarting: mutation.isPending,
  };
}

/**
 * Hook for completing a task
 * Requires completion notes for audit trail
 * Transitions task to 'completed' status
 *
 * @returns Mutation function and loading state
 */
export function useCompleteTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.completeTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Công việc đã hoàn thành');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể hoàn thành công việc');
    },
  });

  return {
    completeTask: mutation.mutate,
    isCompleting: mutation.isPending,
  };
}

/**
 * Hook for blocking a task
 * Requires reason for blocking
 * Transitions task to 'blocked' status
 *
 * @returns Mutation function and loading state
 */
export function useBlockTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.blockTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Công việc đã được đánh dấu chặn');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể chặn công việc');
    },
  });

  return {
    blockTask: mutation.mutate,
    isBlocking: mutation.isPending,
  };
}

/**
 * Hook for unblocking a task
 * Transitions task from 'blocked' back to 'pending'
 *
 * @returns Mutation function and loading state
 */
export function useUnblockTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.unblockTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Công việc đã được bỏ chặn');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể bỏ chặn công việc');
    },
  });

  return {
    unblockTask: mutation.mutate,
    isUnblocking: mutation.isPending,
  };
}
