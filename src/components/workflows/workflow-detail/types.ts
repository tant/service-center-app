/**
 * Types for workflow detail components
 */

export interface WorkflowTaskType {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface WorkflowTaskItem {
  id: string;
  sequence_order: number;
  is_required: boolean;
  custom_instructions?: string | null;
  task_id: string;
  task_type?: WorkflowTaskType;
}

export interface WorkflowDetailData {
  id: string;
  name: string;
  description?: string | null;
  entity_type?: string | null;
  enforce_sequence: boolean;
  is_active: boolean;
  created_at: string;
  tasks?: WorkflowTaskItem[];
}
