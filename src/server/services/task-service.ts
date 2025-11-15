/**
 * Task Service
 *
 * Core business logic for polymorphic task management.
 * Handles task lifecycle operations and integrates with entity adapters.
 *
 * @module services/task-service
 */

import type { TRPCContext } from "../trpc";
import { adapterRegistry } from "./entity-adapters/registry";
import type { EntityType, TaskStatus } from "./entity-adapters/base-adapter";

/**
 * Task data from database
 */
export interface TaskData {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  task_id: string;
  workflow_task_id: string | null;
  workflow_id: string | null;
  name: string;
  description: string | null;
  sequence_order: number;
  status: TaskStatus;
  is_required: boolean;
  assigned_to_id: string | null;
  estimated_duration_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  task_notes: string | null;
  completion_notes: string | null;
  blocked_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
}

/**
 * Task with entity context for UI display
 */
export interface TaskWithContext extends TaskData {
  entity_context: {
    title: string;
    subtitle?: string;
    status: string;
    url: string;
    priority?: string;
    deadline?: Date | string;
    metadata?: Record<string, unknown>;
  };
  assigned_to?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Filters for querying tasks
 */
export interface TaskFilters {
  /** Filter by assigned user (null = show all tasks) */
  assignedToId?: string | null;
  /** Filter by task status */
  status?: TaskStatus | TaskStatus[];
  /** Filter by entity type */
  entityType?: EntityType;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Show only overdue tasks */
  overdue?: boolean;
  /** Show only required tasks */
  requiredOnly?: boolean;
}

/**
 * Input for creating tasks from workflow
 */
export interface CreateTasksFromWorkflowInput {
  entityType: EntityType;
  entityId: string;
  workflowId: string;
  createdById?: string;
}

/**
 * Input for starting a task
 */
export interface StartTaskInput {
  taskId: string;
  userId: string;
}

/**
 * Input for completing a task
 */
export interface CompleteTaskInput {
  taskId: string;
  userId: string;
  completionNotes: string;
}

/**
 * Input for blocking a task
 */
export interface BlockTaskInput {
  taskId: string;
  userId: string;
  blockedReason: string;
}

/**
 * Task Service Class
 *
 * Provides high-level operations for task management with proper
 * integration to entity adapters for auto-progression logic.
 */
export class TaskService {
  constructor(private ctx: TRPCContext) {}

