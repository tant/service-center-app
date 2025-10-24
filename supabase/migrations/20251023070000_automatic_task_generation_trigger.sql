-- Migration: Automatic Task Generation Trigger
-- Story: 01.03 - Automatic Task Generation on Ticket Creation
-- Created: 2025-10-23
-- Description: Creates trigger to automatically generate tasks when a service ticket is created

-- =====================================================
-- FUNCTION: generate_ticket_tasks()
-- =====================================================
-- Automatically generates tasks for a service ticket based on template
-- Fires AFTER INSERT on service_tickets table

CREATE OR REPLACE FUNCTION generate_ticket_tasks()
RETURNS TRIGGER AS $$
DECLARE
  v_template_id UUID;
  v_template_task RECORD;
  v_task_count INTEGER := 0;
BEGIN
  -- Check if tasks already exist (idempotency)
  IF EXISTS (SELECT 1 FROM service_ticket_tasks WHERE ticket_id = NEW.id) THEN
    RAISE NOTICE 'Tasks already exist for ticket %, skipping generation', NEW.id;
    RETURN NEW;
  END IF;

  -- Check if product_id exists
  IF NEW.product_id IS NULL THEN
    RAISE NOTICE 'No product_id for ticket %, skipping task generation', NEW.id;
    RETURN NEW;
  END IF;

  -- Find active template for this product + service type
  -- Note: service_type is warranty_type in service_tickets table
  SELECT id INTO v_template_id
  FROM task_templates
  WHERE (product_type = NEW.product_id OR product_type IS NULL)
    AND service_type = NEW.warranty_type
    AND is_active = true
  ORDER BY
    CASE WHEN product_type IS NOT NULL THEN 1 ELSE 2 END,  -- Prioritize product-specific templates
    created_at DESC
  LIMIT 1;

  -- If template found, generate tasks
  IF v_template_id IS NOT NULL THEN
    RAISE NOTICE 'Found template % for ticket %', v_template_id, NEW.id;

    -- Update ticket with template reference
    UPDATE service_tickets
    SET template_id = v_template_id
    WHERE id = NEW.id;

    -- Insert task instances from template
    INSERT INTO service_ticket_tasks (
      ticket_id,
      task_type_id,
      sequence_order,
      status,
      is_required,
      custom_instructions,
      created_at,
      updated_at
    )
    SELECT
      NEW.id,
      tt.task_type_id,
      tt.sequence_order,
      'pending'::task_status,
      tt.is_required,
      tt.custom_instructions,
      NOW(),
      NOW()
    FROM task_templates_tasks tt
    WHERE tt.template_id = v_template_id
    ORDER BY tt.sequence_order;

    -- Get count of inserted tasks
    GET DIAGNOSTICS v_task_count = ROW_COUNT;
    RAISE NOTICE 'Generated % tasks for ticket %', v_task_count, NEW.id;
  ELSE
    RAISE NOTICE 'No template found for product % with service type %, ticket created without tasks', NEW.product_id, NEW.warranty_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: trigger_generate_ticket_tasks
-- =====================================================
-- Executes generate_ticket_tasks() after each ticket insert

DROP TRIGGER IF EXISTS trigger_generate_ticket_tasks ON service_tickets;

CREATE TRIGGER trigger_generate_ticket_tasks
  AFTER INSERT ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_tasks();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION generate_ticket_tasks() IS
'Automatically generates tasks for service tickets based on task templates.
Matches templates by product_id and service_type (warranty_type in tickets).
Idempotent - will not create duplicate tasks if called multiple times.';

COMMENT ON TRIGGER trigger_generate_ticket_tasks ON service_tickets IS
'Automatically generates workflow tasks when a new service ticket is created';
