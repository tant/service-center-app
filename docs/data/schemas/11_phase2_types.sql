-- Phase 2 ENUMs
-- Service Center - Task Workflow, Warehouse, and Service Request Types
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- TASK STATUS ENUM
-- =====================================================
-- Status flow for task execution
-- pending → in_progress → completed
--   ↓            ↓
-- blocked      skipped

DROP TYPE IF EXISTS public.task_status CASCADE;
CREATE TYPE public.task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped'
);

COMMENT ON TYPE public.task_status IS 'Task execution status within service ticket workflow';

-- =====================================================
-- WAREHOUSE TYPE ENUM
-- =====================================================
-- Five virtual warehouse types for product categorization

DROP TYPE IF EXISTS public.warehouse_type CASCADE;
CREATE TYPE public.warehouse_type AS ENUM (
  'warranty_stock',
  'rma_staging',
  'dead_stock',
  'in_service',
  'parts'
);

COMMENT ON TYPE public.warehouse_type IS 'Virtual warehouse categories for physical product organization';

-- =====================================================
-- SERVICE REQUEST STATUS ENUM
-- =====================================================
-- Status flow for public service requests
-- submitted → received → processing → completed
--                           ↓
--                       cancelled

DROP TYPE IF EXISTS public.request_status CASCADE;
CREATE TYPE public.request_status AS ENUM (
  'submitted',
  'received',
  'processing',
  'completed',
  'cancelled'
);

COMMENT ON TYPE public.request_status IS 'Status flow for customer service requests from public portal';

-- =====================================================
-- PRODUCT CONDITION ENUM
-- =====================================================
-- Physical condition of serialized products

DROP TYPE IF EXISTS public.product_condition CASCADE;
CREATE TYPE public.product_condition AS ENUM (
  'new',
  'refurbished',
  'used',
  'faulty',
  'for_parts'
);

COMMENT ON TYPE public.product_condition IS 'Physical condition classification for inventory products';

-- =====================================================
-- SERVICE TYPE ENUM (for task templates)
-- =====================================================
-- Service type determines which template to use

DROP TYPE IF EXISTS public.service_type CASCADE;
CREATE TYPE public.service_type AS ENUM (
  'warranty',
  'paid',
  'replacement'
);

COMMENT ON TYPE public.service_type IS 'Service type classification for task template selection';

-- =====================================================
-- DELIVERY METHOD ENUM
-- =====================================================
-- Customer delivery preference

DROP TYPE IF EXISTS public.delivery_method CASCADE;
CREATE TYPE public.delivery_method AS ENUM (
  'pickup',
  'delivery'
);

COMMENT ON TYPE public.delivery_method IS 'Customer product delivery method preference';

-- =====================================================
-- STOCK MOVEMENT TYPE ENUM
-- =====================================================
-- Types of product movements between warehouses

DROP TYPE IF EXISTS public.movement_type CASCADE;
CREATE TYPE public.movement_type AS ENUM (
  'receipt',
  'transfer',
  'assignment',
  'return',
  'disposal'
);

COMMENT ON TYPE public.movement_type IS 'Type of stock movement transaction';
