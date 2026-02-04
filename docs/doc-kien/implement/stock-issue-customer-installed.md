# Phiếu Xuất Kho - Chuyển sản phẩm vào kho "Hàng Đã Bán"

> **Status**: ✅ **IMPLEMENTED** (2026-02-04)

## Tổng quan

Khi xuất kho với lý do bán hàng (`reason = 'sale'`), sản phẩm cần được chuyển vào kho ảo `customer_installed` để theo dõi lịch sử và phục vụ tra cứu bảo hành.

## Lý do thay đổi

1. **Tra cứu bảo hành**: Biết serial X đang ở nhà khách Y
2. **Lịch sử sửa chữa**: Tra cứu serial đã qua bao nhiêu lần sửa
3. **Đổi/trả hàng**: Biết nguồn gốc khi khách mang sản phẩm vào
4. **Báo cáo**: Tổng hàng đã bán theo sản phẩm/khách hàng

---

## Mô hình kho ảo

```
┌────────────────────────────────────────────┐
│       CÁC KHO HOẠT ĐỘNG (active)           │
│  ┌──────┐  ┌───────┐  ┌─────┐  ┌────────┐ │
│  │ main │  │ parts │  │ rma │  │warranty│ │
│  └──────┘  └───────┘  └─────┘  └────────┘ │
│         ↑↓ chuyển kho tự do ↑↓            │
└────────────────────────────────────────────┘
                    │
                    │ Phiếu Xuất (sale)
                    ▼
┌────────────────────────────────────────────┐
│     customer_installed (luôn issued)       │
│                                            │
│   - Điểm cuối, không phải kho hoạt động    │
│   - Chỉ để tra cứu: serial nào → khách nào │
│   - Không thể chuyển kho từ/vào đây        │
└────────────────────────────────────────────┘
                    │
                    │ Phiếu Nhập (customer_return)
                    ▼
            Quay lại kho hoạt động
```

### Đặc điểm kho `customer_installed`

| Thuộc tính | Giá trị |
|------------|---------|
| `status` của sản phẩm | Luôn là `issued` |
| Chuyển kho vào | ❌ Không cho phép (dùng Phiếu Xuất) |
| Chuyển kho ra | ❌ Không cho phép (dùng Phiếu Nhập với `customer_return`) |
| Mục đích | Tra cứu lịch sử, không quản lý tồn kho |

---

## Hành vi hiện tại vs Hành vi mong muốn

### Hiện tại

```sql
-- Trigger process_issue_serial() chỉ:
UPDATE physical_products
SET status = 'issued'
WHERE id = NEW.physical_product_id;

-- Giảm tồn kho
PERFORM upsert_product_stock(v_product_id, v_from_warehouse_id, -1);
```

**Vấn đề**: Sản phẩm được đánh dấu `issued` nhưng `virtual_warehouse_id` vẫn giữ nguyên kho cũ → không thể tra cứu "sản phẩm nào đã bán cho khách nào".

### Mong muốn

```sql
-- Trigger process_issue_serial() cần:
UPDATE physical_products
SET status = 'issued',
    virtual_warehouse_id = v_customer_installed_warehouse_id,
    previous_virtual_warehouse_id = virtual_warehouse_id,
    last_known_customer_id = v_customer_id
WHERE id = NEW.physical_product_id;

-- Giảm tồn kho từ kho nguồn
PERFORM upsert_product_stock(v_product_id, v_from_warehouse_id, -1);

-- Tăng tồn kho tại customer_installed (để tracking)
PERFORM upsert_product_stock(v_product_id, v_customer_installed_warehouse_id, 1);
```

---

## Schema Changes

### 1. Lấy ID kho customer_installed

```sql
-- File: docs/data/schemas/600_stock_triggers.sql

-- Trong function process_issue_serial(), thêm:
DECLARE
  v_customer_installed_warehouse_id UUID;
BEGIN
  -- Lấy ID của kho customer_installed (global)
  SELECT id INTO v_customer_installed_warehouse_id
  FROM public.virtual_warehouses
  WHERE warehouse_type = 'customer_installed'
    AND physical_warehouse_id IS NULL
  LIMIT 1;
```

### 2. Cập nhật trigger process_issue_serial()

