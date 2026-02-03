# Tự Động Tạo Phiếu Chuyển Kho Trong Quy Trình Bảo Hành

**Trạng thái:** Luồng 2 ✅ Completed | Luồng 1 🔲 Pending
**Ngày:** 2025-11-06
**Cập nhật:** 2025-12-15
**Owner:** Ops/Inventory + Service Ticket

> **📋 Implementation Status:**
>
> | Luồng | Trạng thái | Commit |
> |-------|------------|--------|
> | **Luồng 2 (Outbound)** | ✅ Completed | `2311198` - fix: create stock transfers for warranty replacement |
> | **Luồng 1 (Inbound)** | 🔲 Pending | Chưa triển khai |
>
> **Luồng 2 đã triển khai:**
> - Tự động tạo 2 phiếu chuyển kho khi `setOutcome` với `warranty_replacement`
> - Sản phẩm thay thế: `warranty_stock` → `customer_installed`
> - Sản phẩm cũ: `customer_installed` → `in_service`
> - Auto-approve triggers cập nhật tồn kho và tạo Issue/Receipt

## 1. Bối Cảnh

**Trước khi triển khai (đã fix):**
- ~~Hoàn tất ticket bảo hành chỉ tự đổi `virtual_warehouse_type` → `customer_installed` và ghi `stock_movement` (không có phiếu chuyển kho)~~
- ~~Kho/đối soát kế toán thiếu chứng từ chuyển kho~~

**Sau khi triển khai Luồng 2:**
- ✅ Tự động tạo phiếu chuyển kho khi hoàn tất warranty replacement
- ✅ Có đầy đủ chứng từ (stock_transfer, stock_issue, stock_receipt)

**Còn lại (Luồng 1):**
- Khi nhận sản phẩm từ khách để bảo hành, chưa có cơ chế tự động chuyển từ `customer_installed` → `in_service`

## 2. Mục Tiêu

Hệ thống tự động tạo phiếu chuyển kho tại **2 thời điểm** trong quy trình bảo hành:

| Thời điểm | Luồng chuyển kho | Mô tả |
|-----------|------------------|-------|
| **Nhận sản phẩm bảo hành** | `customer_installed` → `in_service` | Khi tạo/tiếp nhận ticket từ service request |
| **Hoàn tất đổi sản phẩm** | `warranty_stock` → `customer_installed` | Khi hoàn tất ticket với outcome `warranty_replacement` |

**Lợi ích:**
- Giữ audit trail đầy đủ
- Tồn kho luôn khớp với thực tế
- Không tăng bước thủ công cho nhân viên
- Có chứng từ cho kế toán đối soát

## 3. Phạm Vi

### 3.1 Luồng 1: Nhận sản phẩm bảo hành (Inbound)

- Áp dụng khi **chuyển đổi service_request thành service_ticket** hoặc **tạo ticket bảo hành mới** có sản phẩm từ khách.
- Sản phẩm phải có `physical_product_id` + serial đang nằm trong `customer_installed`.
- Chỉ áp dụng cho ticket có `warranty_type = 'warranty'` hoặc `'paid'`.

### 3.2 Luồng 2: Xuất sản phẩm đổi mới (Outbound)

- Áp dụng cho **service_tickets** với outcome `warranty_replacement`.
- Sản phẩm thay thế phải có `physical_product_id` + serial đang nằm trong `warranty_stock`.
- Không thay đổi luồng paid/goodwill (không đổi sản phẩm).

## 4. Luồng Mới (Chi Tiết)

### 4.1 Luồng 1: Nhận sản phẩm bảo hành

