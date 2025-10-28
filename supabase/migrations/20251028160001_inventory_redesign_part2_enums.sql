-- =====================================================
-- Migration: Inventory Redesign Part 2 - Create New ENUMs
-- Description: Create simplified ENUM types
-- Date: 2025-10-28
-- =====================================================

-- Stock Document Status (unchanged)
CREATE TYPE public.stock_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.stock_document_status IS 'Workflow status for stock documents';

-- Stock Receipt Type (SIMPLIFIED: 2 types only)
CREATE TYPE public.stock_receipt_type AS ENUM (
  'normal',      -- Phiếu nhập bình thường (mặc định)
  'adjustment'   -- Phiếu điều chỉnh (kiểm kê/sửa sai sót)
);
COMMENT ON TYPE public.stock_receipt_type IS 'Receipt types: normal or adjustment';

-- Stock Issue Type (SIMPLIFIED: 2 types only)
CREATE TYPE public.stock_issue_type AS ENUM (
  'normal',      -- Phiếu xuất bình thường (mặc định)
  'adjustment'   -- Phiếu điều chỉnh (kiểm kê/sửa sai sót)
);
COMMENT ON TYPE public.stock_issue_type IS 'Issue types: normal or adjustment';

-- Transfer Status (unchanged)
CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'in_transit',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.transfer_status IS 'Workflow status for stock transfers';

-- Grant usage to authenticated users
GRANT USAGE ON TYPE public.stock_document_status TO authenticated;
GRANT USAGE ON TYPE public.stock_receipt_type TO authenticated;
GRANT USAGE ON TYPE public.stock_issue_type TO authenticated;
GRANT USAGE ON TYPE public.transfer_status TO authenticated;

-- Recreate sequences
CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.issue_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.transfer_number_seq START 1;

SELECT 'Part 2 Complete: New ENUMs created' as status;
