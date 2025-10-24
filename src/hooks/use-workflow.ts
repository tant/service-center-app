// Task Workflow Hooks
// Custom hooks for task templates, task execution, and workflow management

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/components/providers/trpc-provider';
import type { TaskTemplate, ServiceTicketTask, TaskProgressSummary } from '@/types/workflow';

/**
 * Hook for managing task types
 * Returns all active task types for template creation
 */
export function useTaskTypes() {
  const { data: taskTypes, isLoading, error } = trpc.workflow.taskType.list.useQuery();

  return {
    taskTypes: taskTypes ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook for creating custom task types
 * Admin/Manager only
 */
export function useCreateTaskType() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.taskType.create.useMutation({
    onSuccess: () => {
      utils.workflow.taskType.list.invalidate();
      toast.success('Task type created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create task type');
    },
  });

  return {
    createTaskType: mutation.mutate,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for managing task templates
 * Supports filtering by product type, service type, and active status
 */
export function useTaskTemplates(filters?: {
  product_type?: string;
  service_type?: 'warranty' | 'paid' | 'replacement';
  is_active?: boolean;
}) {
  const { data: templates, isLoading, error } = trpc.workflow.template.list.useQuery(filters);

  return {
    templates: templates ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook for fetching a single template by ID
 * Used for editing templates - loads template with all its tasks
 */
export function useTaskTemplate(templateId: string | undefined) {
  const { data: template, isLoading, error } = trpc.workflow.template.getById.useQuery(
    { template_id: templateId! },
    { enabled: !!templateId } // Only fetch if templateId exists
  );

  return {
    template,
    isLoading,
    error,
  };
}

/**
 * Hook for creating new templates
 * Admin/Manager only
 */
export function useCreateTemplate() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.template.create.useMutation({
    onSuccess: () => {
      utils.workflow.template.list.invalidate();
      toast.success('Template created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  return {
    createTemplate: mutation.mutate,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for updating templates (creates new version)
 * Admin/Manager only
 */
export function useUpdateTemplate() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.template.update.useMutation({
    onSuccess: () => {
      utils.workflow.template.list.invalidate();
      toast.success('Template updated successfully (new version created)');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  return {
    updateTemplate: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for deleting templates
 * Admin/Manager only
 * Validates that template is not in use by active tickets
 */
export function useDeleteTemplate() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.template.delete.useMutation({
    onSuccess: (data) => {
      utils.workflow.template.list.invalidate();
      toast.success(
        data.soft_deleted
          ? 'Template deactivated successfully'
          : 'Template deleted successfully'
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  return {
    deleteTemplate: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}

/**
 * Hook for managing tasks within a service ticket
 * TODO: Implement task execution logic (Story 1.3)
 */
export function useTicketTasks(ticketId: string | undefined) {
  // TODO: Implement with tRPC in Story 1.3
  const tasks: ServiceTicketTask[] = [];
  const isLoading = false;
  const error = null;

  return {
    tasks,
    isLoading,
    error,
    // TODO: Add mutations (complete, block, skip, assign)
  };
}

/**
 * Hook for task progress analytics
 * TODO: Implement progress tracking
 */
export function useTaskProgress(ticketId: string | undefined) {
  // TODO: Implement with tRPC view query
  const progress: TaskProgressSummary | null = null;
  const isLoading = false;
  const error = null;

  return {
    progress,
    isLoading,
    error,
  };
}

/**
 * Hook for applying a template to a ticket
 * TODO: Implement template application logic
 */
export function useApplyTemplate() {
  const [isApplying, setIsApplying] = useState(false);

  const applyTemplate = useCallback(async (ticketId: string, templateId: string) => {
    // TODO: Implement tRPC mutation
    setIsApplying(true);
    try {
      // Placeholder
      console.log('Applying template', templateId, 'to ticket', ticketId);
    } finally {
      setIsApplying(false);
    }
  }, []);

  return {
    applyTemplate,
    isApplying,
  };
}

/**
 * Hook for task status transitions
 * TODO: Implement status validation and transitions
 */
export function useTaskTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const canTransition = useCallback((currentStatus: string, newStatus: string): boolean => {
    // TODO: Implement validation logic based on TASK_STATUS_TRANSITIONS
    return true;
  }, []);

  const transitionTask = useCallback(async (
    taskId: string,
    newStatus: string,
    data?: { notes?: string; reason?: string }
  ) => {
    // TODO: Implement tRPC mutation
    setIsTransitioning(true);
    try {
      console.log('Transitioning task', taskId, 'to', newStatus, data);
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  return {
    canTransition,
    transitionTask,
    isTransitioning,
  };
}

// ===================================================
// TASK EXECUTION HOOKS (Story 1.4)
// ===================================================

/**
 * Hook for fetching tasks assigned to current user
 * Story 1.4: Task Execution UI
 * Supports real-time polling with refetchInterval
 */
export function useMyTasks() {
  const { data: tasks, isLoading, error, refetch } = trpc.workflow.myTasks.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return {
    tasks: tasks ?? [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for updating task status
 * Story 1.4: Task Execution UI
 */
export function useUpdateTaskStatus() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.updateTaskStatus.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh task lists
      utils.workflow.myTasks.invalidate();
      toast.success('Trạng thái công việc đã được cập nhật');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật trạng thái công việc');
    },
  });

  return {
    updateStatus: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for adding notes to tasks
 * Story 1.4: Task Execution UI
 */
export function useAddTaskNotes() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.addTaskNotes.useMutation({
    onSuccess: () => {
      utils.workflow.myTasks.invalidate();
      toast.success('Ghi chú đã được thêm vào công việc');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể thêm ghi chú');
    },
  });

  return {
    addNotes: mutation.mutate,
    isAdding: mutation.isPending,
  };
}

/**
 * Hook for completing tasks with required completion notes
 * Story 1.4: Task Execution UI
 */
export function useCompleteTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.completeTask.useMutation({
    onSuccess: () => {
      utils.workflow.myTasks.invalidate();
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
 * Hook for fetching task dependencies
 * Story 1.5: Task Dependencies and Status Automation
 * AC 8: Get prerequisite tasks to validate sequence
 */
export function useTaskDependencies(taskId: string | undefined) {
  const { data, isLoading, error } = trpc.workflow.getTaskDependencies.useQuery(
    { task_id: taskId! },
    { enabled: !!taskId }
  );

  return {
    dependencies: data,
    isLoading,
    error,
  };
}
