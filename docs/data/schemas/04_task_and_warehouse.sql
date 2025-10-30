-- =====================================================
-- 04_task_and_warehouse.sql
-- =====================================================
-- Phase 2 tables for task management and warehouse/
-- inventory tracking.
-- =====================================================

-- =====================================================
-- TASK WORKFLOW TABLES (from 13_task_tables.sql)
-- =====================================================

-- TASK TEMPLATES
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
COMMENT ON TABLE public.task_templates IS 'Task workflow templates for different product and service types';
CREATE TRIGGER trigger_task_templates_updated_at BEFORE UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASK TYPES
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
COMMENT ON TABLE public.task_types IS 'Reusable library of task definitions';
CREATE TRIGGER trigger_task_types_updated_at BEFORE UPDATE ON public.task_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASK TEMPLATES TASKS (Junction)
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
COMMENT ON TABLE public.task_templates_tasks IS 'Junction table mapping task types to templates with sequence order';

-- SERVICE TICKET TASKS
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
  CONSTRAINT service_ticket_tasks_completed_requires_notes CHECK (status != 'completed' OR completion_notes IS NOT NULL),
  CONSTRAINT service_ticket_tasks_blocked_requires_reason CHECK (status != 'blocked' OR blocked_reason IS NOT NULL)
);
COMMENT ON TABLE public.service_ticket_tasks IS 'Task instances for specific service tickets';
CREATE TRIGGER trigger_service_ticket_tasks_updated_at BEFORE UPDATE ON public.service_ticket_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASK HISTORY
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
COMMENT ON TABLE public.task_history IS 'Immutable audit trail of task status changes';

-- TICKET TEMPLATE CHANGES
CREATE TABLE IF NOT EXISTS public.ticket_template_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  old_template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  new_template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.ticket_template_changes IS 'Audit trail of template changes during service execution';

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
-- WAREHOUSE TABLES (from 14_warehouse_tables.sql)
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
  virtual_warehouse_type public.warehouse_type NOT NULL DEFAULT 'warranty_stock',
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,
  previous_virtual_warehouse_type public.warehouse_type,
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
COMMENT ON COLUMN public.physical_products.previous_virtual_warehouse_type IS 'Stores warehouse type before RMA - used to restore location when removed from RMA batch';
COMMENT ON COLUMN public.physical_products.manufacturer_warranty_end_date IS 'Manufacturer warranty end date (nullable - managed separately at /inventory/products)';
COMMENT ON COLUMN public.physical_products.user_warranty_end_date IS 'Extended warranty for end user (nullable - managed separately at /inventory/products)';
COMMENT ON COLUMN public.physical_products.last_known_customer_id IS 'Last known customer who owns/received this product. Updated when product moves to customer_installed warehouse.';
CREATE TRIGGER trigger_physical_products_updated_at BEFORE UPDATE ON public.physical_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_physical_products_last_customer ON public.physical_products(last_known_customer_id) WHERE last_known_customer_id IS NOT NULL;

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
