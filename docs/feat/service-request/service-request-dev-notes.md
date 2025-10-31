# Service Request Flow — Implementation Notes

Danh sách thay đổi cần thực hiện để triển khai luồng `/service-request` mới.

## Schema updates
- Cho phép lưu `service_option` cho từng sản phẩm và bỏ field tổng:
  - Migration thêm cột `service_option public.service_type` (hoặc enum tương ứng) vào `service_request_items`.
  - Migration drop `service_requests.service_type` (cùng với cập nhật constraint phụ thuộc nếu có).
  - Backfill giá trị mặc định cho dữ liệu hiện hữu trước khi loại bỏ cột.
  - Cập nhật Supabase types + adapters API nhận/trả trường mới và xóa tham chiếu cũ.
- Lưu ghi chú lịch hẹn và phương án nhận sản phẩm:
  - Migration thêm `preferred_schedule` (nullable date) và `pickup_notes` (nullable text) vào `service_requests`.
  - Điều chỉnh tRPC/service layer để xử lý hai trường này.
- Mô tả tổng quát cho yêu cầu:
  - Thực hiện migration cho phép NULL/DEFAULT trên `service_requests.issue_description`.
  - Điều chỉnh validation phía UI/API để xử lý trường không bắt buộc nhưng sinh giá trị fallback khi cần.

## Backend & API
- Cập nhật schema validation (Zod/tRPC) cho payload mới (`customer`, `products[]`, `service_option`, `delivery`, `schedule`).
- Đảm bảo upload ảnh theo sản phẩm:
  - Endpoint/tRPC handler nhận metadata attachments và map vào `service_request_items.issue_photos`.
- Auto-fill khách hàng bởi số điện thoại:
  - API endpoint/query tìm `service_requests`/CRM by `customer_phone`.
  - Xử lý debounce, caching và fallback nếu không tìm thấy.

## Frontend UI/UX
- Wizard 4 bước:
  - Bước 1: Form đa sản phẩm với upload ảnh, validation serial ≥ 5 ký tự.
  - Bước 2: Kiểm tra bảo hành từng sản phẩm, toggle bảo hành, chọn dịch vụ bắt buộc.
  - Bước 3: Form khách hàng + tiếp nhận, auto-fill và validate địa chỉ theo phương thức.
  - Bước 4: Review, chỉnh sửa, submit payload mới + honeypot.
- State management:
  - Tạo hook/context `useServiceRequestWizard` lưu `products`, `customer`, `delivery`, `metadata`.
  - Reset state có kiểm soát khi xóa sản phẩm hoặc quay lại bước trước.
- Xử lý upload ảnh:
  - Tích hợp queue upload (ví dụ Supabase Storage/S3 presigned).
  - Hiển thị tiến trình và cho phép xóa ảnh khỏi sản phẩm.

## QA & Testing
- Unit test cho reducer/state wizard (thêm/xóa sản phẩm, chọn dịch vụ).
- Integration test API payload (bao gồm `service_option`, `preferred_schedule`, `pickup_notes`).
- Playwright spec bao phủ:
  - Flow bảo hành hợp lệ + dịch vụ trả phí.
  - Auto-fill khách hàng theo số điện thoại.
  - Submission với nhiều sản phẩm & ảnh đính kèm.
