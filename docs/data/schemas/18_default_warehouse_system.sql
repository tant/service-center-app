-- =====================================================
-- 18_default_warehouse_system.sql
-- =====================================================
-- Default Warehouse System
-- Creates system default "Công ty" physical warehouse
-- and 7 system virtual warehouses (one per type)
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
INSERT INTO public.virtual_warehouses (warehouse_type, name, description, physical_warehouse_id)
SELECT
  v.warehouse_type,
  v.name,
  v.description,
  (SELECT id FROM public.physical_warehouses WHERE code = 'COMPANY' LIMIT 1)
FROM (VALUES
  ('main'::warehouse_type, 'Main', 'Kho Chính — Default main virtual warehouse for a physical warehouse'),
  ('warranty_stock'::warehouse_type, 'Warranty Stock', 'Products under active warranty available for replacement'),
  ('rma_staging'::warehouse_type, 'RMA Staging Area', 'Products awaiting return to supplier or manufacturer'),
  ('dead_stock'::warehouse_type, 'Dead Stock', 'Non-functional products for parts harvesting or disposal'),
  ('in_service'::warehouse_type, 'In Service', 'Products currently being serviced or repaired'),
  ('parts'::warehouse_type, 'Parts Inventory', 'Replacement parts and components inventory'),
  ('customer_installed'::warehouse_type, 'Customer Installed', 'Hàng đã bán — Products sold and currently installed at customer sites')
) AS v(warehouse_type, name, description)
ON CONFLICT (warehouse_type) DO NOTHING;

-- Display result
SELECT 'Default Warehouse System: Created ' ||
  (SELECT COUNT(*) FROM public.physical_warehouses WHERE is_system_default = true)::TEXT ||
  ' default physical warehouse and ' ||
  (SELECT COUNT(*) FROM public.virtual_warehouses)::TEXT ||
  ' virtual warehouses';