```
Tạo ticket từ Service Request / Tạo ticket mới
    ↓
Validate: serial thuộc customer_installed?
    ↓ (Yes)
Tạo phiếu chuyển kho (stock_transfer) - INBOUND
    - transfer_type = 'service_inbound'
    - from_virtual_warehouse = customer_installed
    - to_virtual_warehouse   = in_service
    - customer_id = ticket.customer_id
    - reference_type = 'service_ticket'
    - reference_id = ticket.id
    - status = approved (tự sinh issue + receipt qua trigger)
    - chuyển serials vào transfer_serials
    ↓
Auto-generate Issue + Receipt (trigger auto_generate_transfer_documents)
    ↓
Cập nhật physical_product:
    - virtual_warehouse_type = 'in_service'
    - previous_virtual_warehouse_id = (customer_installed id)
    ↓
Ghi stock_movement + audit log
    ↓
Ticket sẵn sàng xử lý
```

### 4.2 Luồng 2: Xuất sản phẩm đổi mới

```
Complete ticket (warranty_replacement)
    ↓
Validate: serial thay thế thuộc warranty_stock?
    ↓ (Yes)
Tạo phiếu chuyển kho (stock_transfer) - OUTBOUND
    - transfer_type = 'service_outbound'
    - from_virtual_warehouse = warranty_stock
    - to_virtual_warehouse   = customer_installed
    - customer_id = ticket.customer_id (ghi last_known_customer_id)
    - reference_type = 'service_ticket'
    - reference_id = ticket.id
    - status = approved (tự sinh issue + receipt qua trigger)
    - chuyển serials vào transfer_serials
    ↓
Auto-generate Issue + Receipt (trigger auto_generate_transfer_documents)
    ↓
Cập nhật physical_product (sản phẩm mới):
    - virtual_warehouse_type = 'customer_installed'
    - last_known_customer_id = ticket.customer_id
    ↓
Cập nhật physical_product (sản phẩm cũ - nếu có):
    - virtual_warehouse_type = 'rma_staging' hoặc 'dead_stock' (tùy tình trạng)
    ↓
Ghi stock_movement + audit log
    ↓
Hoàn tất ticket
```

### 4.3 Tổng quan luồng kho trong quy trình bảo hành

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        QUY TRÌNH BẢO HÀNH                               │
└─────────────────────────────────────────────────────────────────────────┘

[Khách hàng]                                              [Kho công ty]
     │                                                          │
     │  ┌──────────────────────┐                               │
     │  │  customer_installed  │                               │
     │  │    (Hàng đã bán)     │                               │
     │  └──────────┬───────────┘                               │
     │             │                                           │
     │             │ (1) Nhận sản phẩm bảo hành                │
     │             │     Transfer: INBOUND                     │
     │             ▼                                           │
     │  ┌──────────────────────┐                               │
     │  │      in_service      │                               │
     │  │   (Đang sửa chữa)    │                               │
     │  └──────────┬───────────┘                               │
     │             │                                           │
     │             ├─────────────────┐                         │
     │             │                 │                         │
     │             ▼                 ▼                         │
     │     [Sửa được]        [Không sửa được]                  │
     │             │                 │                         │
     │             │                 ▼                         │
     │             │      ┌──────────────────────┐             │
     │             │      │    warranty_stock    │◄────────────┤
     │             │      │   (Kho bảo hành)     │             │
     │             │      └──────────┬───────────┘             │
     │             │                 │                         │
     │             │                 │ (2) Xuất sản phẩm mới   │
     │             │                 │     Transfer: OUTBOUND  │
     │             │                 │                         │
     │             ▼                 ▼                         │
     │  ┌──────────────────────────────────────┐               │
     │  │         customer_installed           │               │
     │  │          (Hàng đã bán)               │               │
     │  └──────────────────────────────────────┘               │
     │                                                          │
     │  [Sản phẩm cũ hỏng]                                     │
     │             │                                           │
     │             ▼                                           │
     │  ┌──────────────────────┐                               │
     │  │  rma_staging /       │                               │
     │  │  dead_stock          │                               │
     │  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5. Thay Đổi Kỹ Thuật

### 5.1 Database

**Bổ sung ENUM `transfer_type`:**
```sql
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'service_inbound';
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'service_outbound';
```

