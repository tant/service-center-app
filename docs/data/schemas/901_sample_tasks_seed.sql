-- =====================================================
-- 901_sample_tasks_seed.sql
-- =====================================================
-- Sample Task Types (Tasks table)
--
-- Defines reusable task definitions for common service center operations
-- Categories: Reception, Inspection, Verification, Diagnosis, Testing, 
--             Repair, Software, Data, Replacement, Warehouse, Logistics,
--             QC, Documentation, Communication, Waiting, Approval, 
--             Packaging, Delivery, Support, Cleaning, Maintenance, 
--             Service, Billing
--
-- ORDER: 900+ (Seed Data)
-- DEPENDENCIES: 202_task_and_warehouse.sql
-- =====================================================

-- Clear existing data (if any)
-- TRUNCATE public.tasks CASCADE;

-- =====================================================
-- RECEPTION & INITIAL INSPECTION
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Tiếp nhận sản phẩm', 'Nhận sản phẩm từ khách hàng, kiểm tra ngoại quan ban đầu, xác nhận serial number', 'Reception', 10, true, true, true),
('Kiểm tra ban đầu', 'Kiểm tra tình trạng bên ngoài, phụ kiện đi kèm, xác nhận không có hư hỏng vật lý', 'Inspection', 15, true, true, true),
('Chụp ảnh sản phẩm nhận', 'Chụp ảnh sản phẩm lúc nhận (6 mặt) để tránh tranh chấp sau này', 'Documentation', 5, false, true, true),
('Kiểm tra bảo hành', 'Kiểm tra serial number, ngày mua, tình trạng bảo hành còn hiệu lực', 'Verification', 5, true, false, true);

-- =====================================================
-- DIAGNOSIS & TESTING
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Chẩn đoán lỗi', 'Xác định nguyên nhân lỗi chính xác, phân loại loại lỗi (phần cứng/phần mềm)', 'Diagnosis', 30, true, false, true),
('Test phần cứng', 'Test CPU, RAM, VGA, SSD bằng công cụ chuyên dụng (GPU-Z, CrystalDiskMark, FurMark)', 'Testing', 20, true, false, true),
('Test phần mềm', 'Kiểm tra driver, firmware, hệ điều hành, cập nhật BIOS nếu cần', 'Testing', 15, true, false, true),
('Test stress', 'Test sản phẩm dưới tải nặng kéo dài (stress test) để phát hiện lỗi tiềm ẩn', 'Testing', 60, true, false, true),
('Báo giá sửa chữa', 'Tạo báo giá chi tiết chi phí sửa chữa cho khách hàng (áp dụng cho dịch vụ trả phí)', 'Quotation', 10, true, false, true);

-- =====================================================
-- REPAIR & MAINTENANCE
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Sửa chữa phần cứng', 'Hàn, sửa chữa bo mạch chính, thay thế linh kiện điện tử bị hỏng', 'Repair', 45, true, true, true),
('Thay linh kiện VGA', 'Thay thế các linh kiện VGA như fan, capacitor, HDMI port, power connector', 'Repair', 30, true, true, true),
('Cài đặt phần mềm', 'Cài đặt driver, firmware, cập nhật BIOS, cài đặt hệ điều hành', 'Software', 20, true, false, true),
('Backup dữ liệu', 'Sao lưu dữ liệu khách hàng trước khi tiến hành sửa chữa', 'Data', 30, true, false, true),
('Restore dữ liệu', 'Khôi phục dữ liệu khách hàng sau khi hoàn thành sửa chữa', 'Data', 30, true, false, true),
('Vệ sinh sản phẩm', 'Vệ sinh bụi bẩn, làm sạch sản phẩm bên trong và bên ngoài', 'Cleaning', 15, false, false, true),
('Thay keo tản nhiệt', 'Thay thermal paste cho VGA, CPU để cải thiện tản nhiệt', 'Maintenance', 10, false, false, true);

