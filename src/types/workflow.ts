// Task Workflow Types
// Types for task templates, task execution, and workflow management

import type { Database } from './database.types';
import type { TaskStatus, ServiceType } from './enums';

// Database table types
export type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];
export type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert'];
export type TaskTemplateUpdate = Database['public']['Tables']['task_templates']['Update'];

export type TaskType = Database['public']['Tables']['task_types']['Row'];
export type TaskTypeInsert = Database['public']['Tables']['task_types']['Insert'];
export type TaskTypeUpdate = Database['public']['Tables']['task_types']['Update'];

export type TaskTemplateTask = Database['public']['Tables']['task_templates_tasks']['Row'];
export type TaskTemplateTaskInsert = Database['public']['Tables']['task_templates_tasks']['Insert'];
export type TaskTemplateTaskUpdate = Database['public']['Tables']['task_templates_tasks']['Update'];

export type ServiceTicketTask = Database['public']['Tables']['service_ticket_tasks']['Row'];
export type ServiceTicketTaskInsert = Database['public']['Tables']['service_ticket_tasks']['Insert'];
export type ServiceTicketTaskUpdate = Database['public']['Tables']['service_ticket_tasks']['Update'];

export type TaskHistory = Database['public']['Tables']['task_history']['Row'];
export type TaskHistoryInsert = Database['public']['Tables']['task_history']['Insert'];

export type TicketTemplateChange = Database['public']['Tables']['ticket_template_changes']['Row'];
export type TicketTemplateChangeInsert = Database['public']['Tables']['ticket_template_changes']['Insert'];

// View types
export type TaskProgressSummary = Database['public']['Views']['v_task_progress_summary']['Row'];

// Extended types with relations
export interface TaskTemplateWithTasks extends TaskTemplate {
  tasks: (TaskTemplateTask & {
    task_type: TaskType;
  })[];
}

export interface ServiceTicketTaskWithDetails extends ServiceTicketTask {
  task_type: TaskType;
  assigned_to?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface TaskHistoryWithDetails extends TaskHistory {
  changed_by?: {
    id: string;
    full_name: string;
  };
}

// Form types
export interface TaskTemplateFormData {
  name: string;
  description?: string;
  product_type?: string;
  service_type: ServiceType;
  strict_sequence: boolean;
  is_active: boolean;
  tasks: {
    task_type_id: string;
    sequence_order: number;
    is_required: boolean;
    custom_instructions?: string;
  }[];
}

export interface TaskTypeFormData {
  name: string;
  description?: string;
  category?: string;
  estimated_duration_minutes?: number;
  requires_notes: boolean;
  requires_photo: boolean;
  is_active: boolean;
}

export interface TaskUpdateFormData {
  status: TaskStatus;
  completion_notes?: string;
  blocked_reason?: string;
}

// Task execution types
export interface TaskExecutionContext {
  task_id: string;
  ticket_id: string;
  current_status: TaskStatus;
  is_required: boolean;
  can_skip: boolean;
  can_complete: boolean;
  can_block: boolean;
  next_task_id?: string;
}

// Task analytics types
export interface TaskAnalytics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  blocked_tasks: number;
  completion_percentage: number;
  average_completion_time_minutes: number;
}

// Task category constants
export const TASK_CATEGORIES = [
  'Intake',
  'Diagnosis',
  'Repair',
  'QA',
  'Closing',
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];
