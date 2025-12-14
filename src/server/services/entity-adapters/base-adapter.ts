/**
 * Base Entity Adapter
 *
 * Abstract base class for entity adapters that handle task lifecycle hooks.
 * Each entity type (service_ticket, inventory_receipt, etc.) implements
 * this interface to provide custom business logic for task events.
 *
 * @module services/entity-adapters/base-adapter
 */

import type { TRPCContext } from "../../trpc";

/**
 * Entity types that support polymorphic tasks
 * Must match database ENUM: public.entity_type
 */
export type EntityType =
  | "service_ticket"
  | "inventory_receipt"
  | "inventory_issue"
  | "inventory_transfer"
  | "service_request";

/**
 * Task status
 * Must match database ENUM: public.task_status
 */
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "skipped";

/**
 * Result of canStartTask check
 */
export interface CanStartResult {
  canStart: boolean;
  reason?: string;
}

/**
 * Result of canAssignWorkflow check
 */
export interface CanAssignWorkflowResult {
  canAssign: boolean;
  reason?: string;
}

/**
 * Entity context for UI display
 */
export interface TaskContext {
  entityId: string;
  entityType: EntityType;
  title: string;
  subtitle?: string;
  status: string;
  url: string;
  priority?: "low" | "normal" | "high" | "urgent";
  deadline?: Date | string;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract base class for entity adapters
 *
 * Adapters handle:
 * - Task lifecycle hooks (onTaskStart, onTaskComplete, onTaskBlock)
 * - Auto-progression logic (updating entity status when tasks complete)
 * - Entity context for UI display
 * - Workflow assignment validation
 *
 * Example: ServiceTicketAdapter handles auto-progression of service_tickets
 * from 'pending' → 'in_progress' → 'completed' based on task completion.
 */
export abstract class BaseEntityAdapter {
  /**
   * Entity type this adapter handles
   */
  abstract readonly entityType: EntityType;

  /**
   * Optional: Validate if task can be started
   *
   * Use this to enforce business rules like:
   * - Receipt must be approved before serial entry tasks
   * - Transfer must be packed before shipping task
   *
   * @param ctx - tRPC context with Supabase clients and user
   * @param taskId - UUID of task to start
   * @returns Result with canStart boolean and optional reason
   */
  async canStartTask(ctx: TRPCContext, taskId: string): Promise<CanStartResult> {
    // Default: Allow all tasks to start
    return { canStart: true };
  }

  /**
   * Optional: Called when task starts
   *
   * Use this for:
   * - Logging task start time
   * - Sending notifications
   * - Updating entity status (e.g., ticket → 'in_progress')
   *
   * @param ctx - tRPC context
   * @param taskId - UUID of task that started
   */
  async onTaskStart(ctx: TRPCContext, taskId: string): Promise<void> {
    // Default: No action
  }

  /**
   * REQUIRED: Called when task completes
   *
   * This is the core auto-progression logic. Examples:
   * - Check if all required tasks complete → Update ticket status to 'completed'
   * - Check if serial entry 100% → Auto-complete receipt
   * - Check if all transfer tasks done → Update transfer status to 'completed'
   *
   * @param ctx - tRPC context
   * @param taskId - UUID of task that completed
   */
  abstract onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void>;

  /**
   * Optional: Called when task is blocked
   *
   * Use this for:
   * - Logging blocked reason
   * - Sending notifications to managers
   * - Updating entity status if all tasks blocked
   *
   * @param ctx - tRPC context
   * @param taskId - UUID of task that was blocked
   * @param reason - Reason for blocking
   */
  async onTaskBlock(ctx: TRPCContext, taskId: string, reason: string): Promise<void> {
    // Default: No action
  }

  /**
   * REQUIRED: Get entity context for UI display
   *
   * Fetches entity data and returns formatted context for task cards:
   * - title: "Service Ticket SV-2025-123"
   * - subtitle: "Customer: John Doe"
   * - status: "in_progress"
   * - url: "/tickets/uuid"
   * - priority: "high" (based on business rules)
   *
   * @param ctx - tRPC context
   * @param entityId - UUID of entity
   * @returns Task context for UI
   */
  abstract getEntityContext(ctx: TRPCContext, entityId: string): Promise<TaskContext>;

  /**
   * Optional: Validate if workflow can be assigned to entity
   *
   * Use this to prevent:
   * - Assigning serialized workflow to non-serialized products
   * - Assigning repair workflow to warranty tickets
   *
   * @param ctx - tRPC context
   * @param entityId - UUID of entity
   * @param workflowId - UUID of workflow to assign
   * @returns Result with canAssign boolean and optional reason
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string,
  ): Promise<CanAssignWorkflowResult> {
    // Default: Allow all workflow assignments
    return { canAssign: true };
  }

  /**
   * Helper: Get task data from database
   *
   * @param ctx - tRPC context
   * @param taskId - UUID of task
   * @returns Task data
   */
  protected async getTask(ctx: TRPCContext, taskId: string) {
    const { data: task, error } = await ctx.supabaseAdmin
      .from("entity_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    return task;
  }

  /**
   * Helper: Check if all required tasks for entity are complete
   *
   * @param ctx - tRPC context
   * @param entityId - UUID of entity
   * @returns True if all required tasks are completed/skipped
   */
  protected async areAllRequiredTasksComplete(
    ctx: TRPCContext,
    entityId: string,
  ): Promise<boolean> {
    const { data: tasks, error } = await ctx.supabaseAdmin
      .from("entity_tasks")
      .select("id, status, is_required")
      .eq("entity_type", this.entityType)
      .eq("entity_id", entityId)
      .eq("is_required", true);

    if (error) {
      throw new Error(`Failed to check tasks: ${error.message}`);
    }

    // All required tasks must be completed or skipped
    return tasks.every((task) =>
      task.status === "completed" || task.status === "skipped"
    );
  }

  /**
   * Helper: Check if task dependencies are met (for strict sequence workflows)
   *
   * @param ctx - tRPC context
   * @param taskId - UUID of task to check
   * @returns True if all previous tasks in sequence are complete
   */
  protected async areDependenciesMet(
    ctx: TRPCContext,
    taskId: string,
  ): Promise<boolean> {
    const task = await this.getTask(ctx, taskId);

    // Check if workflow is strict sequence
    const { data: workflow, error: workflowError } = await ctx.supabaseAdmin
      .from("workflows")
      .select("strict_sequence")
      .eq("id", task.workflow_id)
      .single();

    if (workflowError || !workflow?.strict_sequence) {
      // Not a strict sequence workflow, dependencies always met
      return true;
    }

    // Check if all previous tasks (lower sequence_order) are completed
    const { data: previousTasks, error } = await ctx.supabaseAdmin
      .from("entity_tasks")
      .select("id, status")
      .eq("entity_type", task.entity_type)
      .eq("entity_id", task.entity_id)
      .eq("workflow_id", task.workflow_id)
      .lt("sequence_order", task.sequence_order)
      .eq("is_required", true);

    if (error) {
      throw new Error(`Failed to check dependencies: ${error.message}`);
    }

    // All previous required tasks must be completed or skipped
    return previousTasks.every((t) =>
      t.status === "completed" || t.status === "skipped"
    );
  }
}

/**
 * Type alias for adapter interface (used by registry)
 */
export type EntityAdapter = BaseEntityAdapter;
