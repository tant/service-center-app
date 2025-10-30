# Service Request Form Fields by Step

Danh sách trường dữ liệu cần thu thập cho từng bước trong wizard `/service-request`.

## Bước 1: Thông tin khách hàng
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `customer_name` | string | ✔ | Tối thiểu 2 ký tự, không chấp nhận chỉ khoảng trắng. |
| `customer_email` | string (email) | ✔ | Kiểm tra định dạng RFC cơ bản, nên chuẩn hóa lowercase. |
| `customer_phone` | string | ✔ | Tối thiểu 10 số, có thể áp dụng mask +84/0. |

## Bước 2: Thông tin bảo hành (đa serial)
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `serial_numbers[]` | string[] | ✔ | Mỗi serial tối thiểu 5 ký tự, upper-case trước khi lưu. |
| `verifiedItems[]` | object[] | ✔ | UI state chứa kết quả `verifyWarranty` (serial, product, eligible, warranty, message, status); không gửi lên API. |
| `verifiedItems[].status` | `'pending' \| 'success' \| 'error'` | ✔ | UI state cho trạng thái kiểm tra từng serial. |
| `verifiedItems[].error` | string | ✖ | UI state: lưu thông báo lỗi nếu kiểm tra thất bại. |

## Bước 3: Thông tin sản phẩm
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `issue_description` | string | ✔ | Mô tả tổng quát toàn bộ yêu cầu (>= 20 ký tự); map `service_requests.issue_description`. |
| `service_type` | `'warranty' \| 'paid' \| 'replacement'` | ✔ | Một giá trị cho toàn request; map `service_requests.service_type`. |
| `items[]` | object[] | ✔ | Danh sách sản phẩm sẽ gửi sau khi lọc từ `verifiedItems`; map `service_request_items`. |
| `items[].serial_number` | string | ✔ | Kế thừa từ bước 2, upper-case. |
| `items[].product_brand` | string | ✖ | Ánh xạ `service_request_items.product_brand`; tự điền từ lookup hoặc nhập tay. |
| `items[].product_model` | string | ✖ | Ánh xạ `service_request_items.product_model`; tự điền từ lookup hoặc nhập tay. |
| `items[].purchase_date` | string (ISO) | ✖ | Lưu nếu khách cung cấp; map `service_request_items.purchase_date`. |
| `items[].issue_description` | string | ✖ | Mô tả riêng từng sản phẩm (>= 10 ký tự nếu nhập); map `service_request_items.issue_description`. |
| `items[].eligible` | boolean | ✖ | UI state để hiển thị cảnh báo; không gửi lên API. |

## Bước 4: Thông tin tiếp nhận sản phẩm
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `preferred_delivery_method` | `'pickup' \| 'delivery'` | ✔ | Giá trị điều khiển giao diện phần địa chỉ. |
| `delivery_address` | string | ✖ | Bắt buộc nếu `preferred_delivery_method === 'delivery'`, tối thiểu 10 ký tự. |
| `pickup_notes` | string | ✖ | Ghi chú thêm (ví dụ thời gian mong muốn). |
| `preferred_schedule` | string/date | ✖ | Tùy chọn, nhập khi cần đặt lịch hẹn. |

## Bước 5: Review & Confirm
| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `honeypot` | string | ✖ | Trường ẩn chống spam, phải rỗng khi submit. |
| `consent_confirmed` | boolean | ✔ | UI state bảo đảm người dùng đồng ý; không nằm trong schema Supabase. |
| `payload` | object | ✔ | Dữ liệu tổng hợp gửi `submitRequest` theo `submitRequestSchema` (customer + issue + items + delivery). |
