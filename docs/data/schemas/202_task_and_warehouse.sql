-- =====================================================
-- 202_task_and_warehouse.sql
-- =====================================================
-- Task Management and Warehouse Tables
--
-- Phase 2 tables for:
-- - Task workflow (templates, types, execution)
-- - Warehouse management (physical/virtual)
-- - Physical product tracking
-- - RMA batch processing
-- - Stock movements
--
-- ORDER: 200-299 (Tables)
-- DEPENDENCIES: 100, 150, 200, 201
-- =====================================================

-- =====================================================
-- TASK WORKFLOW TABLES (POLYMORPHIC)
-- =====================================================

-- WORKFLOWS
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type public.entity_type, -- Makes workflow entity-specific
  strict_sequence BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workflows_name_unique UNIQUE(name)
);
COMMENT ON TABLE public.workflows IS 'Workflow templates for different entity types';
COMMENT ON COLUMN public.workflows.entity_type IS 'Entity type this workflow applies to (NULL for generic workflows)';
CREATE TRIGGER trigger_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASKS (Library of task definitions)
CREATE TABLE IF NOT EXISTS public.tasks (
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
  CONSTRAINT tasks_name_unique UNIQUE(name)
);
COMMENT ON TABLE public.tasks IS 'Reusable library of task definitions';
CREATE TRIGGER trigger_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WORKFLOW TASKS (Junction)
CREATE TABLE IF NOT EXISTS public.workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,
  sequence_order INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  custom_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workflow_tasks_workflow_sequence_unique UNIQUE(workflow_id, sequence_order),
  CONSTRAINT workflow_tasks_sequence_positive CHECK (sequence_order > 0)
);
COMMENT ON TABLE public.workflow_tasks IS 'Junction table mapping tasks to workflows with sequence order';

-- ENTITY TASKS (Polymorphic task instances)
CREATE TABLE IF NOT EXISTS public.entity_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.entity_type NOT NULL,
  entity_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,
  workflow_task_id UUID REFERENCES public.workflow_tasks(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  is_required BOOLEAN NOT NULL DEFAULT true,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_duration_minutes INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  task_notes TEXT,
  completion_notes TEXT,
  blocked_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT entity_tasks_sequence_positive CHECK (sequence_order > 0),
  CONSTRAINT entity_tasks_completed_requires_notes CHECK (status != 'completed' OR completion_notes IS NOT NULL),
  CONSTRAINT entity_tasks_blocked_requires_reason CHECK (status != 'blocked' OR blocked_reason IS NOT NULL),
  CONSTRAINT entity_tasks_started_at_before_completed CHECK (started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at),
  CONSTRAINT entity_tasks_entity_sequence_unique UNIQUE(entity_type, entity_id, sequence_order)
);
COMMENT ON TABLE public.entity_tasks IS 'Polymorphic task instances that can be associated with any entity type';
COMMENT ON COLUMN public.entity_tasks.task_notes IS 'Runtime work log added during task execution. Can be updated multiple times with timestamps. Required based on tasks.requires_notes flag. Separate from completion_notes which is always required.';
COMMENT ON COLUMN public.entity_tasks.metadata IS 'Extensible JSON field for entity-specific task data (e.g., serial entry progress)';
CREATE TRIGGER trigger_entity_tasks_updated_at BEFORE UPDATE ON public.entity_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENTITY TASK HISTORY (Polymorphic audit trail)
CREATE TABLE IF NOT EXISTS public.entity_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL,
  entity_id UUID NOT NULL,
  old_status public.task_status,
  new_status public.task_status NOT NULL,
  changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.entity_task_history IS 'Immutable audit trail of task status changes across all entity types';

-- TASK ATTACHMENTS (Photos and documents for task execution)
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_attachments_file_size_positive CHECK (file_size_bytes > 0)
);
CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);
COMMENT ON TABLE public.task_attachments IS 'Photos and documents attached to tasks during execution (e.g., inspection photos, repair evidence)';

-- TICKET WORKFLOW CHANGES
CREATE TABLE IF NOT EXISTS public.ticket_workflow_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  old_workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  new_workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.ticket_workflow_changes IS 'Audit trail of workflow changes during service execution';

-- RMA BATCHES
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
COMMENT ON TABLE public.rma_batches IS 'Return Merchandise Authorization batches for supplier returns';
CREATE TRIGGER trigger_generate_rma_batch_number BEFORE INSERT ON public.rma_batches FOR EACH ROW EXECUTE FUNCTION public.generate_rma_batch_number();
CREATE TRIGGER trigger_rma_batches_updated_at BEFORE UPDATE ON public.rma_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- WAREHOUSE TABLES
-- =====================================================

