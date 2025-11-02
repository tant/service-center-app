# Kế hoạch triển khai luồng `/service-request` mới

## Bối cảnh & mục tiêu
- Điều chỉnh form công khai `/service-request` theo luồng 4 bước mô tả trong `service-request-wizard.md`.
- Hợp nhất dữ liệu thu thập để hỗ trợ nhiều sản phẩm, kiểm tra bảo hành, phương án tiếp nhận và payload mới gửi backend.
- Bảo đảm schema Supabase, tRPC API và UI/UX đồng bộ, có test bao phủ quy trình chính.

## Phạm vi công việc
- Frontend (Next.js App Router, hooks, upload queue).
- Backend (Supabase migrations, tRPC router, adapters).
- Liên kết lưu trữ `service_media` cho ảnh sản phẩm.
- Testing (unit, integration, e2e) và QA thủ công.

## Lộ trình chi tiết

### 1. Chuẩn bị & dọn dẹp
- [x] Rà soát các component/hook hiện dùng trong `src/app/(public)/service-request/page.tsx` và xác định phần logic có thể tái sử dụng.  
  - Ghi chú: Giữ lại logic gọi `useVerifyWarranty`, `useSubmitServiceRequest`; cần refactor state cục bộ thành context + payload mới.
- [x] Tạo tài liệu sơ đồ state (context) để theo dõi các trường trong wizard (`docs/feat/service-request/service-request-state-diagram.md`).
- [x] Thống nhất giới hạn ảnh/sản phẩm (mặc định 10 ảnh, 10 sản phẩm) với stakeholder.  
  - Tạm thời chốt theo tài liệu hiện tại: tối đa 10 sản phẩm mỗi yêu cầu, 5 ảnh mỗi sản phẩm, 10 MiB/ảnh và định dạng JPEG/PNG/GIF/WebP; sẽ cập nhật nếu nhận yêu cầu mới.

### 2. Kiến trúc frontend mới
- [x] Tạo `ServiceRequestWizardProvider` + hook `useServiceRequestWizard` tại `src/hooks/use-service-request-wizard.ts` để quản lý state toàn cục.
  - State: `products[]` (UUID tạm, serial, issue, attachments, warranty metadata, service_option), `customer`, `delivery`, `review`, `honeypot`.
  - Export reducer/actions cho thêm/xóa cập nhật sản phẩm, reset khi quay lại.
- [x] Di chuyển trang chính sang component `ServiceRequestWizard` với 4 bước (Step components trong `src/app/(public)/service-request/components/steps/`).
- [ ] Xây dựng step UI:
  - [x] **Sản phẩm & vấn đề**: dynamic list, serial validation (≥5 ký tự, uppercase), issue ≥10 ký tự, brand/model/purchase date tùy chọn, upload queue (preview, tiến trình, xoá).  
    - Skeleton UI + validation cơ bản đã dựng (chưa tích hợp upload).
  - [x] **Kiểm tra bảo hành & giải pháp**: gọi `useVerifyWarranty`, cho phép chọn sản phẩm cần kiểm tra, cập nhật `service_option`, retry, remove.  
    - Đã cộng nối API kiểm tra bảo hành, hiển thị trạng thái/alert, chọn dịch vụ và ghi chú.
  - [x] **Khách hàng & tiếp nhận**: thu thập name/email/phone, debounce lookup số điện thoại, hỗ trợ `preferred_delivery_method`, `delivery_address`, `preferred_schedule`, `pickup_notes`, `contact_notes`.  
    - Đã thêm hook `useCustomerLookup` với debounce, auto-fill khách hàng và hàm tra cứu server-side tạm thời; cần mở rộng khi schema cập nhật.
  - [x] **Xem lại & xác nhận**: hiển thị tổng hợp, highlight sản phẩm không đủ bảo hành, checkbox consent, input honeypot (ẩn), điều hướng quay lại.  
    - Hiển thị summary khách hàng, tiếp nhận, sản phẩm; badge phân loại bảo hành và link quay lại chỉnh sửa.
  - Đã dựng skeleton các step component và wiring state; sẽ bổ sung logic chi tiết theo từng bước tiếp theo.
