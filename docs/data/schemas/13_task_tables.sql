-- Phase 2 Task Workflow Tables
-- Service Center - Task Templates and Execution
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- TASK TEMPLATES
-- =====================================================
-- Template definitions for different service types

CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  product_type UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_type public.service_type NOT NULL DEFAULT 'warranty',
  strict_sequence BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_templates_name_unique UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_task_templates_product_type ON public.task_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_service_type ON public.task_templates(service_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON public.task_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE public.task_templates IS 'Task workflow templates for different product and service types';
COMMENT ON COLUMN public.task_templates.strict_sequence IS 'If true, tasks must be completed in order';
COMMENT ON COLUMN public.task_templates.product_type IS 'Optional: Link template to specific product type';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TASK TYPES
-- =====================================================
-- Library of reusable task definitions

CREATE TABLE IF NOT EXISTS public.task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  estimated_duration_minutes INT,
  requires_notes BOOLEAN NOT NULL DEFAULT false,
  requires_photo BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_types_name_unique UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_task_types_category ON public.task_types(category);
CREATE INDEX IF NOT EXISTS idx_task_types_active ON public.task_types(is_active) WHERE is_active = true;

COMMENT ON TABLE public.task_types IS 'Reusable library of task definitions';
COMMENT ON COLUMN public.task_types.category IS 'Task category: Intake, Diagnosis, Repair, QA, Closing';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_task_types_updated_at
  BEFORE UPDATE ON public.task_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TASK TEMPLATES TASKS (Junction Table)
-- =====================================================
-- Maps task types to templates with sequence order

CREATE TABLE IF NOT EXISTS public.task_templates_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES public.task_types(id) ON DELETE RESTRICT,
  sequence_order INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  custom_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_templates_tasks_template_sequence_unique UNIQUE(template_id, sequence_order),
  CONSTRAINT task_templates_tasks_sequence_positive CHECK (sequence_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_task_templates_tasks_template ON public.task_templates_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_tasks_type ON public.task_templates_tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_tasks_sequence ON public.task_templates_tasks(template_id, sequence_order);

COMMENT ON TABLE public.task_templates_tasks IS 'Junction table mapping task types to templates with sequence order';
COMMENT ON COLUMN public.task_templates_tasks.sequence_order IS 'Execution order within template (1-based)';

-- =====================================================
-- SERVICE TICKET TASKS
-- =====================================================
-- Task instances created from templates for specific tickets

CREATE TABLE IF NOT EXISTS public.service_ticket_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES public.task_types(id) ON DELETE RESTRICT,
  template_task_id UUID REFERENCES public.task_templates_tasks(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  is_required BOOLEAN NOT NULL DEFAULT true,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_ticket_tasks_ticket_sequence_unique UNIQUE(ticket_id, sequence_order),
  CONSTRAINT service_ticket_tasks_sequence_positive CHECK (sequence_order > 0),
  CONSTRAINT service_ticket_tasks_completed_requires_notes CHECK (
    status != 'completed' OR completion_notes IS NOT NULL
  ),
  CONSTRAINT service_ticket_tasks_blocked_requires_reason CHECK (
    status != 'blocked' OR blocked_reason IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_ticket ON public.service_ticket_tasks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_type ON public.service_ticket_tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_status ON public.service_ticket_tasks(status);
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_assigned ON public.service_ticket_tasks(assigned_to_id) WHERE assigned_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_pending ON public.service_ticket_tasks(ticket_id, status) WHERE status IN ('pending', 'in_progress');

COMMENT ON TABLE public.service_ticket_tasks IS 'Task instances for specific service tickets';
COMMENT ON COLUMN public.service_ticket_tasks.template_task_id IS 'Reference to template task if created from template';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_service_ticket_tasks_updated_at
  BEFORE UPDATE ON public.service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TASK HISTORY
-- =====================================================
-- Audit trail for task execution events

CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.service_ticket_tasks(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  old_status public.task_status,
  new_status public.task_status NOT NULL,
  changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_ticket ON public.task_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created ON public.task_history(created_at DESC);

COMMENT ON TABLE public.task_history IS 'Immutable audit trail of task status changes';

-- =====================================================
-- TICKET TEMPLATE CHANGES
-- =====================================================
-- Track when ticket template changes during service

CREATE TABLE IF NOT EXISTS public.ticket_template_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  old_template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  new_template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_template_changes_ticket ON public.ticket_template_changes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_template_changes_created ON public.ticket_template_changes(created_at DESC);

COMMENT ON TABLE public.ticket_template_changes IS 'Audit trail of template changes during service execution';

-- =====================================================
-- RMA BATCHES
-- =====================================================
-- Return Merchandise Authorization batches

CREATE TABLE IF NOT EXISTS public.rma_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(20) NOT NULL UNIQUE,
  supplier_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  shipping_date DATE,
  tracking_number VARCHAR(255),
  notes TEXT,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_batches_batch_number ON public.rma_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_rma_batches_status ON public.rma_batches(status);
CREATE INDEX IF NOT EXISTS idx_rma_batches_created ON public.rma_batches(created_at DESC);

COMMENT ON TABLE public.rma_batches IS 'Return Merchandise Authorization batches for supplier returns';

-- Trigger: Auto-generate batch number
CREATE TRIGGER trigger_generate_rma_batch_number
  BEFORE INSERT ON public.rma_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_rma_batch_number();

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_rma_batches_updated_at
  BEFORE UPDATE ON public.rma_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
