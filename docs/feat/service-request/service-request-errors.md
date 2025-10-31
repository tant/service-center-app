## 2025-10-31 — Submit lỗi `issue_description` quá ngắn
- **Triệu chứng**: tRPC trả 400 với thông điệp `Issue description must be at least 10 characters` khi người dùng bỏ trống mô tả sản phẩm nhưng vẫn chuyển sang bước tiếp theo.
- **Nguyên nhân**: wizard chưa chặn bước 1 khi mô tả < 10 ký tự; payload gửi chuỗi rỗng khiến backend (Zod) báo lỗi.
- **Khắc phục**:
  - Thêm `validateStep` trong `ServiceRequestWizard` để ép người dùng nhập mô tả hợp lệ và chờ upload ảnh hoàn tất trước khi qua bước kế tiếp.
  - Trong `buildWizardPayload`, bỏ qua mô tả trống (`undefined`) để tránh vi phạm schema.
- **Tình trạng**: Đã sửa (pnpm build pass, supabase reset pass).
