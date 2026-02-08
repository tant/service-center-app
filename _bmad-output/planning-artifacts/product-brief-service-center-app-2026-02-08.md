---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - docs/brief.md
  - docs/docs-nhung/business-docs/business-requirements-document.md
  - docs/docs-nhung/business-docs/improvements-feature-requests.md
  - docs/docs-nhung/business-docs/sstc-questionnaire.md
  - docs/prd/index.md
  - docs/prd/01-intro-project-analysis-and-context.md
date: 2026-02-08
author: Tan
language: Vietnamese
---

# Product Brief: Hệ Thống Quản Lý Trung Tâm Bảo Hành SSTC

## Executive Summary

Hệ thống Quản lý Trung tâm Bảo hành dành cho **Công ty CP Công nghệ SSTC** — một trung tâm chuyên bảo hành và sửa chữa linh kiện điện tử cho nhiều thương hiệu. Hệ thống thay thế giải pháp Frappe/ERPNext hiện tại bằng một nền tảng web gọn nhẹ, dễ vận hành và dễ tùy chỉnh, không đòi hỏi chuyên gia kỹ thuật riêng để duy trì.

Hệ thống bao quát toàn bộ vòng đời sản phẩm: từ **nhập kho**, **bán hàng**, **tiếp nhận bảo hành**, **sửa chữa/đổi mới**, đến **đổi trả về hãng (RMA)** — với mọi sản phẩm được theo dõi theo mã serial xuyên suốt. Kiến trúc kho 2 cấp (kho vật lý + 5 kho ảo) đảm bảo biết chính xác trạng thái và vị trí của từng sản phẩm tại mọi thời điểm.

**Quy mô vận hành:** ~20 nhân viên, ~vài trăm phiếu dịch vụ/tháng, ~100 SKU, triển khai trên server nội bộ, giao diện tiếng Việt.

---

## Tầm Nhìn Sản Phẩm

### Vấn Đề Cốt Lõi

SSTC đang vận hành trung tâm bảo hành với hệ thống Frappe/ERPNext nhưng gặp một vấn đề quan trọng: **không có nhân sự kỹ thuật để quản trị, bảo trì và tùy chỉnh hệ thống** khi nghiệp vụ thay đổi. Frappe/ERPNext là nền tảng mạnh nhưng đòi hỏi chuyên gia riêng — điều mà một trung tâm bảo hành 20 người không duy trì được lâu dài.

Hệ quả:
- Quy trình nghiệp vụ không thể điều chỉnh kịp thời khi có yêu cầu mới
- Phụ thuộc vào bên thứ ba để thay đổi dù nhỏ
- Rủi ro gián đoạn vận hành nếu hệ thống gặp sự cố mà không có ai xử lý

### Tác Động

- Hệ thống cũ trở thành "hộp đen" — chạy nhưng không ai kiểm soát được
- Mất khả năng thích ứng nhanh với thay đổi nghiệp vụ
- Chi phí ẩn từ việc phải thuê ngoài cho mọi tùy chỉnh

### Tại Sao Giải Pháp Hiện Tại Không Đáp Ứng

| Giải pháp | Hạn chế |
|-----------|---------|
| **Frappe/ERPNext** | Mạnh nhưng cần chuyên gia Frappe riêng để quản trị và tùy chỉnh — không phù hợp quy mô nhỏ |
| **Phần mềm bảo hành chuyên dụng** (RepairShopr, Syncro) | Đắt tiền, quá phức tạp, không hỗ trợ tiếng Việt, không triển khai nội bộ được |
| **Phần mềm quản lý kho** (Zoho Inventory) | Thiếu tích hợp phiếu dịch vụ và quy trình bảo hành |

### Giải Pháp Đề Xuất

Xây dựng hệ thống web **thiết kế riêng cho nghiệp vụ trung tâm bảo hành**, với các đặc điểm:

1. **Quản lý toàn diện vòng đời sản phẩm** — Nhập kho → Bán hàng → Bảo hành/Sửa chữa → RMA, theo dõi serial xuyên suốt
2. **Kho 2 cấp thông minh** — 5 kho ảo (Chính, Hàng Bán, Bảo Hành, Sửa Chữa, Hàng Hỏng) với di chuyển tự động theo nghiệp vụ
3. **Quy trình bảo hành có cấu trúc** — Xác minh serial → Tạo phiếu yêu cầu → Phiếu dịch vụ → Sửa được/Đổi mới → Đóng phiếu
4. **Quản lý RMA** — Gom hàng lỗi theo lô, theo dõi gửi trả về hãng
5. **Phân quyền 4 vai trò** — Quản trị, Quản lý, Kỹ thuật viên, Tiếp nhận

