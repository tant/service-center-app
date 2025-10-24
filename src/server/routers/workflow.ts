// Workflow Router - Task Template Management
// Story: 01.02 Task Template Management
// Handles task types, templates, and workflow operations

import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// =====================================================
// INPUT VALIDATION SCHEMAS
// =====================================================

const taskTypeCreateSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  estimated_duration_minutes: z.number().int().positive().optional(),
  requires_notes: z.boolean().default(false),
  requires_photo: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const templateCreateSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  product_type: z.string().uuid().optional(),
  service_type: z.enum(['warranty', 'paid', 'replacement']),
  enforce_sequence: z.boolean().default(true), // Story 1.5: Changed from strict_sequence, default true for strict mode
  is_active: z.boolean().default(true),
  tasks: z.array(z.object({
    task_type_id: z.string().uuid(),
    sequence_order: z.number().int().positive(),
    is_required: z.boolean().default(true),
    custom_instructions: z.string().optional(),
  })).min(1, 'Template must have at least one task'),
});

const templateUpdateSchema = z.object({
  template_id: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  product_type: z.string().uuid().optional(),
  service_type: z.enum(['warranty', 'paid', 'replacement']),
  enforce_sequence: z.boolean(), // Story 1.5: Changed from strict_sequence
  tasks: z.array(z.object({
    task_type_id: z.string().uuid(),
    sequence_order: z.number().int().positive(),
    is_required: z.boolean(),
    custom_instructions: z.string().optional(),
  })).min(1),
});

const templateListSchema = z.object({
  product_type: z.string().uuid().optional(),
  service_type: z.enum(['warranty', 'paid', 'replacement']).optional(),
  is_active: z.boolean().optional(),
});

const templateDeleteSchema = z.object({
  template_id: z.string().uuid(),
  soft_delete: z.boolean().default(true),
});

// =====================================================
// WORKFLOW ROUTER
// =====================================================

