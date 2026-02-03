-- =====================================================
-- 900_default_warehouse_seed.sql
-- =====================================================
-- Default Warehouse System Seed Data
--
-- Seeds:
-- - Default "Công ty" physical warehouse (system-managed)
-- - 7 system virtual warehouses (one per type)
-- - Restore UNIQUE constraint on warehouse_type
--
-- ORDER: 900-999 (Seed Data)
-- DEPENDENCIES: 202, 300
-- =====================================================

-- Step 1: Restore UNIQUE constraint on warehouse_type
-- (Was dropped in 15_virtual_warehouse_physical_link.sql but we need it for system warehouses)
ALTER TABLE public.virtual_warehouses
ADD CONSTRAINT virtual_warehouses_warehouse_type_unique UNIQUE (warehouse_type);

COMMENT ON CONSTRAINT virtual_warehouses_warehouse_type_unique ON public.virtual_warehouses IS 'Ensures one system virtual warehouse per type linked to default physical warehouse';

-- Step 2: Seed default "Công ty" physical warehouse
INSERT INTO public.physical_warehouses (
  name,
  code,
  location,
  description,
  is_active,
  is_system_default
)
VALUES (
  'Công ty',
  'COMPANY',
  'Trụ sở chính',
  'Kho mặc định của công ty, không thể xóa. Chứa tất cả các loại kho ảo.',
  true,
  true
)
ON CONFLICT (code) DO UPDATE SET
  is_system_default = true,
  description = 'Kho mặc định của công ty, không thể xóa. Chứa tất cả các loại kho ảo.'
WHERE physical_warehouses.code = 'COMPANY';

-- Step 3: Seed 7 system virtual warehouses
-- Link all virtual warehouses to the default "Công ty" physical warehouse
INSERT INTO public.virtual_warehouses (warehouse_type, name, description, physical_warehouse_id, is_archive)
SELECT
  v.warehouse_type,
  v.name,
  v.description,
  (SELECT id FROM public.physical_warehouses WHERE code = 'COMPANY' LIMIT 1),
  v.is_archive
FROM (VALUES
  ('main'::warehouse_type, 'Kho Chính', 'Kho hàng chính, quản lý hàng hóa tồn kho thông thường', FALSE),
  ('warranty_stock'::warehouse_type, 'Kho Bảo Hành', 'Hàng hóa còn bảo hành, sẵn sàng để thay thế cho khách hàng', FALSE),
  ('rma_staging'::warehouse_type, 'Kho Chờ Trả Hàng', 'Sản phẩm chờ trả lại nhà cung cấp hoặc nhà sản xuất', TRUE),
  ('dead_stock'::warehouse_type, 'Kho Hàng Hỏng', 'Sản phẩm hỏng không sửa được, dùng để tháo linh kiện hoặc thanh lý', TRUE),
  ('in_service'::warehouse_type, 'Kho Đang Sửa Chữa', 'Sản phẩm đang trong quá trình bảo hành hoặc sửa chữa', FALSE),
  ('parts'::warehouse_type, 'Kho Linh Kiện', 'Linh kiện thay thế và phụ tùng', FALSE),
  ('customer_installed'::warehouse_type, 'Hàng Đã Bán', 'Sản phẩm đã bán và đang lắp đặt tại địa điểm khách hàng', TRUE)
) AS v(warehouse_type, name, description, is_archive)
ON CONFLICT (warehouse_type) DO UPDATE SET is_archive = EXCLUDED.is_archive;

-- Display result
SELECT 'Default Warehouse System: Created ' ||
  (SELECT COUNT(*) FROM public.physical_warehouses WHERE is_system_default = true)::TEXT ||
  ' default physical warehouse and ' ||
  (SELECT COUNT(*) FROM public.virtual_warehouses)::TEXT ||
  ' virtual warehouses';