### Điểm Khác Biệt

- **Không cần chuyên gia riêng** — Công nghệ phổ biến (Next.js, TypeScript, Supabase), dễ tìm dev bảo trì
- **Thiết kế đúng nghiệp vụ** — Không thừa, không thiếu; quy trình kho tự động hóa theo đúng luồng bảo hành SSTC
- **Triển khai nội bộ** — Toàn quyền kiểm soát dữ liệu, không phụ thuộc cloud bên ngoài
- **Dễ tùy chỉnh** — Codebase gọn, có tài liệu kiến trúc đầy đủ, thay đổi nhanh khi nghiệp vụ cần
- **Giao diện tiếng Việt** — Thiết kế cho người dùng Việt Nam từ đầu

---

## Người Dùng Mục Tiêu

### Người Dùng Chính: Kỹ Thuật Viên

Là người sử dụng hệ thống nhiều nhất. Kỹ thuật viên liên tục cập nhật thông tin trong suốt quy trình sửa chữa/bảo hành.

**Công việc hàng ngày với hệ thống:**
- Xem danh sách phiếu dịch vụ được gán
- Cập nhật kết quả chẩn đoán, sửa chữa
- Quyết định kết quả: Sửa được (Repaired) hoặc Không sửa được → Đổi mới (Warranty Replacement)
- Chọn sản phẩm thay thế từ Kho Bảo Hành khi cần đổi mới

**Nhu cầu:** Giao diện nhanh, ít bước thao tác, dễ cập nhật trạng thái ngay tại nơi làm việc.

---

### Người Dùng Thứ Hai: Tiếp Nhận

Vai trò chung — bất kỳ nhân viên nào cũng có thể thực hiện. Xử lý giao dịch trực tiếp với khách hàng.

**Công việc hàng ngày với hệ thống:**
- Tạo phiếu yêu cầu bảo hành (xác minh serial → kiểm tra bảo hành → tạo phiếu)
- Nhập kho (nhận hàng mới từ nhà cung cấp hoặc RMA về)
- Xuất kho / Bán hàng (chọn serial, gán khách hàng)
- Quản lý khách hàng
- Tạo phiếu dịch vụ từ phiếu yêu cầu

**Nhu cầu:** Quy trình rõ ràng từng bước, xác minh bảo hành tự động, ít nhập liệu thủ công.

---

### Người Dùng Thứ Ba: Quản Lý

Giám sát toàn bộ vận hành trung tâm.

**Công việc hàng ngày với hệ thống:**
- Gán kỹ thuật viên cho phiếu dịch vụ
- Giám sát tiến độ phiếu dịch vụ
- Quản lý kho: chuyển kho, kiểm tra tồn kho
- Tạo và quản lý lô RMA gửi về hãng
- Quản lý danh mục sản phẩm

**Nhu cầu:** Tổng quan nhanh về tình trạng vận hành, tồn kho, phiếu đang xử lý.

---

### Người Dùng Thứ Tư: Quản Trị Hệ Thống

Cấu hình và quản trị nền tảng.

**Công việc:**
- Quản lý tài khoản người dùng và phân quyền
- Cấu hình hệ thống (kho, danh mục, thương hiệu...)
- Toàn quyền trên mọi chức năng

---

### Người Dùng Bên Ngoài: Khách Hàng (Public)

Không cần đăng nhập. Truy cập qua trang công khai.

**Tương tác với hệ thống:**
- Tra cứu bảo hành bằng mã serial
- Tự tạo phiếu yêu cầu bảo hành/sửa chữa
- Theo dõi trạng thái phiếu yêu cầu

**Nhu cầu:** Đơn giản, nhanh, không cần tạo tài khoản.

---

## Mục Tiêu Thành Công

Mục tiêu duy nhất: **Thay thế hoàn toàn hệ thống Frappe/ERPNext hiện tại**, đảm bảo tất cả nghiệp vụ đang chạy trên hệ cũ đều được hỗ trợ trên hệ thống mới.

