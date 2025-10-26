# Hướng dẫn sử dụng cho Quản trị viên - Giai đoạn 2

**Cập nhật lần cuối:** 2025-10-26
**Đối tượng:** Quản trị viên Hệ thống

---

## Giới thiệu

Là Quản trị viên Hệ thống, bạn có toàn quyền truy cập vào tất cả các tính năng của hệ thống Service Center. Hướng dẫn này bao gồm các tính năng của Giai đoạn 2, bao gồm quản lý quy trình công việc, hoạt động kho, và cấu hình hệ thống.

### Trách nhiệm của bạn

*   Tạo và quản lý các mẫu công việc.
*   Thiết lập và cấu hình các vị trí kho.
*   Quản lý danh mục sản phẩm và hàng tồn kho.
*   Giám sát các hoạt động RMA (trả hàng).
*   Quản lý tài khoản và quyền của người dùng.

---

## Bắt đầu

### Truy cập Hệ thống

1.  Truy cập URL của ứng dụng.
2.  Đăng nhập bằng thông tin đăng nhập của quản trị viên.

### Dashboard của Admin

Sau khi đăng nhập, bạn sẽ thấy dashboard của admin với menu điều hướng cho phép truy cập vào tất cả các khu vực của hệ thống.

---

## Quản lý Mẫu Công việc (Task Template)

*   **Mẫu công việc là gì?** Chúng định nghĩa một chuỗi các công việc mà kỹ thuật viên phải hoàn thành cho các loại dịch vụ khác nhau.
*   **Tạo Mẫu mới:**
    1.  Điều hướng đến **Workflows → Templates**.
    2.  Nhấp vào **"+ New Template"**.
    3.  Điền các chi tiết (tên, loại dịch vụ, chế độ thực thi: `Strict` hoặc `Flexible`).
    4.  Thêm các công việc từ thư viện, sắp xếp chúng theo thứ tự, và đánh dấu là bắt buộc hoặc tùy chọn.
    5.  Lưu mẫu.
*   **Quản lý các Mẫu hiện có:** Bạn có thể chỉnh sửa, hủy kích hoạt, hoặc xóa các mẫu. Việc chỉnh sửa một mẫu sẽ chỉ ảnh hưởng đến các phiếu sửa chữa mới.

---

## Thiết lập Hệ thống Kho

*   **Các loại Kho:** Hệ thống bao gồm **Kho vật lý** (do người dùng định nghĩa) và **Kho ảo** (do hệ thống quản lý, ví dụ: `Đang sửa chữa`, `Đã sửa xong`).
*   **Tạo Kho vật lý:**
    1.  Điều hướng đến **Warehouses**.
    2.  Nhấp vào **"+ New Warehouse"** và điền các chi tiết.

---

## Quản lý Sản phẩm và Hàng tồn kho

*   **Đăng ký Sản phẩm Vật lý:**
    1.  Điều hướng đến **Dashboard → Inventory → Products**.
    2.  Nhấp vào **"Register Product"** và điền các chi tiết, bao gồm số serial duy nhất.
    3.  Bạn cũng có thể nhập hàng loạt sản phẩm bằng tệp CSV.
*   **Cảnh báo Tồn kho Thấp:** Đặt ngưỡng tồn kho cho các linh kiện. Hệ thống sẽ hiển thị cảnh báo khi số lượng giảm xuống dưới ngưỡng này.

---

## Quản lý Người dùng

*   **Trang:** `/management/team`
*   **Các vai trò Người dùng:** Admin, Manager, Technician, Reception.
*   **Tạo Người dùng Mới:** Thêm thành viên mới và gán vai trò phù hợp. Hệ thống sẽ gửi một email mời để thiết lập mật khẩu.
*   **Quản lý Người dùng Hiện có:** Chỉnh sửa thông tin, thay đổi vai trò, hoặc hủy kích hoạt tài khoản.

---

## Cấu hình Hệ thống

### Cài đặt Ban đầu

*   Tạo tài khoản admin qua trang `/setup`.
*   Thêm các thành viên trong nhóm.
*   Tạo các mẫu công việc và thiết lập kho.
*   Nhập danh mục sản phẩm và linh kiện.

### Quản lý Cơ sở dữ liệu

*   Sử dụng Supabase Studio (`http://localhost:54323`) để truy cập trực tiếp vào cơ sở dữ liệu, chạy các truy vấn SQL, và xem log.
*   Sử dụng các lệnh của Supabase CLI để sao lưu và khôi phục cơ sở dữ liệu.

---

## Xử lý sự cố

*   **Không thể tạo mẫu công việc:** Kiểm tra xem đã thêm ít nhất một công việc chưa và thứ tự các công việc là duy nhất.
*   **Sản phẩm không xuất hiện trong kho:** Xác minh sản phẩm có số serial hợp lệ và làm mới materialized view (`REFRESH MATERIALIZED VIEW v_warehouse_stock_levels;`).
*   **Email không được gửi:** Kiểm tra bảng `email_notifications` để tìm lỗi và xác minh địa chỉ email của khách hàng.

**End of Admin User Guide**