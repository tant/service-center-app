# Điều Chỉnh Logic Hoàn Thành Ticket Với Warranty Replacement

**Ngày:** 2025-12-15
**Trạng thái:** Đề xuất
**Liên quan:** `src/server/routers/tickets.ts` - `setOutcome()`

---

## 1. Vấn Đề Hiện Tại

### 1.1 Bug trong code

Hàm `setOutcome()` (line 1958-1973) cố tạo `stock_movement` nhưng **sử dụng sai tên cột**:

| Code hiện tại | Schema thực tế |
|---------------|----------------|
| `from_warehouse_type` | `from_virtual_warehouse` |
| `to_warehouse_type` | `to_virtual_warehouse` |
| `reference_type` | ❌ Không tồn tại |
| `reference_id` | `ticket_id` |
| `created_by_id` | `moved_by_id` |

**Hậu quả:** Insert fail silently → không có record stock_movement.

### 1.2 Thiếu phiếu chuyển kho

- Hiện tại chỉ update trực tiếp `physical_products`
- Không tạo `stock_transfer` → thiếu chứng từ cho kế toán/audit
- Không có Issue/Receipt tự động

### 1.3 Không xử lý sản phẩm cũ

- Sản phẩm khách gửi bảo hành vẫn ở `Hàng Đã Bán`
- Không được chuyển vào `Kho Đang Sửa Chữa`

---

## 2. Yêu Cầu Điều Chỉnh

### 2.1 Khi hoàn thành ticket với `warranty_replacement`:

1. **Sản phẩm THAY THẾ (mới):**
   - Tạo phiếu chuyển kho: `Kho Bảo Hành` → `Hàng Đã Bán`
   - Auto-approve để trigger cập nhật tồn kho

2. **Sản phẩm CŨ (từ khách):**
   - Tạo phiếu chuyển kho: `Hàng Đã Bán` → `Kho Đang Sửa Chữa`
   - Auto-approve để trigger cập nhật tồn kho

### 2.2 Không thay đổi:

- Luồng tạo ticket (không cần inbound tự động)
- Các outcome khác (`repaired`, `unrepairable`)

---

## 3. Thiết Kế Chi Tiết

### 3.1 Flow mới cho `setOutcome` với `warranty_replacement`

```
setOutcome(ticket_id, outcome='warranty_replacement', replacement_product_id)
    │
    ├─► Validate ticket (status = in_progress, warranty_type = warranty)
    │
    ├─► Validate replacement product (ở warranty_stock, status = active)
    │
    ├─► Tìm sản phẩm cũ (physical_product có serial = ticket.serial_number)
    │
    ├─► [TRANSFER 1] Sản phẩm THAY THẾ: warranty_stock → customer_installed
    │   ├── Tạo stock_transfer
    │   ├── Tạo stock_transfer_item
    │   ├── Tạo stock_transfer_serial
    │   └── Approve transfer → trigger update physical_product
    │
    ├─► [TRANSFER 2] Sản phẩm CŨ: customer_installed → in_service
    │   ├── Tạo stock_transfer
    │   ├── Tạo stock_transfer_item
    │   ├── Tạo stock_transfer_serial
    │   └── Approve transfer → trigger update physical_product
    │
    ├─► Update ticket (status, outcome, replacement_product_id)
    │
    └─► Tạo comment, gửi email, audit log
```

### 3.2 Cấu trúc 2 phiếu chuyển kho

#### Transfer 1: Xuất sản phẩm thay thế

| Field | Value |
|-------|-------|
| `from_virtual_warehouse_id` | Kho Bảo Hành (`warranty_stock`) |
| `to_virtual_warehouse_id` | Hàng Đã Bán (`customer_installed`) |
| `customer_id` | `ticket.customer_id` |
| `status` | `approved` (auto) |
| `notes` | `Auto: Xuất sản phẩm đổi bảo hành - Phiếu {ticket_number}` |

#### Transfer 2: Nhận sản phẩm cũ vào sửa chữa

| Field | Value |
|-------|-------|
| `from_virtual_warehouse_id` | Hàng Đã Bán (`customer_installed`) |
| `to_virtual_warehouse_id` | Kho Đang Sửa Chữa (`in_service`) |
| `customer_id` | `ticket.customer_id` |
| `status` | `approved` (auto) |
| `notes` | `Auto: Nhận sản phẩm bảo hành - Phiếu {ticket_number}` |

