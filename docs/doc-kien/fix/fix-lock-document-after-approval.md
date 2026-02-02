# FIX: Physical product status không đồng nhất khi thêm serial sau duyệt

## 1. Vấn đề

### Mô tả

Hệ thống sử dụng **non-blocking workflow**: cho phép thêm serial sau khi phiếu nhập đã duyệt. Tuy nhiên, serial thêm sau duyệt bị tạo với status sai:

- Serial thêm **trước khi duyệt** → trigger approval chạy → status = `active`
- Serial thêm **sau khi duyệt** → tạo với status = `draft` → **không bao giờ được activate** → không thể xuất kho

### Nguyên nhân gốc

**File:** `docs/data/schemas/600_stock_triggers.sql` — function `create_physical_product_from_receipt_serial` (line 145-211)

Dòng 183 luôn tạo physical product với `status = 'draft'`, kể cả khi receipt đã `approved`. Dòng 194-200 đã handle tăng stock count nhưng **thiếu activate product**.

```sql
-- Dòng 183: Luôn 'draft' — BUG
'draft',  -- Always start as draft

-- Dòng 194-200: Đã handle stock nhưng THIẾU activate
IF v_receipt_status = 'approved' OR v_receipt_status = 'completed' THEN
  PERFORM public.upsert_product_stock(...);
  -- ❌ THIẾU: UPDATE physical_products SET status = 'active'
END IF;
```

### Ảnh hưởng

- Sản phẩm `draft` không xuất kho được (issue validation yêu cầu `active`)
- Tồn kho `declared_quantity` tăng nhưng số sản phẩm `active` không khớp
- Không có cách activate thủ công các sản phẩm bị kẹt

---

## 2. Giải pháp

Sửa trigger `create_physical_product_from_receipt_serial`: khi receipt đã `approved`/`completed`, tạo physical product với `status = 'active'` thay vì `'draft'`.

**Không thay đổi workflow** — vẫn giữ non-blocking serial entry sau duyệt.

---

## 3. File cần sửa

### 3.1. Database trigger (duy nhất)

**File:** `docs/data/schemas/600_stock_triggers.sql`

**Sửa function `create_physical_product_from_receipt_serial`**, thay đổi logic tạo physical product:

```sql
-- TRƯỚC (line 169-186):
-- Create physical product with status='draft'
INSERT INTO public.physical_products (
  product_id, serial_number, virtual_warehouse_id,
  condition, status,
  manufacturer_warranty_end_date, user_warranty_end_date
) VALUES (
  v_product_id, NEW.serial_number, v_virtual_warehouse_id,
  'new',
  'draft',  -- Always start as draft          ← BUG
  NEW.manufacturer_warranty_end_date, NEW.user_warranty_end_date
)
RETURNING id INTO v_physical_product_id;

-- SAU:
-- Create physical product
-- If receipt already approved → 'active', otherwise → 'draft'
INSERT INTO public.physical_products (
  product_id, serial_number, virtual_warehouse_id,
  condition, status,
  manufacturer_warranty_end_date, user_warranty_end_date
) VALUES (
  v_product_id, NEW.serial_number, v_virtual_warehouse_id,
  'new',
  CASE
    WHEN v_receipt_status IN ('approved', 'completed') THEN 'active'
    ELSE 'draft'
  END,
  NEW.manufacturer_warranty_end_date, NEW.user_warranty_end_date
)
RETURNING id INTO v_physical_product_id;
```

Chỉ cần thay `'draft'` thành biểu thức `CASE WHEN`. Không cần sửa gì thêm — block `IF v_receipt_status = 'approved'` ở dòng 194-200 đã handle stock count đúng.

---

## 4. Test cases

| # | Test case | Kết quả mong đợi |
|---|-----------|-------------------|
| 1 | Tạo phiếu draft, thêm serial | physical product status = `draft` |
| 2 | Duyệt phiếu | Tất cả physical product chuyển sang `active` |
| 3 | Thêm serial vào phiếu đã duyệt | physical product status = `active` (không phải `draft`) |
| 4 | Thêm serial vào phiếu đã duyệt → xuất kho serial đó | Xuất thành công (vì đã `active`) |
| 5 | Hủy phiếu draft có serial | physical product `draft` bị xóa (cleanup trigger) |

---

## 5. Migration cho data hiện tại

Activate các sản phẩm bị kẹt ở `draft` trong phiếu đã approved:

```sql
-- Kiểm tra trước
SELECT pp.id, pp.serial_number, pp.status, sr.status as receipt_status
FROM public.physical_products pp
JOIN public.stock_receipt_serials srs ON srs.physical_product_id = pp.id
JOIN public.stock_receipt_items sri ON sri.id = srs.receipt_item_id
JOIN public.stock_receipts sr ON sr.id = sri.receipt_id
WHERE pp.status = 'draft' AND sr.status IN ('approved', 'completed');

-- Fix
UPDATE public.physical_products pp
SET status = 'active', updated_at = NOW()
FROM public.stock_receipt_serials srs
JOIN public.stock_receipt_items sri ON sri.id = srs.receipt_item_id
JOIN public.stock_receipts sr ON sr.id = sri.receipt_id
WHERE srs.physical_product_id = pp.id
  AND pp.status = 'draft'
  AND sr.status IN ('approved', 'completed');
```

---

## 6. Không cần thay đổi

- **Docs** (ARCHITECTURE-MASTER, brief, prd): workflow không đổi
- **Stories**: không ảnh hưởng
- **Frontend**: không cần sửa UI
- **Backend routers**: không cần sửa validation