**Tiêu chí hoàn thành:**
- Tất cả module nghiệp vụ hoạt động đầy đủ (Kho, Bán hàng, Bảo hành, RMA)
- Nhân viên SSTC chuyển sang dùng hệ thống mới hoàn toàn
- Trang public cho khách hàng tự tạo yêu cầu hoạt động

---

## Phạm Vi Hệ Thống

### 1. Quản Lý Danh Mục Sản Phẩm
- Tạo/sửa sản phẩm: tên, SKU, thương hiệu, loại, model, mô tả, hình ảnh
- Quản lý thương hiệu và danh mục
- Ràng buộc: SKU trùng → từ chối, tên trùng → cảnh báo

### 2. Quản Lý Kho (2 Cấp)

**Kiến trúc kho:**
- Kho vật lý → 5 kho ảo: Chính, Hàng Bán, Bảo Hành, Sửa Chữa, Hàng Hỏng

**Nhập kho:**
- Phiếu nhập: lý do (Nhập mua hàng / Nhập RMA về), kho đích, ngày nhập
- Nhập serial + thời hạn bảo hành cho từng sản phẩm
- Hệ thống tạo bản ghi sản phẩm vật lý cho mỗi serial

**Xuất kho / Bán hàng:**
- Chọn sản phẩm, serial cụ thể, gán khách hàng
- Tự động: di chuyển Kho Chính → Kho Hàng Bán, cập nhật serial (Đã bán, chủ sở hữu)

**Di chuyển kho tự động:**
- Tạo phiếu dịch vụ → Kho Hàng Bán → Kho Sửa Chữa
- Sửa xong → Kho Sửa Chữa → Kho Hàng Bán
- Đổi mới → sản phẩm lỗi: Sửa Chữa → Hàng Hỏng; sản phẩm thay thế: Bảo Hành → Hàng Bán
- Gửi RMA → Hàng Hỏng → Ra khỏi hệ thống

**Di chuyển kho thủ công:**
- Nhập kho từ nhà cung cấp
- Bán hàng
- Chuyển hàng dự phòng: Kho Chính → Kho Bảo Hành

### 3. Quản Lý Khách Hàng
- Họ tên, SĐT (duy nhất, dùng định danh), email, địa chỉ
- Tìm kiếm theo tên/SĐT/email
- Tự động điền thông tin khi nhập SĐT đã có

### 4. Phiếu Yêu Cầu (Service Request)
- Nhập serial → xác minh bảo hành tự động
- Chỉ tiếp nhận sản phẩm còn bảo hành
- Trạng thái: Open → In Service → Completed
- Quan hệ 1:N với Phiếu Dịch vụ (mỗi serial 1 phiếu)

### 5. Phiếu Dịch Vụ (Service Ticket)
- Tạo từ Phiếu Yêu cầu, mã tự động SV-YYYY-NNN
- Trạng thái: Open → In Progress → Completed
- Gán kỹ thuật viên
- **Kịch bản A — Sửa được:** cập nhật kết quả → tự động chuyển kho → đóng phiếu
- **Kịch bản B — Đổi mới:** chọn sản phẩm thay thế từ Kho Bảo Hành → tự động chuyển kho + thêm vào lô RMA → đóng phiếu

### 6. Quản Lý RMA
- Gom sản phẩm hỏng thành lô (RMA-YYYYMMDD-XXX)
- Thông tin: nhà sản xuất, danh sách serial, mã vận đơn
- Nhận hàng thay thế từ hãng → tạo Phiếu Nhập Kho (lý do: Nhập RMA về)

### 7. Trang Public (Khách Hàng)
- Tra cứu bảo hành bằng serial (không cần đăng nhập)
- Tự tạo phiếu yêu cầu bảo hành
- Theo dõi trạng thái phiếu yêu cầu

### 8. Phân Quyền (RBAC)
- 4 vai trò: Quản trị, Quản lý, Kỹ thuật viên, Tiếp nhận
- Ma trận phân quyền chi tiết theo chức năng (xem tài liệu nghiệp vụ)

### 9. Dashboard & Báo Cáo
- Tổng quan phiếu dịch vụ đang xử lý
- Tồn kho theo kho ảo
- Thống kê cơ bản

---

### Ngoài Phạm Vi

- Quản lý nhà cung cấp / đơn đặt hàng
- Công nợ khách hàng / nhà cung cấp
- In tem mã vạch / quét barcode
- Gửi SMS/Email tự động cho khách
- Kế toán / tích hợp hệ thống bên ngoài
- Ứng dụng mobile native