```sql
-- File: docs/data/schemas/600_stock_triggers.sql

CREATE OR REPLACE FUNCTION public.process_issue_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_customer_id UUID;
  v_customer_installed_warehouse_id UUID;
BEGIN
  -- Lấy thông tin từ stock_issue
  SELECT sii.product_id, si.virtual_warehouse_id, si.customer_id
  INTO v_product_id, v_from_warehouse_id, v_customer_id
  FROM public.stock_issue_items sii
  JOIN public.stock_issues si ON sii.issue_id = si.id
  WHERE sii.id = NEW.issue_item_id;

  -- Lấy ID kho customer_installed
  SELECT id INTO v_customer_installed_warehouse_id
  FROM public.virtual_warehouses
  WHERE warehouse_type = 'customer_installed'
    AND physical_warehouse_id IS NULL
  LIMIT 1;

  -- Cập nhật physical_product
  UPDATE public.physical_products
  SET status = 'issued',
      previous_virtual_warehouse_id = virtual_warehouse_id,
      virtual_warehouse_id = v_customer_installed_warehouse_id,
      last_known_customer_id = COALESCE(v_customer_id, last_known_customer_id),
      updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  -- Giảm tồn kho từ kho nguồn
  PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);

  -- Tăng tồn kho tại customer_installed (để tracking số lượng đã bán)
  PERFORM public.upsert_product_stock(v_product_id, v_customer_installed_warehouse_id, 1);

  RETURN NEW;
END;
$$;
```

---

## Validation Rules

### 1. Phiếu Xuất Kho - Không được xuất từ customer_installed

```typescript
// File: src/server/routers/inventory/issues.ts

// Trong mutation create:
const { data: fromWarehouse } = await ctx.supabaseAdmin
  .from("virtual_warehouses")
  .select("warehouse_type")
  .eq("id", input.virtualWarehouseId)
  .single();

if (fromWarehouse?.warehouse_type === "customer_installed") {
  throw new Error(
    "Không thể xuất kho từ 'Hàng Đã Bán'. " +
    "Nếu cần điều chỉnh, vui lòng sử dụng Phiếu nhập kho với lý do 'Khách trả lại'."
  );
}
```

### 2. Bắt buộc customer_id khi reason = 'sale'

```typescript
// File: src/server/routers/inventory/issues.ts

if (input.issueReason === 'sale' && !input.customerId) {
  throw new Error('Vui lòng chọn khách hàng khi xuất bán hàng');
}
```

---

## Frontend Changes

### 1. Form tạo phiếu xuất kho

```tsx
// File: src/app/(auth)/inventory/documents/issues/new/page.tsx

// Khi reason = 'sale', customer_id là bắt buộc
{issueReason === 'sale' && (
  <div className="grid gap-2">
    <Label className="text-primary">Khách hàng *</Label>
    <CustomerSelect
      value={customerId}
      onChange={setCustomerId}
      required
    />
  </div>
)}
```

### 2. Ẩn kho customer_installed trong dropdown

```tsx
// File: component WarehouseSelect

// Filter bỏ customer_installed
const filteredWarehouses = warehouses.filter(
  w => w.warehouse_type !== 'customer_installed'
);
```

---

## Luồng dữ liệu hoàn chỉnh

### Xuất bán hàng

```
1. User tạo Phiếu Xuất Kho
   - reason: 'sale'
   - customer_id: bắt buộc
   - virtual_warehouse_id: kho nguồn (main, parts...)

2. User thêm serial vào phiếu
   - Trigger process_issue_serial() chạy

3. Trigger thực hiện:
   - physical_product.status = 'issued'
   - physical_product.virtual_warehouse_id = customer_installed
   - physical_product.last_known_customer_id = customer_id
   - Giảm stock tại kho nguồn
   - Tăng stock tại customer_installed
```

### Khách trả hàng

```
1. User tạo Phiếu Nhập Kho
   - reason: 'customer_return'
   - customer_id: bắt buộc
   - virtual_warehouse_id: kho đích (main, warranty...)

2. User nhập serial
   - Validation: serial phải đang ở customer_installed

3. Xử lý:
   - physical_product.status = 'active'
   - physical_product.virtual_warehouse_id = kho đích
   - Giảm stock tại customer_installed
   - Tăng stock tại kho đích
```

---

## Test Cases

### TC1: Xuất bán hàng thành công

