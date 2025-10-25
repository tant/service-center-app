-- Seed Data for Service Center
-- Default Task Types for Workflow Management
-- Created: 2025-10-23
-- Updated: Based on ZOTAC & SSTC Service Center workflow
-- Products: Graphics Cards, Mini PCs, SSDs, NVMe, RAM, Barebone PCs

-- =====================================================
-- CLEAR EXISTING DATA (for re-seeding)
-- =====================================================
-- Delete in correct order due to foreign keys
-- Using DO block to handle tables that may not exist yet
DO $$
BEGIN
    -- Only delete if tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_templates_tasks') THEN
        DELETE FROM public.task_templates_tasks;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_templates') THEN
        DELETE FROM public.task_templates;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_types') THEN
        DELETE FROM public.task_types;
    END IF;
END $$;

-- =====================================================
-- SEED DEFAULT TASK TYPES
-- =====================================================
-- Task types aligned with ZOTAC & SSTC workflow

-- Intake Category (Tiếp nhận)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Product Receiving', 'Tiếp nhận sản phẩm, ghi nhận phụ kiện, chụp ảnh bao bì', 'Intake', 10, true, true, true),
  ('Serial Verification', 'Xác minh số serial khớp với hồ sơ bảo hành', 'Intake', 5, true, true, true),
  ('Initial Inspection', 'Kiểm tra vật lý bên ngoài, seal, dấu hiệu va đập hoặc nước', 'Intake', 15, true, true, true),
  ('Customer Interview', 'Phỏng vấn khách hàng để thu thập thông tin chi tiết về sự cố (walk-in)', 'Intake', 20, true, false, true)
ON CONFLICT (name) DO NOTHING;

-- Diagnosis Category (Chẩn đoán)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Run Diagnostic Tests', 'Chạy các bài test chuyên sâu (GPU: Furmark, SSD: Crystal Disk, RAM: Memtest)', 'Diagnosis', 45, true, false, true),
  ('Identify Root Cause', 'Xác định nguyên nhân gốc rễ của sự cố', 'Diagnosis', 30, true, false, true),
  ('Component Testing', 'Test từng linh kiện riêng lẻ (quạt, VRAM, controller)', 'Diagnosis', 30, true, false, true),
  ('Warranty Check', 'Kiểm tra điều kiện bảo hành: thời hạn, seal, dấu hiệu lạm dụng', 'Diagnosis', 10, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Approval & Decision Category (Phê duyệt & Quyết định)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Manager Approval', 'Quản lý phê duyệt phương án xử lý (bảo hành/goodwill/trả phí)', 'Approval', 15, true, false, true),
  ('Quote Creation', 'Lập báo giá sửa chữa cho khách hàng (trường hợp hết BH)', 'Approval', 20, true, false, true),
  ('Customer Decision', 'Chờ khách hàng quyết định chấp nhận báo giá hoặc từ chối', 'Approval', 0, true, false, true)
ON CONFLICT (name) DO NOTHING;

-- Repair Category (Sửa chữa)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Replace Component', 'Thay thế linh kiện hỏng (quạt, thermal, capacitor)', 'Repair', 60, true, true, true),
  ('Repair Component', 'Sửa chữa linh kiện hiện có (hàn, thay chip)', 'Repair', 90, true, true, true),
  ('Clean/Service', 'Vệ sinh và bảo dưỡng sản phẩm', 'Repair', 30, true, false, true),
  ('Firmware Update', 'Cập nhật firmware/BIOS lên phiên bản mới nhất', 'Repair', 20, true, false, true)
ON CONFLICT (name) DO NOTHING;

-- Warehouse Category (Kho hàng - for replacement flow)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Warehouse Out', 'Xuất sản phẩm mới từ kho để đổi cho khách', 'Warehouse', 15, true, true, true),
  ('Warehouse In', 'Nhập sản phẩm lỗi vào kho để gửi RMA hãng', 'Warehouse', 15, true, true, true),
  ('RMA Processing', 'Xử lý yêu cầu RMA với nhà sản xuất (ZOTAC/SSTC)', 'Warehouse', 30, true, false, true)
ON CONFLICT (name) DO NOTHING;

-- QA Category (Kiểm tra chất lượng)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Quality Check', 'Kiểm tra chất lượng sửa chữa đạt tiêu chuẩn', 'QA', 20, true, true, true),
  ('Functional Test', 'Test toàn bộ chức năng đảm bảo hoạt động bình thường', 'QA', 45, true, false, true),
  ('Burn-In Test', 'Test ổn định dài hạn (GPU: stress 1-2h, SSD: write test)', 'QA', 90, true, false, true),
  ('Final Inspection', 'Kiểm tra cuối cùng trước khi trả khách', 'QA', 10, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Closing Category (Kết thúc)
INSERT INTO public.task_types (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
VALUES
  ('Customer Notification', 'Thông báo khách hàng sản phẩm đã sẵn sàng', 'Closing', 10, true, false, true),
  ('Payment Collection', 'Thu phí sửa chữa (trường hợp trả phí)', 'Closing', 15, true, false, true),
  ('Documentation Update', 'Cập nhật hồ sơ dịch vụ và thông tin bảo hành', 'Closing', 15, true, false, true),
  ('Package for Delivery', 'Đóng gói sản phẩm chuẩn bị giao cho khách', 'Closing', 10, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Display inserted count
SELECT 'Task Types Seeded: ' || COUNT(*)::TEXT || ' task types created'
FROM public.task_types;