**Bổ sung columns cho `stock_transfers`:**
```sql
ALTER TABLE public.stock_transfers
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_id UUID;

COMMENT ON COLUMN public.stock_transfers.reference_type IS
'Loại entity liên quan: service_ticket, service_request, etc.';
COMMENT ON COLUMN public.stock_transfers.reference_id IS
'ID của entity liên quan';
```

### 5.2 API Layer

**Luồng 1 - Tạo ticket (service request conversion / new ticket):**
```typescript
// src/server/routers/service-ticket.ts
createFromServiceRequest: procedure
  .input(createTicketFromRequestSchema)
  .mutation(async ({ ctx, input }) => {
    return ctx.supabaseAdmin.rpc('create_ticket_with_inbound_transfer', {
      p_service_request_id: input.serviceRequestId,
      p_physical_product_id: input.physicalProductId,
      // ... other params
    });
  });
```

**Luồng 2 - Hoàn tất ticket:**
```typescript
// src/server/routers/service-ticket.ts
completeTicket: procedure
  .input(completeTicketSchema)
  .mutation(async ({ ctx, input }) => {
    if (input.outcome === 'warranty_replacement') {
      return ctx.supabaseAdmin.rpc('complete_ticket_with_outbound_transfer', {
        p_ticket_id: input.ticketId,
        p_replacement_product_id: input.replacementProductId,
        // ... other params
      });
    }
    // ... handle other outcomes
  });
```

### 5.3 Database Functions

**Function: Tạo ticket với inbound transfer:**
```sql
CREATE OR REPLACE FUNCTION public.create_ticket_with_inbound_transfer(
  p_service_request_id UUID,
  p_physical_product_id UUID,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ticket_id UUID;
  v_transfer_id UUID;
  v_customer_id UUID;
  v_current_warehouse public.warehouse_type;
BEGIN
  -- Validate physical product exists and is in customer_installed
  SELECT virtual_warehouse_type, last_known_customer_id
  INTO v_current_warehouse, v_customer_id
  FROM public.physical_products
  WHERE id = p_physical_product_id;

  IF v_current_warehouse IS NULL THEN
    RAISE EXCEPTION 'Physical product not found';
  END IF;

  IF v_current_warehouse != 'customer_installed' THEN
    RAISE EXCEPTION 'Product must be in customer_installed warehouse. Current: %', v_current_warehouse;
  END IF;

  -- Create service ticket
  INSERT INTO public.service_tickets (service_request_id, physical_product_id, assigned_to, ...)
  VALUES (p_service_request_id, p_physical_product_id, p_assigned_to, ...)
  RETURNING id INTO v_ticket_id;

  -- Create inbound transfer
  INSERT INTO public.stock_transfers (
    transfer_type,
    from_virtual_warehouse_type,
    to_virtual_warehouse_type,
    customer_id,
    reference_type,
    reference_id,
    status,
    notes
  ) VALUES (
    'service_inbound',
    'customer_installed',
    'in_service',
    v_customer_id,
    'service_ticket',
    v_ticket_id,
    'approved',
    'Auto-generated: Nhận sản phẩm bảo hành từ khách'
  )
  RETURNING id INTO v_transfer_id;

  -- Add serial to transfer
  INSERT INTO public.transfer_serials (transfer_id, physical_product_id)
  VALUES (v_transfer_id, p_physical_product_id);

  -- Trigger will auto-generate issue/receipt and update product location

  RETURN v_ticket_id;
END;
$$;
```

