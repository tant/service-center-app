# Transfer Document Model — Mô hình Phiếu chuyển kho

## 1. Tổng quan

Transfer Document là mô hình quản lý xuất/nhập kho dựa trên **phiếu chuyển kho**. Mỗi lần hàng hóa di chuyển (nhập từ bên ngoài, xuất ra bên ngoài, hoặc chuyển giữa các kho ảo), hệ thống tạo một phiếu chuyển kho và tự động sinh các dòng giao dịch kho tương ứng.

### Nguyên tắc cốt lõi

- **Append-only**: Chỉ INSERT, không bao giờ UPDATE hay DELETE dòng giao dịch kho.
- **Atomic**: Các dòng giao dịch sinh ra từ 1 phiếu phải được tạo trong cùng 1 database transaction.
- **Truy vết được**: Mọi dòng giao dịch đều trỏ về phiếu chuyển kho gốc.

---

## 2. Kho ảo (Virtual Warehouse)

Kho ảo là phân vùng **logic** trong cùng một kho vật lý, dùng để phân loại trạng thái hàng hóa mà không cần tách biệt vị trí vật lý.

Ví dụ trong bảo hành:

| Kho ảo | Mục đích |
|--------|----------|
| Linh kiện mới (GOOD) | Linh kiện sẵn sàng sử dụng để sửa chữa |
| Linh kiện hỏng (DEFECTIVE) | Linh kiện hỏng chờ trả nhà sản xuất hoặc hủy |

---

## 3. Thiết kế Database

### 3.1. Bảng `warehouses` — Kho ảo

```sql
CREATE TABLE warehouses (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50) NOT NULL,   -- GOOD, DEFECTIVE, ...
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

Dữ liệu mẫu:

| id | name | type |
|----|------|------|
| 1 | Linh kiện mới | GOOD |
| 2 | Linh kiện hỏng | DEFECTIVE |

### 3.2. Bảng `stock_transfers` — Phiếu chuyển kho

```sql
CREATE TABLE stock_transfers (
    id                  SERIAL PRIMARY KEY,
    from_warehouse_id   INT REFERENCES warehouses(id),  -- NULL nếu nhập từ bên ngoài
    to_warehouse_id     INT REFERENCES warehouses(id),  -- NULL nếu xuất ra bên ngoài
    part_id             INT NOT NULL,
    quantity            INT NOT NULL CHECK (quantity > 0),
    reason              VARCHAR(50) NOT NULL,            -- PURCHASE, REPAIR, RETURN, REVERSAL, DISPOSE, ...
    ref_order_id        INT,                             -- Tham chiếu đến phiếu sửa chữa (Work Order)
    ref_original_id     INT REFERENCES stock_transfers(id), -- Tham chiếu phiếu gốc (dùng khi đảo phiếu)
    note                TEXT,
    created_by          INT,
    created_at          TIMESTAMP DEFAULT NOW()
);
```

**Quy ước:**
- `from_warehouse_id = NULL`: Nhập từ bên ngoài vào hệ thống.
- `to_warehouse_id = NULL`: Xuất ra khỏi hệ thống.
- Cả hai đều có giá trị: Chuyển kho nội bộ.
- Cả hai đều NULL: Không hợp lệ (cần validate).

### 3.3. Bảng `stock_transactions` — Giao dịch kho

```sql
CREATE TABLE stock_transactions (
    id                  SERIAL PRIMARY KEY,
    warehouse_id        INT NOT NULL REFERENCES warehouses(id),
    part_id             INT NOT NULL,
    type                VARCHAR(3) NOT NULL CHECK (type IN ('IN', 'OUT')),
    quantity            INT NOT NULL CHECK (quantity > 0),
    ref_transfer_id     INT NOT NULL REFERENCES stock_transfers(id),
    created_at          TIMESTAMP DEFAULT NOW()
);
```

Bảng này **chỉ INSERT**, không bao giờ UPDATE hay DELETE.

---

## 4. Các loại giao dịch

### 4.1. Nhập kho từ bên ngoài

Nhận linh kiện mới từ nhà cung cấp.

```
stock_transfers:
  id=1, from_warehouse=NULL, to_warehouse=1, part=X, qty=5, reason=PURCHASE

stock_transactions:
  warehouse=1, type=IN, qty=5, ref_transfer=1
```

Kết quả: Kho "Linh kiện mới" tăng 5.

### 4.2. Chuyển kho nội bộ

Kỹ thuật viên tháo linh kiện hỏng, hệ thống chuyển từ kho GOOD sang kho DEFECTIVE.

```
stock_transfers:
  id=2, from_warehouse=1, to_warehouse=2, part=X, qty=1, reason=REPAIR, ref_order=WO-001

