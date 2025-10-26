# Câu hỏi Thường gặp (FAQ) - Giai đoạn 2

**Phiên bản:** 1.0
**Cập nhật lần cuối:** 2025-10-26

---

## Nội dung chính

1.  [Câu hỏi chung](#câu-hỏi-chung)
2.  [Hệ thống Quy trình Công việc (Task Workflow)](#hệ-thống-quy-trình-công-việc-task-workflow)
3.  [Quản lý Kho (Warehouse Management)](#quản-lý-kho-warehouse-management)
4.  [Cổng Yêu cầu Dịch vụ Công khai](#cổng-yêu-cầu-dịch-vụ-công-khai)

---

## Câu hỏi chung

**Q1: Giai đoạn 2 của Trung tâm Dịch vụ bao gồm những gì?**

**A:** Giai đoạn 2 là một bản mở rộng lớn, bổ sung các tính năng:
*   Hệ thống quy trình công việc cho các dịch vụ có cấu trúc.
*   Quản lý kho toàn diện với theo dõi theo số serial.
*   Cổng thông tin công khai cho khách hàng gửi yêu cầu dịch vụ.
*   Hệ thống thông báo qua email tự động.

**Q2: Dữ liệu cũ của tôi có bị ảnh hưởng không?**

**A:** Không. Tất cả dữ liệu hiện có vẫn được giữ nguyên. Các tính năng của Giai đoạn 2 được thêm vào và không làm mất hoặc thay đổi dữ liệu cũ.

---

## Hệ thống Quy trình Công việc (Task Workflow)

**Q3: "Mẫu công việc" (task template) là gì?**

**A:** Là một quy trình được định sẵn, chia một dịch vụ thành các bước nhỏ. Ví dụ, "Thay màn hình iPhone" có thể bao gồm các bước: Nhận máy, Kiểm tra ban đầu, Tháo màn hình cũ, Lắp màn hình mới, Kiểm tra chất lượng, Trả khách.

**Q4: Tất cả các phiếu sửa chữa (ticket) có cần mẫu công việc không?**

**A:** Không. Mẫu công việc là tùy chọn. Bạn có thể tạo phiếu sửa chữa mà không cần mẫu cho các công việc đơn giản.

**Q5: Sự khác biệt giữa chế độ "Nghiêm ngặt" (strict) và "Linh hoạt" (flexible) là gì?**

**A:**
*   **Nghiêm ngặt:** Các công việc phải được hoàn thành theo thứ tự.
*   **Linh hoạt:** Các công việc có thể được hoàn thành không theo thứ tự.

**Q6: Làm thế nào để theo dõi tiến độ công việc?**

**A:** Truy cập **Dashboard → Task Progress** (`/dashboard/task-progress`) để xem tổng quan về các công việc đang hoạt động, các công việc bị chặn và phân bổ công việc cho kỹ thuật viên.

---

## Quản lý Kho (Warehouse Management)

**Q7: Sự khác biệt giữa kho "ảo" và kho "vật lý" là gì?**

**A:**
*   **Kho ảo:** Là các danh mục do hệ thống định nghĩa (ví dụ: kho bảo hành, kho chờ xử lý). Chúng phân loại sản phẩm theo mục đích.
*   **Kho vật lý:** Là các địa điểm lưu trữ do người dùng định nghĩa (ví dụ: Kho chính, Trạm sửa chữa số 2).

**Q8: Số serial hoạt động như thế nào?**

**A:** Số serial là định danh duy nhất cho mỗi sản phẩm, được tự động chuyển thành chữ hoa và phải là duy nhất trên toàn hệ thống.

**Q9: Điều gì xảy ra với sản phẩm khi được thêm vào một phiếu sửa chữa?**

**A:** Sản phẩm sẽ tự động được chuyển vào kho ảo "in_service" (đang trong dịch vụ) và sẽ được trả về kho ban đầu sau khi phiếu sửa chữa hoàn tất. Quá trình này hoàn toàn tự động.

**Q10: Cảnh báo tồn kho hoạt động như thế nào?**

**A:** Hệ thống sẽ gửi cảnh báo khi số lượng tồn kho của một sản phẩm giảm xuống dưới ngưỡng tối thiểu đã được cấu hình. Bạn có thể xem các cảnh báo này tại **Dashboard → Inventory → Stock Levels**.

---

## Cổng Yêu cầu Dịch vụ Công khai

**Q11: Khách hàng có thể truy cập hệ thống mà không cần đăng nhập không?**

**A:** Có, cổng thông tin công khai cho phép người dùng không cần tài khoản để:
*   Gửi yêu cầu dịch vụ bảo hành.
*   Theo dõi tình trạng yêu cầu bằng mã theo dõi.

**Q12: "Mã theo dõi" (tracking token) là gì?**

**A:** Là một mã duy nhất được tạo ra khi khách hàng gửi yêu cầu. Khách hàng sử dụng mã này để theo dõi tình trạng yêu cầu của họ mà không cần đăng nhập.

**Q13: Điều gì xảy ra khi một yêu cầu bị từ chối?**

**A:** Khách hàng sẽ nhận được email thông báo về việc từ chối kèm theo lý do. Yêu cầu ban đầu vẫn được lưu trong hệ thống để kiểm tra.

**Q14: Làm thế nào để chuyển đổi một yêu cầu thành một phiếu sửa chữa (ticket)?**

**A:** Nhân viên có thể chuyển đổi các yêu cầu đã được duyệt thành phiếu sửa chữa. Hệ thống sẽ tự động điền trước thông tin từ yêu cầu và thông báo cho khách hàng.

---

Để biết thêm chi tiết, vui lòng tham khảo các tài liệu trong `/docs/phase2/user-guides/`.

**End of FAQ Document**