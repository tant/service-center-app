-- Migration: Add enforce_sequence column to task_templates table
-- Story: 1.5 - Task Dependencies and Status Automation
-- Description: Adds boolean flag to control whether tasks must be completed sequentially

-- Add enforce_sequence column (default: true for strict mode)
ALTER TABLE task_templates
ADD COLUMN IF NOT EXISTS enforce_sequence BOOLEAN NOT NULL DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN task_templates.enforce_sequence IS
  'If true, tasks must be completed in sequence_order (strict mode). If false, tasks can be completed in any order with UI warning (flexible mode).';

-- Update existing templates to have strict mode by default
UPDATE task_templates
SET enforce_sequence = true
WHERE enforce_sequence IS NULL;
