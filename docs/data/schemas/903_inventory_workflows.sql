-- =====================================================
-- 903_inventory_workflows.sql
-- =====================================================
-- Sample Workflow Templates for Inventory Operations
--
-- Defines workflows for:
-- 1. Inventory Receipt - Quality Check & Serial Entry
-- 2. Inventory Receipt - Fast Entry (No Serial)
-- 3. Inventory Issue - Standard Picking
-- 4. Inventory Issue - Customer Order Fulfillment
-- 5. Inventory Transfer - Standard Transfer
-- 6. Service Request - Customer Intake & Processing
--
-- ORDER: 900+ (Seed Data)
-- DEPENDENCIES: 901_sample_tasks_seed.sql, 202_task_and_warehouse.sql
-- =====================================================

-- =====================================================
-- WORKFLOW 1: Phiếu nhập kho - Kiểm tra chất lượng & Nhập serial
-- (Inventory Receipt - Quality Check & Serial Entry)
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
  v_task_id UUID;
BEGIN
  -- Get a creator (first admin or manager)
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE NOTICE 'No admin or manager profile found. Skipping inventory workflow creation.';
    RETURN;
  END IF;

  -- Create workflow for inventory receipt with quality check
  INSERT INTO public.workflows (name, description, entity_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Phiếu nhập kho - Kiểm tra & Nhập serial',
    'Quy trình nhập kho đầy đủ với kiểm tra chất lượng và nhập serial number cho sản phẩm có bảo hành. Áp dụng cho VGA, SSD, miniPC.',
    'inventory_receipt',
    true, -- Enforce sequence: must complete quality check before serial entry
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  -- Check if required tasks exist, create if not
  -- Task 1: Kiểm tra số lượng
  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES (
    'Kiểm tra số lượng hàng nhập',
    'Đếm và xác nhận số lượng sản phẩm nhận từ nhà cung cấp khớp với phiếu nhập',
    'inventory',
    10,
    true,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  -- Task 2: Kiểm tra chất lượng sản phẩm
  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES (
    'Kiểm tra chất lượng sản phẩm nhập',
    'Kiểm tra ngoại quan, phụ kiện, đóng gói. Loại bỏ sản phẩm hỏng hoặc không đạt chuẩn.',
    'inventory',
    15,
    true,
    true,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  -- Task 3: Nhập serial number
  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES (
    'Nhập serial number sản phẩm',
    'Quét hoặc nhập thủ công serial number cho từng sản phẩm vào hệ thống',
    'inventory',
    30,
    false,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  -- Task 4: Cập nhật vị trí kho
  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES (
    'Cập nhật vị trí lưu kho',
    'Sắp xếp sản phẩm vào kệ/vị trí và cập nhật vào hệ thống',
    'inventory',
    10,
    true,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  -- Add tasks to workflow
  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra số lượng hàng nhập'), 1, true, 'Đếm kỹ, ghi rõ số lượng thực tế nếu có sai lệch'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra chất lượng sản phẩm nhập'), 2, true, 'Chụp ảnh sản phẩm hỏng nếu có. Loại ra khỏi lô hàng nhập.'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Nhập serial number sản phẩm'), 3, true, 'Nhập serial sau khi phiếu đã được duyệt. Stock đã được cập nhật, serial entry không chặn workflow.'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Cập nhật vị trí lưu kho'), 4, false, 'Ghi rõ kệ/ngăn/vị trí để dễ tìm kiếm');

  RAISE NOTICE 'Inventory Workflow 1 created: % (Receipt - Quality Check & Serial)', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 2: Phiếu nhập kho - Nhập nhanh (Không serial)
-- (Inventory Receipt - Fast Entry without Serial)
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.workflows (name, description, entity_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Phiếu nhập kho - Nhập nhanh',
    'Quy trình nhập kho đơn giản cho sản phẩm không cần serial (linh kiện, phụ kiện, vật tư tiêu hao)',
    'inventory_receipt',
    false, -- No strict sequence required
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  -- Add tasks to workflow
  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra số lượng hàng nhập'), 1, true, 'Kiểm tra số lượng và tình trạng đóng gói'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Cập nhật vị trí lưu kho'), 2, false, 'Sắp xếp theo loại sản phẩm');

  RAISE NOTICE 'Inventory Workflow 2 created: % (Receipt - Fast Entry)', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 3: Phiếu xuất kho - Lấy hàng chuẩn
-- (Inventory Issue - Standard Picking)
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  -- Create tasks specific to inventory issue
  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES
  (
    'Chọn sản phẩm theo serial',
    'Tìm và chọn sản phẩm có serial number cụ thể từ kho',
    'inventory',
    15,
    true,
    false,
    true
  ),
  (
    'Kiểm tra chất lượng trước xuất kho',
    'Kiểm tra sản phẩm còn nguyên vẹn, đầy đủ phụ kiện trước khi xuất kho',
    'inventory',
    10,
    true,
    true,
    true
  ),
  (
    'Đóng gói sản phẩm xuất kho',
    'Đóng gói cẩn thận để tránh hư hỏng trong quá trình vận chuyển',
    'inventory',
    10,
    false,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO public.workflows (name, description, entity_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Phiếu xuất kho - Lấy hàng chuẩn',
    'Quy trình xuất kho cho service ticket hoặc yêu cầu nội bộ. Bao gồm chọn serial, kiểm tra chất lượng, và đóng gói.',
    'inventory_issue',
    true, -- Must follow sequence: pick → verify → pack
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chọn sản phẩm theo serial'), 1, true, 'Chọn sản phẩm đúng serial, kiểm tra vị trí kho'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra chất lượng trước xuất kho'), 2, true, 'Chụp ảnh sản phẩm nếu phát hiện vấn đề'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm xuất kho'), 3, true, 'Dùng túi chống tĩnh điện cho sản phẩm điện tử');

  RAISE NOTICE 'Inventory Workflow 3 created: % (Issue - Standard Picking)', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 4: Phiếu xuất kho - Giao hàng khách
-- (Inventory Issue - Customer Order Fulfillment)
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES
  (
    'Xác nhận thông tin khách hàng',
    'Xác nhận địa chỉ giao hàng, số điện thoại, người nhận',
    'customer_service',
    5,
    true,
    false,
    true
  ),
  (
    'Chuẩn bị hóa đơn và chứng từ',
    'In hóa đơn VAT, phiếu bảo hành, hướng dẫn sử dụng',
    'administrative',
    10,
    false,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO public.workflows (name, description, entity_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Phiếu xuất kho - Giao hàng khách',
    'Quy trình xuất kho và giao hàng cho khách hàng. Bao gồm xác nhận thông tin, chọn hàng, kiểm tra, đóng gói và chuẩn bị chứng từ.',
    'inventory_issue',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Xác nhận thông tin khách hàng'), 1, true, 'Gọi điện xác nhận trước khi giao hàng'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chọn sản phẩm theo serial'), 2, true, 'Chọn sản phẩm mới nhất, bảo hành còn lâu'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Kiểm tra chất lượng trước xuất kho'), 3, true, 'Kiểm tra kỹ vì giao cho khách hàng'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Chuẩn bị hóa đơn và chứng từ'), 4, true, 'Hóa đơn VAT, phiếu bảo hành, hướng dẫn'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói sản phẩm xuất kho'), 5, true, 'Đóng gói cẩn thận, dán tem công ty');

  RAISE NOTICE 'Inventory Workflow 4 created: % (Issue - Customer Fulfillment)', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 5: Phiếu chuyển kho - Chuyển kho chuẩn
-- (Inventory Transfer - Standard Transfer)
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES
  (
    'Lấy hàng từ kho nguồn',
    'Tìm và lấy sản phẩm từ kho nguồn theo danh sách',
    'inventory',
    20,
    true,
    false,
    true
  ),
  (
    'Đóng gói để vận chuyển',
    'Đóng gói sản phẩm an toàn cho quá trình vận chuyển giữa các kho',
    'inventory',
    15,
    false,
    false,
    true
  ),
  (
    'Vận chuyển giữa các kho',
    'Di chuyển hàng từ kho nguồn đến kho đích',
    'logistics',
    30,
    true,
    false,
    true
  ),
  (
    'Nhận hàng tại kho đích',
    'Kiểm tra số lượng, chất lượng khi nhận hàng tại kho đích',
    'inventory',
    15,
    true,
    true,
    true
  ),
  (
    'Sắp xếp vào vị trí mới',
    'Sắp xếp sản phẩm vào vị trí lưu kho mới',
    'inventory',
    10,
    true,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO public.workflows (name, description, entity_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Phiếu chuyển kho - Chuyển kho chuẩn',
    'Quy trình chuyển kho giữa các địa điểm. Tuân thủ nghiêm ngặt trình tự: lấy hàng → đóng gói → vận chuyển → nhận hàng → sắp xếp.',
    'inventory_transfer',
    true, -- Strict sequence: must complete in order
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Lấy hàng từ kho nguồn'), 1, true, 'Kiểm tra serial trước khi lấy'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Đóng gói để vận chuyển'), 2, true, 'Đóng gói cẩn thận, dán nhãn kho đích'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Vận chuyển giữa các kho'), 3, true, 'Ghi rõ thời gian khởi hành và đến'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Nhận hàng tại kho đích'), 4, true, 'Chụp ảnh nếu có hư hỏng trong vận chuyển'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Sắp xếp vào vị trí mới'), 5, true, 'Cập nhật vị trí vào hệ thống');

  RAISE NOTICE 'Inventory Workflow 5 created: % (Transfer - Standard)', v_workflow_id;
END $$;

-- =====================================================
-- WORKFLOW 6: Yêu cầu dịch vụ - Tiếp nhận & Xử lý
-- (Service Request - Customer Intake & Processing)
-- =====================================================
DO $$
DECLARE
  v_workflow_id UUID;
  v_creator_id UUID;
BEGIN
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('admin', 'manager') LIMIT 1;
  IF v_creator_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.tasks (name, description, category, estimated_duration_minutes, requires_notes, requires_photo, is_active)
  VALUES
  (
    'Xác nhận yêu cầu dịch vụ',
    'Gọi điện xác nhận yêu cầu dịch vụ với khách hàng',
    'customer_service',
    10,
    true,
    false,
    true
  ),
  (
    'Xác nhận đã nhận sản phẩm',
    'Xác nhận đã nhận sản phẩm từ khách hàng (tại center hoặc đã lấy hàng)',
    'customer_service',
    5,
    true,
    true,
    true
  ),
  (
    'Tạo phiếu sửa chữa',
    'Tạo service ticket cho từng sản phẩm trong yêu cầu',
    'administrative',
    15,
    false,
    false,
    true
  ),
  (
    'Theo dõi tiến độ xử lý',
    'Theo dõi tiến độ các phiếu sửa chữa đã tạo',
    'customer_service',
    10,
    false,
    false,
    true
  )
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO public.workflows (name, description, entity_type, strict_sequence, is_active, created_by_id)
  VALUES (
    'Yêu cầu dịch vụ - Tiếp nhận & Xử lý',
    'Quy trình xử lý yêu cầu dịch vụ từ khách hàng: xác nhận → nhận sản phẩm → tạo phiếu sửa chữa → theo dõi',
    'service_request',
    true,
    true,
    v_creator_id
  )
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_tasks (workflow_id, task_id, sequence_order, is_required, custom_instructions) VALUES
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Xác nhận yêu cầu dịch vụ'), 1, true, 'Xác nhận loại dịch vụ, sản phẩm, mô tả lỗi'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Xác nhận đã nhận sản phẩm'), 2, true, 'Chụp ảnh sản phẩm khi nhận, kiểm tra serial'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Tạo phiếu sửa chữa'), 3, true, 'Tự động tạo ticket cho mỗi sản phẩm (trigger xử lý)'),
  (v_workflow_id, (SELECT id FROM public.tasks WHERE name = 'Theo dõi tiến độ xử lý'), 4, false, 'Cập nhật tiến độ cho khách hàng nếu có yêu cầu');

  RAISE NOTICE 'Inventory Workflow 6 created: % (Service Request - Intake)', v_workflow_id;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
DECLARE
  v_workflow_count INT;
BEGIN
  SELECT COUNT(*) INTO v_workflow_count FROM public.workflows WHERE entity_type IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Inventory Workflows Seed Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created 6 inventory workflows:';
  RAISE NOTICE '1. Inventory Receipt - Quality Check & Serial';
  RAISE NOTICE '2. Inventory Receipt - Fast Entry';
  RAISE NOTICE '3. Inventory Issue - Standard Picking';
  RAISE NOTICE '4. Inventory Issue - Customer Fulfillment';
  RAISE NOTICE '5. Inventory Transfer - Standard';
  RAISE NOTICE '6. Service Request - Intake & Processing';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total workflows with entity_type: %', v_workflow_count;
  RAISE NOTICE '========================================';
END $$;
