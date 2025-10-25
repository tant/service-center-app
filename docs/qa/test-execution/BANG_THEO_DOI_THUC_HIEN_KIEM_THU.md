# Bảng Theo Dõi Thực Hiện Kiểm Thử Tổng Thể - EPIC-01 Giai Đoạn 2

**Epic:** EPIC-01 - Service Center Giai Đoạn 2 - Quy Trình, Bảo Hành & Kho
**Kế Hoạch Kiểm Thử:** docs/KE_HOACH_KIEM_THU.md
**Cổng Chất Lượng:** docs/qa/gates/epic-01-phase2-quality-gate.yaml
**Ngày Bắt Đầu Thực Hiện:** _______________
**Ngày Hoàn Thành Dự Kiến:** _______________
**Trưởng Nhóm Kiểm Thử:** _______________

---

## Tóm Tắt Điều Hành

| Chỉ Số | Mục Tiêu | Thực Tế | Trạng Thái |
|--------|----------|---------|------------|
| **Tổng Số Test Case** | 137+ | ___ / 137 | ⏳ |
| **Tỷ Lệ Pass (Tổng Thể)** | >90% | ___% | ⏳ |
| **Lỗi Nghiêm Trọng** | 0 | ___ | ⏳ |
| **Lỗi Mức Cao** | <3 | ___ | ⏳ |
| **Test Bảo Mật Pass** | 100% | ___% | ⏳ |
| **Test Hiệu Năng Pass** | 80% | ___% | ⏳ |

---

## Tổng Quan Các Danh Mục Kiểm Thử

### 1. Kiểm Thử Chấp Nhận Tính Năng (88 tests) - QUAN TRỌNG
**Ưu Tiên:** P0 (Phải hoàn thành trước khi triển khai)
**Tiêu Chí Pass:** Tỷ lệ pass ≥95%
**Thời Gian Ước Tính:** 10-12 giờ
**Checklist:** `01-KIEM_THU_CHAP_NHAN_TINH_NANG.md`

| Story | Tests | Đã Thực Hiện | Pass | Fail | Bị Chặn | Tỷ Lệ Pass |
|-------|-------|--------------|------|------|---------|------------|
| 1.2 - Mẫu Công Việc | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.4 - Thực Hiện Công Việc | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.5 - Phụ Thuộc | 3 | ___ | ___ | ___ | ___ | ___% |
| 1.6 - Thiết Lập Kho | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.7 - Theo Dõi Sản Phẩm | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.8 - Xác Minh Serial | 5 | ___ | ___ | ___ | ___ | ___% |
| 1.9 - Mức Tồn Kho | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.10 - Lô RMA | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.11 - Cổng Công Khai | 5 | ___ | ___ | ___ | ___ | ___% |
| 1.12 - Theo Dõi Yêu Cầu | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.13 - Quản Lý Yêu Cầu Nhân Viên | 5 | ___ | ___ | ___ | ___ | ___% |
| 1.14 - Xác Nhận Giao Hàng | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.15 - Thông Báo Email | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.16 - Bảng Điều Khiển Quản Lý | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.17 - Chuyển Đổi Mẫu | 5 | ___ | ___ | ___ | ___ | ___% |
| **TỔNG** | **88** | **___** | **___** | **___** | **___** | **___%** |

**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

### 2. Kiểm Thử Bảo Mật (12 tests) - QUAN TRỌNG
**Ưu Tiên:** P0 (Phải hoàn thành trước khi triển khai)
**Tiêu Chí Pass:** Tỷ lệ pass 100% (KHÔNG CHO PHÉP LỖI)
**Thời Gian Ước Tính:** 3-4 giờ
**Checklist:** `02-KIEM_THU_BAO_MAT.md`

