-- =====================================================
-- Migration: Apply RLS Policies
-- Description: Row-level security for inventory tables
-- Date: 2025-01-27
-- =====================================================

-- =====================================================
-- RLS: Stock Receipts
-- =====================================================
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_receipts_admin_manager_all
  ON public.stock_receipts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_receipts_others_read
  ON public.stock_receipts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- RLS: Stock Issues
-- =====================================================
ALTER TABLE public.stock_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_issues_admin_manager_all
  ON public.stock_issues FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_issues_others_read
  ON public.stock_issues FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- RLS: Stock Transfers
-- =====================================================
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_transfers_admin_manager_all
  ON public.stock_transfers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_transfers_others_read
  ON public.stock_transfers FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- RLS: Product Warehouse Stock
-- =====================================================
ALTER TABLE public.product_warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY product_warehouse_stock_admin_all
  ON public.product_warehouse_stock FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Manager: Can view and update declared_quantity (not initial_stock_entry)
CREATE POLICY product_warehouse_stock_manager_read
  ON public.product_warehouse_stock FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

CREATE POLICY product_warehouse_stock_manager_update
  ON public.product_warehouse_stock FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'manager'
    )
  )
  WITH CHECK (
    -- Prevent updating initial_stock_entry
    initial_stock_entry = (
      SELECT initial_stock_entry
      FROM public.product_warehouse_stock
      WHERE id = product_warehouse_stock.id
    )
  );

-- Others: Read-only
CREATE POLICY product_warehouse_stock_others_read
  ON public.product_warehouse_stock FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- RLS: Child Tables (items, serials, attachments)
-- =====================================================

-- Stock Receipt Items
ALTER TABLE public.stock_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_receipt_items_admin_manager
  ON public.stock_receipt_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_receipts sr
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE sr.id = stock_receipt_items.receipt_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_receipt_items_others_read
  ON public.stock_receipt_items FOR SELECT TO authenticated
  USING (true);

-- Stock Receipt Serials
ALTER TABLE public.stock_receipt_serials ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_receipt_serials_admin_manager
  ON public.stock_receipt_serials FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_receipt_items sri
      JOIN public.stock_receipts sr ON sr.id = sri.receipt_id
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE sri.id = stock_receipt_serials.receipt_item_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_receipt_serials_others_read
  ON public.stock_receipt_serials FOR SELECT TO authenticated
  USING (true);

-- Stock Issue Items
ALTER TABLE public.stock_issue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_issue_items_admin_manager
  ON public.stock_issue_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_issues si
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE si.id = stock_issue_items.issue_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_issue_items_others_read
  ON public.stock_issue_items FOR SELECT TO authenticated
  USING (true);

-- Stock Issue Serials
ALTER TABLE public.stock_issue_serials ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_issue_serials_admin_manager
  ON public.stock_issue_serials FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_issue_items sii
      JOIN public.stock_issues si ON si.id = sii.issue_id
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE sii.id = stock_issue_serials.issue_item_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_issue_serials_others_read
  ON public.stock_issue_serials FOR SELECT TO authenticated
  USING (true);

-- Stock Transfer Items
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_transfer_items_admin_manager
  ON public.stock_transfer_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_transfers st
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE st.id = stock_transfer_items.transfer_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_transfer_items_others_read
  ON public.stock_transfer_items FOR SELECT TO authenticated
  USING (true);

-- Stock Transfer Serials
ALTER TABLE public.stock_transfer_serials ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_transfer_serials_admin_manager
  ON public.stock_transfer_serials FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_transfer_items sti
      JOIN public.stock_transfers st ON st.id = sti.transfer_id
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE sti.id = stock_transfer_serials.transfer_item_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_transfer_serials_others_read
  ON public.stock_transfer_serials FOR SELECT TO authenticated
  USING (true);

-- Stock Document Attachments
ALTER TABLE public.stock_document_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_document_attachments_admin_manager
  ON public.stock_document_attachments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_document_attachments_others_read
  ON public.stock_document_attachments FOR SELECT TO authenticated
  USING (true);