### 3.3 Kết quả mong đợi

Sau khi `setOutcome` với `warranty_replacement`:

| Sản phẩm | Serial | Kho trước | Kho sau | Status |
|----------|--------|-----------|---------|--------|
| Thay thế (mới) | SP-BH-001 | Kho Bảo Hành | Hàng Đã Bán | `issued` |
| Cũ (từ khách) | SP-SOLD-009 | Hàng Đã Bán | Kho Đang Sửa Chữa | `active` |

Phiếu chuyển kho:
- 2 phiếu `stock_transfer` với status `approved`
- 2 phiếu `stock_issue` (auto-generated)
- 2 phiếu `stock_receipt` (auto-generated)

---

## 4. Code Changes

### 4.1 File: `src/server/routers/tickets.ts`

**Thay đổi hàm `setOutcome()`:**

```typescript
// Thêm helper function
async function createAutoTransfer(
  supabaseAdmin: SupabaseClient,
  {
    fromWarehouseId,
    toWarehouseId,
    customerId,
    physicalProductId,
    serialNumber,
    productId,
    notes,
    createdById,
    approvedById,
  }: {
    fromWarehouseId: string;
    toWarehouseId: string;
    customerId: string;
    physicalProductId: string;
    serialNumber: string;
    productId: string;
    notes: string;
    createdById: string;
    approvedById: string;
  }
) {
  // 1. Tạo transfer
  const { data: transfer, error: transferError } = await supabaseAdmin
    .from("stock_transfers")
    .insert({
      from_virtual_warehouse_id: fromWarehouseId,
      to_virtual_warehouse_id: toWarehouseId,
      customer_id: customerId,
      status: "draft",
      notes,
      created_by_id: createdById,
    })
    .select()
    .single();

  if (transferError) throw new Error(`Lỗi tạo phiếu chuyển kho: ${transferError.message}`);

  // 2. Tạo transfer item
  const { data: transferItem, error: itemError } = await supabaseAdmin
    .from("stock_transfer_items")
    .insert({
      transfer_id: transfer.id,
      product_id: productId,
      quantity: 1,
    })
    .select()
    .single();

  if (itemError) throw new Error(`Lỗi tạo item chuyển kho: ${itemError.message}`);

  // 3. Thêm serial
  const { error: serialError } = await supabaseAdmin
    .from("stock_transfer_serials")
    .insert({
      transfer_item_id: transferItem.id,
      physical_product_id: physicalProductId,
      serial_number: serialNumber,
    });

  if (serialError) throw new Error(`Lỗi thêm serial: ${serialError.message}`);

  // 4. Approve transfer
  const { error: approveError } = await supabaseAdmin
    .from("stock_transfers")
    .update({
      status: "approved",
      approved_by_id: approvedById,
      approved_at: new Date().toISOString(),
    })
    .eq("id", transfer.id);

  if (approveError) throw new Error(`Lỗi duyệt phiếu: ${approveError.message}`);

  return transfer;
}
```

**Trong `setOutcome` mutation, thay thế logic hiện tại:**

