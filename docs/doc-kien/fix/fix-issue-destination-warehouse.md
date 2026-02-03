# Fix: Sản phẩm không chuyển kho đích sau khi xuất kho

**Ngày:** 2026-02-02
**Liên quan:** TC02 trong `docs/doc-kien/test-cases-warranty-workflow.md`
**Trạng thái:** ✅ Đã triển khai
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
-- Trong 202_task_and_warehouse.sql, thêm cột vào bảng virtual_warehouses
is_archive BOOLEAN NOT NULL DEFAULT FALSE
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
-- Trong 204_inventory_documents.sql, thêm cột vào bảng stock_issues
to_virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT
```

> **Quyết định thiết kế:** Cột nullable (thay vì `NOT NULL` như plan ban đầu) để tương thích với dữ liệu cũ. Validate bắt buộc ở tRPC layer khi tạo/sửa phiếu xuất.

### 2.5 Sửa trigger xuất kho

Trong trigger `mark_physical_products_as_issued_on_issue_approval` (file `600_stock_triggers.sql`), thêm logic chuyển kho đích cùng lúc update status:

```sql
UPDATE public.physical_products pp
SET
  status = 'issued',
  virtual_warehouse_id = COALESCE(NEW.to_virtual_warehouse_id, pp.virtual_warehouse_id),
  updated_at = NOW()
FROM public.stock_issue_serials sis
JOIN public.stock_issue_items sii ON sis.issue_item_id = sii.id
WHERE
  sii.issue_id = NEW.id
  AND pp.id = sis.physical_product_id
  AND pp.status = 'transferring';
```

> **Ghi chú:** Dùng `COALESCE` để backward-compatible — nếu `to_virtual_warehouse_id` là NULL (phiếu cũ), giữ nguyên kho hiện tại.

### 2.6 Gợi ý kho đích mặc định theo loại xuất

Áp dụng ở frontend — khi tạo phiếu xuất, tự động chọn kho đích dựa theo context:

| Ngữ cảnh xuất | Kho đích mặc định |
|---|---|
| Xuất bán cho khách | `customer_installed` (Hàng Đã Bán) |
| Xuất RMA trả nhà máy | `rma_staging` (Kho Chờ Trả Hàng) |
| Xuất hủy | `dead_stock` (Kho Hàng Hỏng) |
| Xuất thay thế bảo hành | `customer_installed` (Hàng Đã Bán) |

User có thể thay đổi qua dropdown (chỉ hiển thị kho có `is_archive = TRUE`).

> **Chưa implement:** Auto-default theo context. Hiện tại user phải chọn thủ công.

---

## 3. Các file đã sửa

### Schema
| File | Thay đổi |
|---|---|
| `docs/data/schemas/202_task_and_warehouse.sql` | ✅ Thêm cột `is_archive BOOLEAN NOT NULL DEFAULT FALSE` vào `virtual_warehouses` |
| `docs/data/schemas/204_inventory_documents.sql` | ✅ Thêm cột `to_virtual_warehouse_id UUID` (nullable) vào `stock_issues` |
| `docs/data/schemas/600_stock_triggers.sql` | ✅ Trigger update `virtual_warehouse_id = COALESCE(NEW.to_virtual_warehouse_id, ...)` khi duyệt |
| `docs/data/schemas/900_default_warehouse_seed.sql` | ✅ Set `is_archive` cho 7 kho, `ON CONFLICT` update `is_archive` |

### Backend (tRPC)
| File | Thay đổi |
|---|---|
| `src/server/routers/warehouse.ts` | ✅ `listVirtualWarehouses` nhận optional `{ isArchive?: boolean }` filter |
| `src/server/routers/inventory/issues.ts` | ✅ `create`/`updateFull` nhận `toVirtualWarehouseId`; `getById` join `to_virtual_warehouse` |

### Frontend
| File | Thay đổi |
|---|---|
| `src/app/(auth)/inventory/documents/issues/new/page.tsx` | ✅ Dropdown "Kho đích" (chỉ archive), kho nguồn filter `isArchive: false` |
| `src/app/(auth)/inventory/documents/issues/[id]/edit/page.tsx` | ✅ Tương tự, load `to_virtual_warehouse_id` từ issue |
| `src/components/inventory/documents/issue-detail-header.tsx` | ✅ Hiển thị "Kho đích" trong detail view |

---

## 4. Lưu ý quan trọng

- **Không cộng stock ở kho đích:** Kho archive chỉ chứa sản phẩm vật lý để truy vết, không tính `product_warehouse_stock`. Trigger hiện tại chỉ trừ stock ở kho nguồn — giữ nguyên logic này.
- **Dữ liệu cũ:** Phiếu xuất đã duyệt trước đó sẽ có `to_virtual_warehouse_id = NULL`. Trigger dùng `COALESCE` nên không ảnh hưởng. Cần clean up thủ công nếu muốn truy vết chính xác.
- **Không ảnh hưởng Stock Transfer:** Logic chuyển kho (transfer) giữa các kho không-archive vẫn hoạt động như cũ.

---

## 5. Sau khi deploy

1. Chạy `./docs/data/schemas/setup_schema.sh` để apply schema changes
2. Verify seed data: `SELECT warehouse_type, name, is_archive FROM virtual_warehouses;`
3. Test tạo phiếu xuất mới → chọn kho đích → duyệt → verify `physical_products.virtual_warehouse_id` đã chuyển
4. (Tùy chọn) Clean up dữ liệu cũ: update `to_virtual_warehouse_id` cho các phiếu xuất đã duyệt
