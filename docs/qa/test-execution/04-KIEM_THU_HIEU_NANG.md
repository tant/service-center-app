# Checklist Kiểm Thử Hiệu Năng - EPIC-01 Giai Đoạn 2

**Ưu Tiên:** P1 - MỨC CAO
**Tiêu Chí Pass:** Tỷ lệ pass ≥80% (7+ trên 9 tests phải pass)
**Thời Gian Ước Tính:** 2-3 giờ
**Tổng Số Tests:** 9
**Phạm Vi:** Xác minh NFR-1 (API response <500ms P95) và hiệu năng tải trang

**⚠️ QUAN TRỌNG:** Thiết lập cơ sở hiệu năng cho giám sát production.

---

## Thiết Lập Trước Kiểm Thử

**Môi Trường Kiểm Thử:**
- [ ] Ứng dụng đang chạy: http://localhost:3025
- [ ] Supabase Studio truy cập được: http://localhost:54323
- [ ] Browser DevTools mở (tab Performance, Network)
- [ ] Ghi hình hiệu năng được kích hoạt
- [ ] Network throttling TẮT (kiểm tra trên kết nối tốt trước)

**Dữ Liệu Test:**
- [ ] Database seed với khối lượng dữ liệu thực tế:
  - 100+ phiếu dịch vụ
  - 50+ khách hàng
  - 100+ linh kiện
  - 20+ mẫu
  - 10+ kho
- [ ] Nhiều người dùng với session hoạt động

**Công Cụ Hiệu Năng:**
- [ ] Browser DevTools (tab Performance)
- [ ] Browser DevTools (tab Network với timing)
- [ ] Lighthouse (tùy chọn)
- [ ] Supabase Studio (để đo timing truy vấn)

---

## Danh Mục Test 1: Thời Gian Tải Trang

**Tests:** 5
**Ưu Tiên:** MỨC CAO
**Mục Tiêu:** Tất cả trang tải <3 giây
**Tiêu Chí Pass:** 4/5 tests pass

### PERF-1.1: Tải Trang Danh Sách Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh trang danh sách phiếu dịch vụ tải trong thời gian chấp nhận được

**Các Bước Kiểm Thử:**
1. Xóa cache trình duyệt
2. Đăng nhập với Admin
3. Mở Browser DevTools → tab Performance
4. Bắt đầu recording
5. Điều hướng đến `/tickets`
6. Đợi trang tải đầy đủ (không có loading spinner)
7. Dừng recording
8. Phân tích chỉ số hiệu năng:
   - DOM Content Loaded (DCL)
   - Load Event
   - Largest Contentful Paint (LCP)
9. Lặp lại test 3 lần, ghi lại trung bình
10. Kiểm tra tab Network:
    - Tổng requests
    - Tổng kích thước truyền tải
    - Timing cuộc gọi API

**Kết Quả Mong Đợi:**
- ✅ Trang tải trong <2 giây (mục tiêu)
- ✅ DOM Content Loaded: <1.5 giây
- ✅ Load Event: <2 giây
- ✅ LCP: <2.5 giây
- ✅ Không có tài nguyên chặn
- ✅ Cuộc gọi API hoàn thành nhanh

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Hiệu Năng:**
| Chỉ Số | Mục Tiêu | Lần 1 | Lần 2 | Lần 3 | TB | Pass? |
|--------|----------|-------|-------|-------|-----|-------|
| DCL | <1.5s | ___ | ___ | ___ | ___ | [ ] |
| Load | <2s | ___ | ___ | ___ | ___ | [ ] |
| LCP | <2.5s | ___ | ___ | ___ | ___ | [ ] |

**Thống Kê Network:**
- Tổng requests: ___
- Tổng kích thước: ___ MB
- Cuộc gọi API chậm nhất: ___ ms

**Bằng Chứng:**
- Screenshot của tab Performance: _____________
- Screenshot của tab Network: _____________

**Ghi Chú:**

---

### PERF-1.2: Tải Trang Chi Tiết Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh trang phiếu dịch vụ riêng lẻ tải nhanh

**Các Bước Kiểm Thử:**
1. Xóa cache trình duyệt
2. Đăng nhập với Admin
3. Điều hướng đến danh sách phiếu dịch vụ
4. Mở Browser DevTools → tab Performance
5. Bắt đầu recording
6. Nhấp vào phiếu dịch vụ để mở trang chi tiết
7. Đợi tải đầy đủ (tất cả tab: chi tiết, công việc, linh kiện, bình luận)
8. Dừng recording
9. Phân tích chỉ số
10. Lặp lại 3 lần