```typescript
// 5. Nếu warranty_replacement, tạo 2 phiếu chuyển kho
if (outcome === "warranty_replacement" && replacement_product_id) {

  // Lấy thông tin warehouses
  const { data: warehouses } = await ctx.supabaseAdmin
    .from("virtual_warehouses")
    .select("id, warehouse_type");

  const warrantyWarehouse = warehouses?.find(w => w.warehouse_type === "warranty_stock");
  const customerWarehouse = warehouses?.find(w => w.warehouse_type === "customer_installed");
  const inServiceWarehouse = warehouses?.find(w => w.warehouse_type === "in_service");

  if (!warrantyWarehouse || !customerWarehouse || !inServiceWarehouse) {
    throw new Error("Thiếu cấu hình kho ảo");
  }

  // Lấy thông tin sản phẩm thay thế
  const { data: replacementProduct } = await ctx.supabaseAdmin
    .from("physical_products")
    .select("id, serial_number, product_id")
    .eq("id", replacement_product_id)
    .single();

  // [TRANSFER 1] Xuất sản phẩm thay thế: warranty_stock → customer_installed
  await createAutoTransfer(ctx.supabaseAdmin, {
    fromWarehouseId: warrantyWarehouse.id,
    toWarehouseId: customerWarehouse.id,
    customerId: ticket.customer_id,
    physicalProductId: replacement_product_id,
    serialNumber: replacementProduct!.serial_number,
    productId: replacementProduct!.product_id,
    notes: `Auto: Xuất sản phẩm đổi bảo hành - Phiếu ${ticket.ticket_number}`,
    createdById: profileId,
    approvedById: profileId,
  });

  // Tìm sản phẩm cũ (từ serial trong ticket)
  if (ticket.serial_number) {
    const { data: oldProduct } = await ctx.supabaseAdmin
      .from("physical_products")
      .select("id, serial_number, product_id, virtual_warehouse_id")
      .eq("serial_number", ticket.serial_number)
      .single();

    if (oldProduct && oldProduct.virtual_warehouse_id === customerWarehouse.id) {
      // [TRANSFER 2] Nhận sản phẩm cũ: customer_installed → in_service
      await createAutoTransfer(ctx.supabaseAdmin, {
        fromWarehouseId: customerWarehouse.id,
        toWarehouseId: inServiceWarehouse.id,
        customerId: ticket.customer_id,
        physicalProductId: oldProduct.id,
        serialNumber: oldProduct.serial_number,
        productId: oldProduct.product_id,
        notes: `Auto: Nhận sản phẩm bảo hành - Phiếu ${ticket.ticket_number}`,
        createdById: profileId,
        approvedById: profileId,
      });
    }
  }

  // Update replacement product's customer reference
  await ctx.supabaseAdmin
    .from("physical_products")
    .update({ last_known_customer_id: ticket.customer_id })
    .eq("id", replacement_product_id);
}
```

### 4.2 Xóa code cũ

Xóa đoạn code update trực tiếp `physical_products` và `stock_movements` (line 1937-1974) vì đã được trigger xử lý khi approve transfer.

---

## 5. Kiểm Thử

### 5.1 Test Cases

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Set outcome warranty_replacement với replacement hợp lệ | 2 transfers created, 2 issues, 2 receipts |
| 2 | Sản phẩm thay thế | Chuyển từ Kho Bảo Hành → Hàng Đã Bán |
| 3 | Sản phẩm cũ | Chuyển từ Hàng Đã Bán → Kho Đang Sửa Chữa |
| 4 | Ticket không có serial_number | Chỉ tạo 1 transfer (sản phẩm thay thế) |
| 5 | Serial cũ không tồn tại trong DB | Chỉ tạo 1 transfer (sản phẩm thay thế) |

### 5.2 Verification Queries

```sql
-- Kiểm tra transfers được tạo
SELECT
  st.transfer_number,
  st.status,
  vw_from.name as from_warehouse,
  vw_to.name as to_warehouse,
  st.notes
FROM stock_transfers st
JOIN virtual_warehouses vw_from ON st.from_virtual_warehouse_id = vw_from.id
JOIN virtual_warehouses vw_to ON st.to_virtual_warehouse_id = vw_to.id
WHERE st.notes LIKE '%Auto:%'
ORDER BY st.created_at DESC;

-- Kiểm tra vị trí sản phẩm sau khi complete
SELECT
  pp.serial_number,
  pp.status,
  vw.name as current_warehouse
FROM physical_products pp
JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
WHERE pp.serial_number IN ('SP-BH-001', 'SP-SOLD-009');
```

---

## 6. Rollback Plan

Nếu có lỗi:
1. Revert code về version cũ
2. Các transfers đã tạo có thể cancel thủ công
3. Physical products có thể update lại warehouse thủ công

---

## 7. Checklist Triển Khai

- [ ] Backup database trước khi deploy
- [ ] Update `src/server/routers/tickets.ts`
- [ ] Test trên môi trường dev
- [ ] Verify với phiếu SV-2025-015 (đã có data)
- [ ] Deploy lên staging
- [ ] QA verification
- [ ] Deploy production