- **Input**: reason=sale, customer_id=XXX, serial=ABC001, từ kho main
- **Expected**:
  - physical_product.status = 'issued' ✓
  - physical_product.virtual_warehouse_id = customer_installed ✓
  - physical_product.last_known_customer_id = XXX ✓
  - stock tại main giảm 1 ✓
  - stock tại customer_installed tăng 1 ✓

### TC2: Xuất bán thiếu customer_id

- **Input**: reason=sale, customer_id=null
- **Expected**: Báo lỗi "Vui lòng chọn khách hàng" ✓

### TC3: Xuất từ kho customer_installed

- **Input**: virtual_warehouse_id = customer_installed
- **Expected**: Báo lỗi "Không thể xuất kho từ 'Hàng Đã Bán'" ✓

### TC4: Tra cứu serial đã bán

- **Input**: Tìm serial ABC001
- **Expected**:
  - Hiển thị đang ở kho "Hàng Đã Bán" ✓
  - Hiển thị khách hàng sở hữu ✓

### TC5: Khách trả hàng - nhập serial từ customer_installed

- **Input**: Phiếu nhập với reason=customer_return, serial=ABC001 (đang ở customer_installed)
- **Expected**:
  - physical_product.status = 'active' ✓
  - physical_product.virtual_warehouse_id = kho đích ✓
  - stock tại customer_installed giảm 1 ✓
  - stock tại kho đích tăng 1 ✓

---

## Migration Plan

### Phase 1: Schema & Trigger ✅ DONE

1. ✅ Cập nhật trigger `process_issue_serial()` trong `600_stock_triggers.sql`
2. ✅ Chạy `setup_schema.sh` để apply

**Files changed:**
- `docs/data/schemas/600_stock_triggers.sql` - Trigger chỉ chuyển sang customer_installed khi `reason = 'sale'`
- `supabase/schemas/600_stock_triggers.sql` - Đồng bộ

### Phase 2: Backend Validation ✅ DONE

1. ✅ Thêm validation chặn xuất từ `customer_installed`
2. ✅ Thêm validation bắt buộc `customer_id` khi `reason = 'sale'`

**Files changed:**
- `src/server/routers/inventory/issues.ts` - Thêm validation trong mutation `create`

### Phase 3: Frontend ✅ DONE

1. ✅ Ẩn kho `customer_installed` trong dropdown chọn kho xuất
2. ✅ Hiển thị field khách hàng bắt buộc khi `reason = 'sale'`
3. ✅ Validation frontend trước khi submit

**Files changed:**
- `src/app/(auth)/inventory/documents/issues/new/page.tsx` - Filter kho, UI required, validation
- `src/app/(auth)/inventory/documents/issues/[id]/edit/page.tsx` - Cùng logic cho edit page

### Phase 4: Data Migration ✅ DONE (Script created)

Script migration đã được tạo tại `docs/data/schemas/610_migrate_sold_products_to_customer_installed.sql`

**Cách sử dụng:**
1. Mở file và chạy query preview (Step 1) để xem các record bị ảnh hưởng
2. Chạy DO block (Step 2) để migrate
3. Chạy query verify (Step 3) để kiểm tra kết quả

---

## Related Documents

- [Stock Receipt Reason Enhancement](./stock-receipt-reason-enhancement.md) - Phân loại phiếu nhập kho
- Schema: `docs/data/schemas/600_stock_triggers.sql`
- Router: `src/server/routers/inventory/issues.ts`
- Migration: `docs/data/schemas/610_migrate_sold_products_to_customer_installed.sql`

## Implementation Notes

### Trigger Logic

Trigger `process_issue_serial()` chỉ chuyển serial sang `customer_installed` khi `issue_reason = 'sale'`. Các lý do xuất khác (warranty_replacement, repair, internal_use, ...) vẫn giữ nguyên hành vi cũ (chỉ đánh dấu `status = 'issued'`).

```sql
IF v_issue_reason = 'sale' THEN
  -- Move to customer_installed + track customer
  UPDATE physical_products SET
    virtual_warehouse_id = customer_installed,
    previous_virtual_warehouse_id = old_warehouse,
    last_known_customer_id = customer_id
  ...
ELSE
  -- Original behavior: just mark as issued
  UPDATE physical_products SET status = 'issued' ...
END IF;
```
