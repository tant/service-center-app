# Service Request Multi-Step Flow

Mô tả chi tiết luồng mới của form `/service-request` với 4 bước, dữ liệu cần thu thập, kiểm tra hợp lệ và các hành vi tương tác.

## Bước 1: Sản phẩm và vấn đề
- Cho phép thêm một hoặc nhiều sản phẩm trong cùng yêu cầu:
  - Mỗi sản phẩm bao gồm các trường cơ bản (`serial_number`, `product_brand`, `product_model`, `purchase_date?`).
  - Thu thập mô tả vấn đề riêng (`issue_description`, tối thiểu 10 ký tự) để hiểu rõ triệu chứng.
  - Hỗ trợ upload nhiều ảnh cho từng sản phẩm; lưu metadata theo sản phẩm để gửi kèm payload hoặc xử lý upload trước.
- Cung cấp trường mô tả tổng quát (tùy chọn) cho toàn bộ yêu cầu; lưu để map `service_requests.issue_description` khi cần.
- Khi thêm sản phẩm mới, yêu cầu nhập serial hợp lệ (>= 5 ký tự, auto uppercase).
- Kiểm tra hợp lệ trước khi tiếp tục: phải có ít nhất một sản phẩm với serial hợp lệ và mô tả vấn đề hợp lệ; ảnh là tùy chọn.
- State lưu theo cấu trúc `products[]`: `{ id, serial_number, issue_description, attachments[], ... }`. Tạo `id` tạm (UUID) để theo dõi khi thêm/xóa.
- Upload ảnh tham chiếu bucket `service_media` (`public = true`, `10MiB`, `image/jpeg|png|gif|webp`) theo cấu hình `supabase/config.toml`.

## Bước 2: Kiểm tra bảo hành và giải pháp
- Người dùng chọn những sản phẩm trong danh sách muốn kiểm tra bảo hành; các sản phẩm khác vẫn có thể gửi như dịch vụ thường.
- Với mỗi sản phẩm được chọn:
  - Gọi `useVerifyWarranty` hoặc API tương tự để lấy kết quả (`eligible`, `warranty`, `message`, `expires_at`).
  - Hiển thị trạng thái kiểm tra (đang xử lý, thành công, lỗi) và thông tin kết quả rõ ràng.
- Cho phép khách bật/tắt flag “yêu cầu bảo hành” cho từng sản phẩm sau khi xem kết quả.
- Bắt buộc chọn một dịch vụ xử lý hợp lệ cho từng sản phẩm (`service_option`):
  - Options dựa trên enum `public.service_type` (hiện: `warranty`, `paid`, `replacement`); mở rộng nếu schema cập nhật.
  - Validate để ngăn submit khi sản phẩm chưa chọn dịch vụ.
- Cho phép loại bỏ sản phẩm khỏi yêu cầu hoặc quay lại chỉnh sửa thông tin sản phẩm nếu cần; trạng thái bảo hành cập nhật theo lần kiểm tra gần nhất.

## Bước 3: Khách hàng và tiếp nhận sản phẩm
- Thu thập thông tin khách hàng bắt buộc: `customer_name` (>= 2 ký tự), `customer_phone` (>= 10 ký tự), `customer_email` (định dạng email).
- Khi nhập số điện thoại:
  - Thực hiện lookup (debounced) để auto-fill họ tên, email, địa chỉ hoặc lịch sử dịch vụ nếu tồn tại.
  - Cho phép người dùng chỉnh sửa lại giá trị auto-fill trước khi tiếp tục.
- Thu thập phương thức tiếp nhận:
  - `preferred_delivery_method`: `pickup` (khách tự mang tới) hoặc `delivery` (thu gom/giao nhận).
  - Nếu `delivery`, yêu cầu `delivery_address` (tối thiểu 10 ký tự) và cho phép thêm `preferred_schedule`.
  - Nếu `pickup`, cung cấp thông tin chi nhánh/giờ làm việc và tùy chọn `pickup_notes`.
- Có thể lưu thêm trường `contact_notes` hoặc kênh liên hệ ưu tiên khi cần; bảo đảm disabled step khi thiếu dữ liệu bắt buộc.

## Bước 4: Xem lại và xác nhận
- Tổng hợp toàn bộ dữ liệu để người dùng kiểm tra:
  - Thông tin khách hàng, phương thức tiếp nhận và chi tiết địa chỉ/lịch hẹn.
  - Danh sách sản phẩm với mô tả, ảnh, trạng thái bảo hành (nếu có) và dịch vụ xử lý đã chọn.
  - Cảnh báo các sản phẩm không đủ điều kiện bảo hành (ví dụ highlight màu) nhưng vẫn gửi kèm dịch vụ đã chọn.
- Cho phép quay lại từng bước để chỉnh sửa; giữ state đã nhập khi di chuyển giữa các bước.
- Khi xác nhận:
  - Chuẩn hóa payload gửi `submitRequest`: gồm `customer`, `products` (serial, issue, service_option, attachments), flags bảo hành, phương thức tiếp nhận, `honeypot`.
  - Hiển thị trạng thái gửi (`isSubmitting`), xử lý lỗi bằng toast/banner.
  - Thành công: điều hướng tới `/service-request/success?token=<tracking_token>` hoặc trang xác nhận tương tự.

## Lưu ý triển khai
- State tổng hợp nên gói trong context hoặc hook (`useServiceRequestWizard`) để đồng bộ dữ liệu giữa các bước.
- Khi người dùng xóa sản phẩm sau khi đã kiểm tra bảo hành, phải dọn sạch kết quả liên quan để tránh payload thừa.
- Xử lý upload ảnh theo queue (pre-signed URL hoặc tạm lưu) và hiển thị tiến trình; bảo đảm xóa file khi người dùng loại bỏ sản phẩm.
- Disable nút `Tiếp tục` và `Xác nhận` theo điều kiện hợp lệ của từng bước để tránh gửi thiếu dữ liệu.
- Viết test bao phủ: kiểm tra auto-fill khách hàng theo số điện thoại, chọn dịch vụ bắt buộc, điều kiện bảo hành không đủ, và gửi payload nhiều sản phẩm.
