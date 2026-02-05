# Luồng phiếu kho trong nghiệp vụ bảo hành

## Khái niệm cơ bản

### Ba loại phiếu kho

| Phiếu | Bản chất | Tồn kho |
|---|---|---|
| **Phiếu nhập kho** | Hàng đi vào trung tâm từ bên ngoài | Tăng |
| **Phiếu xuất kho** | Hàng đi ra khỏi trung tâm ra bên ngoài | Giảm |
| **Phiếu chuyển kho** | Hàng di chuyển giữa các kho nội bộ | Không đổi (tổng) |

### Kho ảo (Virtual Warehouse)

Kho ảo là đơn vị quản lý tồn kho trên hệ thống, không tương ứng với vị trí vật lý cụ thể. Dùng để theo dõi **trạng thái** hoặc **quyền sở hữu** của hàng hóa.

Các kho ảo trong hệ thống:

| Kho ảo | Mô tả |
|---|---|
| **Kho hàng bán** | Hàng đã bán, đang ở phía khách hàng. Đại diện cho nghĩa vụ bảo hành của trung tâm |
| **Kho đang sửa chữa** | Hàng đang được kiểm tra / sửa chữa tại trung tâm |
| **Kho hàng hỏng** | Hàng đã xác nhận lỗi, chờ xử lý tiếp (RMA, hủy...) |
| **Kho bảo hành** | Hàng mới dành cho đổi trả bảo hành |

## Luồng: Đổi trả bảo hành (khách mang hàng lỗi đến, nhận hàng mới)

### Tiền đề

- Khách hàng đã mua sản phẩm từ trung tâm (sản phẩm đang nằm trong "Kho hàng bán")
- Sản phẩm còn trong thời hạn bảo hành
- Sản phẩm được xác nhận lỗi và đủ điều kiện đổi mới

### Flow

```
Kho hàng bán ──(nhập kho)──▶ Kho đang sửa chữa ──(chuyển kho)──▶ Kho hàng hỏng
                                                                        │
Kho bảo hành ──(xuất kho)──▶ Kho hàng bán                              │
                                                                   (xử lý tiếp)
```

### Chi tiết từng bước

| Bước | Sự kiện | Phiếu | Từ | Đến |
|---|---|---|---|---|
| 1 | Khách mang hàng lỗi đến trung tâm | **Nhập kho** | Kho hàng bán | Kho đang sửa chữa |
| 2 | Kiểm tra xong, xác nhận lỗi | **Chuyển kho** | Kho đang sửa chữa | Kho hàng hỏng |
| 3 | Xuất hàng mới trả cho khách | **Xuất kho** | Kho bảo hành | Kho hàng bán |

### Giải thích

- **Bước 1 — Nhập kho**: Hàng từ phía khách (bên ngoài trung tâm) đi vào trung tâm. "Kho hàng bán" giảm, "Kho đang sửa chữa" tăng.
- **Bước 2 — Chuyển kho**: Sau khi xác nhận lỗi, hàng chuyển trạng thái nội bộ. Không có hàng vào/ra trung tâm, chỉ thay đổi phân loại.
- **Bước 3 — Xuất kho**: Hàng mới từ kho bảo hành đi ra khỏi trung tâm, giao cho khách. "Kho bảo hành" giảm, "Kho hàng bán" tăng (khách giữ sản phẩm mới, trung tâm tiếp tục có nghĩa vụ bảo hành).

### Xử lý tiếp hàng hỏng (ngoài luồng đổi trả)

Hàng trong "Kho hàng hỏng" sẽ được xử lý riêng tùy tình huống:

| Hướng xử lý | Phiếu | Từ | Đến |
|---|---|---|---|
| Gửi bảo hành hãng (RMA) | Xuất kho | Kho hàng hỏng | Kho RMA |
| Sửa được, nhập lại hàng tốt | Chuyển kho | Kho hàng hỏng | Kho hàng tốt |
| Hủy (không sửa được) | Xuất kho (hủy) | Kho hàng hỏng | (hủy) |