**Kết Quả Mong Đợi:**
- ✅ Trang tải trong <1.5 giây (mục tiêu)
- ✅ Tất cả tab tải dữ liệu không có độ trễ quá mức
- ✅ Không có cuộc gọi API không cần thiết
- ✅ Ảnh/tệp đính kèm lazy loaded

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Hiệu Năng:**
| Chỉ Số | Mục Tiêu | Lần 1 | Lần 2 | Lần 3 | TB | Pass? |
|--------|----------|-------|-------|-------|-----|-------|
| Page Load | <1.5s | ___ | ___ | ___ | ___ | [ ] |
| LCP | <2s | ___ | ___ | ___ | ___ | [ ] |

**Cuộc Gọi API:**
- Ticket detail API: ___ ms
- Tasks API: ___ ms
- Parts API: ___ ms
- Comments API: ___ ms

**Bằng Chứng:**
- Performance recording: _____________

**Ghi Chú:**

---

### PERF-1.3: Tải Trang Bảng Điều Khiển
**Mục Tiêu:** Xác minh bảng điều khiển tải trong thời gian chấp nhận được mặc dù có nhiều chỉ số

**Các Bước Kiểm Thử:**
1. Xóa cache trình duyệt
2. Đăng nhập với Admin
3. Mở DevTools → tab Performance
4. Bắt đầu recording
5. Điều hướng đến `/dashboard`
6. Đợi tất cả thẻ chỉ số tải
7. Đợi tất cả biểu đồ/đồ thị render
8. Dừng recording
9. Phân tích chỉ số
10. Lặp lại 3 lần

**Kết Quả Mong Đợi:**
- ✅ Bảng điều khiển tải trong <3 giây (mục tiêu)
- ✅ Thẻ chỉ số xuất hiện nhanh (<1s)
- ✅ Biểu đồ render dần dần (không chặn)
- ✅ Nhiều cuộc gọi API thực thi song song

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Hiệu Năng:**
| Chỉ Số | Mục Tiêu | Lần 1 | Lần 2 | Lần 3 | TB | Pass? |
|--------|----------|-------|-------|-------|-----|-------|
| First Paint | <1s | ___ | ___ | ___ | ___ | [ ] |
| Metrics Loaded | <2s | ___ | ___ | ___ | ___ | [ ] |
| Full Load | <3s | ___ | ___ | ___ | ___ | [ ] |

**Cuộc Gọi API (nên song song):**
- Ticket stats: ___ ms
- Revenue stats: ___ ms
- Task stats: ___ ms
- Charts data: ___ ms

**Bằng Chứng:**
- Performance waterfall: _____________

**Ghi Chú:**

---

### PERF-1.4: Tải Trang Danh Sách Mẫu
**Mục Tiêu:** Xác minh trang workflows/templates tải nhanh

**Các Bước Kiểm Thử:**
1. Xóa cache trình duyệt
2. Đăng nhập với Admin
3. Mở DevTools → tab Performance
4. Bắt đầu recording
5. Điều hướng đến `/workflows/templates`
6. Đợi danh sách mẫu tải
7. Dừng recording
8. Lặp lại 3 lần

**Kết Quả Mong Đợi:**
- ✅ Trang tải trong <2 giây (mục tiêu)
- ✅ Danh sách mẫu render nhanh
- ✅ Không có re-render không cần thiết

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Hiệu Năng:**
| Chỉ Số | Mục Tiêu | Lần 1 | Lần 2 | Lần 3 | TB | Pass? |
|--------|----------|-------|-------|-------|-----|-------|
| Page Load | <2s | ___ | ___ | ___ | ___ | [ ] |

**Bằng Chứng:**
- Performance recording: _____________

**Ghi Chú:**

---

### PERF-1.5: Gửi Yêu Cầu Dịch Vụ Công Khai
**Mục Tiêu:** Xác minh gửi form cổng công khai nhanh

