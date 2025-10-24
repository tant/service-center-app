/**
 * Story 1.14: Customer Delivery Confirmation Workflow
 * Add delivery tracking fields to service_tickets table
 */

-- Add delivery tracking fields
ALTER TABLE service_tickets
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_confirmed_by_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS delivery_signature_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Create index for delivery queries
CREATE INDEX IF NOT EXISTS idx_service_tickets_delivery_confirmed ON service_tickets(delivery_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_service_tickets_pending_delivery ON service_tickets(status) WHERE status = 'completed' AND delivery_confirmed_at IS NULL;

-- Add comment
COMMENT ON COLUMN service_tickets.delivery_confirmed_at IS 'Timestamp when delivery was confirmed';
COMMENT ON COLUMN service_tickets.delivery_confirmed_by_id IS 'Staff member who confirmed delivery';
COMMENT ON COLUMN service_tickets.delivery_signature_url IS 'URL to delivery signature image in storage';
COMMENT ON COLUMN service_tickets.delivery_notes IS 'Notes from delivery confirmation';
