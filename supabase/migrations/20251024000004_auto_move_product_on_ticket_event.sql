-- =====================================================
-- Story 1.8: Serial Number Verification and Stock Movements
-- Auto-move products between warehouses based on ticket events
-- =====================================================

-- Function to automatically move products when ticket status changes
CREATE OR REPLACE FUNCTION auto_move_product_on_ticket_event()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_previous_warehouse warehouse_type;
BEGIN
  -- Only process if ticket has serial_number
  IF NEW.serial_number IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find product by serial number
  SELECT id, virtual_warehouse_type INTO v_product_id, v_previous_warehouse
  FROM physical_products
  WHERE serial_number = NEW.serial_number;

  IF v_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ticket created or in progress: move to In Service
  IF NEW.status IN ('pending', 'in_progress') AND (OLD IS NULL OR OLD.status != NEW.status) THEN
    -- Record movement
    INSERT INTO stock_movements (
      physical_product_id,
      movement_type,
      from_virtual_warehouse,
      to_virtual_warehouse,
      ticket_id,
      notes,
      moved_by_id
    ) VALUES (
      v_product_id,
      'assignment',
      v_previous_warehouse,
      'in_service',
      NEW.id,
      'Auto-moved to In Service (ticket ' || NEW.ticket_number || ')',
      NEW.created_by_id
    );

    -- Update product
    UPDATE physical_products
    SET virtual_warehouse_type = 'in_service',
        current_ticket_id = NEW.id
    WHERE id = v_product_id;
  END IF;

  -- Ticket completed: move back to previous warehouse
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    -- Get original warehouse (from last assignment movement)
    SELECT from_virtual_warehouse INTO v_previous_warehouse
    FROM stock_movements
    WHERE physical_product_id = v_product_id
      AND movement_type = 'assignment'
      AND ticket_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no previous warehouse found, default to warranty_stock
    IF v_previous_warehouse IS NULL THEN
      v_previous_warehouse := 'warranty_stock';
    END IF;

    -- Record movement
    INSERT INTO stock_movements (
      physical_product_id,
      movement_type,
      from_virtual_warehouse,
      to_virtual_warehouse,
      ticket_id,
      notes,
      moved_by_id
    ) VALUES (
      v_product_id,
      'return',
      'in_service',
      v_previous_warehouse,
      NEW.id,
      'Auto-moved from In Service (ticket ' || NEW.ticket_number || ' completed)',
      COALESCE(NEW.updated_by_id, NEW.created_by_id)
    );

    -- Update product
    UPDATE physical_products
    SET virtual_warehouse_type = v_previous_warehouse,
        current_ticket_id = NULL
    WHERE id = v_product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_move_product_on_ticket_event ON service_tickets;

CREATE TRIGGER trigger_auto_move_product_on_ticket_event
  AFTER INSERT OR UPDATE OF status, serial_number ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_move_product_on_ticket_event();

COMMENT ON FUNCTION auto_move_product_on_ticket_event() IS 'Automatically move products to/from In Service virtual warehouse based on ticket status';
