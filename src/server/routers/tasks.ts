/**
 * Tasks tRPC Router
 *
 * API endpoints for polymorphic task management.
 * Uses TaskService for business logic and entity adapters for auto-progression.
 *
 * @module routers/tasks
 */

import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { requireAnyAuthenticated } from "../middleware/requireRole";
import { TaskService } from "../services/task-service";
import { getProfileIdFromUserId } from "../utils/profile-helpers";

/**
 * Entity type schema (must match database ENUM)
 */
const entityTypeSchema = z.enum([
  "service_ticket",
  "inventory_receipt",
  "inventory_issue",
  "inventory_transfer",
  "service_request",
]);

/**
 * Task status schema (must match database ENUM)
 */
const taskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "blocked",
  "skipped",
]);

/**
 * Task filters schema
 */
const taskFiltersSchema = z.object({
  assignedToId: z.string().uuid().optional(),
  status: z
    .union([taskStatusSchema, z.array(taskStatusSchema)])
    .optional(),
  entityType: entityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  overdue: z.boolean().optional(),
  requiredOnly: z.boolean().optional(),
});

/**
 * Create tasks from workflow schema
 */
const createTasksFromWorkflowSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Entity ID must be a valid UUID"),
  workflowId: z.string().uuid("Workflow ID must be a valid UUID"),
});

/**
 * Start task schema
 */
const startTaskSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
});

/**
 * Complete task schema
 */
const completeTaskSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
  completionNotes: z
    .string()
    .min(1, "Completion notes are required")
    .max(5000, "Completion notes must be less than 5000 characters"),
});

/**
 * Block task schema
 */
const blockTaskSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
  blockedReason: z
    .string()
    .min(1, "Blocked reason is required")
    .max(1000, "Blocked reason must be less than 1000 characters"),
});

/**
 * Unblock/skip task schema
 */
const taskIdSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
});

/**
 * Get entity tasks schema
 */
const getEntityTasksSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Entity ID must be a valid UUID"),
});

/**
 * Get serial entry progress schema
 */
const getSerialEntryProgressSchema = z.object({
  receiptId: z.string().uuid("Receipt ID must be a valid UUID"),
});

/**
 * Tasks Router
 */
