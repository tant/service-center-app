# Kế hoạch triển khai thiết lập workflow mặc định

## Mục tiêu
- Thêm cơ chế cấu hình mặc định cho workflow của từng loại phiếu (phiếu yêu cầu dịch vụ, phiếu dịch vụ) tại `/admin/app-settings`.
- Tự động chọn workflow mặc định khi nhân viên tạo phiếu mới, vẫn cho phép thay đổi thủ công.
- Dùng một bảng cấu hình chung cho mọi thiết lập tại trang app settings.

## Phạm vi
- Backend: schema Supabase, RLS, router/API để đọc/ghi thiết lập.
- Frontend: trang `/admin/app-settings` hiển thị và lưu cấu hình; form tạo phiếu tự điền workflow mặc định.
- Kiểm thử: unit/integration/e2e.

## Thiết kế dữ liệu
- Tạo bảng `public.system_settings` (bảng cấu hình chung):
  - `key` TEXT PRIMARY KEY.
  - `value` JSONB NOT NULL (lưu giá trị linh hoạt).
  - `category` TEXT NOT NULL DEFAULT 'general'.
  - `description` TEXT DEFAULT NULL.
  - `updated_by` UUID REFERENCES public.profiles(id) ON DELETE SET NULL.
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now().
  - (Tuỳ chọn) `created_at` TIMESTAMPTZ NOT NULL DEFAULT now().
- Chỉ mục: PRIMARY KEY trên `key`; GIN trên `value` nếu cần truy vấn phần tử.
- RLS:
  - Policy cho admin/manager: SELECT/INSERT/UPDATE/DELETE.
  - Policy mặc định deny all.
  - Supabase function/helper để kiểm tra vai trò reuse từ các bảng khác (nếu có).
- Khoá nghiệp vụ cho thiết lập workflow mặc định:
  - Sử dụng `key = 'default_workflows'`.
  - Cấu trúc `value`: `{ "service_request": "<workflow-id>", "service_ticket": "<workflow-id>" }`.
  - Khi upsert, validate mỗi `workflow-id` tồn tại trong `public.workflows`.

## Migration (dự kiến)
1) Tạo file migration mới trong `supabase/migrations`:
   - `CREATE TABLE public.system_settings ...`.
   - Thêm RLS `ENABLE ROW LEVEL SECURITY`.
   - Thêm policy theo role (admin/manager) cho SELECT/INSERT/UPDATE/DELETE.
   - (Tuỳ chọn) seed bản ghi trống `default_workflows` với `{}`.
2) Chạy `supabase db push` hoặc `supabase db commit` (sau khi tạo file) kèm psql để kiểm chứng trong local (dùng psql như hướng dẫn).

## Backend/API
- TRPC router mới hoặc mở rộng router admin settings:
  - Endpoint `getSettings(keys: string[])`: trả về map key/value.
  - Endpoint `upsertSettings(payload: { key, value, category?, description? }[])`.
  - Validate role admin/manager; dùng profiles.id trong trường `updated_by`.
  - Với `default_workflows`, check tồn tại workflow ids trước khi upsert.
  - Cache nhẹ (optional) bằng revalidation hoặc keep on client fetch.
- Cập nhật `physical-products` router (nếu có stub `system_settings`) để dùng bảng mới hoặc xoá code thừa tránh lỗi.

## Frontend
- Trang `/admin/app-settings`:
  - Thêm tab/section “Workflow mặc định”.
  - Fetch key `default_workflows` khi load; hiển thị dropdown theo loại phiếu (phiếu yêu cầu dịch vụ, phiếu dịch vụ).
  - Dropdown options lấy từ danh sách workflows (reuse query hiện có).
  - Nút “Lưu” gọi endpoint upsert; toast thành công/thất bại; disable khi đang lưu.
  - Hiển thị nhãn “(Mặc định hiện tại)” khi option trùng với giá trị đã lưu.
- Form tạo phiếu:
  - Khi mở form phiếu yêu cầu dịch vụ/phiếu dịch vụ, fetch `default_workflows`.
  - Nếu có workflow hợp lệ → set giá trị mặc định của dropdown workflow.
  - Nếu id không tồn tại hoặc missing → giữ behavior hiện tại + cảnh báo nhẹ (optional).

## Kiểm thử
- Unit:
  - Validator default_workflows (validate workflow tồn tại, schema JSON).
  - TRPC procedures quyền admin/manager vs user thường.
- Integration:
  - Upsert và đọc `system_settings` qua router; kiểm tra ghi nhận `updated_by`.
- E2E (Playwright):
  - Đăng nhập admin → vào `/admin/app-settings` → chọn workflow mặc định → lưu.
  - Tạo phiếu yêu cầu dịch vụ, phiếu dịch vụ → kiểm tra dropdown workflow được preselect theo thiết lập.
  - Trường hợp workflow bị xoá: đảm bảo form không crash và không auto-select; hiển thị cảnh báo.

## Triển khai & an toàn
- Migration trước, verify bằng psql (psql trong container/quy định).
- Triển khai backend router, sau đó UI.
- Đảm bảo rollback an toàn: migration có thể drop bảng mới nếu chưa dùng; feature flag: nếu fetch settings lỗi, fallback behavior cũ.

## Ghi chú bổ sung
- Tuân thủ yêu cầu: luôn dùng `profiles.id` cho `updated_by`.
- Không thay đổi hành vi hiện tại khi không có cấu hình mặc định.
