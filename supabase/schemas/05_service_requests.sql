-- =====================================================
-- 05_service_requests.sql
-- =====================================================
-- Phase 2 tables for the public service request portal
-- and email notifications.
-- =====================================================

-- =====================================================
-- SERVICE REQUESTS TABLE (from 15_service_request_tables.sql)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(15) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  product_brand VARCHAR(255) NOT NULL,
  product_model VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  purchase_date DATE,
  issue_description TEXT NOT NULL,
  issue_photos JSONB DEFAULT '[]'::jsonb,
  service_type public.service_type NOT NULL DEFAULT 'warranty',
  delivery_method public.delivery_method NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  status public.request_status NOT NULL DEFAULT 'submitted',
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  submitted_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_requests_rejected_requires_reason CHECK (status != 'cancelled' OR rejection_reason IS NOT NULL),
  CONSTRAINT service_requests_converted_requires_ticket CHECK (status != 'completed' OR ticket_id IS NOT NULL),
  CONSTRAINT service_requests_delivery_requires_address CHECK (delivery_method != 'delivery' OR delivery_address IS NOT NULL)
);

COMMENT ON TABLE public.service_requests IS 'Public service request submissions from customer portal';
CREATE TRIGGER trigger_generate_service_request_tracking_token BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_token();
CREATE TRIGGER trigger_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- EMAIL NOTIFICATIONS TABLE (from 15_service_request_tables.sql)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body_text TEXT,
  body_html TEXT,
  template_name VARCHAR(100),
  notification_type VARCHAR(100) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.email_notifications IS 'Audit trail and delivery tracking for all email notifications';
CREATE TRIGGER trigger_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS FROM 03_service_tickets.sql
-- =====================================================
-- These FK constraints reference tables created in 04 and 05,
-- so they must be added after those tables exist.

-- Add FK constraint for template_id (references task_templates from 04_task_and_warehouse.sql)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.task_templates(id)
  ON DELETE SET NULL;

-- Add FK constraint for request_id (references service_requests from this file)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_request_id_fkey
  FOREIGN KEY (request_id)
  REFERENCES public.service_requests(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT service_tickets_template_id_fkey ON public.service_tickets IS 'Links ticket to task template used for workflow';
COMMENT ON CONSTRAINT service_tickets_request_id_fkey ON public.service_tickets IS 'Links ticket to originating service request from public portal';
