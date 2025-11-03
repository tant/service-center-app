// Workflow Tasks Helper
// Utilities for creating and managing workflow tasks in service tickets

import type { TRPCContext } from "../trpc";

/**
 * Create service ticket tasks from a workflow template
 * This function fetches the workflow template and creates individual tasks for the ticket
 *
 * @param ctx - tRPC context with Supabase admin client
 * @param ticketId - UUID of the service ticket
 * @param workflowId - UUID of the workflow template to use
 * @returns Number of tasks created
 * @throws Error if workflow not found or task creation fails
 */
export async function createTasksFromWorkflow(
  ctx: TRPCContext,
  ticketId: string,
  workflowId: string
): Promise<number> {
  // 1. Fetch workflow with all its tasks
  const { data: workflow, error: workflowError } = await ctx.supabaseAdmin
    .from('workflows')
    .select(`
      id,
      name,
      strict_sequence,
      tasks:workflow_tasks(
        id,
        task_id,
        sequence_order,
        is_required,
        custom_instructions,
        task:tasks(
          id,
          name,
          description,
          category,
          estimated_duration_minutes,
          requires_notes,
          requires_photo
        )
      )
    `)
    .eq('id', workflowId)
    .eq('is_active', true)
    .single();

  if (workflowError || !workflow) {
    throw new Error(`Workflow not found or inactive: ${workflowId}`);
  }

  if (!workflow.tasks || workflow.tasks.length === 0) {
    throw new Error(`Workflow "${workflow.name}" has no tasks defined`);
  }

  // 2. Sort tasks by sequence_order
  const sortedTasks = [...workflow.tasks].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );

  // 3. Prepare ticket tasks for insertion
  const ticketTasks = sortedTasks.map((wt) => {
    // Handle nested task object (Supabase returns array or object)
    const task = Array.isArray(wt.task) ? wt.task[0] : wt.task;

    return {
      ticket_id: ticketId,
      task_id: wt.task_id,
      workflow_task_id: wt.id,
      name: task.name,
      description: wt.custom_instructions || task.description,
      sequence_order: wt.sequence_order,
      status: 'pending' as const,
      is_required: wt.is_required,
      estimated_duration_minutes: task.estimated_duration_minutes,
    };
  });

  // 4. Insert tasks into service_ticket_tasks table
  const { error: insertError } = await ctx.supabaseAdmin
    .from('service_ticket_tasks')
    .insert(ticketTasks);

  if (insertError) {
    throw new Error(`Failed to create ticket tasks: ${insertError.message}`);
  }

  return ticketTasks.length;
}

/**
 * Get tasks for a specific ticket with progress information
 *
 * @param ctx - tRPC context with Supabase admin client
 * @param ticketId - UUID of the service ticket
 * @returns Array of tasks with their current status
 */
export async function getTicketTasksWithProgress(
  ctx: TRPCContext,
  ticketId: string
) {
  const { data: tasks, error } = await ctx.supabaseAdmin
    .from('service_ticket_tasks')
    .select(`
      *,
      task:tasks(*),
      assigned_to:profiles(id, full_name, email, avatar_url)
    `)
    .eq('ticket_id', ticketId)
    .order('sequence_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch ticket tasks: ${error.message}`);
  }

  // Calculate progress statistics
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
  const blockedTasks = tasks?.filter(t => t.status === 'blocked').length || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;

  return {
    tasks: tasks || [],
    progress: {
      total: totalTasks,
      completed: completedTasks,
      in_progress: inProgressTasks,
      blocked: blockedTasks,
      pending: pendingTasks,
      completion_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  };
}

/**
 * Check if a task can be started based on workflow sequence rules
 *
 * @param ctx - tRPC context with Supabase admin client
 * @param taskId - UUID of the task to check
 * @returns Object with canStart flag and reason if blocked
 */
export async function canStartTask(
  ctx: TRPCContext,
  taskId: string
): Promise<{ canStart: boolean; reason?: string }> {
  // 1. Get task details
  const { data: task, error: taskError } = await ctx.supabaseAdmin
    .from('service_ticket_tasks')
    .select(`
      id,
      ticket_id,
      sequence_order,
      status
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return { canStart: false, reason: 'Task not found' };
  }

  // 2. Check if task is already completed or in progress
  if (task.status === 'completed') {
    return { canStart: false, reason: 'Task is already completed' };
  }

  if (task.status === 'in_progress') {
    return { canStart: true }; // Already started
  }

  // 3. Get workflow to check if sequence is enforced
  const { data: ticket } = await ctx.supabaseAdmin
    .from('service_tickets')
    .select('workflow_id, workflows(strict_sequence)')
    .eq('id', task.ticket_id)
    .single();

  // Handle workflows being array or object (Supabase type inference)
  const workflow = Array.isArray(ticket?.workflows)
    ? ticket?.workflows[0]
    : ticket?.workflows;

  const enforceSequence = workflow?.strict_sequence ?? false;

  // 4. If sequence not enforced, can start anytime
  if (!enforceSequence) {
    return { canStart: true };
  }

  // 5. Check if all previous tasks are completed
  const { data: previousTasks } = await ctx.supabaseAdmin
    .from('service_ticket_tasks')
    .select('id, name, status, is_required')
    .eq('ticket_id', task.ticket_id)
    .lt('sequence_order', task.sequence_order)
    .neq('status', 'skipped');

  const incompleteTasks = previousTasks?.filter(
    t => t.status !== 'completed' && t.is_required
  ) || [];

  if (incompleteTasks.length > 0) {
    return {
      canStart: false,
      reason: `Phải hoàn thành ${incompleteTasks.length} công việc trước đó: ${incompleteTasks.map(t => t.name).join(', ')}`,
    };
  }

  return { canStart: true };
}