-- =====================================================
-- REPLACEMENT & WAREHOUSE OPERATIONS
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Thay thế sản phẩm', 'Thay thế toàn bộ sản phẩm bằng sản phẩm mới từ kho bảo hành', 'Replacement', 20, true, true, true),
('Xuất kho bảo hành', 'Xuất sản phẩm mới từ warranty_stock để thay thế cho khách hàng', 'Warehouse', 10, true, false, true),
('Nhập kho RMA', 'Chuyển sản phẩm lỗi vào kho rma_staging để chuẩn bị trả về nhà cung cấp', 'Warehouse', 10, true, true, true),
('Tạo lô RMA', 'Tạo một lô RMA mới để nhóm các sản phẩm lỗi chờ trả về nhà cung cấp', 'Documentation', 15, true, false, true),
('Chuẩn bị & Gửi lô RMA', 'Vệ sinh, sắp xếp, đóng gói và gửi các sản phẩm trong lô RMA về nhà cung cấp', 'Logistics', 30, true, true, true),
('Nhập kho hàng mới', 'Tạo GRN (Goods Receipt Note), nhập sản phẩm bảo hành mới vào kho', 'Warehouse', 30, true, false, true),
('Nhập serial number', 'Nhập serial number cho từng sản phẩm trong GRN (Goods Receipt Note)', 'Warehouse', 45, true, false, true),
('Kiểm kê kho', 'Kiểm kê định kỳ tồn kho, đối chiếu số liệu thực tế với hệ thống', 'Warehouse', 120, true, false, true),
('Chuyển kho', 'Chuyển sản phẩm giữa các kho vật lý khác nhau', 'Warehouse', 15, true, false, true);

-- =====================================================
-- QUALITY CONTROL
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Kiểm tra sau sửa', 'Test sản phẩm sau khi hoàn thành sửa chữa để đảm bảo hoạt động tốt', 'QC', 20, true, false, true),
('Test ổn định', 'Test sản phẩm chạy ổn định trong 30 phút để phát hiện lỗi tiềm ẩn', 'QC', 30, true, false, true),
('Kiểm tra cuối cùng', 'Kiểm tra toàn diện sản phẩm trước khi giao lại cho khách hàng', 'QC', 15, true, true, true),
('Chụp ảnh kết quả', 'Chụp ảnh sản phẩm sau sửa chữa, kết quả test để lưu hồ sơ', 'Documentation', 5, false, true, true);

-- =====================================================
-- DELIVERY & CUSTOMER COMMUNICATION
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Thông báo khách hàng', 'Gọi điện hoặc nhắn tin thông báo khách hàng về tình trạng sản phẩm', 'Communication', 5, true, false, true),
('Đóng gói sản phẩm', 'Đóng gói cẩn thận sản phẩm, đính kèm phụ kiện và hướng dẫn', 'Packaging', 10, false, false, true),
('Giao hàng', 'Giao sản phẩm cho khách hàng, thu tiền (nếu có), xác nhận hoàn thành', 'Delivery', 15, true, false, true),
('Hướng dẫn sử dụng', 'Hướng dẫn khách hàng cách sử dụng, bảo quản sản phẩm đúng cách', 'Support', 10, false, false, true);

-- =====================================================
-- WAITING & APPROVAL STATES
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Chờ phụ tùng', 'Đánh dấu trạng thái đang chờ linh kiện, phụ tùng về để tiếp tục sửa chữa', 'Waiting', NULL, true, false, true),
('Chờ phê duyệt', 'Chờ manager phê duyệt báo giá sửa chữa hoặc thay thế sản phẩm', 'Approval', NULL, true, false, true),
('Liên hệ nhà cung cấp', 'Liên hệ ZOTAC, SSTC hoặc nhà cung cấp khác về bảo hành, RMA, linh kiện', 'Communication', 15, true, false, true),
('Chờ khách quyết định', 'Chờ khách hàng xác nhận có đồng ý sửa chữa/thay thế hay không', 'Waiting', NULL, true, false, true),
('Yêu cầu thêm thông tin từ khách', 'Gửi yêu cầu (email/tin nhắn) cho khách hàng để làm rõ về tình trạng lỗi', 'Communication', 5, true, false, true),
('Chờ phản hồi từ khách', 'Đánh dấu ticket tạm dừng để chờ thông tin phản hồi từ khách hàng', 'Waiting', NULL, true, false, true);

-- =====================================================
-- ADDITIONAL SERVICES & BILLING
-- =====================================================

INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active) VALUES
('Nâng cấp theo yêu cầu', 'Thực hiện các yêu cầu nâng cấp (thêm RAM, đổi SSD) không thuộc bảo hành', 'Service', 30, true, true, true),
('Tạo hóa đơn dịch vụ', 'Tạo và xuất hóa đơn chi tiết cho các dịch vụ sửa chữa có tính phí', 'Billing', 10, true, false, true);

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total: 41 tasks
-- Categories breakdown:
--   Reception: 1, Inspection: 1, Documentation: 2, Verification: 1
--   Diagnosis: 1, Testing: 3, Quotation: 1
--   Repair: 2, Software: 1, Data: 2, Cleaning: 1, Maintenance: 1
--   Replacement: 1, Warehouse: 6, Logistics: 1
--   QC: 4
--   Communication: 4, Packaging: 1, Delivery: 1, Support: 1
--   Waiting: 3, Approval: 1
--   Service: 1, Billing: 1
-- =====================================================
