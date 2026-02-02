# Fix: Sản phẩm không chuyển kho đích sau khi xuất kho

**Ngày:** 2026-02-02
**Liên quan:** TC02 trong `docs/doc-kien/test-cases-warranty-workflow.md`
**Trạng thái:** Sẵn sàng triển khai
**Test Cases:** TC14–TC20 trong `docs/doc-kien/test-cases-warranty-workflow.md`

---

## 1. Vấn đề

Khi phiếu xuất kho (Stock Issue) được duyệt:
- `product_warehouse_stock` bị trừ đúng (số lượng tồn kho chính xác)
- `physical_products.status` chuyển thành `issued`
- **Nhưng** `physical_products.virtual_warehouse_id` vẫn trỏ về kho nguồn

**Hệ quả:**
- Sản phẩm đã xuất vẫn hiển thị trong danh sách kho nguồn (dù status khác)
- Không phân biệt được sản phẩm đã xuất bán, xuất RMA, hay xuất hủy nằm ở đâu
- Truy vết sản phẩm sau khi xuất phải dựa vào document history thay vì kho hiện tại

**So sánh với hệ thống chuẩn (SAP, Oracle):**
- SAP: Goods Issue xóa sản phẩm khỏi inventory của warehouse nguồn hoàn toàn
- Oracle: Interorganization Transfer chuyển sản phẩm sang tổ chức đích (direct hoặc in-transit)
- Cả hai đều không giữ sản phẩm đã xuất trong kho nguồn

---

## 2. Giải pháp

### 2.1 Ý tưởng chính

Khi xuất kho, sản phẩm sẽ được **tự động chuyển sang kho đích** (mặc định theo loại xuất). User có thể chọn kho đích khác qua dropdown (chỉ kho archive).

### 2.2 Thêm cột `is_archive` vào `virtual_warehouses`

```sql
ALTER TABLE public.virtual_warehouses
  ADD COLUMN is_archive BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.virtual_warehouses.is_archive
  IS 'Kho archive: không tính vào tồn kho khả dụng, không cho phép tạo phiếu xuất từ kho này';
```

**Tác dụng:**
- **Tồn kho khả dụng:** Query báo cáo, dashboard chỉ tính kho có `is_archive = FALSE`
- **Kho nguồn (xuất/chuyển):** Dropdown chỉ hiển thị kho có `is_archive = FALSE`
- **Truy vết:** Sản phẩm trong kho archive vẫn query được bình thường khi cần tra cứu

### 2.3 Phân loại kho hiện tại

| warehouse_type | Tên | is_archive | Lý do |
|---|---|---|---|
| `main` | Kho Chính | `FALSE` | Kho bán hàng chính |
| `warranty_stock` | Kho Bảo Hành | `FALSE` | Hàng sẵn sàng thay thế, vẫn khả dụng |
| `parts` | Kho Linh Kiện | `FALSE` | Linh kiện thay thế, vẫn khả dụng |
| `in_service` | Kho Đang Sửa Chữa | `FALSE` | Hàng tạm thời, sẽ quay lại lưu thông |
| `rma_staging` | Kho Chờ Trả Hàng | **`TRUE`** | Hàng chờ trả nhà sản xuất, không khả dụng |
| `dead_stock` | Kho Hàng Hỏng | **`TRUE`** | Hàng hỏng, không dùng được |
| `customer_installed` | Hàng Đã Bán | **`TRUE`** | Đã bán cho khách, không còn trong kho |

### 2.4 Thêm cột `to_virtual_warehouse_id` vào `stock_issues`

```sql
ALTER TABLE public.stock_issues
  ADD COLUMN to_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id);

COMMENT ON COLUMN public.stock_issues.to_virtual_warehouse_id
  IS 'Kho đích (archive) sau khi xuất. Bắt buộc. Mặc định theo loại xuất.';
```

### 2.5 Sửa trigger xuất kho

Trong trigger `mark_physical_products_as_issued_on_issue_approval` (file `600_stock_triggers.sql`), thêm logic:

```sql
-- Sau khi đánh dấu status = 'issued', chuyển kho đích
UPDATE public.physical_products
SET virtual_warehouse_id = NEW.to_virtual_warehouse_id
WHERE id IN (
  SELECT pp.id FROM public.physical_products pp
  JOIN public.stock_issue_serials sis ON sis.physical_product_id = pp.id
  JOIN public.stock_issue_items sii ON sii.id = sis.stock_issue_item_id
  WHERE sii.stock_issue_id = NEW.id
);
```

### 2.6 Gợi ý kho đích mặc định theo loại xuất

Áp dụng ở frontend — khi tạo phiếu xuất, tự động chọn kho đích dựa theo context:

| Ngữ cảnh xuất | Kho đích mặc định |
|---|---|
| Xuất bán cho khách | `customer_installed` (Hàng Đã Bán) |
| Xuất RMA trả nhà máy | `rma_staging` (Kho Chờ Trả Hàng) |
| Xuất hủy | `dead_stock` (Kho Hàng Hỏng) |
| Xuất thay thế bảo hành | `customer_installed` (Hàng Đã Bán) |

User có thể thay đổi qua dropdown (chỉ hiển thị kho có `is_archive = TRUE`).

---

## 3. Các file cần sửa

### Schema
- `docs/data/schemas/100_enums_and_sequences.sql` — Không cần sửa (enum đủ rồi)
- `docs/data/schemas/202_task_and_warehouse.sql` — Thêm cột `is_archive` vào `virtual_warehouses`
- `docs/data/schemas/204_inventory_documents.sql` — Thêm cột `to_virtual_warehouse_id` vào `stock_issues`
- `docs/data/schemas/600_stock_triggers.sql` — Sửa trigger chuyển kho khi duyệt xuất
- `docs/data/schemas/900_default_warehouse_seed.sql` — Set `is_archive` cho các kho

### Backend (tRPC)
- `src/server/routers/inventory/issues.ts` — Thêm field `to_virtual_warehouse_id` vào create/update
- `src/server/routers/inventory/approvals.ts` — Đảm bảo trigger mới hoạt động đúng

### Frontend (`src/app/(auth)/inventory/documents/issues/new`)
- Form tạo/sửa phiếu xuất — Thêm dropdown chọn kho đích (chỉ kho archive, bắt buộc) với giá trị mặc định theo ngữ cảnh
- Dropdown chọn kho nguồn — Filter `is_archive = FALSE`

---

## 4. Lưu ý quan trọng

- **Không cộng stock ở kho đích:** Kho archive chỉ chứa sản phẩm vật lý để truy vết, không tính `product_warehouse_stock`. Trigger hiện tại chỉ trừ stock ở kho nguồn — giữ nguyên logic này.
- **Dữ liệu cũ:** Sản phẩm đã xuất trước đó (`status = 'issued'`) sẽ được clean up thủ công.
- **Không ảnh hưởng Stock Transfer:** Logic chuyển kho (transfer) giữa các kho không-archive vẫn hoạt động như cũ.