- [x] Điều chỉnh điều hướng / bước:
  - Bộ điều khiển tiến lùi chung (disable theo validation).
  - Lưu state khi chuyển bước; reset validation khi xoá sản phẩm.
- Navigation cơ bản đã hoạt động; logic disable theo validation sẽ cập nhật sau khi hoàn thiện từng step.
- [x] Payload builder mới: chuẩn hóa dữ liệu gửi đi `{ customer, products[], delivery, issue_overview?, honeypot }`.  
  - Đã thêm hàm `buildWizardPayload`; hiện tạm map payload cũ khi gọi tRPC cho tới khi backend hỗ trợ schema mới.
- [x] Chạy `pnpm build` và xử lý lỗi build (nếu có) trước khi chuyển sang bước 3.  
  - Lần build đầu báo lỗi vì file hook dùng JSX với đuôi `.ts`; đã đổi sang `.tsx` và build lại thành công.

### 3. Xử lý upload ảnh
- [x] Tạo util upload (`src/utils/upload-service-media.ts`) dùng Supabase client, queue, abort controller.  
  - Đã hỗ trợ sanitise filename, giới hạn kích thước/định dạng và callback tiến trình.
- [x] Ràng buộc dung lượng (≤10 MiB) và định dạng (`image/jpeg|png|gif|webp`).
- [x] Lưu metadata attachment `{ id, file_name, path, size, type, status }` trong state sản phẩm.  
  - Đã cập nhật progress/preview cục bộ; bước xóa file khỏi bucket sẽ thực hiện sau.
- [ ] Thiết kế cơ chế preload ảnh đã upload (nếu submit thất bại) và retry.

### 4. Backend & Supabase
- [ ] Migration 1: `service_request_items`
  - Thêm `service_option public.service_type not null`.
  - Cho phép `product_brand`, `product_model` nullable; mở rộng `issue_photos` thành JSONB metadata chuẩn (`[{path,url,size,type}]`).
  - Backfill `service_option` từ `service_requests.service_type`, cập nhật function/triggers liên quan.
  - ✅ Đã tạo `supabase/migrations/20251102090000_update_service_request_items.sql` thêm cột mới, backfill giá trị và chuẩn hóa `issue_photos` thành mảng metadata.
  - ✅ Đã loại bỏ cột `warranty_requested` bằng `supabase/migrations/20251103090000_drop_warranty_requested_from_service_request_items.sql`.
- [ ] Migration 2: `service_requests`
  - Thêm `preferred_schedule date`, `pickup_notes text`, `contact_notes text`.
  - Đổi `delivery_method` -> `preferred_delivery_method` (nếu cần) và constraint yêu cầu địa chỉ khi delivery.
  - Cho phép `issue_description` nullable (mô tả tổng quát tùy chọn).
  - Bỏ cột `service_type` cấp request sau khi backfill (giữ migration riêng để dễ rollback).
  - ✅ Đã tạo `supabase/migrations/20251102091000_update_service_requests.sql` thêm cột delivery metadata, sao chép `delivery_method` sang `preferred_delivery_method`, drop `service_type`, và cho phép `issue_description` nullable.
- [x] Regenerate Supabase types (`pnpm supabase types gen ...`) và cập nhật `src/types/database.types.ts`.
- [ ] Cập nhật adapters/tRPC:
  - `submitRequestSchema` nhận payload mới, validate per-product `service_option`, delivery metadata ✔️.
  - Map attachments -> `issue_photos` với metadata; vệ sinh serial uppercase, mô tả trim ✔️ (payload hiện lưu trực tiếp metadata người dùng cung cấp, cần bổ sung link Supabase khi sẵn).
  - Điều chỉnh logic insert `service_request_items` tương ứng trường mới ✔️.
