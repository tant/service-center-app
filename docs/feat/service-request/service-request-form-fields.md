# Service Request Form Fields by Step

Danh sách trường dữ liệu cần thu thập cho từng bước trong wizard `/service-request`.

## Bước 1: Sản phẩm và vấn đề
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `request_issue_overview` | string | ✖ | Mô tả tổng quát toàn bộ yêu cầu; map `service_requests.issue_description` (nullable). |
| `products[]` | object[] | ✔ | Ít nhất một sản phẩm trong yêu cầu. |
| `products[].id` | string | ✔ | UUID tạm để theo dõi sản phẩm trong UI. |
| `products[].serial_number` | string | ✔ | Tối thiểu 5 ký tự, upper-case trước khi lưu. |
| `products[].product_brand` | string | ✖ | Cho phép nhập tay hoặc chọn từ danh sách. |
| `products[].product_model` | string | ✖ | Cho phép nhập tay hoặc chọn từ danh sách. |
| `products[].purchase_date` | string (ISO) | ✖ | Lưu nếu khách cung cấp thông tin mua. |
| `products[].issue_description` | string | ✔ | Tối thiểu 10 ký tự cho từng sản phẩm. |
| `products[].attachments[]` | File[]/string[] | ✖ | Ảnh tải lên bucket `service_media` (`10MiB`, JPEG/PNG/GIF/WebP). |

## Bước 2: Kiểm tra bảo hành và giải pháp
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `products[].warranty_check` | object | ✖ | UI state kết quả kiểm tra (`status`, `eligible`, `message`, `expires_at`). |
| `products[].warranty_check.status` | `'idle' \| 'pending' \| 'success' \| 'error'` | ✔ | Trạng thái kiểm tra từng sản phẩm. |
| `products[].warranty_check.eligible` | boolean | ✖ | Cho biết sản phẩm đủ điều kiện bảo hành. |
| `products[].warranty_requested` | boolean | ✖ | Người dùng đánh dấu có muốn bảo hành. |
| `products[].service_option` | `'warranty' \| 'paid' \| 'replacement'` | ✔ | Enum `public.service_type`; lưu cho từng sản phẩm. |
| `products[].service_option_notes` | string | ✖ | Ghi chú thêm nếu dịch vụ yêu cầu mô tả chi tiết. |

## Bước 3: Khách hàng và tiếp nhận
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `customer_name` | string | ✔ | Tối thiểu 2 ký tự, không chấp nhận chỉ khoảng trắng. |
| `customer_email` | string (email) | ✔ | Kiểm tra định dạng, chuyển lowercase trước khi lưu. |
| `customer_phone` | string | ✔ | Tối thiểu 10 số, dùng để auto-fill thông tin. |
| `customer_address` | string | ✖ | Auto-fill nếu lookup có dữ liệu; cho phép chỉnh sửa. |
| `preferred_delivery_method` | `'pickup' \| 'delivery'` | ✔ | Điều khiển giao diện phần địa chỉ/lịch hẹn. |
| `delivery_address` | string | ✖ | Bắt buộc nếu chọn `delivery`, tối thiểu 10 ký tự. |
| `preferred_schedule` | date | ✖ | Lịch hẹn giao nhận (chuẩn ISO YYYY-MM-DD). |
| `pickup_notes` | string | ✖ | Ghi chú khi khách tự mang sản phẩm tới. |
| `contact_notes` | string | ✖ | Thông tin liên hệ bổ sung nếu cần. |

## Bước 4: Xem lại và xác nhận
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `review_summary` | object | ✔ | UI state tổng hợp dữ liệu đã nhập. |
| `consent_confirmed` | boolean | ✔ | Người dùng đồng ý điều khoản trước khi gửi. |
| `honeypot` | string | ✖ | Trường ẩn chống spam, phải rỗng khi submit. |
| `payload` | object | ✔ | Dữ liệu chuẩn hóa gửi `submitRequest`: `{ customer, products[], delivery, notes }`. |