| Khu Vực Kiểm Thử | Tests | Đã Thực Hiện | Pass | Fail | Tỷ Lệ Pass |
|------------------|-------|--------------|------|------|------------|
| RLS Policies | 5 | ___ | ___ | ___ | ___% |
| Xác Thực Đầu Vào (XSS) | 2 | ___ | ___ | ___ | ___% |
| Phòng Chống SQL Injection | 1 | ___ | ___ | ___ | ___% |
| Bảo Vệ CSRF | 1 | ___ | ___ | ___ | ___% |
| Rate Limiting | 2 | ___ | ___ | ___ | ___% |
| Quản Lý Session | 1 | ___ | ___ | ___ | ___% |
| **TỔNG** | **12** | **___** | **___** | **___** | **___%** |

**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Lỗi Nghiêm Trọng:** ___ (PHẢI BẰNG KHÔNG)
**Ký Duyệt:** _______________ Ngày: _______________

---

### 3. Kiểm Thử Hồi Quy (13 tests) - MỨC CAO
**Ưu Tiên:** P1 (Ưu tiên cao)
**Tiêu Chí Pass:** Tỷ lệ pass ≥95%
**Thời Gian Ước Tính:** 2-3 giờ
**Checklist:** `03-KIEM_THU_HOI_QUY.md`

| Khu Vực Kiểm Thử | Tests | Đã Thực Hiện | Pass | Fail | Tỷ Lệ Pass |
|------------------|-------|--------------|------|------|------------|
| Quản Lý Phiếu Dịch Vụ | 5 | ___ | ___ | ___ | ___% |
| Quản Lý Khách Hàng | 3 | ___ | ___ | ___ | ___% |
| Tồn Kho Linh Kiện | 3 | ___ | ___ | ___ | ___% |
| Auth/Điều Hướng Cơ Bản | 2 | ___ | ___ | ___ | ___% |
| **TỔNG** | **13** | **___** | **___** | **___** | **___%** |

**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

### 4. Kiểm Thử Hiệu Năng (9 tests) - MỨC CAO
**Ưu Tiên:** P1 (Ưu tiên cao)
**Tiêu Chí Pass:** Tỷ lệ pass ≥80%
**Thời Gian Ước Tính:** 2-3 giờ
**Checklist:** `04-KIEM_THU_HIEU_NANG.md`

| Khu Vực Kiểm Thử | Tests | Mục Tiêu | Đã Thực Hiện | Pass | Fail |
|------------------|-------|----------|--------------|------|------|
| Thời Gian Tải Trang | 5 | <3s | ___ | ___ | ___ |
| Thời Gian Phản Hồi API | 2 | P95 <500ms | ___ | ___ | ___ |
| Thời Gian Truy Vấn Database | 2 | <200ms | ___ | ___ | ___ |
| **TỔNG** | **9** | - | **___** | **___** | **___** |

**Cơ Sở Hiệu Năng Đã Thiết Lập:** [ ] Có [ ] Không
**NFR1 Đã Xác Thực (API <500ms):** [ ] Có [ ] Không
**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

### 5. Kiểm Thử Toàn Vẹn Dữ Liệu (9 tests) - QUAN TRỌNG
**Ưu Tiên:** P0 (Phải hoàn thành)
**Tiêu Chí Pass:** Tỷ lệ pass 100%
**Thời Gian Ước Tính:** 1-2 giờ
**Checklist:** `05-KIEM_THU_TOAN_VEN_DU_LIEU.md`

| Khu Vực Kiểm Thử | Tests | Đã Thực Hiện | Pass | Fail |
|------------------|-------|--------------|------|------|
| Foreign Key Constraints | 3 | ___ | ___ | ___ |
| Unique Constraints | 1 | ___ | ___ | ___ |
| Triggers (Cập Nhật Tự Động) | 4 | ___ | ___ | ___ |
| Check Constraints | 1 | ___ | ___ | ___ |
| **TỔNG** | **9** | **___** | **___** | **___** |

**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