-- PHYSICAL WAREHOUSES
CREATE TABLE IF NOT EXISTS public.physical_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index: only one warehouse can be system default
CREATE UNIQUE INDEX IF NOT EXISTS physical_warehouses_system_default_unique
ON public.physical_warehouses(is_system_default)
WHERE is_system_default = true;

COMMENT ON TABLE public.physical_warehouses IS 'Physical locations for storing products (shelves, rooms, buildings)';
COMMENT ON COLUMN public.physical_warehouses.is_system_default IS 'Indicates if this is the system-managed default warehouse that cannot be deleted';
CREATE TRIGGER trigger_physical_warehouses_updated_at BEFORE UPDATE ON public.physical_warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VIRTUAL WAREHOUSES
CREATE TABLE IF NOT EXISTS public.virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_type public.warehouse_type NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.virtual_warehouses IS 'Virtual warehouse categories for product state management';
COMMENT ON COLUMN public.virtual_warehouses.name IS 'Virtual warehouse name (primary display name)';
CREATE TRIGGER trigger_virtual_warehouses_updated_at BEFORE UPDATE ON public.virtual_warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PHYSICAL PRODUCTS
CREATE TABLE IF NOT EXISTS public.physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,
  condition public.product_condition NOT NULL DEFAULT 'new',
  status public.physical_product_status NOT NULL DEFAULT 'draft',
  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,
  previous_virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL,
  manufacturer_warranty_end_date DATE,
  user_warranty_end_date DATE,
  current_ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  rma_reason TEXT,
  rma_date DATE,
  supplier_id UUID,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  last_known_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT physical_products_serial_unique UNIQUE(serial_number)
);
COMMENT ON TABLE public.physical_products IS 'Serialized product instances with warranty and location tracking';
COMMENT ON COLUMN public.physical_products.status IS 'Lifecycle status: draft (from unapproved receipt) → active (in stock) → issued (out) / disposed (scrapped)';
COMMENT ON COLUMN public.physical_products.virtual_warehouse_id IS 'Virtual warehouse this product belongs to (required - every product must be in a warehouse)';
COMMENT ON COLUMN public.physical_products.previous_virtual_warehouse_id IS 'Previous virtual warehouse before RMA - used to restore location when removed from RMA batch';
COMMENT ON COLUMN public.physical_products.manufacturer_warranty_end_date IS 'Manufacturer warranty end date (nullable - managed separately at /inventory/products)';
COMMENT ON COLUMN public.physical_products.user_warranty_end_date IS 'Extended warranty for end user (nullable - managed separately at /inventory/products)';
COMMENT ON COLUMN public.physical_products.last_known_customer_id IS 'Last known customer who owns/received this product. Updated when product moves to customer_installed warehouse.';
CREATE TRIGGER trigger_physical_products_updated_at BEFORE UPDATE ON public.physical_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_physical_products_status ON public.physical_products(status);
CREATE INDEX IF NOT EXISTS idx_physical_products_serial_number ON public.physical_products(serial_number);
CREATE INDEX IF NOT EXISTS idx_physical_products_last_customer ON public.physical_products(last_known_customer_id) WHERE last_known_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse ON public.physical_products(virtual_warehouse_id) WHERE virtual_warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_previous_virtual_warehouse ON public.physical_products(previous_virtual_warehouse_id) WHERE previous_virtual_warehouse_id IS NOT NULL;

-- STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE RESTRICT,
  movement_type public.movement_type NOT NULL,
  from_virtual_warehouse public.warehouse_type,
  to_virtual_warehouse public.warehouse_type,
  from_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,
  to_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  reason TEXT,
  notes TEXT,
  moved_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_movements_virtual_warehouse_changed CHECK (from_virtual_warehouse IS DISTINCT FROM to_virtual_warehouse OR from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id)
);
COMMENT ON TABLE public.stock_movements IS 'Immutable audit trail of all product movements between warehouses';

-- PRODUCT STOCK THRESHOLDS
CREATE TABLE IF NOT EXISTS public.product_stock_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_type public.warehouse_type NOT NULL,
  minimum_quantity INT NOT NULL,
  reorder_quantity INT,
  maximum_quantity INT,
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  last_alert_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_stock_thresholds_product_warehouse_unique UNIQUE(product_id, warehouse_type),
  CONSTRAINT product_stock_thresholds_quantities_valid CHECK (minimum_quantity >= 0 AND (reorder_quantity IS NULL OR reorder_quantity >= minimum_quantity) AND (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity))
);
COMMENT ON TABLE public.product_stock_thresholds IS 'Low stock alert configuration per product and warehouse type';
CREATE TRIGGER trigger_product_stock_thresholds_updated_at BEFORE UPDATE ON public.product_stock_thresholds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
