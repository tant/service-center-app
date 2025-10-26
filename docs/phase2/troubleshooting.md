# Hướng dẫn Xử lý Sự cố

**Phiên bản:** 1.0
**Cập nhật lần cuối:** 2025-10-26

---

## Nội dung chính

1.  [Sự cố với Quy trình Công việc](#sự-cố-với-quy-trình-công-việc)
2.  [Sự cố Quản lý Kho](#sự-cố-quản-lý-kho)
3.  [Sự cố Cổng thông tin Công cộng](#sự-cố-cổng-thông-tin-công-cộng)
4.  [Sự cố về Email](#sự-cố-về-email)

---

## Sự cố với Quy trình Công việc

**Vấn đề 1: Không thể hoàn thành công việc - Nút bị vô hiệu hóa**

*   **Triệu chứng:** Nút "Hoàn thành" có màu xám, không thể nhấp.
*   **Nguyên nhân có thể:** Quy trình đang ở chế độ "Nghiêm ngặt" và các công việc trước đó chưa hoàn thành.
*   **Giải pháp:**
    1.  Hoàn thành tất cả các công việc trước đó theo đúng thứ tự.
    2.  Nếu một công việc trước đó là tùy chọn, bạn có thể bỏ qua nó.

**Vấn đề 2: Công việc không xuất hiện trong trang "Công việc của tôi"**

*   **Triệu chứng:** Trang "Công việc của tôi" trống mặc dù bạn đã được giao việc.
*   **Nguyên nhân có thể:**
    *   Công việc chưa được giao cho bạn.
    *   Lỗi bộ nhớ đệm (cache) của trình duyệt.
*   **Giải pháp:**
    1.  Yêu cầu quản lý kiểm tra lại việc phân công công việc.
    2.  Tải lại trang bằng cách nhấn `Ctrl + Shift + R` (Windows/Linux) hoặc `Cmd + Shift + R` (Mac).

---

## Sự cố Quản lý Kho

**Vấn đề 3: Không tìm thấy Số Serial**

*   **Triệu chứng:** Lỗi "Không tìm thấy số serial" khi thêm sản phẩm vào phiếu sửa chữa hoặc kiểm tra bảo hành.
*   **Nguyên nhân có thể:**
    *   Nhập sai số serial.
    *   Sản phẩm chưa được đăng ký trong hệ thống.
*   **Giải pháp:**
    1.  Kiểm tra lại số serial đã nhập, đảm bảo không có lỗi chính tả.
    2.  Nếu sản phẩm chưa được đăng ký, hãy vào mục **Dashboard → Inventory** và chọn **"Register Product"** để thêm mới.

**Vấn đề 4: Sản phẩm bị kẹt ở trạng thái "Đang trong dịch vụ"**

*   **Triệu chứng:** Không thể di chuyển sản phẩm vì nó đang được gán cho một phiếu sửa chữa đang hoạt động.
*   **Nguyên nhân có thể:** Phiếu sửa chữa liên quan chưa được đóng đúng cách.
*   **Giải pháp:**
    1.  Tìm phiếu sửa chữa đang giữ sản phẩm.
    2.  Hoàn thành hoặc hủy phiếu sửa chữa đó. Sản phẩm sẽ tự động được trả về kho.

---

## Sự cố Cổng thông tin Công cộng

**Vấn đề 5: Mã theo dõi không hoạt động**

*   **Triệu chứng:** Lỗi "Không tìm thấy yêu cầu" khi khách hàng nhập mã theo dõi.
*   **Nguyên nhân có thể:**
    *   Khách hàng nhập sai mã.
    *   Lỗi phân biệt chữ hoa/thường.
*   **Giải pháp:**
    1.  Hướng dẫn khách hàng kiểm tra lại mã theo dõi, đảm bảo đúng định dạng (ví dụ: `SR-XXXXXXXXXXXX`).
    2.  Yêu cầu khách hàng nhập chính xác chữ hoa/thường như đã nhận.

**Vấn đề 6: Gửi yêu cầu bị chặn**

*   **Triệu chứng:** Khách hàng không thể gửi yêu cầu, biểu mẫu báo lỗi không rõ ràng.
*   **Nguyên nhân có thể:** Tính năng tự động điền của trình duyệt hoặc một tiện ích mở rộng đã can thiệp vào biểu mẫu.
*   **Giải pháp:**
    1.  Hướng dẫn khách hàng thử gửi lại bằng trình duyệt ẩn danh.
    2.  Yêu cầu khách hàng tạm thời tắt các tiện ích tự động điền biểu mẫu.

---

## Sự cố về Email

**Vấn đề 7: Khách hàng không nhận được email**

*   **Triệu chứng:** Email thông báo không đến được hộp thư của khách hàng.
*   **Nguyên nhân có thể:**
    *   Khách hàng đã hủy đăng ký nhận email.
    *   Email bị chuyển vào thư mục Spam.
    *   Địa chỉ email không hợp lệ.
*   **Giải pháp:**
    1.  Kiểm tra trong **Dashboard → Notifications** để xem trạng thái gửi email.
    2.  Yêu cầu khách hàng kiểm tra thư mục Spam.
    3.  Xác minh lại địa chỉ email của khách hàng.

Nếu sự cố vẫn tiếp diễn, vui lòng liên hệ với quản trị viên hệ thống để được hỗ trợ kỹ thuật sâu hơn.

**End of Troubleshooting Guide**