-- =====================================================
-- 100_enums_and_sequences.sql
-- =====================================================
-- Base Types: ENUMs and SEQUENCES
--
-- This file defines all enum types and sequences used
-- across the entire schema. It should be loaded first
-- to ensure types are available for all other objects.
--
-- ORDER: 100-199 (Base Schema)
-- =====================================================

-- =====================================================
-- CORE ENUM TYPES
-- =====================================================

-- User Role Enum
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'manager',
  'technician',
  'reception'
);
COMMENT ON TYPE public.user_role IS 'User roles in the service center system';

-- Ticket Status Enum
DROP TYPE IF EXISTS public.ticket_status CASCADE;
CREATE TYPE public.ticket_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.ticket_status IS 'Service ticket lifecycle statuses';

-- Priority Level Enum
DROP TYPE IF EXISTS public.priority_level CASCADE;
CREATE TYPE public.priority_level AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);
COMMENT ON TYPE public.priority_level IS 'Priority levels for service tickets';

-- Warranty Type Enum
DROP TYPE IF EXISTS public.warranty_type CASCADE;
CREATE TYPE public.warranty_type AS ENUM (
  'warranty',
  'paid',
  'goodwill'
);
COMMENT ON TYPE public.warranty_type IS 'Warranty status of service tickets';

-- Comment Type Enum
DROP TYPE IF EXISTS public.comment_type CASCADE;
CREATE TYPE public.comment_type AS ENUM (
  'note',
  'status_change',
  'assignment',
  'system'
);
COMMENT ON TYPE public.comment_type IS 'Types of comments on service tickets';

-- =====================================================
-- PHASE 2 ENUM TYPES
-- =====================================================

-- Task Status Enum
DROP TYPE IF EXISTS public.task_status CASCADE;
CREATE TYPE public.task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped'
);
COMMENT ON TYPE public.task_status IS 'Task execution status within service ticket workflow';

-- Entity Type Enum (for Polymorphic Tasks)
DROP TYPE IF EXISTS public.entity_type CASCADE;
CREATE TYPE public.entity_type AS ENUM (
  'service_ticket',      -- Service repair/warranty tickets
  'inventory_receipt',   -- Goods receipt notes (GRN)
  'inventory_issue',     -- Goods issue notes (GIN)
  'inventory_transfer',  -- Stock transfers between warehouses
  'service_request'      -- Customer service requests
);
COMMENT ON TYPE public.entity_type IS 'Entity types that can have associated tasks in the polymorphic task system';

-- Warehouse Type Enum
DROP TYPE IF EXISTS public.warehouse_type CASCADE;
CREATE TYPE public.warehouse_type AS ENUM (
  'main',
  'warranty_stock',
  'rma_staging',
  'dead_stock',
  'in_service',
  'parts',
  'customer_installed'
);
COMMENT ON TYPE public.warehouse_type IS 'Virtual warehouse categories: main (primary storage), warranty_stock, rma_staging, dead_stock, in_service, parts, customer_installed (products sold to customers)';