**Các Bước Kiểm Thử:**
1. Đăng xuất khỏi ứng dụng
2. Xóa cache trình duyệt
3. Mở DevTools → tab Network
4. Điều hướng đến `/service-request`
5. Điền form với dữ liệu test
6. Ghi nhận thời gian bắt đầu
7. Gửi form
8. Đo thời gian cho đến khi thông báo thành công xuất hiện
9. Kiểm tra tab Network để xem timing cuộc gọi API
10. Lặp lại 3 lần

**Kết Quả Mong Đợi:**
- ✅ Gửi form hoàn thành trong <1 giây (mục tiêu)
- ✅ Thời gian phản hồi API <500ms
- ✅ Trang thành công render ngay sau phản hồi API

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Hiệu Năng:**
| Chỉ Số | Mục Tiêu | Lần 1 | Lần 2 | Lần 3 | TB | Pass? |
|--------|----------|-------|-------|-------|-----|-------|
| API Response | <500ms | ___ | ___ | ___ | ___ | [ ] |
| Total Time | <1s | ___ | ___ | ___ | ___ | [ ] |

**Bằng Chứng:**
- Network timing: _____________

**Ghi Chú:**

---

## Danh Mục Test 2: Thời Gian Phản Hồi API (Xác Thực NFR-1)

**Tests:** 2
**Ưu Tiên:** QUAN TRỌNG
**Mục Tiêu:** Thời gian phản hồi P95 <500ms
**Tiêu Chí Pass:** Cả hai tests phải pass

### PERF-2.1: Thời Gian Phản Hồi tRPC Endpoint
**Mục Tiêu:** Xác minh các endpoint tRPC chính đáp ứng NFR-1 (<500ms P95)

**Các Bước Kiểm Thử:**
1. Sử dụng Browser DevTools tab Network
2. Thực thi 20 cuộc gọi API cho mỗi endpoint (để có dữ liệu P95):

   **Kiểm tra các endpoint này:**
   - `tickets.getAll` (danh sách phiếu dịch vụ)
   - `tickets.getById` (chi tiết phiếu dịch vụ)
   - `workflow.template.getAll` (danh sách mẫu)
   - `warehouse.product.getAll` (tồn kho)
   - `dashboard.getMetrics` (thống kê bảng điều khiển)

3. Cho mỗi endpoint:
   - Thực thi 20 lần
   - Ghi lại thời gian phản hồi
   - Tính toán P95 (phần trăm thứ 95)
   - Sắp xếp thời gian tăng dần: P95 = giá trị thứ 19 (95% của 20)

4. Xác minh trong Supabase Studio:
   - Kiểm tra thời gian thực thi truy vấn
   - Xác định truy vấn chậm

**Kết Quả Mong Đợi:**
- ✅ Tất cả endpoint P95 <500ms
- ✅ P50 (median) <200ms
- ✅ Không có timeout hoặc lỗi

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Hiệu Năng API:**

| Endpoint | P50 | P95 | P99 | Max | Pass (<500ms P95)? |
|----------|-----|-----|-----|-----|--------------------|
| tickets.getAll | ___ | ___ | ___ | ___ | [ ] |
| tickets.getById | ___ | ___ | ___ | ___ | [ ] |
| template.getAll | ___ | ___ | ___ | ___ | [ ] |
| product.getAll | ___ | ___ | ___ | ___ | [ ] |
| dashboard.getMetrics | ___ | ___ | ___ | ___ | [ ] |

