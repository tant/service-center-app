# Fix: Serial status giữ nguyên "issued" sau auto-transfer khi tạo phiếu dịch vụ

## Vấn đề

Khi tạo phiếu dịch vụ (service ticket), hệ thống tự động tạo phiếu chuyển kho (auto-transfer) từ kho `customer_installed` sang kho `in_service`. Phiếu chuyển được tạo và approve thành công, sản phẩm được di chuyển đúng kho — nhưng **status của serial vẫn giữ nguyên `issued`** thay vì chuyển thành `active`.

### Hệ quả

- Serial ở trạng thái `issued` trong kho `in_service` là không hợp lý — `issued` nghĩa là "đã xuất cho khách", nhưng sản phẩm đã quay lại trung tâm để sửa chữa.
- Các chức năng khác kiểm tra `status = 'active'` sẽ không tìm thấy serial này (ví dụ: chọn serial cho phiếu xuất, phiếu chuyển khác).
- Logic lock serial (`transferring`) không hoạt động cho sản phẩm `issued`, có thể dẫn đến chọn trùng serial.

## Phân tích nguyên nhân

### Flow auto-transfer khi nhận sản phẩm bảo hành

```
Service Request → received
  └─ createAutoTransfer() [src/server/routers/tickets.ts:152-244]
       ├─ 1. Tạo stock_transfer (draft)
       ├─ 2. Tạo transfer_item
       ├─ 3. Insert serial vào stock_transfer_serials
       │     └─ TRIGGER: mark_physical_product_as_transferring_on_transfer
       │        → UPDATE status = 'transferring' WHERE status = 'active'
       │        ⚠️ Serial đang là 'issued' → KHÔNG match → KHÔNG update
       └─ 4. Approve transfer
             ├─ TRIGGER: restore_active_status_on_transfer_approval
             │  → UPDATE status = 'active' WHERE status = 'transferring'
             │  ⚠️ Serial vẫn là 'issued' → KHÔNG match → KHÔNG update
             └─ TRIGGER: update_stock_on_transfer_approval
                → Di chuyển warehouse ✓ (không kiểm tra status)
```

### Root cause

Trigger `mark_physical_product_as_transferring_on_transfer` tại `docs/data/schemas/600_stock_triggers.sql:352-357`:

```sql
UPDATE public.physical_products
SET status = 'transferring', updated_at = NOW()
WHERE id = NEW.physical_product_id
  AND status = 'active';  -- ← CHỈ chấp nhận 'active'
```

Sản phẩm đã bán/lắp cho khách có status = `issued`. Điều kiện `AND status = 'active'` khiến trigger bỏ qua hoàn toàn, dẫn đến chuỗi trigger tiếp theo cũng không hoạt động.

### Các trigger liên quan

| Trigger | File & dòng | Điều kiện status | Vấn đề |
|---------|-------------|-----------------|--------|
| `mark_physical_product_as_transferring_on_transfer` | `600_stock_triggers.sql:345-361` | `status = 'active'` | Bỏ qua serial `issued` |
| `restore_active_status_on_transfer_approval` | `600_stock_triggers.sql:620-646` | `status = 'transferring'` | Bỏ qua vì bước trước không chuyển sang `transferring` |
| `update_stock_on_transfer_approval` | `600_stock_triggers.sql:518-565` | Không kiểm tra status | Hoạt động bình thường — warehouse được cập nhật |

## Giải pháp

### Mở rộng điều kiện lock serial cho transfer

**File:** `docs/data/schemas/600_stock_triggers.sql` — function `mark_physical_product_as_transferring_on_transfer`

```sql
-- Hiện tại (dòng 352-357):
UPDATE public.physical_products
SET status = 'transferring', updated_at = NOW()
WHERE id = NEW.physical_product_id
  AND status = 'active';

-- Sửa thành:
UPDATE public.physical_products
SET status = 'transferring', updated_at = NOW()
WHERE id = NEW.physical_product_id
  AND status IN ('active', 'issued');
```

### Giải thích

- `issued` là trạng thái hợp lệ cho sản phẩm quay lại trung tâm bảo hành. Cho phép lock nó khi thêm vào phiếu chuyển.
- Sau khi transfer được approve, trigger `restore_active_status_on_transfer_approval` sẽ chuyển `transferring` → `active` — đúng ngữ nghĩa: sản phẩm đã quay lại kho nội bộ, sẵn sàng sửa chữa.
- Trigger tương tự cho issue (`mark_physical_product_as_transferring_on_issue` dòng 280-304) cũng có cùng điều kiện `AND status = 'active'` — cần xem xét mở rộng tương tự nếu có use case xuất kho sản phẩm `issued`.

### Luồng sau khi fix

```
Serial status: issued
  → Insert vào transfer_serials → transferring  ✓ (lock)
  → Approve transfer            → active        ✓ (unlock + đúng ngữ nghĩa)
  → Warehouse: customer_installed → in_service   ✓ (đã hoạt động)
```

## Kiểm tra

1. Tạo service request cho sản phẩm đã bán (status = `issued`, kho = `customer_installed`)
2. Chuyển request sang `received` → auto-transfer được tạo
3. Kiểm tra `physical_products`:
   - `status` = `active` ✓
   - `virtual_warehouse_id` = kho `in_service` ✓
4. Kiểm tra serial có thể được chọn trong các phiếu xuất/chuyển kho khác ✓