  /**
   * Get tasks for the current user with optional filters
   *
   * @param filters - Filtering options
   * @returns Array of tasks with entity context
   */
  async getMyTasks(filters: TaskFilters = {}): Promise<TaskWithContext[]> {
    const userId = this.ctx.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Lookup profile ID from auth user ID
    const { data: profile, error: profileError } = await this.ctx.supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    // Build query
    let query = this.ctx.supabaseAdmin
      .from("entity_tasks")
      .select(
        `
        *,
        assigned_to:profiles!assigned_to_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("sequence_order", { ascending: true });

    // Apply filters
    if (filters.assignedToId === null) {
      // Explicitly null = show all tasks (no filter)
      // Don't add any assigned_to_id filter
    } else if (filters.assignedToId) {
      // Specific user ID provided
      query = query.eq("assigned_to_id", filters.assignedToId);
    } else {
      // Default: show user's assigned tasks (use profile ID, not auth user ID)
      query = query.eq("assigned_to_id", profile.id);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    } else {
      // Default: show active tasks only
      query = query.in("status", ["pending", "in_progress", "blocked"]);
    }

    if (filters.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    if (filters.entityId) {
      query = query.eq("entity_id", filters.entityId);
    }

    if (filters.workflowId) {
      query = query.eq("workflow_id", filters.workflowId);
    }

    if (filters.requiredOnly) {
      query = query.eq("is_required", true);
    }

    if (filters.overdue) {
      query = query.lt("due_date", new Date().toISOString());
      query = query.not("due_date", "is", null);
    }

    const { data: tasks, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return [];
    }

    // Enrich tasks with entity context
    const tasksWithContext = await Promise.all(
      tasks.map((task) => this.enrichTaskWithContext(task))
    );

    return tasksWithContext;
  }

  /**
   * Get a single task by ID
   *
   * @param taskId - UUID of the task
   * @returns Task with context
   */
  async getTask(taskId: string): Promise<TaskWithContext> {
    const { data: task, error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .select(
        `
        *,
        assigned_to:profiles!assigned_to_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq("id", taskId)
      .single();

    if (error || !task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return this.enrichTaskWithContext(task);
  }

  /**
   * Get all tasks for a specific entity
   *
   * @param entityType - Type of entity
   * @param entityId - UUID of entity
   * @returns Array of tasks with progress statistics
   */
  async getEntityTasks(entityType: EntityType, entityId: string) {
    const { data: tasks, error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .select(
        `
        *,
        assigned_to:profiles!assigned_to_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("sequence_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch entity tasks: ${error.message}`);
    }

    // Enrich tasks with entity context
    const tasksWithContext = await Promise.all(
      (tasks || []).map((task) => this.enrichTaskWithContext(task))
    );

    // Calculate progress statistics
    const totalTasks = tasksWithContext.length;
    const completedTasks =
      tasksWithContext.filter((t) => t.status === "completed").length;
    const inProgressTasks =
      tasksWithContext.filter((t) => t.status === "in_progress").length;
    const blockedTasks =
      tasksWithContext.filter((t) => t.status === "blocked").length;
    const pendingTasks =
      tasksWithContext.filter((t) => t.status === "pending").length;

    return {
      tasks: tasksWithContext,
      progress: {
        total: totalTasks,
        completed: completedTasks,
        in_progress: inProgressTasks,
        blocked: blockedTasks,
        pending: pendingTasks,
        completion_percentage:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    };
  }

  /**
   * Start a task (mark as in_progress)
   *
   * @param input - Start task input with validation
   * @returns Updated task
   */
  async startTask(input: StartTaskInput): Promise<TaskWithContext> {
    const { taskId, userId } = input;

    // Get task
    const task = await this.getTask(taskId);

    // Check if task is already started or completed
    if (task.status === "in_progress") {
      return task; // Idempotent
    }

    if (task.status === "completed" || task.status === "skipped") {
      throw new Error(
        `Cannot start task that is already ${task.status}`
      );
    }

    // Check if user can start this task
    const adapter = adapterRegistry.get(task.entity_type);

    if (adapter.canStartTask) {
      const { canStart, reason } = await adapter.canStartTask(
        this.ctx,
        taskId
      );

      if (!canStart) {
        throw new Error(reason || "Cannot start this task");
      }
    }

    // Lookup profile ID from auth user ID
    // userId is from ctx.user.id which is auth.users.id
    // We need profiles.id for the foreign key constraint
    const { data: profile, error: profileError } = await this.ctx.supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    // Update task status
    const { error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        assigned_to_id: profile.id, // Use profile ID, not auth user ID
      })
      .eq("id", taskId);

    if (error) {
      throw new Error(`Failed to start task: ${error.message}`);
    }

    // Call adapter hook
    if (adapter.onTaskStart) {
      await adapter.onTaskStart(this.ctx, taskId);
    }

    // Return updated task
    return this.getTask(taskId);
  }

  /**
   * Get task requirements (requires_notes, requires_photo) via JOIN
   *
   * @param taskId - Entity task UUID
   * @returns Object with requiresNotes and requiresPhoto booleans
   */
  async getTaskRequirements(taskId: string): Promise<{
    requiresNotes: boolean;
    requiresPhoto: boolean;
  }> {
    const { data, error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .select(
        `
        id,
        task:tasks!inner (
          requires_notes,
          requires_photo
        )
      `
      )
      .eq("id", taskId)
      .single();

    if (error) {
      throw new Error(`Failed to get task requirements: ${error.message}`);
    }

    if (!data?.task) {
      throw new Error("Task definition not found");
    }

    // Handle nested task object (Supabase may return array or object)
    const task = Array.isArray(data.task) ? data.task[0] : data.task;

    return {
      requiresNotes: task.requires_notes,
      requiresPhoto: task.requires_photo,
    };
  }

  /**
   * Append timestamped notes to task_notes field
   *
   * @param input - Object with taskId and notes
   * @returns Updated task with entity context
   * @throws Error if task is completed/skipped or update fails
   */
  async addTaskNotes(input: {
    taskId: string;
    notes: string;
    userId: string;
  }): Promise<TaskWithContext> {
    const { taskId, notes, userId } = input;

    // Get current task
    const { data: task, error: fetchError } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .select("task_notes, status")
      .eq("id", taskId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch task: ${fetchError.message}`);
    }

    // Prevent editing completed/skipped tasks
    if (task.status === "completed" || task.status === "skipped") {
      throw new Error(
        "Không thể thêm ghi chú vào công việc đã hoàn thành hoặc đã bỏ qua"
      );
    }

    // Get profile for user name
    const { data: profile } = await this.ctx.supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const userName = profile?.full_name || "Unknown User";
    // Format timestamp in Vietnamese locale for better readability
    const timestamp = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const newEntry = `[${timestamp}] ${userName}: ${notes}`;

    // Append to existing notes or create new
    const updatedNotes = task.task_notes
      ? `${task.task_notes}\n\n${newEntry}`
      : newEntry;

    // Update task_notes
    const { error: updateError } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .update({ task_notes: updatedNotes })
      .eq("id", taskId);

    if (updateError) {
      throw new Error(`Failed to add notes: ${updateError.message}`);
    }

    // Return updated task with context
    return this.getTask(taskId);
  }

  /**
   * Complete a task
   *
   * @param input - Complete task input with notes
   * @returns Updated task
   */
  async completeTask(input: CompleteTaskInput): Promise<TaskWithContext> {
    const { taskId, userId, completionNotes } = input;

    // Get task
    const task = await this.getTask(taskId);

    // Check if task is already completed
    if (task.status === "completed") {
      return task; // Idempotent
    }

    // Step 1: Validate completion notes (always required)
    if (!completionNotes || completionNotes.trim().length < 5) {
      throw new Error("Ghi chú hoàn thành phải có ít nhất 5 ký tự");
    }

    // Step 2: Get task requirements
    const requirements = await this.getTaskRequirements(taskId);

    // Step 3: Validate task_notes if required
    if (requirements.requiresNotes) {
      const { data: taskData } = await this.ctx.supabaseAdmin
        .from("entity_tasks")
        .select("task_notes")
        .eq("id", taskId)
        .single();

      if (!taskData?.task_notes || taskData.task_notes.trim().length === 0) {
        throw new Error(
          "Ghi chú công việc là bắt buộc cho loại công việc này"
        );
      }
    }

    // Step 4: Validate attachments if required
    if (requirements.requiresPhoto) {
      const { count, error: countError } = await this.ctx.supabaseAdmin
        .from("task_attachments")
        .select("*", { count: "exact", head: true })
        .eq("task_id", taskId);

      if (countError) {
        throw new Error(`Failed to check attachments: ${countError.message}`);
      }

      if (!count || count === 0) {
        throw new Error(
          "Phải upload ít nhất 1 ảnh/tài liệu cho loại công việc này"
        );
      }
    }

    // Lookup profile ID from auth user ID
    const { data: profile, error: profileError } = await this.ctx.supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    // Update task status
    const { error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes,
        assigned_to_id: profile.id, // Use profile ID, not auth user ID
      })
      .eq("id", taskId);

    if (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }

    // Call adapter hook (REQUIRED - auto-progression logic)
    const adapter = adapterRegistry.get(task.entity_type);
    await adapter.onTaskComplete(this.ctx, taskId);

    // Return updated task
    return this.getTask(taskId);
  }

  /**
   * Block a task with reason
   *
   * @param input - Block task input with reason
   * @returns Updated task
   */
  async blockTask(input: BlockTaskInput): Promise<TaskWithContext> {
    const { taskId, userId, blockedReason } = input;

    // Get task
    const task = await this.getTask(taskId);

    // Validate blocked reason
    if (!blockedReason || blockedReason.trim().length === 0) {
      throw new Error("Blocked reason is required");
    }

    // Lookup profile ID from auth user ID
    const { data: profile, error: profileError } = await this.ctx.supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    // Update task status
    const { error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .update({
        status: "blocked",
        blocked_reason: blockedReason,
        assigned_to_id: profile.id, // Use profile ID, not auth user ID
      })
      .eq("id", taskId);

    if (error) {
      throw new Error(`Failed to block task: ${error.message}`);
    }

    // Call adapter hook
    const adapter = adapterRegistry.get(task.entity_type);
    if (adapter.onTaskBlock) {
      await adapter.onTaskBlock(this.ctx, taskId, blockedReason);
    }

    // Return updated task
    return this.getTask(taskId);
  }

  /**
   * Unblock a task (reset to pending)
   *
   * @param taskId - UUID of task to unblock
   * @returns Updated task
   */
  async unblockTask(taskId: string): Promise<TaskWithContext> {
    const task = await this.getTask(taskId);

    if (task.status !== "blocked") {
      throw new Error("Task is not blocked");
    }

    const { error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .update({
        status: "pending",
        blocked_reason: null,
      })
      .eq("id", taskId);

    if (error) {
      throw new Error(`Failed to unblock task: ${error.message}`);
    }

    return this.getTask(taskId);
  }

  /**
   * Skip a task (mark as skipped if not required)
   *
   * @param taskId - UUID of task to skip
   * @returns Updated task
   */
  async skipTask(taskId: string): Promise<TaskWithContext> {
    const task = await this.getTask(taskId);

    if (task.is_required) {
      throw new Error("Cannot skip required tasks");
    }

    const { error } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .update({
        status: "skipped",
      })
      .eq("id", taskId);

    if (error) {
      throw new Error(`Failed to skip task: ${error.message}`);
    }

    return this.getTask(taskId);
  }

  /**
   * Create tasks from a workflow template
   *
   * @param input - Workflow and entity information
   * @returns Number of tasks created
   */
  async createTasksFromWorkflow(
    input: CreateTasksFromWorkflowInput
  ): Promise<number> {
    const { entityType, entityId, workflowId, createdById } = input;

    // Validate workflow can be assigned to this entity
    const adapter = adapterRegistry.get(entityType);
    if (adapter.canAssignWorkflow) {
      const { canAssign, reason } = await adapter.canAssignWorkflow(
        this.ctx,
        entityId,
        workflowId
      );

      if (!canAssign) {
        throw new Error(
          reason || "Cannot assign this workflow to the entity"
        );
      }
    }

    // Fetch workflow with all its tasks
    const { data: workflow, error: workflowError } =
      await this.ctx.supabaseAdmin
        .from("workflows")
        .select(
          `
          id,
          name,
          strict_sequence,
          entity_type,
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
        `
        )
        .eq("id", workflowId)
        .eq("is_active", true)
        .single();

    if (workflowError || !workflow) {
      throw new Error(`Workflow not found or inactive: ${workflowId}`);
    }

    if (!workflow.tasks || workflow.tasks.length === 0) {
      throw new Error(`Workflow "${workflow.name}" has no tasks defined`);
    }

    // Validate entity_type matches (if workflow specifies)
    if (workflow.entity_type && workflow.entity_type !== entityType) {
      throw new Error(
        `Workflow is for ${workflow.entity_type}, but entity is ${entityType}`
      );
    }

    // Update workflow_id on the entity (for all entity types that support it)
    let shouldCreateTasks = true;

    if (entityType === "service_ticket") {
      await this.ctx.supabaseAdmin
        .from("service_tickets")
        .update({ workflow_id: workflowId })
        .eq("id", entityId);
    } else if (entityType === "service_request") {
      // Check if service request is draft BEFORE updating workflow_id
      const { data: request } = await this.ctx.supabaseAdmin
        .from("service_requests")
        .select("id, status, workflow_id")
        .eq("id", entityId)
        .single();

      // Only create tasks if NOT draft
      // NOTE: When called from submitDraft, status is already updated to 'submitted'
      // But when called from WorkflowSelectionDialog for draft request, status is still 'draft'
      if (request?.status === "draft") {
        shouldCreateTasks = false;
      }

      // Update workflow_id (only if not already set to avoid unnecessary update)
      if (request?.workflow_id !== workflowId) {
        await this.ctx.supabaseAdmin
          .from("service_requests")
          .update({ workflow_id: workflowId })
          .eq("id", entityId);
      }
    } else if (entityType === "inventory_receipt") {
      await this.ctx.supabaseAdmin
        .from("inventory_receipts")
        .update({ workflow_id: workflowId })
        .eq("id", entityId);
    } else if (entityType === "inventory_issue") {
      await this.ctx.supabaseAdmin
        .from("inventory_issues")
        .update({ workflow_id: workflowId })
        .eq("id", entityId);
    } else if (entityType === "inventory_transfer") {
      await this.ctx.supabaseAdmin
        .from("inventory_transfers")
        .update({ workflow_id: workflowId })
        .eq("id", entityId);
    }

    // Return early if we shouldn't create tasks (draft service request)
    if (!shouldCreateTasks) {
      return 0; // 0 tasks created
    }

    // Sort tasks by sequence_order
    const sortedTasks = [...workflow.tasks].sort(
      (a, b) => a.sequence_order - b.sequence_order
    );

    // Prepare entity tasks for insertion
    const entityTasks = sortedTasks.map((wt) => {
      // Handle nested task object (Supabase returns array or object)
      const task = Array.isArray(wt.task) ? wt.task[0] : wt.task;

      return {
        entity_type: entityType,
        entity_id: entityId,
        task_id: wt.task_id,
        workflow_task_id: wt.id,
        workflow_id: workflowId,
        name: task.name,
        description: wt.custom_instructions || task.description,
        sequence_order: wt.sequence_order,
        status: "pending" as const,
        is_required: wt.is_required,
        estimated_duration_minutes: task.estimated_duration_minutes,
        created_by_id: createdById || null,
      };
    });

    // Insert tasks
    const { error: insertError } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .insert(entityTasks);

    if (insertError) {
      throw new Error(
        `Failed to create entity tasks: ${insertError.message}`
      );
    }

    return entityTasks.length;
  }

  /**
   * Helper: Enrich task with entity context from adapter
   */
  private async enrichTaskWithContext(task: any): Promise<TaskWithContext> {
    try {
      const adapter = adapterRegistry.get(task.entity_type);
      const context = await adapter.getEntityContext(
        this.ctx,
        task.entity_id
      );

      return {
        ...task,
        entity_context: context,
      };
    } catch (error) {
      // If adapter fails, return task with minimal context
      console.error(
        `Failed to get entity context for task ${task.id}:`,
        error
      );
      return {
        ...task,
        entity_context: {
          title: `${task.entity_type}: ${task.entity_id}`,
          status: "unknown",
          url: "#",
        },
      };
    }
  }
}
