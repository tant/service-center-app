-- =====================================================
-- 610_migrate_sold_products_to_customer_installed.sql
-- =====================================================
-- One-time migration script to move existing sold products
-- to customer_installed warehouse.
--
-- Run this AFTER applying the updated 600_stock_triggers.sql
-- This migrates historical data that was issued with reason='sale'
-- but wasn't moved to customer_installed warehouse.
--
-- IMPORTANT: Review and run manually - this is a data migration!
-- =====================================================

-- Step 1: Preview affected records (run this first to review)
/*
SELECT
  pp.id,
  pp.serial_number,
  pp.status,
  pp.virtual_warehouse_id,
  vw.name as current_warehouse,
  si.issue_reason,
  si.customer_id,
  c.name as customer_name
FROM physical_products pp
JOIN stock_issue_serials siis ON siis.physical_product_id = pp.id
JOIN stock_issue_items sii ON siis.issue_item_id = sii.id
JOIN stock_issues si ON sii.issue_id = si.id
LEFT JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
LEFT JOIN customers c ON si.customer_id = c.id
WHERE si.issue_reason = 'sale'
  AND pp.status = 'issued'
  AND vw.warehouse_type != 'customer_installed';
*/

-- Step 2: Run the migration
DO $$
DECLARE
  v_customer_installed_id UUID;
  v_affected_count INT;
BEGIN
  -- Get customer_installed warehouse ID
  SELECT id INTO v_customer_installed_id
  FROM virtual_warehouses
  WHERE warehouse_type = 'customer_installed'
    AND physical_warehouse_id IS NULL
  LIMIT 1;

  IF v_customer_installed_id IS NULL THEN
    RAISE EXCEPTION 'customer_installed warehouse not found';
  END IF;

  -- Update physical products and track customer
  WITH sold_products AS (
    SELECT DISTINCT
      pp.id as physical_product_id,
      pp.product_id,
      pp.virtual_warehouse_id as old_warehouse_id,
      si.customer_id
    FROM physical_products pp
    JOIN stock_issue_serials siis ON siis.physical_product_id = pp.id
    JOIN stock_issue_items sii ON siis.issue_item_id = sii.id
    JOIN stock_issues si ON sii.issue_id = si.id
    JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
    WHERE si.issue_reason = 'sale'
      AND pp.status = 'issued'
      AND vw.warehouse_type != 'customer_installed'
  ),
  updated_products AS (
    UPDATE physical_products pp
    SET
      previous_virtual_warehouse_id = sp.old_warehouse_id,
      virtual_warehouse_id = v_customer_installed_id,
      last_known_customer_id = COALESCE(sp.customer_id, pp.last_known_customer_id),
      updated_at = NOW()
    FROM sold_products sp
    WHERE pp.id = sp.physical_product_id
    RETURNING pp.id, pp.product_id, sp.old_warehouse_id
  )
  SELECT COUNT(*) INTO v_affected_count FROM updated_products;

  -- Update stock counts: decrease from old warehouses
  WITH sold_products AS (
    SELECT DISTINCT
      pp.product_id,
      pp.virtual_warehouse_id as old_warehouse_id
    FROM physical_products pp
    JOIN stock_issue_serials siis ON siis.physical_product_id = pp.id
    JOIN stock_issue_items sii ON siis.issue_item_id = sii.id
    JOIN stock_issues si ON sii.issue_id = si.id
    JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
    WHERE si.issue_reason = 'sale'
      AND pp.status = 'issued'
      AND vw.warehouse_type != 'customer_installed'
  ),
  stock_adjustments AS (
    SELECT product_id, old_warehouse_id, COUNT(*) as qty
    FROM sold_products
    GROUP BY product_id, old_warehouse_id
  )
  UPDATE product_warehouse_stock pws
  SET declared_quantity = declared_quantity - sa.qty,
      updated_at = NOW()
  FROM stock_adjustments sa
  WHERE pws.product_id = sa.product_id
    AND pws.virtual_warehouse_id = sa.old_warehouse_id;

  -- Update stock counts: increase at customer_installed
  WITH sold_products AS (
    SELECT pp.product_id, COUNT(*) as qty
    FROM physical_products pp
    JOIN stock_issue_serials siis ON siis.physical_product_id = pp.id
    JOIN stock_issue_items sii ON siis.issue_item_id = sii.id
    JOIN stock_issues si ON sii.issue_id = si.id
    WHERE si.issue_reason = 'sale'
      AND pp.status = 'issued'
      AND pp.virtual_warehouse_id = v_customer_installed_id
    GROUP BY pp.product_id
  )
  INSERT INTO product_warehouse_stock (product_id, virtual_warehouse_id, declared_quantity, initial_stock_entry)
  SELECT product_id, v_customer_installed_id, qty, 0
  FROM sold_products
  ON CONFLICT (product_id, virtual_warehouse_id)
  DO UPDATE SET
    declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
    updated_at = NOW();

  RAISE NOTICE 'Migration completed. Affected products: %', v_affected_count;
END;
$$;

-- Step 3: Verify migration (run after migration)
/*
SELECT
  vw.name as warehouse,
  COUNT(*) as product_count
FROM physical_products pp
JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
WHERE pp.status = 'issued'
GROUP BY vw.name
ORDER BY vw.name;
*/