-- Service Request Status Enum
DROP TYPE IF EXISTS public.request_status CASCADE;
CREATE TYPE public.request_status AS ENUM (
  'draft',
  'submitted',
  'pickingup',
  'received',
  'processing',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.request_status IS 'Status flow: draft (saved, not submitted) → submitted → pickingup (waiting pickup) → received (auto-creates tickets) → processing → completed';

-- Product Condition Enum
DROP TYPE IF EXISTS public.product_condition CASCADE;
CREATE TYPE public.product_condition AS ENUM (
  'new',
  'refurbished',
  'used',
  'faulty',
  'for_parts'
);
COMMENT ON TYPE public.product_condition IS 'Physical condition classification for inventory products';

-- Service Type Enum
DROP TYPE IF EXISTS public.service_type CASCADE;
CREATE TYPE public.service_type AS ENUM (
  'warranty',
  'paid',
  'replacement'
);
COMMENT ON TYPE public.service_type IS 'Service type classification for task template selection';

-- Delivery Method Enum
DROP TYPE IF EXISTS public.delivery_method CASCADE;
CREATE TYPE public.delivery_method AS ENUM (
  'pickup',
  'delivery'
);
COMMENT ON TYPE public.delivery_method IS 'Customer product delivery method preference';

-- Receipt Status Enum
DROP TYPE IF EXISTS public.receipt_status CASCADE;
CREATE TYPE public.receipt_status AS ENUM (
  'received',
  'pending_receipt'
);
COMMENT ON TYPE public.receipt_status IS 'Product receipt status: received (create tickets) or pending_receipt (wait for product)';

-- Stock Movement Type Enum
DROP TYPE IF EXISTS public.movement_type CASCADE;
CREATE TYPE public.movement_type AS ENUM (
  'receipt',
  'transfer',
  'assignment',
  'return',
  'disposal'
);
COMMENT ON TYPE public.movement_type IS 'Type of stock movement transaction';

-- =====================================================
-- INVENTORY DOCUMENT ENUM TYPES
-- =====================================================

-- Stock Document Status
DROP TYPE IF EXISTS public.stock_document_status CASCADE;
CREATE TYPE public.stock_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.stock_document_status IS 'Workflow status for stock documents';

-- Stock Receipt Type (SIMPLIFIED)
DROP TYPE IF EXISTS public.stock_receipt_type CASCADE;
CREATE TYPE public.stock_receipt_type AS ENUM (
  'normal',      -- Phiếu nhập bình thường (mặc định)
  'adjustment'   -- Phiếu điều chỉnh (kiểm kê/sửa sai sót)
);
COMMENT ON TYPE public.stock_receipt_type IS 'Receipt types: normal or adjustment';

-- Stock Issue Type (SIMPLIFIED)
DROP TYPE IF EXISTS public.stock_issue_type CASCADE;
CREATE TYPE public.stock_issue_type AS ENUM (
  'normal',      -- Phiếu xuất bình thường (mặc định)
  'adjustment'   -- Phiếu điều chỉnh (kiểm kê/sửa sai sót)
);
COMMENT ON TYPE public.stock_issue_type IS 'Issue types: normal or adjustment';

-- Transfer Status (SIMPLIFIED - removed in_transit to match receipts/issues)
DROP TYPE IF EXISTS public.transfer_status CASCADE;
CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.transfer_status IS 'Simplified workflow status for stock transfers (removed in_transit)';

-- =====================================================
-- SEQUENCES FOR AUTO-NUMBERING
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.issue_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.transfer_number_seq START 1;

-- =====================================================
-- GRANTS FOR ALL TYPES
-- =====================================================

GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT USAGE ON TYPE public.ticket_status TO authenticated;
GRANT USAGE ON TYPE public.priority_level TO authenticated;
GRANT USAGE ON TYPE public.warranty_type TO authenticated;
GRANT USAGE ON TYPE public.comment_type TO authenticated;
GRANT USAGE ON TYPE public.task_status TO authenticated;
GRANT USAGE ON TYPE public.entity_type TO authenticated;
GRANT USAGE ON TYPE public.warehouse_type TO authenticated;
GRANT USAGE ON TYPE public.request_status TO authenticated;
GRANT USAGE ON TYPE public.product_condition TO authenticated;
GRANT USAGE ON TYPE public.service_type TO authenticated;
GRANT USAGE ON TYPE public.delivery_method TO authenticated;
GRANT USAGE ON TYPE public.receipt_status TO authenticated;
GRANT USAGE ON TYPE public.movement_type TO authenticated;
GRANT USAGE ON TYPE public.stock_document_status TO authenticated;
GRANT USAGE ON TYPE public.stock_receipt_type TO authenticated;
GRANT USAGE ON TYPE public.stock_issue_type TO authenticated;
GRANT USAGE ON TYPE public.transfer_status TO authenticated;
