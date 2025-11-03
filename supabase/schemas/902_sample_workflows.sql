-- =====================================================
-- 902_sample_workflows.sql
-- =====================================================
-- Sample Workflow Templates with Tasks
--
-- Defines 10 common service workflows for the service center:
-- 1. Sửa chữa VGA - Thay linh kiện (Repair with Parts)
-- 2. Thay thế VGA - Xuất kho bảo hành (Replacement with Physical Products)
-- 3. Sửa chữa SSD - Lỗi phần mềm (Software Fix)
-- 4. Thay thế SSD - Lỗi phần cứng (Replacement)
-- 5. Sửa chữa VGA - Chờ linh kiện (Repair with Parts Waiting)
-- 6. Sửa chữa ngoài bảo hành - Trả phí (Paid Repair Service)
-- 7. RMA - Trả hàng nhà cung cấp (Return to Supplier)
-- 8. Nâng cấp sản phẩm - Dịch vụ thêm (Upgrade Service)
-- 9. Yêu cầu thông tin - Chờ phản hồi khách (Information Request)
-- 10. Kiểm tra nhanh - Không có lỗi (Quick Check)
--
-- ORDER: 900+ (Seed Data)
-- DEPENDENCIES: 901_sample_tasks_seed.sql
-- 
-- NOTE: This script uses subqueries to dynamically look up task IDs and profile IDs
--       You may need to adjust the WHERE clauses if your data differs
-- =====================================================

-- =====================================================
-- HELPER: Get Task ID by Name
-- =====================================================
-- Usage: (SELECT id FROM public.tasks WHERE name = 'Task Name')

-- =====================================================
-- HELPER: Get Admin/Manager Profile
-- =====================================================
-- We'll use the first admin profile found, or you can specify a specific user
-- (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)

