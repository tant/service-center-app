# Fix: Tổng thực tế tồn kho tính nhầm hàng đã bán/đã lắp cho khách

## Vấn đề

**Tổng thực tế** (total_actual) hiện đang đếm **tất cả** bản ghi `physical_products` mà không phân biệt loại kho. Điều này dẫn đến hàng nằm trong kho `customer_installed` (đã bán/lắp cho khách) hoặc các kho không thuộc tồn kho nội bộ vẫn bị tính vào con số tồn kho thực tế.

**Hệ quả**: Số liệu tồn kho bị sai lệch — trung tâm tưởng còn nhiều hàng hơn thực tế.

### Các vị trí bị ảnh hưởng

| Vị trí | Hàm/View | Cách tính hiện tại |
|--------|----------|-------------------|
| Trang `/inventory/overview` | `get_inventory_stats()` | `COUNT(*) FROM physical_products` — không lọc gì |
| Trang `/inventory/products/[id]/stock` (header) | `get_aggregated_stock()` | `COUNT(*) FROM physical_products WHERE product_id = ?` — chỉ lọc product |
| Trang `/inventory/products/[id]/stock` (breakdown) | `v_stock_summary` view | `COUNT(*) FROM physical_products WHERE product_id = ? AND virtual_warehouse_id = ?` — không lọc warehouse_type |

### Các loại kho hiện có (`warehouse_type` enum)

| Giá trị | Mô tả | Thuộc tồn kho? |
|---------|--------|----------------|
| `main` | Kho chính | **Có** |
| `warranty_stock` | Kho bảo hành | **Có** |
| `rma_staging` | Kho chờ RMA | **Có** |
| `dead_stock` | Kho hàng chết | **Có** |
| `in_service` | Đang sửa chữa | **Có** |
| `parts` | Kho linh kiện | **Có** |
| `customer_installed` | Đã bán/lắp cho khách | **Không** |

## Giải pháp

Thêm điều kiện lọc loại trừ `customer_installed` (và các loại kho không thuộc tồn kho nếu có thêm trong tương lai) khi đếm `physical_products`.

### 1. Hàm `get_inventory_stats()` — file `docs/data/schemas/501_warehouse_functions.sql`

**Hiện tại:**
```sql
(SELECT COUNT(*)::BIGINT FROM public.physical_products) AS total_actual,
```

**Sửa thành:**
```sql
(SELECT COUNT(*)::BIGINT
 FROM public.physical_products pp
 JOIN public.virtual_warehouses vw ON vw.id = pp.virtual_warehouse_id
 WHERE vw.warehouse_type != 'customer_installed'
) AS total_actual,
```

### 2. Hàm `get_aggregated_stock()` — file `docs/data/schemas/501_warehouse_functions.sql`

**Hiện tại:**
```sql
(SELECT COUNT(*)::INTEGER
 FROM public.physical_products pp
 WHERE pp.product_id = p.id)
```

**Sửa thành:**
```sql
(SELECT COUNT(*)::INTEGER
 FROM public.physical_products pp
 JOIN public.virtual_warehouses vw ON vw.id = pp.virtual_warehouse_id
 WHERE pp.product_id = p.id
   AND vw.warehouse_type != 'customer_installed')
```

### 3. View `v_stock_summary` — file `docs/data/schemas/700_reporting_views.sql`

View này hiển thị theo từng kho ảo nên **không cần sửa** — nó đã tách riêng từng kho. Tuy nhiên, component `StockBreakdownSection` cộng dồn tất cả kho để ra tổng thì cần lọc ở phía frontend, hoặc tốt hơn là dùng kết quả từ `get_aggregated_stock()` (đã sửa ở trên) làm nguồn tổng.

### 4. Cân nhắc thêm

- **Tổng đã khai báo** (`declared_quantity`): Cũng cần xem xét có nên loại trừ `customer_installed` không. Nếu kho `customer_installed` cũng có `declared_quantity` thì tổng khai báo cũng bị ảnh hưởng tương tự.
- **Trạng thái cảnh báo** (`stock_status`): Logic tính critical/warning dựa trên tỷ lệ actual/declared — sau khi sửa, các ngưỡng này sẽ chính xác hơn.
- **Nếu thêm warehouse_type mới** trong tương lai (ví dụ `returned_to_vendor`), cần cập nhật lại danh sách loại trừ. Có thể dùng whitelist thay vì blacklist để an toàn hơn:
  ```sql
  WHERE vw.warehouse_type IN ('main', 'warranty_stock', 'rma_staging', 'dead_stock', 'in_service', 'parts')
  ```