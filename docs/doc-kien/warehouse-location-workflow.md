# Vị Trí Kho Sản Phẩm Theo Quy Trình Sửa Chữa

## 3 Mốc Thời Gian

| Mốc | Sự kiện | Mô tả |
|-----|---------|-------|
| **Mốc 1** | Tạo phiếu yêu cầu (Service Request) | Lễ tân tiếp nhận sản phẩm từ khách hàng |
| **Mốc 2** | Tạo phiếu dịch vụ (Service Ticket) | Nhân viên xác nhận, bắt đầu xử lý kỹ thuật |
| **Mốc 3** | Hoàn thành phiếu | Đóng cả 2 phiếu, trả sản phẩm cho khách |

---

## Trường hợp 1: Sản phẩm khách mang đến — sửa được

> Sản phẩm hỏng của khách được sửa chữa thành công và trả lại cho khách.

| Thời điểm | Vị trí kho |
|---|---|
| **Trước mốc 1** (khách chưa gửi) | Sản phẩm ở tay khách hàng |
| **Sau mốc 1** (tạo phiếu yêu cầu) | **Kho Đang Sửa Chữa** — sản phẩm được chuyển cho kỹ thuật viên xử lý |
| **Sau mốc 2** (tạo phiếu dịch vụ) | **Kho Đang Sửa Chữa** |
| **Sau mốc 3** (hoàn thành) | **Hàng Đã Bán** — sản phẩm sửa xong, trả lại cho khách |

---

## Trường hợp 2: Sản phẩm khách mang đến — không sửa được và không bảo hành

> Sản phẩm không thể sửa chữa, không thuộc diện bảo hành. Trả nguyên sản phẩm hỏng lại cho khách (sản phẩm thuộc sở hữu của khách).

| Thời điểm | Vị trí kho |
|---|---|
| **Trước mốc 1** (khách chưa gửi) | Sản phẩm ở tay khách hàng |
| **Sau mốc 1** (tạo phiếu yêu cầu) | **Kho Đang Sửa Chữa** — sản phẩm được chuyển cho kỹ thuật viên xử lý |
| **Sau mốc 2** (tạo phiếu dịch vụ) | **Kho Đang Sửa Chữa** |
| **Sau mốc 3** (hoàn thành) | **Hàng Đã Bán** — trả nguyên sản phẩm lại cho khách |

---

## Trường hợp 3: Sản phẩm khách mang đến — bảo hành đổi trả

> Sản phẩm thuộc diện bảo hành đổi trả. Khách nhận sản phẩm thay thế mới, sản phẩm hỏng được giữ lại để trả về nhà sản xuất.

### Sản phẩm hỏng của khách

| Thời điểm | Vị trí kho |
|---|---|
| **Trước mốc 1** (khách chưa gửi) | Sản phẩm ở tay khách hàng |
| **Sau mốc 1** (tạo phiếu yêu cầu) | **Kho Đang Sửa Chữa** — sản phẩm được chuyển cho kỹ thuật viên xử lý |
| **Sau mốc 2** (tạo phiếu dịch vụ) | **Kho Đang Sửa Chữa** |
| **Sau mốc 3** (hoàn thành) | **Kho Chờ Trả Hàng** (Khu vực RMA) — chờ trả lại nhà cung cấp/nhà sản xuất |

### Sản phẩm thay thế trả cho khách

| Thời điểm | Vị trí kho |
|---|---|
| Chưa cần dùng | **Kho Bảo Hành** — hàng hóa còn bảo hành, sẵn sàng để thay thế cho khách hàng |
| Được xuất ra để thay thế | **Kho Đang Sửa Chữa** — đi kèm phiếu dịch vụ, đang trong quá trình xử lý |
| **Sau mốc 3** (hoàn thành) | **Hàng Đã Bán** — đã giao cho khách |

---

## Tổng hợp dòng di chuyển kho

```
Trường hợp 1 & 2 (sửa / không sửa được):
  Hàng Đã Bán → Kho Đang Sửa Chữa → Hàng Đã Bán

Trường hợp 3 - Sản phẩm hỏng (bảo hành đổi trả):
  Hàng Đã Bán → Kho Đang Sửa Chữa → Kho Chờ Trả Hàng (RMA)

Trường hợp 3 - Sản phẩm thay thế:
  Kho Bảo Hành → Kho Đang Sửa Chữa → Hàng Đã Bán
```