export const tasksRouter = router({
  /**
   * Get current user's tasks with optional filters
   *
   * @endpoint GET /api/trpc/tasks.myTasks
   * @auth Required
   *
   * @example
   * ```typescript
   * // Get all my pending tasks
   * const tasks = await trpc.tasks.myTasks.query({
   *   status: 'pending'
   * });
   *
   * // Get overdue tasks
   * const overdue = await trpc.tasks.myTasks.query({
   *   overdue: true
   * });
   *
   * // Get tasks for specific entity
   * const ticketTasks = await trpc.tasks.myTasks.query({
   *   entityType: 'service_ticket',
   *   entityId: 'ticket-uuid'
   * });
   * ```
   */
  myTasks: publicProcedure
    .use(requireAnyAuthenticated)
    .input(taskFiltersSchema.optional())
    .query(async ({ input, ctx }) => {
      const taskService = new TaskService(ctx);
      return taskService.getMyTasks(input || {});
    }),

  /**
   * Get a single task by ID
   *
   * @endpoint GET /api/trpc/tasks.getTask
   * @auth Required
   *
   * @example
   * ```typescript
   * const task = await trpc.tasks.getTask.query({
   *   taskId: 'task-uuid'
   * });
   * ```
   */
  getTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(taskIdSchema)
    .query(async ({ input, ctx }) => {
      const taskService = new TaskService(ctx);
      return taskService.getTask(input.taskId);
    }),

  /**
   * Get all tasks for a specific entity with progress statistics
   *
   * @endpoint GET /api/trpc/tasks.getEntityTasks
   * @auth Required
   *
   * @example
   * ```typescript
   * const result = await trpc.tasks.getEntityTasks.query({
   *   entityType: 'service_ticket',
   *   entityId: 'ticket-uuid'
   * });
   *
   * console.log(result.progress.completion_percentage); // 75
   * console.log(result.tasks); // Array of tasks
   * ```
   */
  getEntityTasks: publicProcedure
    .use(requireAnyAuthenticated)
    .input(getEntityTasksSchema)
    .query(async ({ input, ctx }) => {
      const taskService = new TaskService(ctx);
      return taskService.getEntityTasks(
        input.entityType,
        input.entityId
      );
    }),

  /**
   * Start a task (mark as in_progress)
   *
   * @endpoint POST /api/trpc/tasks.startTask
   * @auth Required
   *
   * Validates:
   * - User has permission to start task
   * - Task is not already completed/skipped
   * - Workflow sequence rules (if strict_sequence enabled)
   * - Entity-specific start rules (via adapter)
   *
   * @example
   * ```typescript
   * const task = await trpc.tasks.startTask.mutate({
   *   taskId: 'task-uuid'
   * });
   * ```
   */
  startTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(startTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const taskService = new TaskService(ctx);
      return taskService.startTask({
        taskId: input.taskId,
        userId,
      });
    }),

  /**
   * Complete a task with notes
   *
   * @endpoint POST /api/trpc/tasks.completeTask
   * @auth Required
   *
   * Triggers:
   * - Auto-progression logic via entity adapter
   * - Entity status updates if all tasks complete
   * - Task history logging
   *
   * @example
   * ```typescript
   * const task = await trpc.tasks.completeTask.mutate({
   *   taskId: 'task-uuid',
   *   completionNotes: 'Hoàn thành kiểm tra, không phát hiện lỗi'
   * });
   * ```
   */
  completeTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(completeTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const taskService = new TaskService(ctx);
      return taskService.completeTask({
        taskId: input.taskId,
        userId,
        completionNotes: input.completionNotes,
      });
    }),

  /**
   * Block a task with reason
   *
   * @endpoint POST /api/trpc/tasks.blockTask
   * @auth Required
   *
   * Use when:
   * - Task cannot be completed due to external dependency
   * - Waiting for parts/information
   * - Technical issues preventing completion
   *
   * @example
   * ```typescript
   * const task = await trpc.tasks.blockTask.mutate({
   *   taskId: 'task-uuid',
   *   blockedReason: 'Đang chờ linh kiện thay thế từ nhà cung cấp'
   * });
   * ```
   */
  blockTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(blockTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const taskService = new TaskService(ctx);
      return taskService.blockTask({
        taskId: input.taskId,
        userId,
        blockedReason: input.blockedReason,
      });
    }),

  /**
   * Unblock a task (reset to pending)
   *
   * @endpoint POST /api/trpc/tasks.unblockTask
   * @auth Required
   *
   * @example
   * ```typescript
   * const task = await trpc.tasks.unblockTask.mutate({
   *   taskId: 'task-uuid'
   * });
   * ```
   */
  unblockTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(taskIdSchema)
    .mutation(async ({ input, ctx }) => {
      const taskService = new TaskService(ctx);
      return taskService.unblockTask(input.taskId);
    }),

  /**
   * Skip a task (only for non-required tasks)
   *
   * @endpoint POST /api/trpc/tasks.skipTask
   * @auth Required
   *
   * @example
   * ```typescript
   * const task = await trpc.tasks.skipTask.mutate({
   *   taskId: 'task-uuid'
   * });
   * ```
   */
  skipTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(taskIdSchema)
    .mutation(async ({ input, ctx }) => {
      const taskService = new TaskService(ctx);
      return taskService.skipTask(input.taskId);
    }),

  /**
   * Create tasks from a workflow template
   *
   * @endpoint POST /api/trpc/tasks.createTasksFromWorkflow
   * @auth Required (Admin/Manager typically)
   *
   * Validates:
   * - Workflow exists and is active
   * - Workflow entity_type matches (if specified)
   * - Entity can accept workflow (via adapter)
   *
   * @example
   * ```typescript
   * const count = await trpc.tasks.createTasksFromWorkflow.mutate({
   *   entityType: 'service_ticket',
   *   entityId: 'ticket-uuid',
   *   workflowId: 'workflow-uuid'
   * });
   * console.log(`Created ${count} tasks`);
   * ```
   */
  createTasksFromWorkflow: publicProcedure
    .use(requireAnyAuthenticated)
    .input(createTasksFromWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get profile ID (created_by_id references profiles.id, not auth.users.id)
      const profileId = await getProfileIdFromUserId(ctx.supabaseAdmin, userId);

      const taskService = new TaskService(ctx);
      return taskService.createTasksFromWorkflow({
        ...input,
        createdById: profileId,
      });
    }),

  /**
   * Get serial entry progress for inventory receipt
   *
   * @endpoint GET /api/trpc/tasks.getSerialEntryProgress
   * @auth Required
   *
   * Returns detailed serial entry progress for each product in the receipt:
   * - Product details (id, name)
   * - Expected quantity vs serial count
   * - Completion percentage
   * - Associated task status
   *
   * @example
   * ```typescript
   * const progress = await trpc.tasks.getSerialEntryProgress.query({
   *   receiptId: 'receipt-uuid'
   * });
   *
   * progress.forEach(item => {
   *   console.log(`${item.product_name}: ${item.percentage}% complete`);
   *   console.log(`Task status: ${item.task_status}`);
   * });
   * ```
   */
  getSerialEntryProgress: publicProcedure
    .use(requireAnyAuthenticated)
    .input(getSerialEntryProgressSchema)
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabaseAdmin.rpc(
        "get_serial_entry_progress",
        {
          p_receipt_id: input.receiptId,
        }
      );

      if (error) {
        throw new Error(
          `Failed to get serial entry progress: ${error.message}`
        );
      }

      return data;
    }),

  /**
   * Reassign task to a new technician
   *
   * @endpoint POST /api/trpc/tasks.reassign
   * @auth Required (Admin, Manager, or current assignee)
   * @role admin, manager
   */
  reassign: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        taskId: z.string().uuid(),
        newAssigneeId: z.string().uuid(),
        reason: z.string().min(10, "Reason must be at least 10 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const taskService = new TaskService(ctx);

      // Get task to check permissions
      const task = await taskService.getTask(input.taskId);

      // Only admin/manager or current assignee can reassign
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdminOrManager = profile?.role === "admin" || profile?.role === "manager";
      const isCurrentAssignee = task.assigned_to_id === user.id;

      if (!isAdminOrManager && !isCurrentAssignee) {
        throw new Error("Bạn không có quyền reassign task này");
      }

      // Update task assignee
      const { error: updateError } = await ctx.supabaseAdmin
        .from("entity_tasks")
        .update({
          assigned_to_id: input.newAssigneeId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.taskId);

      if (updateError) {
        throw new Error(`Failed to reassign task: ${updateError.message}`);
      }

      // Log reassignment in audit_logs
      await ctx.supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "task_reassigned",
        entity_type: "entity_task",
        entity_id: input.taskId,
        details: {
          old_assignee_id: task.assigned_to_id,
          new_assignee_id: input.newAssigneeId,
          reason: input.reason,
        },
      });

      return { success: true };
    }),

  /**
   * Complete multiple tasks at once
   *
   * @endpoint POST /api/trpc/tasks.bulkComplete
   * @auth Required
   */
  bulkComplete: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        taskIds: z.array(z.string().uuid()).max(100, "Maximum 100 tasks at once"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const taskService = new TaskService(ctx);
      const results = {
        successful: [] as string[],
        failed: [] as Array<{ taskId: string; error: string }>,
      };

      for (const taskId of input.taskIds) {
        try {
          await taskService.completeTask({
            taskId,
            completionNotes: "Bulk completed",
            userId: ctx.user!.id,
          });
          results.successful.push(taskId);
        } catch (error: any) {
          results.failed.push({
            taskId,
            error: error.message || "Unknown error",
          });
        }
      }

      return {
        total: input.taskIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        failedTasks: results.failed,
      };
    }),

  /**
   * Add comment to task
   *
   * @endpoint POST /api/trpc/tasks.addComment
   * @auth Required
   */
  addComment: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        taskId: z.string().uuid(),
        comment: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("task_comments")
        .insert({
          task_id: input.taskId,
          user_id: user.id,
          comment: input.comment,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add comment: ${error.message}`);
      }

      return data;
    }),

  /**
   * Get comments for a task
   *
   * @endpoint GET /api/trpc/tasks.getComments
   * @auth Required
   */
  getComments: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        taskId: z.string().uuid(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("task_comments")
        .select(
          `
          *,
          user:profiles(id, full_name, email)
        `
        )
        .eq("task_id", input.taskId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new Error(`Failed to get comments: ${error.message}`);
      }

      return data;
    }),

  /**
   * Get task attachments
   *
   * @endpoint GET /api/trpc/tasks.getTaskAttachments
   * @auth Required
   */
  getTaskAttachments: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("task_attachments")
        .select(`
          *,
          uploader:profiles!uploaded_by(id, full_name, avatar_url)
        `)
        .eq("task_id", input.taskId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch attachments: ${error.message}`);
      }

      return data || [];
    }),

  /**
   * Upload attachment to task
   *
   * @endpoint POST /api/trpc/tasks.uploadAttachment
   * @auth Required
   */
  uploadAttachment: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        taskId: z.string().uuid(),
        fileName: z.string(),
        filePath: z.string(), // Path in Supabase Storage
        fileSize: z.number().int().positive().max(5242880), // Max 5MB
        mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("task_attachments")
        .insert({
          task_id: input.taskId,
          file_name: input.fileName,
          file_path: input.filePath,
          file_size_bytes: input.fileSize,
          mime_type: input.mimeType,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to upload attachment: ${error.message}`);
      }

      return data;
    }),

  /**
   * Delete task attachment
   *
   * @endpoint DELETE /api/trpc/tasks.deleteAttachment
   * @auth Required
   */
  deleteAttachment: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        attachmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { error } = await ctx.supabaseAdmin
        .from("task_attachments")
        .delete()
        .eq("id", input.attachmentId);

      if (error) {
        throw new Error(`Failed to delete attachment: ${error.message}`);
      }

      return { success: true };
    }),
});
