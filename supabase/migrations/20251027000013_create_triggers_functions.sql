-- =====================================================
-- Migration: Create Triggers and Functions
-- Description: Automation for stock management
-- Date: 2025-01-27
-- =====================================================

-- =====================================================
-- TRIGGER: Update serial count on receipt
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_receipt_item_serial_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stock_receipt_items
  SET
    serial_count = (
      SELECT COUNT(*)
      FROM stock_receipt_serials
      WHERE receipt_item_id = COALESCE(NEW.receipt_item_id, OLD.receipt_item_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.receipt_item_id, OLD.receipt_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receipt_item_serial_count_insert
  AFTER INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_item_serial_count();

CREATE TRIGGER trigger_update_receipt_item_serial_count_delete
  AFTER DELETE ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_item_serial_count();

-- =====================================================
-- TRIGGER: Process stock receipt completion
-- =====================================================
CREATE OR REPLACE FUNCTION public.process_stock_receipt_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update product_warehouse_stock declared quantities
    INSERT INTO product_warehouse_stock (
      product_id,
      virtual_warehouse_type,
      physical_warehouse_id,
      declared_quantity
    )
    SELECT
      sri.product_id,
      NEW.virtual_warehouse_type,
      NEW.physical_warehouse_id,
      SUM(sri.declared_quantity)
    FROM stock_receipt_items sri
    WHERE sri.receipt_id = NEW.id
    GROUP BY sri.product_id
    ON CONFLICT (product_id, virtual_warehouse_type, physical_warehouse_id)
    DO UPDATE SET
      declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
      updated_at = NOW();

    -- Create physical_products records for serials
    INSERT INTO physical_products (
      product_id,
      serial_number,
      condition,
      virtual_warehouse_type,
      physical_warehouse_id,
      warranty_start_date,
      warranty_months
    )
    SELECT
      sri.product_id,
      srs.serial_number,
      'new',
      NEW.virtual_warehouse_type,
      NEW.physical_warehouse_id,
      COALESCE(srs.warranty_start_date, sri.warranty_start_date),
      COALESCE(srs.warranty_months, sri.warranty_months)
    FROM stock_receipt_items sri
    JOIN stock_receipt_serials srs ON srs.receipt_item_id = sri.id
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (serial_number) DO NOTHING;

    -- Link serials to physical_products
    UPDATE stock_receipt_serials srs
    SET physical_product_id = pp.id
    FROM stock_receipt_items sri
    JOIN physical_products pp ON pp.serial_number = srs.serial_number
    WHERE srs.receipt_item_id = sri.id
      AND sri.receipt_id = NEW.id
      AND srs.physical_product_id IS NULL;

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_stock_receipt_completion
  BEFORE UPDATE ON public.stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_stock_receipt_completion();

-- =====================================================
-- TRIGGER: Process stock issue completion
-- =====================================================
CREATE OR REPLACE FUNCTION public.process_stock_issue_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Decrease declared quantities
    UPDATE product_warehouse_stock pws
    SET
      declared_quantity = GREATEST(0, pws.declared_quantity - issued.qty),
      updated_at = NOW()
    FROM (
      SELECT product_id, SUM(quantity) as qty
      FROM stock_issue_items
      WHERE issue_id = NEW.id
      GROUP BY product_id
    ) issued
    WHERE pws.product_id = issued.product_id
      AND pws.virtual_warehouse_type = NEW.virtual_warehouse_type
      AND (pws.physical_warehouse_id = NEW.physical_warehouse_id
           OR (pws.physical_warehouse_id IS NULL AND NEW.physical_warehouse_id IS NULL));

    -- Update physical_products location based on issue type
    UPDATE physical_products pp
    SET
      virtual_warehouse_type = CASE
        WHEN NEW.issue_type = 'disposal' THEN 'dead_stock'
        WHEN NEW.issue_type = 'warranty_return' THEN 'in_service'
        ELSE pp.virtual_warehouse_type
      END,
      current_ticket_id = CASE
        WHEN NEW.issue_type = 'warranty_return' THEN NEW.ticket_id
        ELSE pp.current_ticket_id
      END,
      updated_at = NOW()
    WHERE pp.id IN (
      SELECT sis.physical_product_id
      FROM stock_issue_serials sis
      JOIN stock_issue_items sii ON sii.id = sis.issue_item_id
      WHERE sii.issue_id = NEW.id
    );

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_stock_issue_completion
  BEFORE UPDATE ON public.stock_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.process_stock_issue_completion();

-- =====================================================
-- TRIGGER: Auto-generate stock issue from ticket
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_generate_stock_issue_from_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_id UUID;
  v_total_value DECIMAL(12,2);
  v_threshold DECIMAL(12,2) := 1000000;
  v_profile_id UUID;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF EXISTS (
      SELECT 1 FROM service_ticket_parts
      WHERE ticket_id = NEW.id AND quantity > 0
    ) THEN
      -- Get profile ID from assigned technician
      SELECT id INTO v_profile_id
      FROM profiles
      WHERE user_id = (SELECT user_id FROM profiles WHERE id = NEW.assigned_to_id LIMIT 1);

      -- Calculate total value
      SELECT COALESCE(SUM(stp.quantity * COALESCE(p.cost_price, 0)), 0)
      INTO v_total_value
      FROM service_ticket_parts stp
      LEFT JOIN parts p ON p.id = stp.part_id
      WHERE stp.ticket_id = NEW.id;

      -- Create stock issue
      INSERT INTO stock_issues (
        issue_type,
        status,
        virtual_warehouse_type,
        issue_date,
        ticket_id,
        created_by_id,
        auto_generated,
        auto_approve_threshold,
        notes
      ) VALUES (
        'parts_usage',
        CASE WHEN v_total_value < v_threshold THEN 'completed' ELSE 'pending_approval' END,
        'parts',
        CURRENT_DATE,
        NEW.id,
        COALESCE(NEW.assigned_to_id, v_profile_id),
        true,
        v_threshold,
        'Auto-generated from ticket ' || NEW.ticket_number
      )
      RETURNING id INTO v_issue_id;

      -- Create issue items
      INSERT INTO stock_issue_items (
        issue_id,
        product_id,
        quantity,
        unit_price
      )
      SELECT
        v_issue_id,
        stp.part_id,
        stp.quantity,
        COALESCE(p.cost_price, 0)
      FROM service_ticket_parts stp
      LEFT JOIN parts p ON p.id = stp.part_id
      WHERE stp.ticket_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_stock_issue
  AFTER UPDATE ON public.service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_stock_issue_from_ticket();