stock_transactions:
  warehouse=1, type=OUT, qty=1, ref_transfer=2
  warehouse=2, type=IN,  qty=1, ref_transfer=2
```

Kết quả: Kho "Linh kiện mới" giảm 1, kho "Linh kiện hỏng" tăng 1.

### 4.3. Xuất kho ra bên ngoài

Trả linh kiện hỏng về nhà sản xuất.

```
stock_transfers:
  id=3, from_warehouse=2, to_warehouse=NULL, part=X, qty=1, reason=RETURN

stock_transactions:
  warehouse=2, type=OUT, qty=1, ref_transfer=3
```

Kết quả: Kho "Linh kiện hỏng" giảm 1.

### 4.4. Đảo phiếu (Reversal)

Khi phát hiện sai sót, tạo phiếu chuyển kho **ngược lại** thay vì xóa phiếu cũ.

```
-- Phiếu gốc: chuyển từ kho 1 → kho 2 (sai)
stock_transfers:
  id=4, from_warehouse=1, to_warehouse=2, part=X, qty=1, reason=REPAIR

-- Phiếu đảo: chuyển ngược từ kho 2 → kho 1
stock_transfers:
  id=5, from_warehouse=2, to_warehouse=1, part=X, qty=1, reason=REVERSAL, ref_original=4
```

Kết quả: Tồn kho trở về trạng thái trước khi có phiếu gốc, nhưng lịch sử vẫn giữ nguyên.

---

## 5. Tính tồn kho

### Query tồn kho theo từng kho ảo

```sql
SELECT
    warehouse_id,
    part_id,
    SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END)
    - SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS stock_on_hand
FROM stock_transactions
GROUP BY warehouse_id, part_id;
```

### Query tồn kho tổng (tất cả kho ảo)

```sql
SELECT
    part_id,
    SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END)
    - SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS total_stock
FROM stock_transactions
GROUP BY part_id;
```

---

## 6. Ví dụ minh họa đầy đủ

Tình huống: Kho A (GOOD) có 1 sản phẩm. Chuyển sang kho B (DEFECTIVE), rồi chuyển lại về kho A.

### Bước 1 — Trạng thái ban đầu (nhập 1 sản phẩm vào kho A)

```
stock_transfers:
  id=1, from=NULL, to=A, qty=1, reason=PURCHASE

stock_transactions:
  id=1, warehouse=A, type=IN, qty=1, ref_transfer=1
```

Tồn kho: A=1, B=0

### Bước 2 — Chuyển từ A sang B

```
stock_transfers:
  id=2, from=A, to=B, qty=1, reason=REPAIR

stock_transactions:
  id=2, warehouse=A, type=OUT, qty=1, ref_transfer=2
  id=3, warehouse=B, type=IN,  qty=1, ref_transfer=2
```

Tồn kho: A = IN(1) - OUT(1) = 0, B = IN(1) = 1

### Bước 3 — Chuyển từ B về A

```
stock_transfers:
  id=3, from=B, to=A, qty=1, reason=RETURN

stock_transactions:
  id=4, warehouse=B, type=OUT, qty=1, ref_transfer=3
  id=5, warehouse=A, type=IN,  qty=1, ref_transfer=3
```

Tồn kho: A = IN(1+1) - OUT(1) = 1, B = IN(1) - OUT(1) = 0

**Tổng cộng 5 dòng trong stock_transactions. Không có dòng nào bị xóa hay sửa.**

---

## 7. Validation cần có

- `from_warehouse_id` và `to_warehouse_id` không được cùng NULL.
- `from_warehouse_id` và `to_warehouse_id` không được trùng nhau.
- Trước khi tạo phiếu xuất (OUT), kiểm tra tồn kho >= số lượng xuất để tránh tồn kho âm.
- Quantity phải > 0.

---

## 8. Tóm tắt ưu/nhược điểm

| Ưu điểm | Nhược điểm |
|----------|-----------|
| Audit trail đầy đủ — truy vết được toàn bộ lịch sử | Số dòng trong stock_transactions tăng liên tục |
| Toàn vẹn dữ liệu — phiếu chuyển kho đảm bảo OUT luôn đi kèm IN | Cần tính toán SUM để ra tồn kho (có thể dùng materialized view hoặc bảng snapshot để tối ưu) |
| Hỗ trợ đảo phiếu mà không mất dữ liệu | Phức tạp hơn so với cách đơn giản (chỉ dùng trường status) |
| Đáp ứng yêu cầu báo cáo của nhà sản xuất khi claim warranty | |