### 6. Quy Trình Đầu-Cuối (2 scenarios) - QUAN TRỌNG
**Ưu Tiên:** P0 (Phải hoàn thành)
**Tiêu Chí Pass:** Tỷ lệ pass 100%
**Thời Gian Ước Tính:** 1-2 giờ
**Checklist:** `06-KIEM_THU_QUY_TRINH_E2E.md`

| Quy Trình | Bước | Đã Thực Hiện | Pass | Vấn Đề |
|-----------|------|--------------|------|--------|
| Quy Trình Dịch Vụ Hoàn Chỉnh | 12 | [ ] | [ ] | ___ |
| Chuyển Đổi Mẫu Giữa Dịch Vụ | 8 | [ ] | [ ] | ___ |
| **TỔNG** | **2** | **___** | **___** | **___** |

**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

### 7. Kiểm Thử Đồng Thời (4 tests) - MỨC TRUNG BÌNH
**Ưu Tiên:** P2 (Ưu tiên trung bình)
**Tiêu Chí Pass:** Tỷ lệ pass >70%
**Thời Gian Ước Tính:** 1-2 giờ
**Checklist:** `07-KIEM_THU_DONG_THOI.md`

| Kịch Bản Kiểm Thử | Đã Thực Hiện | Pass | Vấn Đề |
|-------------------|--------------|------|--------|
| Nhiều Người Dùng Cùng Phiếu Dịch Vụ | [ ] | [ ] | ___ |
| Cập Nhật Công Việc Đồng Thời | [ ] | [ ] | ___ |
| Cập Nhật Bảng Điều Khiển Thời Gian Thực | [ ] | [ ] | ___ |
| Rate Limiting Cổng Công Khai | [ ] | [ ] | ___ |
| **TỔNG: 4 tests** | **___** | **___** | **___** |

**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

### 8. Kiểm Thử Khói - Smoke Tests (8 suites) - QUAN TRỌNG
**Ưu Tiên:** P0 (Chạy sau khi triển khai)
**Tiêu Chí Pass:** Tỷ lệ pass 100%
**Thời Gian Ước Tính:** 30-45 phút (đầy đủ), 5-10 phút (nhanh)
**Quy Trình:** `docs/phase2/deployment/SMOKE-TEST-PROCEDURES.md`

| Suite | Thời Gian | Đã Thực Hiện | Pass | Vấn Đề |
|-------|-----------|--------------|------|--------|
| Xác Thực (4 vai trò) | 5 phút | [ ] | [ ] | ___ |
| Quản Lý Phiếu Dịch Vụ | 7 phút | [ ] | [ ] | ___ |
| Quy Trình Công Việc | 6 phút | [ ] | [ ] | ___ |
| Cổng Công Khai | 5 phút | [ ] | [ ] | ___ |
| Thông Báo Email | 5 phút | [ ] | [ ] | ___ |
| Hoạt Động Kho | 6 phút | [ ] | [ ] | ___ |
| Bảng Điều Khiển Quản Lý | 4 phút | [ ] | [ ] | ___ |
| Chuyển Đổi Mẫu | 4 phút | [ ] | [ ] | ___ |
| **TỔNG: 8 suites** | **42 phút** | **___** | **___** | **___** |

**Script Tự Động Đã Sử Dụng:** [ ] Có [ ] Không
**Trạng Thái:** [ ] Chưa Bắt Đầu [ ] Đang Thực Hiện [ ] Hoàn Thành
**Ký Duyệt:** _______________ Ngày: _______________

---

## Tóm Tắt Lỗi

### Lỗi Nghiêm Trọng (P0) - PHẢI SỬA TRƯỚC KHI TRIỂN KHAI
| Mã Lỗi | Mô Tả | Tìm Thấy Trong | Trạng Thái | Phân Công Cho | Ngày Sửa |
|--------|-------|----------------|------------|---------------|----------|
| | | | | | |

**Tổng Lỗi Nghiêm Trọng:** ___ (PHẢI BẰNG KHÔNG)

