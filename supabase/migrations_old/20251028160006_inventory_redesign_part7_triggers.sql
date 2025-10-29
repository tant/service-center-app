-- =====================================================
-- Migration: Inventory Redesign Part 7 - Auto-Generation Triggers
-- Description: Create triggers to auto-generate issue/receipt for transfers
-- Date: 2025-10-28
-- =====================================================

-- Function: Auto-generate issue and receipt when transfer is approved
CREATE OR REPLACE FUNCTION public.auto_generate_transfer_documents()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_id UUID;
  v_receipt_id UUID;
  v_transfer_item RECORD;
BEGIN
  -- Only proceed if status changed to 'approved' and documents not yet generated
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.generated_issue_id IS NULL THEN

    -- 1. Create Issue Document (Phiếu Xuất - from source warehouse)
    INSERT INTO public.stock_issues (
      issue_type,
      status,
      virtual_warehouse_id,
      issue_date,
      reference_document_number,
      created_by_id,
      approved_by_id,
      approved_at,
      auto_generated,
      notes
    ) VALUES (
      'normal',
      'approved',  -- Auto-approved
      NEW.from_virtual_warehouse_id,
      NEW.transfer_date,
      'PC-' || NEW.transfer_number,
      NEW.created_by_id,
      NEW.approved_by_id,
      NEW.approved_at,
      true,
      'Phiếu xuất tự động từ phiếu chuyển kho ' || NEW.transfer_number
    ) RETURNING id INTO v_issue_id;

    -- 2. Create Receipt Document (Phiếu Nhập - to destination warehouse)
    INSERT INTO public.stock_receipts (
      receipt_type,
      status,
      virtual_warehouse_id,
      receipt_date,
      reference_document_number,
      created_by_id,
      approved_by_id,
      approved_at,
      notes
    ) VALUES (
      'normal',
      'approved',  -- Auto-approved
      NEW.to_virtual_warehouse_id,
      NEW.transfer_date,
      'PC-' || NEW.transfer_number,
      NEW.created_by_id,
      NEW.approved_by_id,
      NEW.approved_at,
      'Phiếu nhập tự động từ phiếu chuyển kho ' || NEW.transfer_number
    ) RETURNING id INTO v_receipt_id;

    -- 3. Copy items from transfer to issue and receipt
    FOR v_transfer_item IN
      SELECT product_id, quantity, notes
      FROM public.stock_transfer_items
      WHERE transfer_id = NEW.id
    LOOP
      -- Create issue item
      INSERT INTO public.stock_issue_items (
        issue_id,
        product_id,
        quantity,
        notes
      ) VALUES (
        v_issue_id,
        v_transfer_item.product_id,
        v_transfer_item.quantity,
        v_transfer_item.notes
      );

      -- Create receipt item
      INSERT INTO public.stock_receipt_items (
        receipt_id,
        product_id,
        declared_quantity,
        notes
      ) VALUES (
        v_receipt_id,
        v_transfer_item.product_id,
        v_transfer_item.quantity,
        v_transfer_item.notes
      );
    END LOOP;

    -- 4. Copy serials from transfer to issue and receipt
    INSERT INTO public.stock_issue_serials (issue_item_id, physical_product_id, serial_number)
    SELECT
      sii.id,
      sts.physical_product_id,
      sts.serial_number
    FROM public.stock_transfer_serials sts
    JOIN public.stock_transfer_items sti ON sts.transfer_item_id = sti.id
    JOIN public.stock_issue_items sii ON sii.issue_id = v_issue_id AND sii.product_id = sti.product_id
    WHERE sti.transfer_id = NEW.id;

    INSERT INTO public.stock_receipt_serials (receipt_item_id, serial_number, physical_product_id)
    SELECT
      sri.id,
      sts.serial_number,
      sts.physical_product_id
    FROM public.stock_transfer_serials sts
    JOIN public.stock_transfer_items sti ON sts.transfer_item_id = sti.id
    JOIN public.stock_receipt_items sri ON sri.receipt_id = v_receipt_id AND sri.product_id = sti.product_id
    WHERE sti.transfer_id = NEW.id;

    -- 5. Update transfer with generated document IDs
    NEW.generated_issue_id := v_issue_id;
    NEW.generated_receipt_id := v_receipt_id;

    RAISE NOTICE 'Auto-generated documents for transfer %: Issue=%, Receipt=%',
      NEW.transfer_number, v_issue_id, v_receipt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_generate_transfer_documents() IS
  'Automatically creates issue and receipt documents when transfer is approved';

-- Trigger: Execute auto-generation on transfer approval
CREATE TRIGGER trigger_auto_generate_transfer_documents
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.auto_generate_transfer_documents();

COMMENT ON TRIGGER trigger_auto_generate_transfer_documents ON public.stock_transfers IS
  'Auto-generate issue and receipt when transfer status changes to approved';

-- Function: Auto-complete generated documents when transfer completes
CREATE OR REPLACE FUNCTION public.auto_complete_transfer_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- When transfer is completed, also complete the generated issue and receipt
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    -- Complete the issue document
    IF NEW.generated_issue_id IS NOT NULL THEN
      UPDATE public.stock_issues
      SET
        status = 'completed',
        completed_by_id = NEW.received_by_id,
        completed_at = NEW.completed_at
      WHERE id = NEW.generated_issue_id;
    END IF;

    -- Complete the receipt document
    IF NEW.generated_receipt_id IS NOT NULL THEN
      UPDATE public.stock_receipts
      SET
        status = 'completed',
        completed_by_id = NEW.received_by_id,
        completed_at = NEW.completed_at
      WHERE id = NEW.generated_receipt_id;
    END IF;

    RAISE NOTICE 'Auto-completed documents for transfer %', NEW.transfer_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_complete_transfer_documents() IS
  'Automatically completes generated issue and receipt when transfer is completed';

-- Trigger: Execute auto-completion on transfer completion
CREATE TRIGGER trigger_auto_complete_transfer_documents
  AFTER UPDATE ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.auto_complete_transfer_documents();

COMMENT ON TRIGGER trigger_auto_complete_transfer_documents ON public.stock_transfers IS
  'Auto-complete generated documents when transfer is completed';

SELECT 'Part 7 Complete: Auto-generation triggers created' as status;
