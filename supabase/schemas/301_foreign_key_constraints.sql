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
