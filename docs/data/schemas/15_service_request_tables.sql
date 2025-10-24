-- Phase 2 Service Request Tables
-- Service Center - Public Service Request Portal
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- SERVICE REQUESTS
-- =====================================================
-- Public service requests from customer portal

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(15) NOT NULL UNIQUE,

  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),

  -- Product information
  product_brand VARCHAR(255) NOT NULL,
  product_model VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  purchase_date DATE,

  -- Issue details
  issue_description TEXT NOT NULL,
  issue_photos JSONB DEFAULT '[]'::jsonb,

  -- Service preferences
  service_type public.service_type NOT NULL DEFAULT 'warranty',
  delivery_method public.delivery_method NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,

  -- Status tracking
  status public.request_status NOT NULL DEFAULT 'submitted',
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Service ticket linkage
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Metadata
  submitted_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT service_requests_rejected_requires_reason CHECK (
    status != 'cancelled' OR rejection_reason IS NOT NULL
  ),
  CONSTRAINT service_requests_converted_requires_ticket CHECK (
    status != 'completed' OR ticket_id IS NOT NULL
  ),
  CONSTRAINT service_requests_delivery_requires_address CHECK (
    delivery_method != 'delivery' OR delivery_address IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_service_requests_tracking_token ON public.service_requests(tracking_token);
CREATE INDEX IF NOT EXISTS idx_service_requests_email ON public.service_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_service_requests_phone ON public.service_requests(customer_phone);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON public.service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_ticket ON public.service_requests(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_requests_pending ON public.service_requests(status, created_at DESC)
  WHERE status IN ('submitted', 'received');

COMMENT ON TABLE public.service_requests IS 'Public service request submissions from customer portal';
COMMENT ON COLUMN public.service_requests.tracking_token IS 'Auto-generated tracking token (SR-XXXXXXXXXXXX)';
COMMENT ON COLUMN public.service_requests.issue_photos IS 'Array of photo URLs from storage bucket';
COMMENT ON COLUMN public.service_requests.status IS 'submitted → received → processing → completed | cancelled';
COMMENT ON COLUMN public.service_requests.ticket_id IS 'Service ticket created from this request';

-- Trigger: Auto-generate tracking token
CREATE TRIGGER trigger_generate_service_request_tracking_token
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_token();

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- EMAIL NOTIFICATIONS
-- =====================================================
-- Audit trail for all email notifications sent

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient information
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- Email content
  subject VARCHAR(500) NOT NULL,
  body_text TEXT,
  body_html TEXT,
  template_name VARCHAR(100),

  -- Context
  notification_type VARCHAR(100) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,

  -- Delivery tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,

  -- Error tracking
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON public.email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON public.email_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_related ON public.email_notifications(related_entity_type, related_entity_id)
  WHERE related_entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON public.email_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_pending_retry ON public.email_notifications(status, last_retry_at)
  WHERE status IN ('pending', 'failed') AND retry_count < 3;

COMMENT ON TABLE public.email_notifications IS 'Audit trail and delivery tracking for all email notifications';
COMMENT ON COLUMN public.email_notifications.notification_type IS 'Type: service_request_received, ticket_created, status_updated, etc.';
COMMENT ON COLUMN public.email_notifications.related_entity_type IS 'Entity type: service_request, service_ticket, etc.';
COMMENT ON COLUMN public.email_notifications.related_entity_id IS 'UUID of related entity';
COMMENT ON COLUMN public.email_notifications.status IS 'pending, sent, delivered, opened, clicked, bounced, failed';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