export const workflowRouter = router({

  // ===================================================
  // TASK TYPE PROCEDURES
  // ===================================================

  taskType: router({
    /**
     * List all task types
     * AC: 2 - taskType.list procedure
     * Requires: Admin or Manager role
     */
    list: publicProcedure
      .query(async ({ ctx }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view task types',
          });
        }

        // Get profile for role checking
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager', 'technician', 'reception'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to view task types',
          });
        }

        const { data, error } = await ctx.supabaseAdmin
          .from('task_types')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch task types',
            cause: error,
          });
        }

        return data;
      }),

    /**
     * Create a new custom task type
     * AC: 2 - taskType.create procedure
     * Requires: Admin or Manager role
     */
    create: publicProcedure
      .input(taskTypeCreateSchema)
      .mutation(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to create task types',
          });
        }

        // Get profile for role checking
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admin and manager can create task types',
          });
        }

        // Check for duplicate name
        const { data: existing } = await ctx.supabaseAdmin
          .from('task_types')
          .select('id')
          .eq('name', input.name)
          .single();

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Task type "${input.name}" already exists`,
          });
        }

        const { data, error } = await ctx.supabaseAdmin
          .from('task_types')
          .insert(input)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create task type',
            cause: error,
          });
        }

        return data;
      }),
  }),

  // ===================================================
  // TEMPLATE PROCEDURES
  // ===================================================

  template: router({
    /**
     * List templates with optional filters
     * AC: 2 - template.list procedure
     * Requires: Admin or Manager role
     */
    list: publicProcedure
      .input(templateListSchema.optional())
      .query(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view templates',
          });
        }

        // Get profile for role checking
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager', 'technician', 'reception'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to view templates',
          });
        }

        let query = ctx.supabaseAdmin
          .from('task_templates')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:task_templates_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type:task_types(*)
            )
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (input?.product_type) {
          query = query.eq('product_type', input.product_type);
        }
        if (input?.service_type) {
          query = query.eq('service_type', input.service_type);
        }
        if (input?.is_active !== undefined) {
          query = query.eq('is_active', input.is_active);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch templates',
            cause: error,
          });
        }

        return data;
      }),

    /**
     * Get a single template by ID with its tasks
     * Requires: Any authenticated user
     */
    getById: publicProcedure
      .input(z.object({ template_id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view templates',
          });
        }

        // Get profile for role checking
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager', 'technician', 'reception'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to view templates',
          });
        }

        const { data, error } = await ctx.supabaseAdmin
          .from('task_templates')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:task_templates_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type_id,
              task_type:task_types(*)
            )
          `)
          .eq('id', input.template_id)
          .single();

        if (error) {
          throw new TRPCError({
            code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
            message: error.code === 'PGRST116' ? 'Template not found' : 'Failed to fetch template',
            cause: error,
          });
        }

        // Sort tasks by sequence_order
        if (data.tasks) {
          data.tasks.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        }

        return data;
      }),

    /**
     * Create a new template
     * AC: 2 - template.create procedure
     * Requires: Admin or Manager role
     */
    create: publicProcedure
      .input(templateCreateSchema)
      .mutation(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to create templates',
          });
        }

        // Get profile for role checking and ID
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role, id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admin and manager can create templates',
          });
        }

        // Check for duplicate name
        const { data: existing } = await ctx.supabaseAdmin
          .from('task_templates')
          .select('id')
          .eq('name', input.name)
          .single();

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Template "${input.name}" already exists`,
          });
        }

        // Validate sequence_order uniqueness
        const sequenceOrders = input.tasks.map(t => t.sequence_order);
        const uniqueSequences = new Set(sequenceOrders);
        if (sequenceOrders.length !== uniqueSequences.size) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task sequence orders must be unique',
          });
        }

        // Start transaction: Create template + tasks
        const { tasks, ...templateData } = input;

        // 1. Create template
        const { data: template, error: templateError } = await ctx.supabaseAdmin
          .from('task_templates')
          .insert({
            ...templateData,
            created_by_id: profile.id,
          })
          .select()
          .single();

        if (templateError || !template) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create template',
            cause: templateError,
          });
        }

        // 2. Create template tasks
        const templateTasks = tasks.map(task => ({
          template_id: template.id,
          ...task,
        }));

        const { error: tasksError } = await ctx.supabaseAdmin
          .from('task_templates_tasks')
          .insert(templateTasks);

        if (tasksError) {
          // Rollback: Delete the template
          await ctx.supabaseAdmin
            .from('task_templates')
            .delete()
            .eq('id', template.id);

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create template tasks',
            cause: tasksError,
          });
        }

        // Fetch complete template with tasks
        const { data: completeTemplate } = await ctx.supabaseAdmin
          .from('task_templates')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:task_templates_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type:task_types(*)
            )
          `)
          .eq('id', template.id)
          .single();

        return completeTemplate;
      }),

    /**
     * Update template (creates new version)
     * AC: 2 - template.update procedure
     * AC: 3 - Template versioning
     * Requires: Admin or Manager role
     */
    update: publicProcedure
      .input(templateUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to update templates',
          });
        }

        // Get profile for role checking and ID
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role, id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admin and manager can update templates',
          });
        }

        // Fetch current template
        const { data: currentTemplate, error: fetchError } = await ctx.supabaseAdmin
          .from('task_templates')
          .select('*')
          .eq('id', input.template_id)
          .single();

        if (fetchError || !currentTemplate) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        // Validate sequence_order uniqueness
        const sequenceOrders = input.tasks.map(t => t.sequence_order);
        const uniqueSequences = new Set(sequenceOrders);
        if (sequenceOrders.length !== uniqueSequences.size) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task sequence orders must be unique',
          });
        }

        // 1. Mark current template as inactive
        const { error: deactivateError } = await ctx.supabaseAdmin
          .from('task_templates')
          .update({ is_active: false })
          .eq('id', currentTemplate.id);

        if (deactivateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to deactivate old template version',
            cause: deactivateError,
          });
        }

        // 2. Create new template version
        const { tasks, template_id, ...templateData } = input;

        const { data: newTemplate, error: createError } = await ctx.supabaseAdmin
          .from('task_templates')
          .insert({
            ...templateData,
            created_by_id: profile.id,
            is_active: true,
          })
          .select()
          .single();

        if (createError || !newTemplate) {
          // Rollback: Reactivate old template
          await ctx.supabaseAdmin
            .from('task_templates')
            .update({ is_active: true })
            .eq('id', currentTemplate.id);

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create new template version',
            cause: createError,
          });
        }

        // 3. Create new template tasks
        const newTemplateTasks = tasks.map(task => ({
          template_id: newTemplate.id,
          ...task,
        }));

        const { error: tasksError } = await ctx.supabaseAdmin
          .from('task_templates_tasks')
          .insert(newTemplateTasks);

        if (tasksError) {
          // Rollback: Delete new template and reactivate old
          await ctx.supabaseAdmin
            .from('task_templates')
            .delete()
            .eq('id', newTemplate.id);

          await ctx.supabaseAdmin
            .from('task_templates')
            .update({ is_active: true })
            .eq('id', currentTemplate.id);

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create template tasks',
            cause: tasksError,
          });
        }

        // Fetch complete new template
        const { data: completeTemplate } = await ctx.supabaseAdmin
          .from('task_templates')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:task_templates_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type:task_types(*)
            )
          `)
          .eq('id', newTemplate.id)
          .single();

        return completeTemplate;
      }),

    /**
     * Delete template with validation
     * AC: 7 - Validation: Cannot delete if in use by active tickets
     * Requires: Admin or Manager role
     */
    delete: publicProcedure
      .input(templateDeleteSchema)
      .mutation(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to delete templates',
          });
        }

        // Get profile for role checking
        const { data: profile, error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user profile',
            cause: profileError,
          });
        }

        // Authorization check
        if (!['admin', 'manager'].includes(profile.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admin and manager can delete templates',
          });
        }

        // Check if template is in use by active tickets
        const { data: activeTickets, error: checkError } = await ctx.supabaseAdmin
          .from('service_tickets')
          .select('id, ticket_number')
          .eq('template_id', input.template_id)
          .in('status', ['pending', 'in_progress']);

        if (checkError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check template usage',
            cause: checkError,
          });
        }

        if (activeTickets && activeTickets.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Cannot delete template: ${activeTickets.length} active ticket(s) are using this template`,
          });
        }

        if (input.soft_delete) {
          // Soft delete: Mark as inactive
          const { error: deactivateError } = await ctx.supabaseAdmin
            .from('task_templates')
            .update({ is_active: false })
            .eq('id', input.template_id);

          if (deactivateError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to deactivate template',
              cause: deactivateError,
            });
          }

          return { success: true, soft_deleted: true };
        } else {
          // Hard delete: Remove from database
          const { error: deleteError } = await ctx.supabaseAdmin
            .from('task_templates')
            .delete()
            .eq('id', input.template_id);

          if (deleteError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to delete template',
              cause: deleteError,
            });
          }

          return { success: true, soft_deleted: false };
        }
      }),
  }),

  // ===================================================
  // TASK EXECUTION PROCEDURES (Story 1.4)
  // ===================================================

  /**
   * Get tasks assigned to current user
   * AC: 1 - workflow.myTasks procedure
   */
  myTasks: publicProcedure
    .query(async ({ ctx }) => {
      // Authentication check
      const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view your tasks',
        });
      }

      // Get profile
      const { data: profile } = await ctx.supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      // Get tasks assigned to this user
      const { data: tasks, error } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select(`
          *,
          task_type:task_types(*),
          ticket:service_tickets(
            id,
            ticket_number,
            status,
            customer:customers(name, phone)
          )
        `)
        .eq('assigned_to_id', profile.id)
        .neq('status', 'skipped')
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tasks',
          cause: error,
        });
      }

      return tasks || [];
    }),

  /**
   * Update task status
   * AC: 1 - workflow.updateTaskStatus procedure
   */
  updateTaskStatus: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
      status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'skipped']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Authentication check
      const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update task status',
        });
      }

      // Get task to verify assignment
      const { data: task } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('*, ticket:service_tickets(id, ticket_number)')
        .eq('id', input.task_id)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Update task status
      const { data: updatedTask, error } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .update({
          status: input.status,
          started_at: input.status === 'in_progress' && !task.started_at ? new Date().toISOString() : task.started_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.task_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task status',
          cause: error,
        });
      }

      return updatedTask;
    }),

  /**
   * Add notes to a task
   * AC: 1 - workflow.addTaskNotes procedure
   */
  addTaskNotes: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
      notes: z.string().min(1, 'Notes cannot be empty'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Authentication check
      const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to add task notes',
        });
      }

      // For now, we'll update the task's custom_instructions field
      // In a full implementation, you might have a separate task_history table
      const { data: task } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('custom_instructions')
        .eq('id', input.task_id)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const existingNotes = task.custom_instructions || '';
      const timestamp = new Date().toISOString();
      const newNotes = existingNotes
        ? `${existingNotes}\n\n[${timestamp}] ${input.notes}`
        : `[${timestamp}] ${input.notes}`;

      const { error } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .update({
          custom_instructions: newNotes,
          updated_at: timestamp,
        })
        .eq('id', input.task_id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add task notes',
          cause: error,
        });
      }

      return { success: true, notes: newNotes };
    }),

  /**
   * Complete a task with required completion notes
   * AC: 1 - workflow.completeTask procedure
   */
  completeTask: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
      completion_notes: z.string().min(5, 'Completion notes must be at least 5 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Authentication check
      const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to complete tasks',
        });
      }

      // Get profile
      const { data: profile } = await ctx.supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      // Get task
      const { data: task } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('*')
        .eq('id', input.task_id)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Prepare completion notes
      const timestamp = new Date().toISOString();
      const existingNotes = task.custom_instructions || '';
      const completionNote = `[COMPLETED ${timestamp}] ${input.completion_notes}`;
      const updatedNotes = existingNotes
        ? `${existingNotes}\n\n${completionNote}`
        : completionNote;

      // Update task to completed
      const { data: completedTask, error } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .update({
          status: 'completed',
          completed_at: timestamp,
          completed_by_id: profile.id,
          custom_instructions: updatedNotes,
          updated_at: timestamp,
        })
        .eq('id', input.task_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete task',
          cause: error,
        });
      }

      return completedTask;
    }),

  /**
   * Get task dependencies (prerequisite tasks)
   * Story 1.5: AC 8 - Get list of prerequisite tasks for sequence validation
   */
  getTaskDependencies: publicProcedure
    .input(z.object({
      task_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Authentication check
      const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view task dependencies',
        });
      }

      // Get current task details
      const { data: currentTask, error: taskError } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('ticket_id, sequence_order')
        .eq('id', input.task_id)
        .single();

      if (taskError || !currentTask) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Get template to check enforce_sequence
      const { data: ticket } = await ctx.supabaseAdmin
        .from('service_tickets')
        .select('template_id, task_templates(enforce_sequence)')
        .eq('id', currentTask.ticket_id)
        .single();

      // Get prerequisite tasks (tasks with lower sequence_order)
      const { data: prerequisites, error: prereqError } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select(`
          id,
          sequence_order,
          status,
          is_required,
          task_type:task_types(
            id,
            name,
            category
          )
        `)
        .eq('ticket_id', currentTask.ticket_id)
        .lt('sequence_order', currentTask.sequence_order)
        .order('sequence_order');

      if (prereqError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task dependencies',
          cause: prereqError,
        });
      }

      // Handle task_templates being array or object (Supabase type inference)
      const taskTemplate = Array.isArray(ticket?.task_templates)
        ? ticket?.task_templates[0]
        : ticket?.task_templates;

      return {
        prerequisites: prerequisites || [],
        enforce_sequence: taskTemplate?.enforce_sequence ?? true,
        incomplete_count: prerequisites?.filter(p =>
          p.status !== 'completed' && p.status !== 'skipped'
        ).length ?? 0,
      };
    }),
});
