-- =====================================================
-- Migration: Inventory Redesign Part 1 - Drop Old Schema
-- Description: Drop existing tables and ENUMs for clean slate
-- Date: 2025-10-28
-- =====================================================

-- Drop existing tables (cascade will drop dependent objects)
DROP TABLE IF EXISTS public.stock_transfer_serials CASCADE;
DROP TABLE IF EXISTS public.stock_transfer_items CASCADE;
DROP TABLE IF EXISTS public.stock_transfers CASCADE;

DROP TABLE IF EXISTS public.stock_issue_serials CASCADE;
DROP TABLE IF EXISTS public.stock_issue_items CASCADE;
DROP TABLE IF EXISTS public.stock_issues CASCADE;

DROP TABLE IF EXISTS public.stock_receipt_serials CASCADE;
DROP TABLE IF EXISTS public.stock_receipt_items CASCADE;
DROP TABLE IF EXISTS public.stock_receipts CASCADE;

DROP TABLE IF EXISTS public.product_warehouse_stock CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS public.receipt_number_seq CASCADE;
DROP SEQUENCE IF EXISTS public.issue_number_seq CASCADE;
DROP SEQUENCE IF EXISTS public.transfer_number_seq CASCADE;

-- Drop old ENUM types
DROP TYPE IF EXISTS public.stock_document_status CASCADE;
DROP TYPE IF EXISTS public.stock_receipt_type CASCADE;
DROP TYPE IF EXISTS public.stock_issue_type CASCADE;
DROP TYPE IF EXISTS public.transfer_status CASCADE;

-- Log completion
SELECT 'Part 1 Complete: Old inventory schema dropped' as status;