**Function: Hoàn tất ticket với outbound transfer:**
```sql
CREATE OR REPLACE FUNCTION public.complete_ticket_with_outbound_transfer(
  p_ticket_id UUID,
  p_replacement_product_id UUID,
  p_old_product_destination public.warehouse_type DEFAULT 'rma_staging'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_transfer_id UUID;
  v_customer_id UUID;
  v_old_product_id UUID;
  v_current_warehouse public.warehouse_type;
BEGIN
  -- Get ticket info
  SELECT customer_id, physical_product_id
  INTO v_customer_id, v_old_product_id
  FROM public.service_tickets
  WHERE id = p_ticket_id;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found or missing customer';
  END IF;

  -- Validate replacement product is in warranty_stock
  SELECT virtual_warehouse_type
  INTO v_current_warehouse
  FROM public.physical_products
  WHERE id = p_replacement_product_id;

  IF v_current_warehouse != 'warranty_stock' THEN
    RAISE EXCEPTION 'Replacement product must be in warranty_stock. Current: %', v_current_warehouse;
  END IF;

  -- Create outbound transfer for new product
  INSERT INTO public.stock_transfers (
    transfer_type,
    from_virtual_warehouse_type,
    to_virtual_warehouse_type,
    customer_id,
    reference_type,
    reference_id,
    status,
    notes
  ) VALUES (
    'service_outbound',
    'warranty_stock',
    'customer_installed',
    v_customer_id,
    'service_ticket',
    p_ticket_id,
    'approved',
    'Auto-generated: Xuất sản phẩm đổi bảo hành cho khách'
  )
  RETURNING id INTO v_transfer_id;

  -- Add replacement serial to transfer
  INSERT INTO public.transfer_serials (transfer_id, physical_product_id)
  VALUES (v_transfer_id, p_replacement_product_id);

  -- Update new product's customer
  UPDATE public.physical_products
  SET last_known_customer_id = v_customer_id
  WHERE id = p_replacement_product_id;

  -- Move old product to rma_staging or dead_stock
  IF v_old_product_id IS NOT NULL THEN
    UPDATE public.physical_products
    SET virtual_warehouse_type = p_old_product_destination
    WHERE id = v_old_product_id;
  END IF;

  -- Complete ticket
  UPDATE public.service_tickets
  SET
    status = 'completed',
    outcome = 'warranty_replacement',
    completed_at = NOW()
  WHERE id = p_ticket_id;

  RETURN v_transfer_id;
END;
$$;
```

### 5.4 Triggers

Tận dụng trigger có sẵn:
- `auto_generate_transfer_documents()` - sinh Issue + Receipt khi transfer status = `approved`
- `update_physical_product_warehouse_on_transfer` - cập nhật location + `previous_virtual_warehouse_id`

### 5.5 UI/UX

**Màn hình tạo ticket:**
- Nếu sản phẩm thuộc `customer_installed` → hiển thị thông báo "Sẽ tự động tạo phiếu nhập kho sửa chữa"
- Sau khi tạo → toast "Đã tạo phiếu chuyển kho [PC-YYYY-NNN]"

**Màn hình hoàn tất ticket:**
- Nếu chọn outcome `warranty_replacement` → yêu cầu chọn sản phẩm thay thế từ `warranty_stock`
- Sau khi hoàn tất → toast "Đã tạo phiếu xuất kho [PC-YYYY-NNN]"

**Trang transfer list:**
- Hiển thị phiếu được tạo tự động với badge "Auto"
- Filter theo `reference_type = 'service_ticket'`
- Link đến ticket liên quan

## 6. Ảnh Hưởng & Ràng Buộc

### 6.1 Luồng 1 (Inbound)
- Sản phẩm phải ở trạng thái `active` trong `customer_installed`
- Nếu serial đang ở `in_service` hoặc `transferring` → chặn tạo ticket
- Nếu serial không tồn tại trong hệ thống → cho phép tạo ticket nhưng không tạo transfer

### 6.2 Luồng 2 (Outbound)
- Sản phẩm thay thế phải ở `warranty_stock` với trạng thái `active`
- Nếu serial đang `transferring` hoặc đã gắn vào transfer draft khác → báo lỗi
- Cần xử lý sản phẩm cũ: chuyển sang `rma_staging` hoặc `dead_stock`

