// Workflow Router - Task Template Management
// Story: 01.02 Task Template Management
// Handles task types, templates, and workflow operations

import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { logAudit } from '../utils/auditLog';
import {
  requireManagerOrAbove,
  requireAnyAuthenticated,
} from '../middleware/requireRole';

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

const taskTypeUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  estimated_duration_minutes: z.number().int().positive().optional(),
  requires_notes: z.boolean(),
  requires_photo: z.boolean(),
  is_active: z.boolean(),
});

const taskTypeToggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
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
// HELPER FUNCTIONS
// =====================================================

/**
 * Map database field strict_sequence to API field enforce_sequence
 * This maintains backward compatibility while using better naming in the API
 */
function mapTemplateFromDb(template: any) {
  if (!template) return null;
  const { strict_sequence, ...rest } = template;
  return {
    ...rest,
    enforce_sequence: strict_sequence,
  };
}

function mapTemplatesFromDb(templates: any[]) {
  if (!templates) return [];
  return templates.map(mapTemplateFromDb);
}

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
     * Requires: Any authenticated user
     * Supports filtering by is_active status
     */
    list: publicProcedure
      .use(requireAnyAuthenticated)
      .input(z.object({
        is_active: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // Build query with optional is_active filter
        let query = ctx.supabaseAdmin
          .from('tasks')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        // Apply is_active filter if provided
        if (input?.is_active !== undefined) {
          query = query.eq('is_active', input.is_active);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Không thể tải danh sách loại công việc. Vui lòng thử lại sau',
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
      .use(requireManagerOrAbove)
      .input(taskTypeCreateSchema)
      .mutation(async ({ ctx, input }) => {
        // Check for duplicate name
        const { data: existing } = await ctx.supabaseAdmin
          .from('tasks')
          .select('id')
          .eq('name', input.name)
          .single();

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Loại công việc "${input.name}" đã tồn tại. Vui lòng chọn tên khác`,
          });
        }

        const { data, error } = await ctx.supabaseAdmin
          .from('tasks')
          .insert(input)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Không thể tạo loại công việc. Vui lòng kiểm tra lại thông tin và thử lại',
            cause: error,
          });
        }

        return data;
      }),

    /**
     * Update an existing task type
     * Requires: Admin or Manager role
     */
    update: publicProcedure
      .use(requireManagerOrAbove)
      .input(taskTypeUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if task type exists
        const { data: existing, error: existingError } = await ctx.supabaseAdmin
          .from('tasks')
          .select('id')
          .eq('id', input.id)
          .single();

        if (existingError || !existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Không tìm thấy loại công việc. Có thể đã bị xóa hoặc không tồn tại',
          });
        }

        // Check for duplicate name (excluding current task type)
        const { data: duplicate } = await ctx.supabaseAdmin
          .from('tasks')
          .select('id')
          .eq('name', input.name)
          .neq('id', input.id)
          .single();

        if (duplicate) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Loại công việc "${input.name}" đã tồn tại. Vui lòng chọn tên khác`,
          });
        }

        const { id, ...updateData } = input;
        const { data, error } = await ctx.supabaseAdmin
          .from('tasks')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Không thể cập nhật loại công việc. Vui lòng kiểm tra lại thông tin và thử lại',
            cause: error,
          });
        }

        return data;
      }),

    /**
     * Toggle task type active status (activate/deactivate)
     * Requires: Admin or Manager role
     */
    toggleActive: publicProcedure
      .use(requireManagerOrAbove)
      .input(taskTypeToggleSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if task type exists
        const { data: existing, error: existingError } = await ctx.supabaseAdmin
          .from('tasks')
          .select('id, name')
          .eq('id', input.id)
          .single();

        if (existingError || !existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Không tìm thấy loại công việc. Có thể đã bị xóa hoặc không tồn tại',
          });
        }

        // If deactivating, check if it's being used in active templates
        if (!input.is_active) {
          const { data: templatesUsing, error: checkError } = await ctx.supabaseAdmin
            .from('workflow_tasks')
            .select(`
              id,
              template:workflows!inner(id, name, is_active)
            `)
            .eq('task_id', input.id)
            .eq('template.is_active', true);

          if (checkError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Không thể kiểm tra trạng thái sử dụng. Vui lòng thử lại sau',
              cause: checkError,
            });
          }

          if (templatesUsing && templatesUsing.length > 0) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Không thể vô hiệu hóa loại công việc "${existing.name}" vì đang được sử dụng trong ${templatesUsing.length} mẫu quy trình đang hoạt động. Vui lòng vô hiệu hóa các mẫu đó trước`,
            });
          }
        }

        const { data, error } = await ctx.supabaseAdmin
          .from('tasks')
          .update({ is_active: input.is_active })
          .eq('id', input.id)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Không thể thay đổi trạng thái loại công việc. Vui lòng thử lại sau',
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
     * Requires: Any authenticated user
     */
    list: publicProcedure
      .use(requireAnyAuthenticated)
      .input(templateListSchema.optional())
      .query(async ({ ctx, input }) => {
        let query = ctx.supabaseAdmin
          .from('workflows')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:workflow_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type:tasks(*)
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

        // Map strict_sequence to enforce_sequence for API response
        return mapTemplatesFromDb(data || []);
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
          .from('workflows')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:workflow_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_id,
              task_type:tasks(*)
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

        // Map strict_sequence to enforce_sequence for API response
        return mapTemplateFromDb(data);
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
          .from('workflows')
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
        const { tasks, enforce_sequence, ...templateData } = input;

        // 1. Create template (map enforce_sequence to strict_sequence for DB)
        const { data: template, error: templateError } = await ctx.supabaseAdmin
          .from('workflows')
          .insert({
            ...templateData,
            strict_sequence: enforce_sequence, // Map field name to DB column
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
          workflow_id: template.id,
          task_id: task.task_type_id,
          sequence_order: task.sequence_order,
          is_required: task.is_required,
          custom_instructions: task.custom_instructions,
        }));

        const { error: tasksError } = await ctx.supabaseAdmin
          .from('workflow_tasks')
          .insert(templateTasks);

        if (tasksError) {
          // Rollback: Delete the template
          await ctx.supabaseAdmin
            .from('workflows')
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
          .from('workflows')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:workflow_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type:tasks(*)
            )
          `)
          .eq('id', template.id)
          .single();

        // Map strict_sequence to enforce_sequence for API response
        return mapTemplateFromDb(completeTemplate);
      }),

    /**
     * Update template (in-place update with active ticket check)
     * AC: 2 - template.update procedure
     * Requires: Admin or Manager role
     *
     * Business Logic:
     * - Blocks update if template is being used by active tickets
     * - Performs in-place update (no versioning)
     * - Logs changes to audit_logs for history
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

        // Validate sequence_order uniqueness
        const sequenceOrders = input.tasks.map(t => t.sequence_order);
        const uniqueSequences = new Set(sequenceOrders);
        if (sequenceOrders.length !== uniqueSequences.size) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task sequence orders must be unique',
          });
        }

        // CHECK: Template being used by active tickets?
        const { count: activeTicketsCount, error: countError } = await ctx.supabaseAdmin
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('workflow_id', input.template_id)
          .in('status', ['pending', 'in_progress']);

        if (countError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check active tickets',
            cause: countError,
          });
        }

        if (activeTicketsCount && activeTicketsCount > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Không thể sửa mẫu quy trình đang được sử dụng bởi ${activeTicketsCount} phiếu dịch vụ. Vui lòng đợi các phiếu hoàn thành hoặc tạo mẫu mới.`,
          });
        }

        // Fetch OLD template snapshot for audit log
        const { data: oldTemplate, error: fetchError } = await ctx.supabaseAdmin
          .from('workflows')
          .select(`
            *,
            tasks:workflow_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_id
            )
          `)
          .eq('id', input.template_id)
          .single();

        if (fetchError || !oldTemplate) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        // 1. UPDATE template (in-place)
        const { tasks, template_id, enforce_sequence, ...templateData } = input;

        const { data: updatedTemplate, error: updateError } = await ctx.supabaseAdmin
          .from('workflows')
          .update({
            ...templateData,
            strict_sequence: enforce_sequence, // Map field name to DB column
          })
          .eq('id', input.template_id)
          .select()
          .single();

        if (updateError || !updatedTemplate) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update template',
            cause: updateError,
          });
        }

        // 2. DELETE old tasks
        const { error: deleteTasksError } = await ctx.supabaseAdmin
          .from('workflow_tasks')
          .delete()
          .eq('workflow_id', input.template_id);

        if (deleteTasksError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete old template tasks',
            cause: deleteTasksError,
          });
        }

        // 3. INSERT new tasks
        const newTemplateTasks = tasks.map(task => ({
          workflow_id: input.template_id,
          task_id: task.task_type_id,
          sequence_order: task.sequence_order,
          is_required: task.is_required,
          custom_instructions: task.custom_instructions,
        }));

        const { error: insertTasksError } = await ctx.supabaseAdmin
          .from('workflow_tasks')
          .insert(newTemplateTasks);

        if (insertTasksError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create new template tasks',
            cause: insertTasksError,
          });
        }

        // 4. LOG to audit_logs
        try {
          await logAudit(ctx.supabaseAdmin, user.id, {
            action: 'update',
            resourceType: 'template',
            resourceId: input.template_id,
            oldValues: {
              name: oldTemplate.name,
              description: oldTemplate.description,
              service_type: oldTemplate.service_type,
              strict_sequence: oldTemplate.strict_sequence,
              tasks: oldTemplate.tasks,
            },
            newValues: {
              name: updatedTemplate.name,
              description: updatedTemplate.description,
              service_type: updatedTemplate.service_type,
              strict_sequence: updatedTemplate.strict_sequence,
              tasks: input.tasks,
            },
            metadata: {
              tasks_count_before: oldTemplate.tasks?.length || 0,
              tasks_count_after: input.tasks.length,
            },
          });
        } catch (auditError) {
          // Log error but don't fail the operation
          console.error('[AUDIT] Failed to log template update:', auditError);
        }

        // 5. Fetch complete updated template
        const { data: completeTemplate } = await ctx.supabaseAdmin
          .from('workflows')
          .select(`
            *,
            product:products(id, name, sku),
            tasks:workflow_tasks(
              id,
              sequence_order,
              is_required,
              custom_instructions,
              task_type:tasks(*)
            )
          `)
          .eq('id', input.template_id)
          .single();

        // Map strict_sequence to enforce_sequence for API response
        return mapTemplateFromDb(completeTemplate);
      }),

    /**
     * Toggle template active status
     * Simple toggle without creating new version
     * Requires: Admin or Manager role
     */
    toggleActive: publicProcedure
      .input(z.object({
        template_id: z.string().uuid(),
        is_active: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Authentication check
        const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
        if (authError || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to toggle template status',
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
            message: 'Only admin and manager can toggle template status',
          });
        }

        // Update is_active field only
        const { error: updateError } = await ctx.supabaseAdmin
          .from('workflows')
          .update({ is_active: input.is_active })
          .eq('id', input.template_id);

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update template status',
            cause: updateError,
          });
        }

        return {
          success: true,
          is_active: input.is_active,
        };
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
          .eq('workflow_id', input.template_id)
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
            message: `Không thể xóa mẫu quy trình đang được sử dụng bởi ${activeTickets.length} phiếu dịch vụ. Vui lòng đợi các phiếu hoàn thành.`,
          });
        }

        // Fetch template info for audit log
        const { data: template } = await ctx.supabaseAdmin
          .from('workflows')
          .select('name, service_type, is_active')
          .eq('id', input.template_id)
          .single();

        if (input.soft_delete) {
          // Soft delete: Mark as inactive
          const { error: deactivateError } = await ctx.supabaseAdmin
            .from('workflows')
            .update({ is_active: false })
            .eq('id', input.template_id);

          if (deactivateError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to deactivate template',
              cause: deactivateError,
            });
          }

          // Log to audit
          try {
            await logAudit(ctx.supabaseAdmin, user.id, {
              action: 'delete',
              resourceType: 'template',
              resourceId: input.template_id,
              oldValues: template || undefined,
              metadata: { soft_delete: true },
            });
          } catch (auditError) {
            console.error('[AUDIT] Failed to log template soft delete:', auditError);
          }

          return { success: true, soft_deleted: true };
        } else {
          // Hard delete: Remove from database
          const { error: deleteError } = await ctx.supabaseAdmin
            .from('workflows')
            .delete()
            .eq('id', input.template_id);

          if (deleteError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to delete template',
              cause: deleteError,
            });
          }

          // Log to audit
          try {
            await logAudit(ctx.supabaseAdmin, user.id, {
              action: 'delete',
              resourceType: 'template',
              resourceId: input.template_id,
              oldValues: template || undefined,
              metadata: { soft_delete: false },
            });
          } catch (auditError) {
            console.error('[AUDIT] Failed to log template hard delete:', auditError);
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
          task_type:tasks(*),
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

      // Get template to check enforce_sequence (map from strict_sequence in DB)
      const { data: ticket } = await ctx.supabaseAdmin
        .from('service_tickets')
        .select('workflow_id, workflows(strict_sequence)')
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
          task_type:tasks(
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

      // Handle workflows being array or object (Supabase type inference)
      const taskTemplate = Array.isArray(ticket?.workflows)
        ? ticket?.workflows[0]
        : ticket?.workflows;

      return {
        prerequisites: prerequisites || [],
        enforce_sequence: taskTemplate?.strict_sequence ?? true, // Map DB field to API field
        incomplete_count: prerequisites?.filter(p =>
          p.status !== 'completed' && p.status !== 'skipped'
        ).length ?? 0,
      };
    }),

  // =====================================================
  // STORY 1.16: TASK PROGRESS DASHBOARD
  // =====================================================

  /**
   * Get overall task progress summary
   * AC 2: workflow.getTaskProgressSummary - Overall metrics
   */
  getTaskProgressSummary: publicProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('v_task_progress_summary')
        .select('*')
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task progress summary',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get tickets with blocked tasks
   * AC 2: workflow.getTicketsWithBlockedTasks - Tickets with blocked tasks
   */
  getTicketsWithBlockedTasks: publicProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('v_tickets_with_blocked_tasks')
        .select('*')
        .order('blocked_tasks_count', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tickets with blocked tasks',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Get technician workload metrics
   * AC 2: workflow.getTechnicianWorkload - Tasks per technician
   */
  getTechnicianWorkload: publicProcedure
    .input(z.object({
      technicianId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      let query = ctx.supabaseAdmin
        .from('v_technician_workload')
        .select('*');

      // Filter by specific technician if provided
      if (input?.technicianId) {
        query = query.eq('technician_id', input.technicianId);
      }

      const { data, error } = await query.order('tasks_in_progress', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch technician workload',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Get task completion timeline
   * AC 7: Task completion timeline (last 7/30 days)
   */
  getTaskCompletionTimeline: publicProcedure
    .input(z.object({
      daysBack: z.number().int().min(1).max(90).default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      const daysBack = input?.daysBack || 7;

      const { data, error } = await ctx.supabaseAdmin
        .rpc('get_task_completion_timeline', { days_back: daysBack });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task completion timeline',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Story 1.17: Switch task template during service
   * Allows technician to change template mid-service while preserving completed tasks
   */
  switchTemplate: publicProcedure
    .input(z.object({
      ticket_id: z.string().uuid(),
      new_template_id: z.string().uuid(),
      reason: z.string().min(10, 'Reason must be at least 10 characters'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ticket_id, new_template_id, reason } = input;

      // 1. Authentication check
      const { data: { user }, error: authError } = await ctx.supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to switch templates',
        });
      }

      // 2. Get user profile
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user profile',
        });
      }

      // 3. Check role permission (technician, admin, manager)
      if (!['technician', 'admin', 'manager'].includes(profile.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only technicians, managers, and admins can switch templates',
        });
      }

      // 4. Get current ticket with workflow_id
      const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
        .from('service_tickets')
        .select('id, workflow_id, status')
        .eq('id', ticket_id)
        .single();

      if (ticketError || !ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      // 5. Validate ticket status (cannot switch if completed/cancelled)
      if (['completed', 'cancelled'].includes(ticket.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot switch template for ${ticket.status} ticket`,
        });
      }

      // 6. Validate template is different
      if (ticket.workflow_id === new_template_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'New template must be different from current template',
        });
      }

      // 7. Check if all tasks are completed (no point in switching)
      const { data: existingTasks, error: existingTasksError } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('*')
        .eq('ticket_id', ticket_id)
        .order('sequence_order');

      if (existingTasksError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch existing tasks',
        });
      }

      const allTasksCompleted = existingTasks.every(t => t.status === 'completed');
      if (allTasksCompleted) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot switch template when all tasks are completed',
        });
      }

      // 8. Get new template tasks
      const { data: newTemplateTasks, error: newTemplateError } = await ctx.supabaseAdmin
        .from('workflow_tasks')
        .select(`
          task_id,
          sequence_order,
          is_required,
          custom_instructions,
          tasks (
            name,
            description,
            category,
            estimated_duration_minutes,
            requires_notes,
            requires_photo
          )
        `)
        .eq('workflow_id', new_template_id)
        .order('sequence_order');

      if (newTemplateError || !newTemplateTasks || newTemplateTasks.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'New template has no tasks',
        });
      }

      // 9. Build task merge logic
      const existingTaskTypeIds = new Set(existingTasks.map(t => t.task_type_id));
      const preservedTasks = existingTasks.filter(t =>
        ['completed', 'in_progress'].includes(t.status)
      );

      const tasksToAdd = newTemplateTasks.filter(nt =>
        !existingTaskTypeIds.has(nt.task_id)
      );

      // 10. Delete tasks that are pending/blocked and not in new template
      const tasksToDelete = existingTasks.filter(t =>
        ['pending', 'blocked'].includes(t.status)
      );

      if (tasksToDelete.length > 0) {
        const { error: deleteError } = await ctx.supabaseAdmin
          .from('service_ticket_tasks')
          .delete()
          .in('id', tasksToDelete.map(t => t.id));

        if (deleteError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove old tasks',
          });
        }
      }

      // 11. Add new tasks
      if (tasksToAdd.length > 0) {
        const newTasksToInsert = tasksToAdd.map((tt, index) => ({
          ticket_id,
          task_type_id: tt.task_id,
          name: (tt.tasks as any)?.name || 'Unknown Task',
          description: tt.custom_instructions || (tt.tasks as any)?.description,
          sequence_order: preservedTasks.length + index + 1,
          status: 'pending' as const,
          is_required: tt.is_required,
          estimated_duration_minutes: (tt.tasks as any)?.estimated_duration_minutes,
        }));

        const { error: insertError } = await ctx.supabaseAdmin
          .from('service_ticket_tasks')
          .insert(newTasksToInsert);

        if (insertError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add new tasks',
            cause: insertError,
          });
        }
      }

      // 12. Re-sequence all tasks (preserved + new)
      const { data: allTasks, error: allTasksError } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('id')
        .eq('ticket_id', ticket_id)
        .order('sequence_order');

      if (!allTasksError && allTasks) {
        for (let i = 0; i < allTasks.length; i++) {
          await ctx.supabaseAdmin
            .from('service_ticket_tasks')
            .update({ sequence_order: i + 1 })
            .eq('id', allTasks[i].id);
        }
      }

      // 13. Update ticket workflow_id
      const { error: updateTicketError } = await ctx.supabaseAdmin
        .from('service_tickets')
        .update({ workflow_id: new_template_id })
        .eq('id', ticket_id);

      if (updateTicketError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update ticket template',
        });
      }

      // 14. Create audit log
      const { error: auditError } = await ctx.supabaseAdmin
        .from('ticket_workflow_changes')
        .insert({
          ticket_id,
          old_workflow_id: ticket.workflow_id,
          new_workflow_id: new_template_id,
          reason,
          changed_by_id: profile.id,
          tasks_preserved_count: preservedTasks.length,
          tasks_added_count: tasksToAdd.length,
        });

      if (auditError) {
        // Log but don't fail the operation
        console.error('Failed to create audit log:', auditError);
      }

      // 15. Return summary
      return {
        success: true,
        summary: {
          tasks_preserved: preservedTasks.length,
          tasks_removed: tasksToDelete.length,
          tasks_added: tasksToAdd.length,
          total_tasks: preservedTasks.length + tasksToAdd.length,
        },
      };
    }),
});