### Lỗi Mức Cao (P1) - NÊN SỬA TRƯỚC KHI TRIỂN KHAI
| Mã Lỗi | Mô Tả | Tìm Thấy Trong | Trạng Thái | Phân Công Cho | Ngày Sửa |
|--------|-------|----------------|------------|---------------|----------|
| | | | | | |

**Tổng Lỗi Mức Cao:** ___ (Mục tiêu: <3)

### Lỗi Mức Trung Bình (P2) - CÓ THỂ SỬA SAU TRIỂN KHAI
| Mã Lỗi | Mô Tả | Tìm Thấy Trong | Trạng Thái | Quyết Định |
|--------|-------|----------------|------------|------------|
| | | | | |

### Lỗi Mức Thấp (P3) - BACKLOG
| Mã Lỗi | Mô Tả | Tìm Thấy Trong | Trạng Thái |
|--------|-------|----------------|------------|
| | | | |

---

## Môi Trường Kiểm Thử

- **URL Ứng Dụng:** http://localhost:3025
- **Supabase Studio:** http://localhost:54323
- **Dữ Liệu Test:** Seed qua `supabase/seed.sql`
- **Trình Duyệt:** Chrome/Firefox (phiên bản mới nhất)
- **Tài Khoản Test:**
  - Quản Trị Viên: admin@example.com
  - Quản Lý: manager@example.com
  - Kỹ Thuật Viên: technician@example.com
  - Lễ Tân: reception@example.com

**Trạng Thái Môi Trường:**
- [ ] Ứng dụng đang chạy và truy cập được
- [ ] Database đã seed dữ liệu test
- [ ] Tất cả tài khoản test đã tạo và xác minh
- [ ] Dịch vụ Supabase đang chạy
- [ ] Dữ liệu test cơ sở đã ghi nhận

---

## Nhật Ký Thực Hiện Kiểm Thử Hàng Ngày

### Ngày 1: _______________
**Người Kiểm Thử:** _______________
**Tests Đã Thực Hiện:** ___ / 137
**Pass:** ___  **Fail:** ___  **Bị Chặn:** ___
**Vấn Đề Nghiêm Trọng Tìm Thấy:** ___
**Ghi Chú:**

---

### Ngày 2: _______________
**Người Kiểm Thử:** _______________
**Tests Đã Thực Hiện:** ___ / 137
**Pass:** ___  **Fail:** ___  **Bị Chặn:** ___
**Vấn Đề Nghiêm Trọng Tìm Thấy:** ___
**Ghi Chú:**

---

### Ngày 3: _______________
**Người Kiểm Thử:** _______________
**Tests Đã Thực Hiện:** ___ / 137
**Pass:** ___  **Fail:** ___  **Bị Chặn:** ___
**Vấn Đề Nghiêm Trọng Tìm Thấy:** ___
**Ghi Chú:**

---

## Lịch Trình Thực Hiện Kiểm Thử

### Tuần 1: Các Test Quan Trọng
**Mục Tiêu:** Hoàn thành tất cả test P0 (Quan Trọng)

| Ngày | Danh Mục Kiểm Thử | Tests | Phân Công Cho | Trạng Thái |
|------|-------------------|-------|---------------|------------|
| T2 | Kiểm Thử Bảo Mật | 12 | ___ | [ ] |
| T3 | Toàn Vẹn Dữ Liệu | 9 | ___ | [ ] |
| T4 | Chấp Nhận Tính Năng (1.2-1.5) | 15 | ___ | [ ] |
| T5 | Chấp Nhận Tính Năng (1.6-1.10) | 21 | ___ | [ ] |
| T6 | Chấp Nhận Tính Năng (1.11-1.17) | 52 | ___ | [ ] |

### Tuần 2: Xác Thực & Hồi Quy
**Mục Tiêu:** Hoàn thành test P1/P2 + kiểm thử lại

