-- Story 1.6: Warehouse Hierarchy Setup
-- AC 2: Seed 5 default virtual warehouses
--
-- This migration is idempotent - safe to run multiple times
-- Uses ON CONFLICT to prevent duplicate inserts

-- Seed the 5 virtual warehouses with their respective types
INSERT INTO virtual_warehouses (warehouse_type, display_name, description, is_active, created_at, updated_at)
VALUES
  (
    'warranty_stock',
    'Warranty Stock',
    'Kho chứa sản phẩm bảo hành đang chờ xử lý hoặc đã sửa chữa xong',
    true,
    NOW(),
    NOW()
  ),
  (
    'rma_staging',
    'RMA Staging Area',
    'Khu vực tập kết sản phẩm trả lại từ khách hàng, chờ phân loại và xử lý',
    true,
    NOW(),
    NOW()
  ),
  (
    'dead_stock',
    'Dead Stock',
    'Kho chứa sản phẩm hỏng không thể sửa chữa, chờ thanh lý hoặc tiêu hủy',
    true,
    NOW(),
    NOW()
  ),
  (
    'in_service',
    'In Service',
    'Danh sách sản phẩm đang được khách hàng sử dụng (đã bàn giao)',
    true,
    NOW(),
    NOW()
  ),
  (
    'parts',
    'Parts Inventory',
    'Kho linh kiện và phụ tùng thay thế cho sửa chữa',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (warehouse_type) DO NOTHING;

-- Add comment for future reference
COMMENT ON TABLE virtual_warehouses IS
  'Story 1.6: Virtual warehouses represent logical inventory categories. Each warehouse_type can only have one virtual warehouse (enforced by unique constraint).';
