/**
 * Ticket Task Card
 *
 * Wrapper component for TaskCard that integrates with task execution hooks and dialogs.
 * Used specifically for service ticket task execution.
 */

'use client';

import { useState } from 'react';
import { TaskCard } from '@/components/tasks/task-card';
import {
  CompleteTaskDialog,
  BlockTaskDialog,
} from '@/components/tasks/task-action-dialogs';
import {
  useStartTask,
  useCompleteTask,
  useBlockTask,
  useUnblockTask,
} from '@/hooks/use-entity-tasks';
import type { TaskWithContext } from '@/server/services/task-service';

interface TicketTaskCardProps {
  task: TaskWithContext;
}

/**
 * Ticket-specific task card with integrated action handlers
 *
 * Features:
 * - Start task (pending → in_progress)
 * - Complete task with notes (in_progress → completed)
 * - Block task with reason (in_progress → blocked)
 * - Unblock task (blocked → pending)
 * - Real-time loading states
 */
export function TicketTaskCard({ task }: TicketTaskCardProps) {
  // Dialog states
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // Task action hooks
  const { startTask, isStarting } = useStartTask();
  const { completeTask, isCompleting } = useCompleteTask();
  const { blockTask, isBlocking } = useBlockTask();
  const { unblockTask, isUnblocking } = useUnblockTask();

  // Combined loading state
  const isLoading = isStarting || isCompleting || isBlocking || isUnblocking;

  /**
   * Handle start task action
   * Directly mutate without confirmation
   */
  const handleStartTask = () => {
    startTask({ taskId: task.id });
  };

  /**
   * Handle complete task action
   * Opens dialog to collect completion notes
   */
  const handleCompleteTask = () => {
    setShowCompleteDialog(true);
  };

  /**
   * Handle complete task confirmation
   * Called when user submits completion dialog
   */
  const handleConfirmComplete = (notes: string) => {
    completeTask({
      taskId: task.id,
      completionNotes: notes,
    });
    setShowCompleteDialog(false);
  };

  /**
   * Handle block task action
   * Opens dialog to collect blocked reason
   */
  const handleBlockTask = () => {
    setShowBlockDialog(true);
  };

  /**
   * Handle block task confirmation
   * Called when user submits block dialog
   */
  const handleConfirmBlock = (reason: string) => {
    blockTask({
      taskId: task.id,
      blockedReason: reason,
    });
    setShowBlockDialog(false);
  };

  /**
   * Handle unblock task action
   * Directly mutate without confirmation
   */
  const handleUnblockTask = () => {
    unblockTask({ taskId: task.id });
  };

  return (
    <>
      {/* Main task card with action buttons */}
      <TaskCard
        task={task}
        onStartTask={handleStartTask}
        onCompleteTask={handleCompleteTask}
        onBlockTask={handleBlockTask}
        onUnblockTask={handleUnblockTask}
        isLoading={isLoading}
      />

      {/* Complete task dialog */}
      <CompleteTaskDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={handleConfirmComplete}
        taskName={task.name}
        isLoading={isCompleting}
      />

      {/* Block task dialog */}
      <BlockTaskDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        onConfirm={handleConfirmBlock}
        taskName={task.name}
        isLoading={isBlocking}
      />
    </>
  );
}
