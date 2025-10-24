/**
 * Story 1.15: Email Notification System
 * Create email_notifications table and email template types
 */

-- Create email type enum
DO $$ BEGIN
  CREATE TYPE public.email_type AS ENUM (
    'request_submitted',
    'request_received',
    'request_rejected',
    'ticket_created',
    'service_completed',
    'delivery_confirmed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create email status enum
DO $$ BEGIN
  CREATE TYPE public.email_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'bounced'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop existing table if it exists (clean migration)
DROP TABLE IF EXISTS public.email_notifications CASCADE;

-- Create email_notifications table
CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type public.email_type NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,

  -- Context data (JSON for flexibility)
  context JSONB,

  -- Status tracking
  status public.email_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,

  -- Related entities
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  service_ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,

  -- Unsubscribe
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON public.email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON public.email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_request ON public.email_notifications(service_request_id) WHERE service_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notifications_ticket ON public.email_notifications(service_ticket_id) WHERE service_ticket_id IS NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.email_notifications IS 'Logs all email notifications sent to customers';
COMMENT ON COLUMN public.email_notifications.email_type IS 'Type of email notification';
COMMENT ON COLUMN public.email_notifications.context IS 'JSON data with template variables (tracking_token, ticket_number, etc.)';
COMMENT ON COLUMN public.email_notifications.retry_count IS 'Number of send attempts';
COMMENT ON COLUMN public.email_notifications.unsubscribed IS 'Whether recipient has unsubscribed from this type';

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only authenticated staff can view email logs
CREATE POLICY email_notifications_select_policy ON public.email_notifications
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system/authenticated users can insert
CREATE POLICY email_notifications_insert_policy ON public.email_notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only system can update
CREATE POLICY email_notifications_update_policy ON public.email_notifications
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add customer email_preferences column to customers table (for unsubscribe)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
    "request_submitted": true,
    "request_received": true,
    "request_rejected": true,
    "ticket_created": true,
    "service_completed": true,
    "delivery_confirmed": true
  }'::jsonb;

COMMENT ON COLUMN public.customers.email_preferences IS 'Customer email notification preferences';
