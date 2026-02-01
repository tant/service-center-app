-- =====================================================
-- 301_foreign_key_constraints.sql
-- =====================================================
-- Deferred Foreign Key Constraints
--
-- FK constraints that reference tables created in later files:
-- - service_tickets.workflow_id → workflows(id)
-- - service_tickets.request_id → service_requests(id)
--
-- ORDER: 300-399 (Constraints & Alterations)
-- DEPENDENCIES: 201, 202, 203
-- =====================================================

-- Add FK constraint for workflow_id (references workflows from 202)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_workflow_id_fkey
  FOREIGN KEY (workflow_id)
  REFERENCES public.workflows(id)
  ON DELETE SET NULL;

-- Add FK constraint for request_id (references service_requests from 203)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_request_id_fkey
  FOREIGN KEY (request_id)
  REFERENCES public.service_requests(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT service_tickets_workflow_id_fkey ON public.service_tickets IS 'Links ticket to workflow template used for task workflow';
COMMENT ON CONSTRAINT service_tickets_request_id_fkey ON public.service_tickets IS 'Links ticket to originating service request from public portal';

-- Add FK for replacement_product_id (circular: 201 references 202)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_tickets_replacement_product_id_fkey') THEN
    ALTER TABLE public.service_tickets
      ADD CONSTRAINT service_tickets_replacement_product_id_fkey
      FOREIGN KEY (replacement_product_id)
      REFERENCES public.physical_products(id);
  END IF;
END $$;

-- Add FK for current_ticket_id (circular: 202 references 201)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'physical_products_current_ticket_id_fkey') THEN
    ALTER TABLE public.physical_products
      ADD CONSTRAINT physical_products_current_ticket_id_fkey
      FOREIGN KEY (current_ticket_id)
      REFERENCES public.service_tickets(id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON CONSTRAINT service_tickets_replacement_product_id_fkey ON public.service_tickets IS 'Links ticket to replacement physical product when outcome is warranty_replacement';
COMMENT ON CONSTRAINT physical_products_current_ticket_id_fkey ON public.physical_products IS 'Links physical product to its current service ticket';