-- =====================================================
-- WORKFLOW 1: Sửa chữa VGA - Thay linh kiện
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  -- Get a creator (first admin or manager)
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  
  -- If no admin/manager found, skip this workflow
  IF v_creator_id IS NULL THEN
    RAISE NOTICE 'No admin or manager profile found. Skipping workflow creation.';
    RETURN;
  END IF;

  -- Create workflow
  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Sửa chữa VGA - Thay linh kiện',
    'Quy trình sửa chữa card đồ họa bằng cách thay thế linh kiện hỏng (fan, capacitor, HDMI port). Áp dụng cho các lỗi phần cứng nhỏ có thể sửa được.',
    'warranty',
    false,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  -- Add tasks to workflow
  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, 'Kiểm tra số serial, phụ kiện đi kèm'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh sản phẩm nhận'), 3, false, 'Chụp 6 mặt sản phẩm để tránh tranh chấp'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 5, true, 'Ghi rõ nguyên nhân lỗi, linh kiện hỏng'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 6, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Sửa chữa phần cứng'), 7, true, 'Hàn linh kiện điện tử, sửa chữa bo mạch'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay linh kiện VGA'), 8, true, 'Cập nhật parts đã sử dụng vào ticket'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vệ sinh sản phẩm'), 9, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay keo tản nhiệt'), 10, false, 'Chỉ thay nếu keo cũ khô/hỏng'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 11, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test ổn định'), 12, false, 'Chạy stress test 30 phút để đảm bảo ổn định'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 13, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh kết quả'), 14, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 15, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 16, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 17, true, NULL);

  RAISE NOTICE 'Workflow 1 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 2: Thay thế VGA - Xuất kho bảo hành
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Thay thế VGA - Xuất kho bảo hành',
    'Quy trình thay thế toàn bộ card đồ họa bằng sản phẩm mới từ kho bảo hành. Áp dụng khi lỗi quá nặng không thể sửa (chip chết, PCB cháy). Sản phẩm lỗi sẽ được chuyển vào kho RMA.',
    'warranty',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh sản phẩm nhận'), 3, true, 'Chụp chi tiết lỗi để phục vụ RMA'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 5, true, 'Xác định chính xác lỗi để yêu cầu RMA'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 6, true, 'Chạy đầy đủ test để có bằng chứng lỗi'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ phê duyệt'), 7, true, 'Manager phê duyệt thay thế và RMA'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay thế sản phẩm'), 8, true, 'Chọn VGA mới từ kho warranty_stock'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Xuất kho bảo hành'), 9, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Nhập kho RMA'), 10, true, 'Chuyển VGA lỗi vào rma_staging'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 11, true, 'Test VGA mới trước khi giao khách'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 12, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh kết quả'), 13, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 14, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 15, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 16, true, NULL);

  RAISE NOTICE 'Workflow 2 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 3: Sửa chữa SSD - Lỗi phần mềm
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Sửa chữa SSD - Lỗi phần mềm',
    'Quy trình sửa chữa SSD có lỗi firmware, driver, cần backup/restore dữ liệu. Không cần thay linh kiện phần cứng.',
    'warranty',
    false,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 3, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần mềm'), 6, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Backup dữ liệu'), 7, true, 'Sao lưu dữ liệu khách trước khi sửa'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Cài đặt phần mềm'), 8, true, 'Cập nhật firmware, driver'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Restore dữ liệu'), 9, true, 'Khôi phục dữ liệu'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 10, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test ổn định'), 11, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 12, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 13, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 14, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 15, true, NULL);

  RAISE NOTICE 'Workflow 3 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 4: Thay thế SSD - Lỗi phần cứng
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Thay thế SSD - Lỗi phần cứng',
    'Quy trình thay thế SSD có lỗi phần cứng không thể sửa (chip chết, PCB hỏng). Cố gắng backup dữ liệu nếu có thể.',
    'warranty',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 3, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Backup dữ liệu'), 6, false, 'Cố gắng cứu dữ liệu nếu có thể'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ phê duyệt'), 7, true, 'Manager phê duyệt thay thế'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay thế sản phẩm'), 8, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Xuất kho bảo hành'), 9, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Nhập kho RMA'), 10, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Restore dữ liệu'), 11, false, 'Restore vào SSD mới nếu có backup'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 12, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test ổn định'), 13, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 14, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 15, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 16, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 17, true, NULL);

  RAISE NOTICE 'Workflow 4 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 5: Sửa chữa VGA - Chờ linh kiện
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Sửa chữa VGA - Chờ linh kiện',
    'Quy trình sửa chữa VGA khi linh kiện chưa có trong kho, phải đặt hàng và chờ. Ticket sẽ tạm dừng cho đến khi linh kiện về.',
    'warranty',
    false,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh sản phẩm nhận'), 3, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 6, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Liên hệ nhà cung cấp'), 7, true, 'Đặt hàng linh kiện'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ phụ tùng'), 8, true, 'Đánh dấu đang chờ linh kiện về'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 9, true, 'Báo khách thời gian chờ dự kiến'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Sửa chữa phần cứng'), 10, true, 'Thực hiện sau khi linh kiện về'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay linh kiện VGA'), 11, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vệ sinh sản phẩm'), 12, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 13, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test ổn định'), 14, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 15, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 16, true, 'Thông báo sản phẩm đã xong'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 17, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 18, true, NULL);

  RAISE NOTICE 'Workflow 5 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 6: Sửa chữa ngoài bảo hành - Trả phí
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Sửa chữa ngoài bảo hành - Trả phí',
    'Quy trình sửa chữa sản phẩm hết bảo hành hoặc lỗi do người dùng. Cần báo giá và chờ khách đồng ý trước khi sửa.',
    'paid',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh sản phẩm nhận'), 3, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 4, true, 'Xác nhận hết bảo hành'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 6, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Báo giá sửa chữa'), 7, true, 'Tạo báo giá chi tiết'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 8, true, 'Gửi báo giá'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ khách quyết định'), 9, true, 'Chờ xác nhận có sửa hay không'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Sửa chữa phần cứng'), 10, true, 'Nếu khách đồng ý'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay linh kiện VGA'), 11, false, 'Nếu cần thay linh kiện'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vệ sinh sản phẩm'), 12, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay keo tản nhiệt'), 13, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 14, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test ổn định'), 15, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 16, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh kết quả'), 17, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tạo hóa đơn dịch vụ'), 18, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 19, true, 'Thông báo hoàn thành'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 20, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 21, true, 'Thu tiền');

  RAISE NOTICE 'Workflow 6 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 7: RMA - Trả hàng nhà cung cấp
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'RMA - Trả hàng nhà cung cấp',
    'Quy trình xử lý sản phẩm lỗi nghiêm trọng, trả về nhà cung cấp. Thay sản phẩm mới cho khách trước, sau đó xử lý RMA.',
    'replacement',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh sản phẩm nhận'), 3, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 6, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test stress'), 7, true, 'Test kỹ để xác nhận lỗi'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ phê duyệt'), 8, true, 'Manager phê duyệt RMA'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay thế sản phẩm'), 9, true, 'Thay sản phẩm mới cho khách trước'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Xuất kho bảo hành'), 10, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Nhập kho RMA'), 11, true, 'Chuyển sản phẩm lỗi vào rma_staging'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tạo lô RMA'), 12, true, 'Tạo RMA batch để nhóm sản phẩm'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vệ sinh sản phẩm'), 13, true, 'Vệ sinh sản phẩm lỗi trước khi trả'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chuẩn bị & Gửi lô RMA'), 14, true, 'Đóng gói, gửi về nhà cung cấp'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 15, true, 'Kiểm tra sản phẩm mới cho khách'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 16, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 17, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 18, true, NULL);

  RAISE NOTICE 'Workflow 7 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 8: Nâng cấp sản phẩm - Dịch vụ thêm
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Nâng cấp sản phẩm - Dịch vụ thêm',
    'Quy trình nâng cấp sản phẩm theo yêu cầu khách hàng (thêm RAM, đổi SSD lớn hơn). Không liên quan đến bảo hành.',
    'paid',
    false,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh sản phẩm nhận'), 3, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 4, true, 'Test trước khi nâng cấp'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Backup dữ liệu'), 5, true, 'Backup dữ liệu khách'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Báo giá sửa chữa'), 6, true, 'Báo giá nâng cấp'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 7, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ khách quyết định'), 8, true, 'Chờ xác nhận'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Nâng cấp theo yêu cầu'), 9, true, 'Thay RAM, SSD...'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Cài đặt phần mềm'), 10, true, 'Cài driver, OS'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Restore dữ liệu'), 11, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vệ sinh sản phẩm'), 12, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay keo tản nhiệt'), 13, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 14, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test ổn định'), 15, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 16, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh kết quả'), 17, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tạo hóa đơn dịch vụ'), 18, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 19, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Hướng dẫn sử dụng'), 20, false, 'Hướng dẫn tính năng mới'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 21, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 22, true, NULL);

  RAISE NOTICE 'Workflow 8 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 9: Yêu cầu thông tin - Chờ phản hồi khách
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Yêu cầu thông tin - Chờ phản hồi khách',
    'Quy trình xử lý khi cần thêm thông tin từ khách để chẩn đoán (mật khẩu, mô tả chi tiết lỗi, hình ảnh). Ticket tạm dừng chờ phản hồi.',
    'warranty',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 3, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 4, true, 'Phát hiện cần thêm thông tin'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Yêu cầu thêm thông tin từ khách'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chờ phản hồi từ khách'), 6, true, 'Tạm dừng ticket'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 7, true, 'Chẩn đoán lại sau khi có thông tin'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 8, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Sửa chữa phần cứng'), 9, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra sau sửa'), 10, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 11, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 12, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 13, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 14, true, NULL);

  RAISE NOTICE 'Workflow 9 created: %', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 10: Kiểm tra nhanh - Không có lỗi
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, service_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Kiểm tra nhanh - Không có lỗi',
    'Quy trình kiểm tra khi khách báo lỗi nhưng sản phẩm hoạt động bình thường. Vệ sinh, test kỹ và hướng dẫn sử dụng đúng cách.',
    'warranty',
    false,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tiếp nhận sản phẩm'), 1, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra ban đầu'), 2, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra bảo hành'), 3, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chẩn đoán lỗi'), 4, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần cứng'), 5, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test phần mềm'), 6, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Test stress'), 7, false, 'Test kỹ để xác nhận không có lỗi'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vệ sinh sản phẩm'), 8, false, 'Vệ sinh kỹ cho khách'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thay keo tản nhiệt'), 9, false, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra cuối cùng'), 10, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chụp ảnh kết quả'), 11, false, 'Chụp kết quả test'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Thông báo khách hàng'), 12, true, 'Báo không phát hiện lỗi'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Hướng dẫn sử dụng'), 13, false, 'Hướng dẫn cách sử dụng đúng'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm'), 14, true, NULL),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Giao hàng'), 15, true, NULL);

  RAISE NOTICE 'Workflow 10 created: %', v_workflow_id;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total: 10 workflows created
-- 
-- Workflow Types:
--   - Warranty Service: 6 workflows (1, 2, 3, 4, 5, 9, 10)
--   - Paid Service: 2 workflows (6, 8)
--   - Replacement: 1 workflow (7)
--
-- Strict Sequence:
--   - Required (true): 6 workflows (2, 4, 6, 7, 9)
--   - Flexible (false): 4 workflows (1, 3, 5, 8, 10)
--
-- Average Tasks per Workflow: 16.5 tasks
-- =====================================================
