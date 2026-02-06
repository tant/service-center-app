// Task Workflow Constants
// Constants for task templates, task execution, and workflow management

import type { ServiceType, TaskStatus } from "@/types/enums";

// Task status flow transitions
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["in_progress", "skipped"],
  in_progress: ["completed", "blocked", "pending"],
  completed: [], // Terminal state
  blocked: ["pending", "in_progress", "skipped"],
  skipped: [], // Terminal state
};

// Task status colors for UI
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "gray",
  in_progress: "blue",
  completed: "green",
  blocked: "red",
  skipped: "yellow",
};

// Task status badge variants (for shadcn/ui Badge component)
export const TASK_STATUS_BADGE_VARIANTS: Record<
  TaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  in_progress: "default",
  completed: "outline",
  blocked: "destructive",
  skipped: "secondary",
};

// Task categories
export const TASK_CATEGORIES = [
  { value: "Intake", label: "Intake" },
  { value: "Diagnosis", label: "Diagnosis" },
  { value: "Repair", label: "Repair" },
  { value: "QA", label: "Quality Assurance" },
  { value: "Closing", label: "Closing" },
] as const;

// Service types for templates
export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "warranty", label: "Warranty Service" },
  { value: "paid", label: "Paid Service" },
  { value: "replacement", label: "Replacement" },
];

// Task completion validation
export const TASK_COMPLETION_REQUIREMENTS = {
  notes_min_length: 10,
  notes_required_statuses: ["completed", "blocked"] as TaskStatus[],
  photo_required_categories: ["QA"],
} as const;

// Task execution permissions
export const TASK_PERMISSIONS = {
  can_create_template: ["admin", "manager"],
  can_edit_template: ["admin", "manager"],
  can_delete_template: ["admin"],
  can_assign_task: ["admin", "manager"],
  can_complete_own_task: ["technician"],
  can_complete_any_task: ["admin", "manager"],
  can_skip_task: ["admin", "manager"],
  can_block_task: ["admin", "manager", "technician"],
} as const;

// Task template validation
export const TEMPLATE_VALIDATION = {
  name_min_length: 3,
  name_max_length: 255,
  min_tasks: 1,
  max_tasks: 50,
  sequence_order_start: 1,
} as const;

// Task type validation
export const TASK_TYPE_VALIDATION = {
  name_min_length: 3,
  name_max_length: 255,
  duration_min_minutes: 1,
  duration_max_minutes: 1440, // 24 hours
} as const;

// Default values
export const WORKFLOW_DEFAULTS = {
  strict_sequence: false,
  is_active: true,
  is_required: true,
  requires_notes: false,
  requires_photo: false,
  estimated_duration_minutes: 30,
} as const;

// Task analytics thresholds
export const TASK_ANALYTICS_THRESHOLDS = {
  completion_percentage_warning: 50,
  completion_percentage_critical: 25,
  blocked_tasks_warning: 3,
  blocked_tasks_critical: 5,
} as const;

// Task notification settings
export const TASK_NOTIFICATIONS = {
  notify_on_assignment: true,
  notify_on_completion: true,
  notify_on_blocked: true,
  notify_on_overdue: true,
} as const;
