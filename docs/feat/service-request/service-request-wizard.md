# Service Request Multi-Step Flow

Phác thảo chi tiết quy trình mới của form `/service-request` với 5 bước, dữ liệu cần thu thập, kiểm tra hợp lệ và các hành vi tương tác.

## Bước 1: Thông tin khách hàng
- Trường bắt buộc: `customer_name` (tối thiểu 2 ký tự), `customer_email` (định dạng email), `customer_phone` (tối thiểu 10 ký tự).
- Có thể bổ sung ghi chú UX: nhắc người dùng sẵn sàng chuẩn bị hóa đơn/phiếu bảo hành.
- Khi hợp lệ mới cho phép chuyển sang bước 2. Dữ liệu lưu tạm trong state form.

## Bước 2: Thông tin bảo hành (đa serial)
- Giao diện cho phép thêm nhiều serial:
  - Ô nhập serial (tự chuyển uppercase), nút `Thêm sản phẩm`.
  - Danh sách serial đã nhập hiển thị trạng thái kiểm tra (đang kiểm tra/thành công/thất bại).
- Với mỗi serial mới:
  - Gọi `useVerifyWarranty` để lấy thông tin `product`, `warranty`, `eligible`, `message`.
  - Lưu kết quả vào `verifiedItems`: `{ serial, status, product, warranty, eligible, message, error? }`.
- Cho phép thao tác trên từng mục:
  - Thử kiểm tra lại khi thất bại.
  - Xóa serial khỏi danh sách.
- Có thể tiếp tục sang bước 3 ngay cả khi serial không còn bảo hành (giữ cờ `eligible` = false để cảnh báo kế tiếp).

## Bước 3: Thông tin sản phẩm
- Hiển thị danh sách `verifiedItems` từ bước 2:
  - Thẻ/bảng gồm serial, tên sản phẩm (brand/model), trạng thái bảo hành (ví dụ còn X ngày, đã hết).
  - Cảnh báo rõ ràng nếu `eligible` = false.
- Thu thập dữ liệu cần gửi lên API:
  - `issue_description` tổng quát cho toàn bộ yêu cầu (textarea, tối thiểu 20 ký tự) — ánh xạ `service_requests.issue_description`.
  - Với từng sản phẩm, cho phép bổ sung `issue_description` riêng tối thiểu 10 ký tự (lưu vào `service_request_items.issue_description` nếu được nhập).
- Lựa chọn `service_type` cho toàn bộ phiếu (`warranty`, `paid`, `replacement`); gợi ý mặc định dựa trên trạng thái bảo hành nhưng chỉ lưu một giá trị ở mức request.
- Cho phép loại bỏ sản phẩm khỏi danh sách (gỡ khỏi `verifiedItems` và khỏi payload `items`).
- Nếu danh sách trống sau khi loại bỏ, yêu cầu quay lại bước 2 để nhập serial mới.

## Bước 4: Thông tin tiếp nhận sản phẩm
- Chọn `preferred_delivery_method`:
  - `pickup`: khách tự mang đến, hiển thị thông tin địa chỉ trung tâm, giờ làm việc.
  - `delivery`: thu gom/giao nhận, yêu cầu `delivery_address` (textarea, tối thiểu 10 ký tự).
- Có thể bổ sung trường tùy chọn: `pickup_notes`, `preferred_schedule` nếu cần.
- Kiểm tra hợp lệ trước khi tiếp tục: địa chỉ bắt buộc khi chọn `delivery`.

## Bước 5: Review & Confirm
- Tổng hợp toàn bộ dữ liệu:
  - Thông tin khách hàng.
  - Mô tả tổng quát và danh sách sản phẩm kèm trạng thái bảo hành, mô tả chi tiết.
  - Phương thức tiếp nhận và địa chỉ (nếu có).
- Cho phép quay lại các bước trước để chỉnh sửa.
- Khi nhấn xác nhận:
  - Gọi `submitRequest` với payload gồm dữ liệu khách hàng, mô tả tổng quát, danh sách sản phẩm (serial uppercase, mô tả chi tiết), `service_type`, phương thức giao nhận, địa chỉ và trường `honeypot`.
  - Hiển thị trạng thái gửi (`isSubmitting`), xử lý lỗi bằng toast.
  - Thành công: điều hướng `/service-request/success?token=<tracking_token>`.

## Lưu ý triển khai
- Giữ state tập trung (`formData`, `verifiedItems`, `honeypot`) và reset phù hợp khi người dùng quay lại các bước trước.
- Bảo đảm điều kiện disabled cho nút `Tiếp tục` theo từng bước để tránh gửi thiếu dữ liệu.
- Xem xét tách nhỏ các bước thành component con để dễ bảo trì và viết test.
