-- Phase 2 Service Tickets Extensions
-- Service Center - Extend existing service_tickets table
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- EXTEND SERVICE_TICKETS TABLE
-- =====================================================
-- Add Phase 2 columns as nullable to maintain backward compatibility

-- Add task template reference
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;

-- Add service request reference
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL;

-- Add delivery preference
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS delivery_method public.delivery_method;

-- Add delivery address (required if delivery_method = 'delivery')
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add constraint: delivery address required if delivery method is 'delivery'
ALTER TABLE public.service_tickets
  DROP CONSTRAINT IF EXISTS service_tickets_delivery_requires_address;

ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_delivery_requires_address CHECK (
    delivery_method != 'delivery' OR delivery_address IS NOT NULL
  );

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_service_tickets_template ON public.service_tickets(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_request ON public.service_tickets(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_delivery_method ON public.service_tickets(delivery_method) WHERE delivery_method IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.service_tickets.template_id IS 'Task template used for workflow (Phase 2)';
COMMENT ON COLUMN public.service_tickets.request_id IS 'Service request that created this ticket (Phase 2)';
COMMENT ON COLUMN public.service_tickets.delivery_method IS 'Customer delivery preference: pickup or delivery (Phase 2)';
COMMENT ON COLUMN public.service_tickets.delivery_address IS 'Delivery address if delivery_method = delivery (Phase 2)';