### 6.3 Chung
- Cần sẵn **kho ảo `warranty_stock`, `customer_installed`, `in_service`** (system default)
- Audit: thêm event `auto_transfer_inbound` và `auto_transfer_outbound` vào ticket history
- Transaction: nếu transfer tạo thất bại → rollback toàn bộ

## 7. Tài Liệu Cần Cập Nhật

- `docs/ARCHITECTURE-MASTER.md` – Service Ticket Flow & Warehouse auto-move
- `docs/architecture/INVENTORY-WORKFLOW-V2.md` – nhánh tạo transfer khi tạo/hoàn tất ticket
- `docs/archive/completed-projects/default-warehouse-system-2025-10.md` – mục Automatic Transfer Flow
- `docs/stories/01.08.serial-verification-and-stock-movements.md` – state diagram cập nhật
- `docs/qa/test-execution/06-e2e-workflows-checklist.md` – bổ sung test cases cho cả 2 luồng
- `docs/data/sample-tasks.md` – template notes về auto-transfer

## 8. Kiểm Thử Đề Xuất

### 8.1 Luồng 1: Inbound Transfer

**Unit Tests:**
- `create_ticket_with_inbound_transfer()` tạo transfer đúng (from/to, serial, customer)
- Chặn nếu sản phẩm không ở `customer_installed`
- Chặn nếu sản phẩm đang `transferring`

**Integration Tests:**
- Tạo ticket từ service request với serial hợp lệ → tạo transfer approved + issue + receipt
- Tồn kho: `customer_installed` giảm, `in_service` tăng
- `physical_product.virtual_warehouse_type` = `in_service`

**Negative Tests:**
- Serial không tồn tại → ticket tạo OK, không có transfer
- Serial ở `warranty_stock` → lỗi, không tạo ticket

### 8.2 Luồng 2: Outbound Transfer

**Unit Tests:**
- `complete_ticket_with_outbound_transfer()` tạo transfer đúng
- Chặn nếu sản phẩm thay thế không ở `warranty_stock`
- Cập nhật `last_known_customer_id` đúng

**Integration Tests:**
- Hoàn tất ticket warranty replacement → tạo transfer approved + issue + receipt
- Tồn kho: `warranty_stock` giảm, `customer_installed` tăng
- Sản phẩm cũ chuyển sang `rma_staging`

**Negative Tests:**
- Thiếu `replacement_product_id` → lỗi, ticket giữ nguyên
- Serial thay thế đang `transferring` → lỗi, rollback

### 8.3 E2E Tests

1. **Full warranty replacement flow:**
   - Tạo service request → convert to ticket (inbound transfer created)
   - Xử lý ticket → complete with replacement (outbound transfer created)
   - Verify: 2 transfers, tồn kho đúng, audit logs đầy đủ

2. **UI verification:**
   - Transfer list hiển thị 2 phiếu với badge "Auto"
   - Click vào phiếu → link đến ticket đúng
   - Ticket history hiển thị events `auto_transfer_inbound`, `auto_transfer_outbound`

## 9. Lịch Sử Thay Đổi

| Ngày | Phiên bản | Thay đổi |
|------|-----------|----------|
| 2025-11-06 | 1.0 | Khởi tạo - chỉ luồng outbound (warranty replacement) |
| 2025-12-15 | 2.0 | Bổ sung luồng inbound (nhận sản phẩm bảo hành), cập nhật diagram, thêm DB functions |
| 2025-12-15 | 2.1 | **Implemented Luồng 2**: Tạo 2 stock_transfer khi setOutcome với warranty_replacement. Commit: `2311198` |

## 10. Lưu Ý Quan Trọng Khi Implement Luồng 1

> ⚠️ **CRITICAL**: Khi implement Luồng 1 (Inbound), cần điều chỉnh logic `setOutcome` hiện tại để tránh conflict.

### 10.1 Conflict với logic `warranty_replacement` hiện tại

