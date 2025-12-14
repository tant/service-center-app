// Task Workflow Hooks
// Custom hooks for task templates, task execution, and workflow management

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/components/providers/trpc-provider';
import type { Workflow, EntityTask, TaskProgressSummary } from '@/types/workflow';

/**
 * Hook for managing task types
 * Supports filtering by is_active status
 * @param filters - Optional filters: is_active (true/false/undefined for all)
 */
export function useTaskTypes(filters?: { is_active?: boolean }) {
  const { data: taskTypes, isLoading, error } = trpc.workflow.taskType.list.useQuery(filters);

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
      toast.success('Loại công việc đã được tạo thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể tạo loại công việc');
    },
  });

  return {
    createTaskType: mutation.mutate,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for updating task types
 * Admin/Manager only
 */
export function useUpdateTaskType() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.taskType.update.useMutation({
    onSuccess: () => {
      utils.workflow.taskType.list.invalidate();
      toast.success('Loại công việc đã được cập nhật thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật loại công việc');
    },
  });

  return {
    updateTaskType: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for toggling task type active status
 * Admin/Manager only
 */
export function useToggleTaskType() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.taskType.toggleActive.useMutation({
    onSuccess: (data) => {
      utils.workflow.taskType.list.invalidate();
      toast.success(
        data.is_active 
          ? 'Loại công việc đã được kích hoạt' 
          : 'Loại công việc đã được vô hiệu hóa'
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể thay đổi trạng thái loại công việc');
    },
  });

  return {
    toggleTaskType: mutation.mutate,
    isToggling: mutation.isPending,
  };
}

/**
 * Hook for managing task templates
 * Supports filtering by entity type and active status
 */
export function useTaskTemplates(filters?: {
  entity_type?: 'service_ticket' | 'inventory_receipt' | 'inventory_issue' | 'inventory_transfer' | 'service_request';
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
      toast.success('Mẫu quy trình đã được tạo thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể tạo mẫu quy trình. Vui lòng kiểm tra lại thông tin và thử lại');
    },
  });

  return {
    createTemplate: mutation.mutate,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for updating templates (in-place update)
 * Admin/Manager only
 * Blocks update if template is being used by active tickets
 */
export function useUpdateTemplate() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.template.update.useMutation({
    onSuccess: () => {
      utils.workflow.template.list.invalidate();
      utils.workflow.template.getById.invalidate();
      toast.success('Mẫu quy trình đã được cập nhật thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật mẫu quy trình. Vui lòng thử lại');
    },
  });

  return {
    updateTemplate: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for toggling template active status
 * Admin/Manager only
 * Simple toggle without creating new version
 */
export function useToggleTemplate() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.template.toggleActive.useMutation({
    onSuccess: (data) => {
      utils.workflow.template.list.invalidate();
      utils.workflow.template.getById.invalidate();
      toast.success(
        data.is_active
          ? 'Mẫu quy trình đã được kích hoạt'
          : 'Mẫu quy trình đã được vô hiệu hóa'
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể thay đổi trạng thái mẫu quy trình');
    },
  });

  return {
    toggleTemplate: mutation.mutate,
    isToggling: mutation.isPending,
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
          ? 'Mẫu quy trình đã được vô hiệu hóa'
          : 'Mẫu quy trình đã được xóa thành công'
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể xóa mẫu quy trình. Có thể mẫu đang được sử dụng bởi các phiếu dịch vụ đang hoạt động');
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
  const tasks: EntityTask[] = [];
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

/**
 * Hook for switching task template during service
 * Story 1.17: Dynamic Template Switching
 * Allows technician to change template mid-service while preserving completed tasks
 */
export function useSwitchTemplate() {
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.switchTemplate.useMutation({
    onSuccess: (data) => {
      // Invalidate all ticket and workflow queries to refresh data
      utils.tickets.invalidate();
      utils.workflow.invalidate();

      // Show success toast with summary
      toast.success(
        `Đã chuyển mẫu quy trình thành công! ${data.summary.tasks_preserved} công việc giữ lại, ${data.summary.tasks_added} công việc mới được thêm.`
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể chuyển mẫu quy trình');
    },
  });

  return {
    switchTemplate: mutation.mutate,
    isSwitching: mutation.isPending,
    error: mutation.error,
  };
}
