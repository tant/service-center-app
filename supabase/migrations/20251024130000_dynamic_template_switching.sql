-- Migration: Dynamic Template Switching (Story 1.17)
-- Description: Enable technicians to switch task templates mid-service with audit trail
-- Created: 2025-10-24

-- =====================================================
-- TICKET TEMPLATE CHANGES AUDIT TABLE
-- =====================================================
-- Tracks all template switches during service with reason and metadata

DROP TABLE IF EXISTS ticket_template_changes CASCADE;

CREATE TABLE ticket_template_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core References
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  old_template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE RESTRICT,
  new_template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE RESTRICT,

  -- Audit Information
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 10), -- Minimum 10 characters
  changed_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  tasks_preserved_count INTEGER NOT NULL DEFAULT 0,
  tasks_added_count INTEGER NOT NULL DEFAULT 0,

  -- Constraints
  CONSTRAINT different_templates CHECK (old_template_id != new_template_id)
);

COMMENT ON TABLE ticket_template_changes IS 'Story 1.17: Audit log for template switches during service';
COMMENT ON COLUMN ticket_template_changes.reason IS 'Technician explanation for template switch (min 10 chars)';
COMMENT ON COLUMN ticket_template_changes.tasks_preserved_count IS 'Number of existing tasks kept after switch';
COMMENT ON COLUMN ticket_template_changes.tasks_added_count IS 'Number of new tasks added from new template';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Query by ticket (common for ticket detail page)
CREATE INDEX idx_ticket_template_changes_ticket_id
ON ticket_template_changes(ticket_id);

-- Query by technician (for audit reports)
CREATE INDEX idx_ticket_template_changes_changed_by
ON ticket_template_changes(changed_by_id);

-- Query by date range (for analytics)
CREATE INDEX idx_ticket_template_changes_changed_at
ON ticket_template_changes(changed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE ticket_template_changes ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view template change history
CREATE POLICY "Users can view template changes"
ON ticket_template_changes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only technicians/admin/manager can create entries (enforced in application logic)
-- Note: This table is written via tRPC procedure, not direct inserts
CREATE POLICY "System can create template change records"
ON ticket_template_changes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('technician', 'admin', 'manager')
  )
);

-- No UPDATE or DELETE policies - audit records are immutable
