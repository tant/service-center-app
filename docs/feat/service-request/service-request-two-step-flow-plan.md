# Kế hoạch cập nhật UI `/service-request/create` (2 bước)

## Mục tiêu
- Chuyển trang tạo yêu cầu dịch vụ sang luồng 2 bước: nhập serial và hoàn thiện phiếu.
- Đảm bảo có thể tái sử dụng component/form logic hiện có, tránh trùng lặp.
- Chuẩn bị sẵn nền tảng để mở rộng thêm bước hoặc điều kiện trong tương lai.

## Phạm vi
- Frontend: trang `/service-request/create`, component form, hook state.
- Service/API đã tồn tại để kiểm tra serial, bảo hành, tra cứu khách hàng.
- Không thay đổi backend lớn ngoài việc gọi lại API hiện có; nếu thiếu endpoint sẽ tạo ticket riêng.

## Kiến trúc tổng quan
- Giữ trang chính làm container `CreateServiceRequestPage`.
- Thêm state `currentStep` (`serial` | `form`) quản lý bằng hook cục bộ hoặc context nhỏ (`useServiceRequestCreateFlow`).
- Tách 2 component bước:
  - `SerialStep`: nhập & kiểm tra serial.
  - `RequestFormStep`: điền form tạo phiếu.
- Chia sẻ dữ liệu qua context/hook để tránh prop drilling; serial hợp lệ truyền sang bước 2.
- Tách logic gọi API vào `src/services/service-request` (hoặc module hiện có).

## Bước 1 – Nhập serial
- Form danh sách serial (tận dụng `react-hook-form` hoặc util hiện dùng cho dynamic field).
- Gọi `validateSerials(serials: string[])` (API hiện có hoặc mới) → trả về `success`, `invalidSerials`.
- Button "Tạo yêu cầu" bật khi `success === true`; disabled ngược lại, hiển thị lỗi từng serial.
- Khi chuyển bước, lưu danh sách serial hợp lệ vào context state.

## Bước 2 – Form yêu cầu
- Layout form: loại dịch vụ, mô tả, upload ảnh, thông tin khách hàng (phone, email, họ tên, địa chỉ), hidden `deliveryMethod = 'delivery'`.
- Khi mount bước 2:
  - Gọi API kiểm tra bảo hành theo serial → xác định `serviceType` (`warranty` hoặc `paid`), set vào form, disable input.
- Số điện thoại:
  - Sau khi nhập/blur, gọi API tra cứu.
  - Nếu tìm thấy khách hàng → auto fill `fullName`, `email` và disable chúng; nếu không, giữ editable.
- Upload ảnh: tái sử dụng component upload chung (nếu có), giới hạn dung lượng/định dạng theo chuẩn hiện tại.
- Submit handler gom dữ liệu form + serial đã lưu + `deliveryMethod`, gọi API tạo yêu cầu.

## API & dữ liệu
- `validateSerials`: GET/POST trả về tình trạng từng serial.
- `fetchWarrantyStatus(serials)` → map sang `serviceType`.
- `lookupCustomer(phone)` → trả về `fullName`, `email`.
- `submitServiceRequest(payload)` → payload gồm serials, serviceType, thông tin khách hàng, mô tả, file metadata, deliveryMethod.
- Đặt service/hook chung trong `src/services/service-request` hoặc `src/hooks/useServiceRequest` để dùng lại.

## UI/UX & thông báo
- Hiển thị trạng thái kiểm tra serial (success/error) theo component feedback chuẩn (toast/tag).
- Khi auto-fill họ tên/email, cho biết "Đã lấy thông tin tài khoản".
- Loading state cho từng API (spinner hoặc button loading).
- Giữ khả năng quay lại bước 1 để chỉnh serial (reset validation bước 2 nếu serial đổi).

## Kiểm thử
- Unit test cho:
  - Component serial: nút bật khi tất cả serial hợp lệ.
  - Logic chọn loại dịch vụ dựa vào dữ liệu bảo hành.
  - Tra cứu số điện thoại tự khóa trường họ tên/email.
- Integration/E2E (nếu hạ tầng sẵn): luồng hạnh phúc và trường hợp serial không hợp lệ.

## Theo dõi & mở rộng
- Ghi lại thiếu hụt API (nếu có) để mở issue backend.
- Cân nhắc tái sử dụng `SerialStep` cho các flow khác (VD: kiểm tra bảo hành độc lập).
- Chuẩn bị hook context cho phép thêm bước mới (ví dụ chọn phương thức nhận hàng khác) mà không đổi nhiều code.