- [ ] Thêm endpoint `lookupCustomerByPhone` trả về `{ name, email, address, history }` lấy từ bảng khách hàng/requests gần nhất, có throttle.
- [ ] Bổ sung caching/bust logic cho kiểm tra bảo hành (nếu Supabase support).

### 5. Hooks & client utilities
- [ ] Cập nhật `useSubmitServiceRequest` để nhận payload mới; handle lỗi mới (thiếu service_option, ảnh quá dung lượng).
- [x] Tạo hook `useCustomerLookup(phone)` sử dụng endpoint mới với debounce trong Step 3.
- [x] Viết helper `useAttachmentQueue(productId)` tách logic upload khỏi component.  
  - `StepProducts` đã sử dụng hook mới để xử lý thêm/xóa ảnh và tiến trình upload.

### 6. Testing & QA
- **Unit**
  - [ ] Kiểm tra reducer state wizard (thêm/xóa sản phẩm, cập nhật service_option, reset attachments).
  - [ ] Test helper validation (serial, mô tả, địa chỉ).
  - [ ] Test upload util (chặn file lớn/định dạng sai).
- **Integration**
  - [ ] Test tRPC `submit` với payload hợp lệ nhiều sản phẩm và các biến thể (delivery/pickup, tùy chọn `service_option`).
  - [ ] Test migration backfill (existing dữ liệu giữ nguyên, `service_option` default).
  - [ ] Test `lookupCustomerByPhone` với dữ liệu seed.
- **E2E (Playwright)**
  - [ ] Flow hạnh phúc: 2 sản phẩm, một đủ bảo hành, một không; delivery với lịch hẹn.
  - [ ] Flow chỉ pickup + multiple attachments.
  - [ ] Honeypot / consent guard (không tick -> disabled submit).
  - [ ] Auto-fill theo số điện thoại và chỉnh sửa lại.
- **QA thủ công**
  - [ ] Upload ảnh lớn/tệ định dạng -> báo lỗi.
  - [ ] Xóa sản phẩm sau khi kiểm tra bảo hành -> state sạch.
  - [ ] Submit lỗi mạng -> giữ state và ảnh.

### 7. Triển khai & chuyển giao
- [ ] Cập nhật tài liệu người dùng nội bộ (wiki/README) về quy trình nộp yêu cầu mới.
- [ ] Chuẩn bị script backfill/manual nếu cần migrate dữ liệu cũ.
- [ ] Lập kế hoạch release (chạy migration trước, deploy backend, rồi frontend).

## Phụ thuộc & rủi ro
- Cần xác nhận nguồn dữ liệu auto-fill (Supabase `service_requests` vs CRM khác).
- Quyền truy cập public vào bucket `service_media` phải đáp ứng upload ẩn danh.
- Phải đảm bảo rollback migration không làm mất `service_type` cũ.
- Quy mô tệp ảnh lớn có thể ảnh hưởng thời gian submit nếu không upload trước.

## Mốc thời gian đề xuất
1. **Ngày 1-2**: hoàn thiện kiến trúc frontend + context, migration draft.
2. **Ngày 3-4**: triển khai UI từng bước + upload queue, cập nhật tRPC.
3. **Ngày 5**: viết test (unit/integration), chuẩn bị Playwright.
4. **Ngày 6**: chạy QA thủ công, fix bug, cập nhật tài liệu và chuẩn bị release.

## Câu hỏi mở
- Có cần lưu ghi chú bổ sung cho từng `service_option` (ví dụ bắt buộc khi chọn `replacement`)?  
- Người dùng có thể lưu bản nháp (draft) hay bắt buộc hoàn thành trong một phiên?  
- Có yêu cầu gửi email xác nhận với tóm tắt sản phẩm/ảnh đính kèm mới không?  
- Thời gian timeout tối đa cho upload từng ảnh (để tối ưu retry)?
