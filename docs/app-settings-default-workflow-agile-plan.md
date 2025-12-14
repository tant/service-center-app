# Kế hoạch triển khai theo Agile (theo phase nhỏ, usable sau mỗi phase)

## Nguyên tắc chung
- Mỗi phase có giá trị sử dụng/test được ở mức cụ thể, không phụ thuộc cross-phase để kiểm thử.
- Phạm vi gọn: chỉ 1–2 tính năng chính + kiểm thử tối thiểu để chốt phase.
- Ưu tiên giảm rủi ro schema/backend trước, sau đó UI và DX.

## Phase 1: Phiên bản v1 (Admin nhập qua API/psql, ghi nhận được) ✅ Hoàn thành
- Việc chính:
  - Tạo bảng `system_settings` (key TEXT PK, value JSONB, category, description, updated_by profiles.id, timestamps) + RLS cho admin/manager.
  - Seed key `default_workflows` giá trị `{}` (tuỳ chọn).
  - TRPC/API minimal: `getSettings(keys[])`, `upsertSettings([{key,value}])` cho admin.
  - Validate workflow ids (nếu key = default_workflows) tồn tại trong `workflows`.
- Kết quả user-facing:
  - Admin có thể dùng API/psql để đặt workflow mặc định, dữ liệu lưu bền; chưa có UI nhưng giá trị đã hiệu lực.
- Test:
  - Unit validator; integration router happy path + forbidden; psql check RLS.

## Phase 2: Phiên bản v2 (Admin UI đặt workflow mặc định) ✅ Hoàn thành
- Việc chính:
  - Trang `/admin/app-settings`: tab “Workflow mặc định”.
  - Fetch workflows list + key `default_workflows`.
  - Dropdown cho 2 loại phiếu; nút Lưu gọi upsert; toast trạng thái; disable khi saving.
- Kết quả user-facing:
  - Admin thấy và thao tác UI để đặt workflow mặc định, reload vẫn giữ.
- Test:
  - Integration component (mock API); e2e ngắn: login admin → chọn → lưu → reload thấy giá trị giữ đúng.

## Phase 3: Phiên bản v3 (Người dùng thấy auto-select khi tạo phiếu) ✅ Hoàn thành
- Việc chính:
  - Form tạo phiếu yêu cầu dịch vụ và phiếu dịch vụ fetch `default_workflows` khi mở.
  - Nếu id hợp lệ → preselect workflow; nếu thiếu/không tồn tại → giữ behavior cũ + cảnh báo nhẹ.
  - Cho phép đổi thủ công.
- Kết quả user-facing:
  - Nhân viên mở form thấy workflow đã tự chọn theo thiết lập admin.
- Test:
  - Integration cho hook/form; e2e: set default → mở form → dropdown đã chọn đúng.

## Phase 4: Phiên bản v4 (Ổn định & thông báo rõ ràng) ✅ Hoàn thành
- Việc chính:
  - Cảnh báo UI khi workflow mặc định không còn tồn tại.
  - (Tuỳ chọn) cache/optimistic update cho trang app-settings.
  - Dọn tham chiếu cũ `system_settings` chưa dùng.
- Kết quả user-facing:
  - UX ổn định; người dùng được thông báo nếu default bị mất.
- Test:
  - E2E trường hợp workflow bị xoá; unit cho fallback/cảnh báo.

## Phase 5: Phiên bản v5 (Hardening & quan sát)
- Việc chính:
  - Logging/audit cho thay đổi `system_settings` (dùng audit_logs nếu có).
  - Thêm metrics/error boundary UI (optional).
  - Tài liệu admin: hướng dẫn cấu hình workflow mặc định.
- Kết quả user-facing:
  - Admin xem được thay đổi (audit), có hướng dẫn rõ ràng.
- Test:
  - Kiểm tra log/audit ghi nhận; review tài liệu.
