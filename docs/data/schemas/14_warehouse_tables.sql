-- Phase 2 Warehouse Tables
-- Service Center - Physical and Virtual Warehouse Management
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- PHYSICAL WAREHOUSES
-- =====================================================
-- Physical locations for storing products

CREATE TABLE IF NOT EXISTS public.physical_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physical_warehouses_code ON public.physical_warehouses(code);
CREATE INDEX IF NOT EXISTS idx_physical_warehouses_active ON public.physical_warehouses(is_active) WHERE is_active = true;

COMMENT ON TABLE public.physical_warehouses IS 'Physical locations for storing products (shelves, rooms, buildings)';
COMMENT ON COLUMN public.physical_warehouses.code IS 'Short code for quick identification (e.g., WH-A, SHELF-01)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_physical_warehouses_updated_at
  BEFORE UPDATE ON public.physical_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VIRTUAL WAREHOUSES
-- =====================================================
-- Virtual categorization of products by status

CREATE TABLE IF NOT EXISTS public.virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_type public.warehouse_type NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  color_code VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_warehouses_type ON public.virtual_warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_virtual_warehouses_active ON public.virtual_warehouses(is_active) WHERE is_active = true;

COMMENT ON TABLE public.virtual_warehouses IS 'Virtual warehouse categories for product state management';
COMMENT ON COLUMN public.virtual_warehouses.warehouse_type IS 'One of: warranty_stock, rma_staging, dead_stock, in_service, parts';
COMMENT ON COLUMN public.virtual_warehouses.color_code IS 'Hex color for UI display (e.g., #10B981)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_virtual_warehouses_updated_at
  BEFORE UPDATE ON public.virtual_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PHYSICAL PRODUCTS
-- =====================================================
-- Serialized products with warranty tracking

CREATE TABLE IF NOT EXISTS public.physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,
  condition public.product_condition NOT NULL DEFAULT 'new',

  -- Warehouse location
  virtual_warehouse_type public.warehouse_type NOT NULL DEFAULT 'warranty_stock',
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Warranty tracking
  warranty_start_date DATE,
  warranty_months INT,
  warranty_end_date DATE,

  -- Service association
  current_ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,

  -- RMA tracking
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  rma_reason TEXT,
  rma_date DATE,

  -- Supplier info
  supplier_id UUID,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT physical_products_serial_unique UNIQUE(serial_number)
);

CREATE INDEX IF NOT EXISTS idx_physical_products_product ON public.physical_products(product_id);
CREATE INDEX IF NOT EXISTS idx_physical_products_serial ON public.physical_products(serial_number);
CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse ON public.physical_products(virtual_warehouse_type);
CREATE INDEX IF NOT EXISTS idx_physical_products_physical_warehouse ON public.physical_products(physical_warehouse_id) WHERE physical_warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_condition ON public.physical_products(condition);
CREATE INDEX IF NOT EXISTS idx_physical_products_current_ticket ON public.physical_products(current_ticket_id) WHERE current_ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_rma_batch ON public.physical_products(rma_batch_id) WHERE rma_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_warranty_expiring ON public.physical_products(warranty_end_date)
  WHERE warranty_end_date IS NOT NULL;

COMMENT ON TABLE public.physical_products IS 'Serialized product instances with warranty and location tracking';
COMMENT ON COLUMN public.physical_products.virtual_warehouse_type IS 'Current virtual warehouse category';
COMMENT ON COLUMN public.physical_products.warranty_end_date IS 'Auto-calculated from warranty_start_date + warranty_months';
COMMENT ON COLUMN public.physical_products.current_ticket_id IS 'Service ticket this product is currently assigned to';

-- Trigger: Auto-calculate warranty_end_date
CREATE OR REPLACE FUNCTION public.calculate_physical_product_warranty_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warranty_start_date IS NOT NULL AND NEW.warranty_months IS NOT NULL THEN
    NEW.warranty_end_date := NEW.warranty_start_date + (NEW.warranty_months || ' months')::INTERVAL;
  ELSE
    NEW.warranty_end_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_physical_products_warranty_calculation
  BEFORE INSERT OR UPDATE ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_physical_product_warranty_end_date();

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_physical_products_updated_at
  BEFORE UPDATE ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STOCK MOVEMENTS
-- =====================================================
-- Audit trail for all product movements

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE RESTRICT,

  -- Movement type
  movement_type public.movement_type NOT NULL,

  -- Location tracking
  from_virtual_warehouse public.warehouse_type,
  to_virtual_warehouse public.warehouse_type,
  from_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,
  to_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Service ticket association
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,

  -- Metadata
  reason TEXT,
  notes TEXT,
  moved_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_movements_virtual_warehouse_changed CHECK (
    from_virtual_warehouse IS DISTINCT FROM to_virtual_warehouse OR
    from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id
  )
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_virtual ON public.stock_movements(from_virtual_warehouse) WHERE from_virtual_warehouse IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_virtual ON public.stock_movements(to_virtual_warehouse) WHERE to_virtual_warehouse IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_ticket ON public.stock_movements(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_moved_by ON public.stock_movements(moved_by_id);

COMMENT ON TABLE public.stock_movements IS 'Immutable audit trail of all product movements between warehouses';
COMMENT ON COLUMN public.stock_movements.movement_type IS 'Type: receipt, transfer, assignment, return, disposal';
COMMENT ON CONSTRAINT stock_movements_virtual_warehouse_changed ON public.stock_movements IS 'Ensure at least one location changed';

-- =====================================================
-- PRODUCT STOCK THRESHOLDS
-- =====================================================
-- Low stock alert configuration per product

CREATE TABLE IF NOT EXISTS public.product_stock_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_type public.warehouse_type NOT NULL,

  -- Threshold levels
  minimum_quantity INT NOT NULL,
  reorder_quantity INT,
  maximum_quantity INT,

  -- Alert settings
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  last_alert_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_stock_thresholds_product_warehouse_unique UNIQUE(product_id, warehouse_type),
  CONSTRAINT product_stock_thresholds_quantities_valid CHECK (
    minimum_quantity >= 0 AND
    (reorder_quantity IS NULL OR reorder_quantity >= minimum_quantity) AND
    (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity)
  )
);

CREATE INDEX IF NOT EXISTS idx_product_stock_thresholds_product ON public.product_stock_thresholds(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_thresholds_warehouse ON public.product_stock_thresholds(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_product_stock_thresholds_alerts_enabled ON public.product_stock_thresholds(alert_enabled, warehouse_type)
  WHERE alert_enabled = true;

COMMENT ON TABLE public.product_stock_thresholds IS 'Low stock alert configuration per product and warehouse type';
COMMENT ON COLUMN public.product_stock_thresholds.minimum_quantity IS 'Alert when stock falls below this level';
COMMENT ON COLUMN public.product_stock_thresholds.reorder_quantity IS 'Suggested reorder quantity';
COMMENT ON COLUMN public.product_stock_thresholds.maximum_quantity IS 'Maximum stock level (for storage planning)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_product_stock_thresholds_updated_at
  BEFORE UPDATE ON public.product_stock_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
