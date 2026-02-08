# SSTC Service Center App — Release Notes

**Phiên bản:** v1.0 | **Ngày:** 06/02/2026

Dưới đây là tổng hợp những gì người dùng có thể làm được và những hạn chế trong phiên bản hiện tại.

**Ký hiệu:** (+) Đã hỗ trợ | (−) Chưa hỗ trợ / Hạn chế

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Giao diện](#giao-diện)
- [Quản lý Danh mục Sản phẩm](#quản-lý-danh-mục-sản-phẩm)
- [Quản lý Kho hàng](#quản-lý-kho-hàng)
- [Quản lý Khách hàng](#quản-lý-khách-hàng)
- [Bảo hành và Sửa chữa](#bảo-hành-và-sửa-chữa)
- [Quản lý RMA](#quản-lý-rma)
- [Phân quyền](#phân-quyền)

---

## Tổng quan

Service Center App là hệ thống quản lý toàn diện dành cho trung tâm bảo hành linh kiện điện tử SSTC — bao gồm nhập hàng, bán hàng, tiếp nhận bảo hành, sửa chữa và đổi trả về hãng (RMA). Mọi sản phẩm đều được theo dõi bằng mã serial xuyên suốt vòng đời.

**Nền tảng:** Web — dành cho quản lý và nhân viên trung tâm bảo hành.

### Hỗ trợ trình duyệt và thiết bị

| Trình duyệt | Chrome, Firefox, Safari, Edge (phiên bản mới nhất) |
| Thiết bị | Desktop / Laptop |

---

## Giao diện

+ Giao diện sáng (Light mode)
+ Ngôn ngữ Tiếng Việt

- Dữ liệu hiện tại trên hệ thống là dữ liệu mẫu dùng để kiểm thử, chưa thực hiện migrate từ hệ thống cũ

---

## Quản lý Danh mục Sản phẩm

+ Tạo và chỉnh sửa sản phẩm với đầy đủ thông tin — Tên, SKU, Thương hiệu, Model, Loại, Nhà cung cấp, Mô tả và Link hình ảnh
+ Hệ thống tự động kiểm tra trùng lặp — nếu trùng SKU sẽ không cho tạo, trùng tên sẽ cảnh báo nhưng vẫn cho phép tiếp tục. SKU là trường bắt buộc
+ Tìm kiếm nhanh theo tên hoặc SKU

- Phần quản lý linh kiện chưa được phát triển trong phiên bản này

---

## Quản lý Kho hàng

+ Hệ thống kho gồm 2 cấp — Kho vật lý và 5 Kho ảo (Chính, Hàng Bán, Bảo Hành, Sửa Chữa, Hàng Hỏng)
+ Trang tổng quan kho được đơn giản hóa, chỉ hiển thị chỉ số "Tổng Tồn Kho"
+ Tạo phiếu nhập kho theo lý do Nhập mua hàng hoặc Nhập RMA về, chọn kho đích là Kho Chính hoặc Kho Bảo Hành. Nhập serial numbers kèm thời hạn bảo hành hãng, hỗ trợ nhiều sản phẩm trong cùng một phiếu
+ Xuất kho bán hàng — chọn serial cụ thể cho khách, hệ thống tự động chuyển từ Kho Chính sang Kho Hàng Bán
+ Chuyển kho thủ công từ Kho Chính sang Kho Bảo Hành
+ Tra cứu bất kỳ serial nào để xem vị trí hiện tại
+ Ngày trên phiếu không được chọn ngày tương lai và chỉ cho phép lùi tối đa 7 ngày

- Phiếu nhập mua hàng chưa hỗ trợ nhập ngày tự do theo định dạng dd/mm/yy với tự động format
- Phiếu nhập mua hàng khi xóa hết trường số lượng sẽ hiển thị cứng giá trị 0
- Chưa hỗ trợ nhập serial từ file CSV
- Chưa hỗ trợ nhập số lượng lớn (500+ serials)
- Chưa có phiếu nhập/xuất điều chỉnh phục vụ kiểm kê
- Chưa cảnh báo khi nhập serial đã tồn tại trong hệ thống
- Trang tổng quan kho chưa có cảnh báo tồn kho thấp

---

## Quản lý Khách hàng

+ Tạo và chỉnh sửa thông tin khách hàng — Họ tên, SĐT (bắt buộc), Email, Địa chỉ, Ghi chú
+ Tìm kiếm theo họ tên
- Khi tạo phiếu xuất, chưa tự động điền thông tin khách hàng từ SĐT
- Chưa kiểm tra trùng SĐT khi tạo khách hàng mới
- Chưa hỗ trợ quản lý nhiều người liên hệ cho cùng một khách hàng

---

## Bảo hành và Sửa chữa

+ Tạo phiếu yêu cầu và phiếu dịch vụ từ serial number
+ Hệ thống tự xác minh bảo hành — khi nhập serial sẽ kiểm tra ngay thời hạn bảo hành. Nếu còn bảo hành thì cho phép tạo phiếu, nếu hết hạn sẽ không cho tạo
+ Quy trình sửa chữa theo từng bước — kỹ thuật viên thực hiện tuần tự các bước với ghi chú và ảnh đính kèm
+ Nếu sửa được — sản phẩm tự động chuyển từ Kho Sửa Chữa về Kho Hàng Bán
+ Nếu cần đổi mới (Warranty Replacement) — sản phẩm hỏng chuyển vào Kho Hàng Hỏng, sản phẩm thay thế chuyển vào Kho Hàng Bán. Sản phẩm thay thế sẽ kế thừa ngày hết hạn bảo hành của sản phẩm cũ
+ Luồng trạng thái — Chờ xử lý → Đang sửa chữa → Sẵn sàng bàn giao → Hoàn thành

- Chức năng upload ảnh trực tiếp mà không cần vào chi tiết trong phiếu dịch vụ chưa hoạt động

---

## Quản lý RMA

+ Tạo lô RMA gồm thông tin Nhà cung cấp, Ngày vận chuyển và Mã vận đơn
+ Thêm sản phẩm từ Kho Hàng Hỏng vào lô
+ Khi đánh dấu "Đã gửi", serial sẽ tự động được đưa ra khỏi hệ thống
+ Nhận hàng thay thế từ hãng bằng cách tạo phiếu nhập kho với lý do "Nhập RMA về"
+ Luồng trạng thái — Nháp → Chờ gửi → Hoàn thành (có thể hủy bỏ)

---

## Phân quyền

| Vai trò | Phạm vi |
|---------|---------|
| Quản trị (Admin) | Toàn quyền, quản lý hệ thống và người dùng |
| Quản lý (Manager) | Giám sát vận hành toàn bộ |
| Kỹ thuật viên (Technician) | Thực hiện sửa chữa, chỉ xem được phiếu được gán cho mình |
| Tiếp nhận (Reception) | Giao dịch trực tiếp với khách hàng |

- Ma trận phân quyền chi tiết theo từng chức năng (xem, tạo, sửa, duyệt) chưa được triển khai
