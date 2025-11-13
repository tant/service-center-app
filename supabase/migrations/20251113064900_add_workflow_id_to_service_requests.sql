-- Migration: Add workflow_id to service_requests
-- Purpose: Enable inspection workflow support for service requests (Phase 3: Week 13-14)
-- Date: 2025-11-13
-- Issue: Service request creation failing due to missing workflow_id column

-- Add workflow_id column to service_requests table
ALTER TABLE service_requests
ADD COLUMN workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN service_requests.workflow_id IS
'Optional workflow for inspection tasks before ticket creation. When set, tasks are created from workflow and tickets are only created after all workflow tasks are completed. NULL means immediate ticket creation (default behavior).';

-- Create index for performance (optional but recommended)
-- Only index non-NULL values since most service requests may not use workflows
CREATE INDEX idx_service_requests_workflow_id
ON service_requests(workflow_id)
WHERE workflow_id IS NOT NULL;
