-- Seed Data for Service Center
-- Default Warehouse System
-- Created: 2025-10-30
-- Updated: 2025-10-31

-- =====================================================
-- DEFAULT WAREHOUSE SYSTEM
-- =====================================================
-- Seed default "Công ty" physical warehouse and 7 virtual warehouses

-- Seed default physical warehouse
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

-- Seed 7 system virtual warehouses linked to default warehouse
INSERT INTO public.virtual_warehouses (warehouse_type, name, description, physical_warehouse_id)
SELECT
  v.warehouse_type,
  v.name,
  v.description,
  (SELECT id FROM public.physical_warehouses WHERE code = 'COMPANY' LIMIT 1)
FROM (VALUES
  ('main'::warehouse_type, 'Kho Chính', 'Kho ảo chính mặc định cho kho vật lý'),
  ('warranty_stock'::warehouse_type, 'Kho Bảo Hành', 'Sản phẩm còn bảo hành, sẵn sàng để thay thế'),
  ('rma_staging'::warehouse_type, 'Khu Vực RMA', 'Sản phẩm chờ trả về nhà cung cấp hoặc nhà sản xuất'),
  ('dead_stock'::warehouse_type, 'Kho Hàng Hỏng', 'Sản phẩm hỏng không sử dụng được, chờ tháo linh kiện hoặc thanh lý'),
  ('in_service'::warehouse_type, 'Đang Sử Dụng', 'Sản phẩm đang được sửa chữa hoặc bảo trì'),
  ('parts'::warehouse_type, 'Kho Linh Kiện', 'Linh kiện thay thế và phụ tùng'),
  ('customer_installed'::warehouse_type, 'Hàng Đã Bán', 'Sản phẩm đã bán và đang ở địa điểm khách hàng')
) AS v(warehouse_type, name, description)
ON CONFLICT (warehouse_type) DO NOTHING;

-- Display warehouse seed results
SELECT 'Default Warehouse System: Created ' ||
  (SELECT COUNT(*) FROM public.physical_warehouses WHERE is_system_default = true)::TEXT ||
  ' default physical warehouse and ' ||
  (SELECT COUNT(*) FROM public.virtual_warehouses)::TEXT ||
  ' virtual warehouses';
