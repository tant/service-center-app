-- =====================================================
-- Migration: Add Inventory Management ENUMs
-- Description: Create enum types for stock document workflows
-- Date: 2025-01-27
-- =====================================================

-- Stock Document Status
CREATE TYPE public.stock_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.stock_document_status IS 'Workflow status for stock documents';

-- Stock Receipt Type
CREATE TYPE public.stock_receipt_type AS ENUM (
  'supplier_receipt',
  'rma_return',
  'transfer_in',
  'breakdown',
  'adjustment_in'
);
COMMENT ON TYPE public.stock_receipt_type IS 'Classification of stock receipt transactions';

-- Stock Issue Type
CREATE TYPE public.stock_issue_type AS ENUM (
  'warranty_return',
  'parts_usage',
  'rma_out',
  'transfer_out',
  'disposal',
  'adjustment_out'
);
COMMENT ON TYPE public.stock_issue_type IS 'Classification of stock issue transactions';

-- Transfer Status (Extended)
CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'in_transit',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.transfer_status IS 'Workflow status for stock transfers with in-transit state';

-- Grant usage to authenticated users
GRANT USAGE ON TYPE public.stock_document_status TO authenticated;
GRANT USAGE ON TYPE public.stock_receipt_type TO authenticated;
GRANT USAGE ON TYPE public.stock_issue_type TO authenticated;
GRANT USAGE ON TYPE public.transfer_status TO authenticated;