**Implementation hiện tại (Luồng 2 - commit `2311198`):**
```
setOutcome(warranty_replacement):
  - Transfer 1: SP thay thế warranty_stock → customer_installed
  - Transfer 2: SP cũ customer_installed → in_service
    ↑ Chỉ chạy nếu SP cũ đang ở customer_installed
```

**Sau khi có Luồng 1:**
```
Tạo ticket (Luồng 1):
  - SP cũ customer_installed → in_service ← Đã chuyển!

setOutcome(warranty_replacement):
  - Transfer 1: OK ✅
  - Transfer 2: KHÔNG CHẠY vì SP cũ đã ở in_service ← Thiếu transfer!
```

**→ Cần sửa code `setOutcome`:**
- Kiểm tra SP cũ đang ở đâu (customer_installed hay in_service)
- Nếu ở `in_service`: Tạo transfer `in_service` → `rma_staging` (thay vì `customer_installed` → `in_service`)

### 10.2 Xử lý SP cũ theo từng outcome

Khi Luồng 1 được implement, SP cũ sẽ ở `in_service` khi `setOutcome`. Cần xử lý:

| Outcome | SP cũ ở | Cần chuyển đến | Lý do |
|---------|---------|----------------|-------|
| `repaired` | in_service | `customer_installed` | Trả lại khách (đã sửa xong) |
| `warranty_replacement` | in_service | `rma_staging` | SP hỏng chờ trả NCC |
| `unrepairable` | in_service | **Cần hỏi user** | Nhiều option (xem bên dưới) |

### 10.3 Các option cho outcome `unrepairable`

| Destination | Mô tả | Khi nào dùng |
|-------------|-------|--------------|
| `customer_installed` | Trả SP hỏng về cho khách | Khách muốn giữ, hết bảo hành |
| `rma_staging` | Chờ trả NCC để claim warranty | Còn bảo hành NCC, cần gửi NCC |
| `dead_stock` | Thanh lý | Không còn giá trị, không claim được |

**Đề xuất implementation:**
```typescript
// Option A: Thêm field vào input
setOutcome({
  ticket_id,
  outcome: 'unrepairable',
  old_product_destination?: 'customer' | 'rma' | 'dead_stock', // Bắt buộc khi unrepairable
})

// Option B: Default behavior + config
// Default: trả lại khách (customer_installed)
// Config: có thể override ở level tenant/product
```

### 10.4 Checklist Implementation Luồng 1

```
□ Database
  □ Thêm transfer_type 'service_inbound' vào ENUM (nếu cần)
  □ Thêm column old_product_destination vào service_tickets (optional)

□ API - Tạo ticket
  □ Tạo transfer Inbound khi tạo ticket có serial ở customer_installed
  □ Link transfer với ticket (reference_type, reference_id)

□ API - setOutcome (SỬA CODE HIỆN TẠI)
  □ warranty_replacement:
    □ Bỏ logic tạo Transfer 2 hiện tại
    □ Thêm: SP cũ in_service → rma_staging
  □ repaired:
    □ Thêm: SP cũ in_service → customer_installed
  □ unrepairable:
    □ Thêm input old_product_destination
    □ Tạo Transfer theo destination đã chọn

□ UI
  □ Modal setOutcome: Thêm selector destination cho unrepairable
  □ Ticket detail: Hiển thị thông tin SP cũ và destination

□ Testing
  □ Test tạo ticket → Luồng 1 tạo transfer
  □ Test setOutcome mỗi outcome → đúng destination
  □ Test edge case: ticket không có serial (không có Luồng 1)
```

### 10.5 Migration cho tickets đã có

Khi deploy Luồng 1, các tickets đang `in_progress` sẽ không có transfer Inbound:
- **Option A**: Không tạo retroactively, chỉ áp dụng cho tickets mới
- **Option B**: Chạy migration script tạo transfer cho tickets đang xử lý

**Đề xuất**: Option A (đơn giản hơn, ít risk)