| Ngày | Danh Mục Kiểm Thử | Tests | Phân Công Cho | Trạng Thái |
|------|-------------------|-------|---------------|------------|
| T2 | Kiểm Thử Hồi Quy | 13 | ___ | [ ] |
| T3 | Kiểm Thử Hiệu Năng | 9 | ___ | [ ] |
| T4 | Quy Trình E2E | 2 | ___ | [ ] |
| T5 | Kiểm Thử Đồng Thời | 4 | ___ | [ ] |
| T6 | Sửa Lỗi & Kiểm Thử Lại | Tất cả fail | ___ | [ ] |

---

## Checklist Ký Duyệt Cuối Cùng

### Xác Thực Trước Triển Khai
- [ ] Tất cả test P0 (Quan Trọng) đã pass (Bảo Mật, Toàn Vẹn Dữ Liệu, E2E, Chấp Nhận Tính Năng)
- [ ] Test bảo mật: Tỷ lệ pass 100% (12/12 pass)
- [ ] Chấp nhận tính năng: Tỷ lệ pass ≥95% (84+/88 pass)
- [ ] Hồi quy: Tỷ lệ pass ≥95% (13+/13 pass)
- [ ] Hiệu năng: Tỷ lệ pass ≥80% (7+/9 pass)
- [ ] Không có lỗi nghiêm trọng (P0)
- [ ] Lỗi mức cao (P1): <3
- [ ] Tất cả bằng chứng test đã ghi nhận (screenshots, logs)
- [ ] Hệ thống theo dõi lỗi đã cập nhật
- [ ] Báo cáo tóm tắt test đã tạo

### Sẵn Sàng Triển Khai
- [ ] Quy trình smoke test đã xem xét và sẵn sàng
- [ ] Quy trình rollback đã xem xét
- [ ] Checklist trước triển khai đã chuẩn bị
- [ ] Đào tạo nhân viên đã hoàn thành
- [ ] Cảnh báo giám sát đã cấu hình
- [ ] Backup database đã tạo và xác minh

### Phê Duyệt Cuối Cùng
- [ ] Ký Duyệt Trưởng Nhóm Kiểm Thử: _______________ Ngày: _______________
- [ ] Ký Duyệt Quản Lý QA: _______________ Ngày: _______________
- [ ] Ký Duyệt Trưởng Nhóm Kỹ Thuật: _______________ Ngày: _______________
- [ ] Ký Duyệt Quản Lý Sản Phẩm: _______________ Ngày: _______________

---

## Quyết Định Triển Khai

**Quyết Định:** [ ] CHẤP THUẬN TRIỂN KHAI [ ] KHÔNG CHẤP THUẬN

**Ngày Quyết Định:** _______________

**Lý Do:**

**Cửa Sổ Triển Khai:** _______________

**Hành Động Sau Triển Khai:**
1. Thực hiện smoke test trong vòng 1 giờ sau triển khai
2. Giám sát error logs trong 24 giờ
3. Kiểm tra hàng ngày trong tuần đầu tiên
4. Thu thập phản hồi người dùng

---

## Tài Liệu Tham Khảo

- **Kế Hoạch Kiểm Thử:** docs/KE_HOACH_KIEM_THU.md
- **Cổng Chất Lượng:** docs/qa/gates/epic-01-phase2-quality-gate.yaml
- **Smoke Tests:** docs/phase2/deployment/SMOKE-TEST-PROCEDURES.md
- **Checklist Trước Triển Khai:** docs/phase2/deployment/PRE-DEPLOYMENT-CHECKLIST.md
- **Hướng Dẫn Triển Khai:** docs/phase2/deployment/deployment-guide.md

---

**Phiên Bản Tài Liệu:** 1.0
**Cập Nhật Lần Cuối:** 2025-10-24
**Xem Xét Tiếp Theo:** Sau khi hoàn thành thực hiện test
