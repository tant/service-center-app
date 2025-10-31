-- =====================================================
-- 301_foreign_key_constraints.sql
-- =====================================================
-- Deferred Foreign Key Constraints
--
-- FK constraints that reference tables created in later files:
-- - service_tickets.template_id → task_templates(id)
-- - service_tickets.request_id → service_requests(id)
--
-- ORDER: 300-399 (Constraints & Alterations)
-- DEPENDENCIES: 201, 202, 203
-- =====================================================

-- Add FK constraint for template_id (references task_templates from 202)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.task_templates(id)
  ON DELETE SET NULL;

-- Add FK constraint for request_id (references service_requests from 203)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_request_id_fkey
  FOREIGN KEY (request_id)
  REFERENCES public.service_requests(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT service_tickets_template_id_fkey ON public.service_tickets IS 'Links ticket to task template used for workflow';
COMMENT ON CONSTRAINT service_tickets_request_id_fkey ON public.service_tickets IS 'Links ticket to originating service request from public portal';