**Tuân Thủ NFR-1:** [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Screenshots timing network: _____________
- Dữ liệu timing thô: _____________

**Ghi Chú:**

---

### PERF-2.2: Truy Vấn Chỉ Số Bảng Điều Khiển Quản Lý
**Mục Tiêu:** Xác minh các truy vấn bảng điều khiển tiến độ công việc quản lý được tối ưu

**Các Bước Kiểm Thử:**
1. Seed database với dữ liệu thực tế:
   - 50+ phiếu dịch vụ với công việc
   - 10+ kỹ thuật viên
   - 100+ công việc ở các trạng thái khác nhau
2. Đăng nhập với Manager
3. Mở DevTools → tab Network
4. Điều hướng đến `/dashboard/task-progress`
5. Ghi lại timing cuộc gọi API
6. Xác minh hiệu năng truy vấn trong Supabase Studio:

```sql
-- Kiểm tra hiệu năng truy vấn workload
EXPLAIN ANALYZE
SELECT
  p.full_name,
  COUNT(CASE WHEN stt.status = 'in_progress' THEN 1 END) as active_tasks,
  COUNT(CASE WHEN stt.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN stt.status = 'completed' THEN 1 END) as completed_tasks
FROM profiles p
LEFT JOIN service_ticket_tasks stt ON stt.assigned_to = p.id
WHERE p.role = 'technician'
GROUP BY p.id, p.full_name;
-- Nên thực thi trong <300ms
```

7. Thực thi cuộc gọi API bảng điều khiển 10 lần
8. Tính toán thời gian phản hồi trung bình

**Kết Quả Mong Đợi:**
- ✅ Phản hồi API bảng điều khiển <300ms trung bình
- ✅ Truy vấn workload thực thi <200ms
- ✅ Không có full table scan (kiểm tra output EXPLAIN)
- ✅ Indexes được sử dụng hiệu quả

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Hiệu Năng:**
- Thời gian phản hồi API (TB của 10): ___ ms
- Thời gian thực thi truy vấn SQL: ___ ms
- Indexes đã sử dụng: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Output EXPLAIN ANALYZE: _____________
- API timing: _____________

**Ghi Chú:**

---

## Danh Mục Test 3: Hiệu Năng Truy Vấn Database

**Tests:** 2
**Ưu Tiên:** MỨC CAO
**Mục Tiêu:** Truy vấn phức tạp <200ms
**Tiêu Chí Pass:** Cả hai tests phải pass

### PERF-3.1: Hiệu Năng Truy Vấn Danh Sách Công Việc
**Mục Tiêu:** Xác minh truy vấn công việc thực thi nhanh

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Kiểm tra truy vấn danh sách công việc với các bộ lọc khác nhau:

```sql
-- Test 1: Lấy tất cả công việc cho kỹ thuật viên
EXPLAIN ANALYZE
SELECT stt.*, st.ticket_number, st.customer_id
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
WHERE stt.assigned_to = '[TECH_USER_ID]'
ORDER BY stt.created_at DESC;
-- Mục tiêu: <100ms

-- Test 2: Lấy công việc bị chặn
EXPLAIN ANALYZE
SELECT stt.*, st.ticket_number, p.full_name as tech_name
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
JOIN profiles p ON p.id = stt.assigned_to
WHERE stt.status = 'blocked'
ORDER BY stt.blocked_at DESC;
-- Mục tiêu: <100ms

-- Test 3: Lấy chỉ số hoàn thành công việc
EXPLAIN ANALYZE
SELECT
  assigned_to,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_completion_seconds
FROM service_ticket_tasks
WHERE assigned_to IS NOT NULL
GROUP BY assigned_to;
-- Mục tiêu: <200ms
```

3. Thực thi mỗi truy vấn 5 lần
4. Ghi lại thời gian thực thi
5. Kiểm tra output EXPLAIN cho indexes

**Kết Quả Mong Đợi:**
- ✅ Truy vấn 1 (danh sách công việc): <100ms
- ✅ Truy vấn 2 (công việc bị chặn): <100ms
- ✅ Truy vấn 3 (chỉ số): <200ms
- ✅ Tất cả truy vấn sử dụng indexes (không có Seq Scan trên bảng lớn)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Hiệu Năng Truy Vấn:**
| Truy Vấn | Mục Tiêu | Lần 1 | Lần 2 | Lần 3 | Lần 4 | Lần 5 | TB | Pass? |
|----------|----------|-------|-------|-------|-------|-------|-----|-------|
| Task List | <100ms | ___ | ___ | ___ | ___ | ___ | ___ | [ ] |
| Blocked Tasks | <100ms | ___ | ___ | ___ | ___ | ___ | ___ | [ ] |
| Task Metrics | <200ms | ___ | ___ | ___ | ___ | ___ | ___ | [ ] |

**Sử Dụng Index:**
- Indexes tìm thấy: _____________
- Seq Scans phát hiện: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Outputs EXPLAIN ANALYZE: _____________

**Ghi Chú:**

---

### PERF-3.2: Hiệu Năng Materialized View Mức Tồn Kho
**Mục Tiêu:** Xác minh truy vấn view mức tồn kho nhanh

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Kiểm tra truy vấn mức tồn kho:

```sql
-- Kiểm tra materialized view (nếu tồn tại)
EXPLAIN ANALYZE
SELECT * FROM vw_stock_levels
WHERE status = 'low_stock'
ORDER BY quantity_in_stock ASC;
-- Mục tiêu: <100ms

-- Kiểm tra truy vấn trực tiếp (nếu không có materialized view)
EXPLAIN ANALYZE
SELECT
  pp.id,
  pp.name,
  pp.serial_number,
  pp.quantity_in_stock,
  pp.low_stock_threshold,
  w.name as warehouse_name,
  CASE
    WHEN pp.quantity_in_stock = 0 THEN 'out_of_stock'
    WHEN pp.quantity_in_stock < pp.low_stock_threshold THEN 'low_stock'
    ELSE 'ok'
  END as status
FROM physical_products pp
LEFT JOIN warehouses w ON w.id = pp.warehouse_id
WHERE pp.quantity_in_stock < pp.low_stock_threshold
ORDER BY pp.quantity_in_stock ASC;
-- Mục tiêu: <200ms
```

3. Thực thi truy vấn 5 lần
4. Ghi lại thời gian thực thi
5. Kiểm tra sử dụng index

**Kết Quả Mong Đợi:**
- ✅ Truy vấn materialized view: <100ms
- ✅ Truy vấn trực tiếp: <200ms
- ✅ Indexes trên quantity_in_stock, low_stock_threshold
- ✅ Nhanh ngay cả với 1000+ sản phẩm

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Hiệu Năng Truy Vấn:**
- Thời gian thực thi TB: ___ ms
- Mục tiêu: <100ms (materialized) hoặc <200ms (trực tiếp)
- Pass: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Output EXPLAIN ANALYZE: _____________

**Ghi Chú:**

---

## Tóm Tắt Test Hiệu Năng

| Danh Mục | Test IDs | Tổng | Đã Thực Hiện | Pass | Fail | Tỷ Lệ Pass |
|----------|----------|------|--------------|------|------|------------|
| Thời Gian Tải Trang | PERF-1.1 đến PERF-1.5 | 5 | ___ | ___ | ___ | ___% |
| Thời Gian Phản Hồi API | PERF-2.1 đến PERF-2.2 | 2 | ___ | ___ | ___ | ___% |
| Truy Vấn Database | PERF-3.1 đến PERF-3.2 | 2 | ___ | ___ | ___ | ___% |
| **TỔNG** | **PERF-1.1 đến PERF-3.2** | **9** | **___** | **___** | **___** | **___%** |

**Tiêu Chí Pass:** Tỷ lệ pass ≥80% = 7+ tests phải pass
**Tuân Thủ NFR-1:** [ ] CÓ [ ] KHÔNG

---

## Cơ Sở Hiệu Năng Đã Thiết Lập

**Thời Gian Tải Trang:**
- Bảng Điều Khiển: ___ giây
- Danh Sách Phiếu Dịch Vụ: ___ giây
- Chi Tiết Phiếu Dịch Vụ: ___ giây
- Danh Sách Mẫu: ___ giây

**Thời Gian Phản Hồi API (P95):**
- tickets.getAll: ___ ms
- tickets.getById: ___ ms
- dashboard.getMetrics: ___ ms

**Thời Gian Truy Vấn Database:**
- Truy vấn danh sách công việc: ___ ms
- Truy vấn mức tồn kho: ___ ms

**Khuyến Nghị cho Giám Sát Production:**
- Đặt cảnh báo nếu tải trang > 5s
- Đặt cảnh báo nếu API P95 > 1000ms
- Đặt cảnh báo nếu truy vấn DB > 500ms

---

## Đánh Giá Cuối Cùng

**Tỷ Lệ Pass Tổng Thể:** ___% (Mục tiêu: ≥80%)

**Kết Quả:** [ ] CHẤP THUẬN [ ] TỪ CHỐI

**Vấn Đề Hiệu Năng Tìm Thấy:** ___

**Khuyến Nghị Tối Ưu:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Chuyên Gia Phân Tích Hiệu Năng:** _______________ Ngày: _______________
**Phê Duyệt:** [ ] PASS - Hiệu năng chấp nhận được [ ] FAIL - Yêu cầu tối ưu

---

**Bước Tiếp Theo:**
- Nếu PASS: Tiến hành Kiểm Thử Toàn Vẹn Dữ Liệu
- Nếu FAIL: Tối ưu truy vấn/endpoint chậm, kiểm thử lại

**Tài Liệu Tham Khảo:**
- NFR-1: Thời gian phản hồi API <500ms P95
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md
- Master Tracker: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md
