-- =====================================================
-- Migration: Create Stock Document Attachments
-- Description: File attachments for stock documents
-- Date: 2025-01-27
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,
  document_id UUID NOT NULL,

  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),

  uploaded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_document_attachments_document
  ON public.stock_document_attachments(document_type, document_id);
CREATE INDEX idx_stock_document_attachments_uploader
  ON public.stock_document_attachments(uploaded_by_id);

COMMENT ON TABLE public.stock_document_attachments IS
  'File attachments for stock documents (receipts, issues, transfers)';
