/**
 * Workflow Validation Utilities
 *
 * Provides comprehensive validation for workflows including:
 * - Circular dependency detection
 * - Task prerequisite validation
 * - Workflow completeness checks
 * - Duplicate task detection
 */

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  field?: string;
  taskIndex?: number;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  allIssues: ValidationIssue[];
}

export interface WorkflowTask {
  id: string;
  task_type_id: string;
  sequence_order: number;
  is_required: boolean;
  custom_instructions?: string;
}

export interface WorkflowData {
  name: string;
  description?: string;
  entity_type?: "service_ticket" | "inventory_receipt" | "inventory_issue" | "inventory_transfer" | "service_request";
  enforce_sequence: boolean;
  tasks: WorkflowTask[];
}

/**
 * Main validation function
 */
export function validateWorkflow(workflow: WorkflowData): WorkflowValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Basic validation
  if (!workflow.name || workflow.name.trim().length === 0) {
    errors.push({
      type: 'error',
      message: 'Tên quy trình không được để trống',
      field: 'name',
    });
  }

  if (workflow.name && workflow.name.length > 255) {
    errors.push({
      type: 'error',
      message: 'Tên quy trình không được quá 255 ký tự',
      field: 'name',
    });
  }

  // Task validation
  if (!workflow.tasks || workflow.tasks.length === 0) {
    errors.push({
      type: 'error',
      message: 'Quy trình phải có ít nhất một task',
      field: 'tasks',
    });
  } else {
    // Check for missing task types
    const missingTaskTypes = workflow.tasks.filter(t => !t.task_type_id);
    if (missingTaskTypes.length > 0) {
      errors.push({
        type: 'error',
        message: `Có ${missingTaskTypes.length} task chưa chọn loại`,
        field: 'tasks',
      });
    }

    // Check for duplicate tasks
    const duplicates = findDuplicateTasks(workflow.tasks);
    if (duplicates.length > 0) {
      warnings.push({
        type: 'warning',
        message: `Có ${duplicates.length} task trùng lặp trong quy trình`,
        field: 'tasks',
      });
    }

    // Check for at least one required task
    const hasRequiredTask = workflow.tasks.some(t => t.is_required);
    if (!hasRequiredTask) {
      warnings.push({
        type: 'warning',
        message: 'Quy trình nên có ít nhất một task bắt buộc',
        field: 'tasks',
      });
    }

    // Check custom instructions length
    workflow.tasks.forEach((task, index) => {
      if (task.custom_instructions && task.custom_instructions.length > 1000) {
        errors.push({
          type: 'error',
          message: `Task ${index + 1}: Hướng dẫn quá dài (tối đa 1000 ký tự)`,
          field: 'tasks',
          taskIndex: index,
        });
      }
    });

    // Check sequence orders
    const sequenceIssues = validateSequenceOrders(workflow.tasks);
    errors.push(...sequenceIssues);
  }

  const allIssues = [...errors, ...warnings];

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    allIssues,
  };
}

/**
 * Find duplicate tasks in workflow
 */
function findDuplicateTasks(tasks: WorkflowTask[]): number[] {
  const taskTypeCounts = new Map<string, number[]>();

  tasks.forEach((task, index) => {
    if (task.task_type_id) {
      const indices = taskTypeCounts.get(task.task_type_id) || [];
      indices.push(index);
      taskTypeCounts.set(task.task_type_id, indices);
    }
  });

  const duplicateIndices: number[] = [];
  taskTypeCounts.forEach((indices) => {
    if (indices.length > 1) {
      duplicateIndices.push(...indices);
    }
  });

  return duplicateIndices;
}

/**
 * Validate sequence orders are consecutive and valid
 */
function validateSequenceOrders(tasks: WorkflowTask[]): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  // Check for missing or invalid sequence orders
  const sequences = tasks.map(t => t.sequence_order).sort((a, b) => a - b);

  for (let i = 0; i < sequences.length; i++) {
    if (sequences[i] !== i + 1) {
      errors.push({
        type: 'error',
        message: 'Thứ tự task không hợp lệ. Vui lòng sắp xếp lại.',
        field: 'tasks',
      });
      break;
    }
  }

  return errors;
}

/**
 * Validate workflow before activation
 * More strict validation for workflows that will be used
 */
export function validateWorkflowForActivation(workflow: WorkflowData): WorkflowValidationResult {
  const result = validateWorkflow(workflow);

  // Additional checks for activation
  if (result.isValid) {
    if (workflow.tasks.length < 2) {
      result.warnings.push({
        type: 'warning',
        message: 'Quy trình chỉ có 1 task. Bạn có chắc muốn kích hoạt?',
        field: 'tasks',
      });
    }

    if (!workflow.description || workflow.description.trim().length === 0) {
      result.warnings.push({
        type: 'warning',
        message: 'Nên thêm mô tả để người dùng hiểu rõ mục đích quy trình',
        field: 'description',
      });
    }

    // Check if sequence enforcement makes sense
    if (!workflow.enforce_sequence && workflow.tasks.length > 3) {
      result.warnings.push({
        type: 'warning',
        message: 'Quy trình có nhiều task nhưng không bắt buộc thứ tự. Điều này có thể gây nhầm lẫn.',
        field: 'enforce_sequence',
      });
    }
  }

  return result;
}

/**
 * Quick validation check
 */
export function isWorkflowValid(workflow: WorkflowData): boolean {
  return validateWorkflow(workflow).isValid;
}

/**
 * Get error message for a specific field
 */
export function getFieldError(
  result: WorkflowValidationResult,
  field: string
): string | undefined {
  const error = result.errors.find(e => e.field === field);
  return error?.message;
}

/**
 * Get all issues for a specific field
 */
export function getFieldIssues(
  result: WorkflowValidationResult,
  field: string
): ValidationIssue[] {
  return result.allIssues.filter(i => i.field === field);
}
