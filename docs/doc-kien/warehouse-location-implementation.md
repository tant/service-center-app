# Kế Hoạch Implement: Vị Trí Kho Theo Quy Trình Sửa Chữa

## Gap Analysis

| Mốc | Tài liệu yêu cầu | Code hiện tại | Cần làm |
|-----|-------------------|---------------|---------|
| Mốc 1 (nhận hàng) | → `in_service` | Không di chuyển | Thêm transfer |
| Mốc 3 - repaired | `in_service` → `customer_installed` | Không di chuyển | Thêm transfer |
| Mốc 3 - unrepairable | `in_service` → `customer_installed` | Không di chuyển | Thêm transfer |
| Mốc 3 - warranty (hỏng) | `in_service` → `rma_staging` | → `in_service` | Sửa đích |
| Mốc 3 - warranty (thay thế) | `warranty_stock` → `customer_installed` | Đúng | Giữ nguyên |

## Thay đổi cần thực hiện

### 1. Mốc 1: Chuyển kho khi tạo ticket từ service request

**File**: `src/server/routers/tickets.ts` — hàm `createTicket` (manual) + `docs/data/schemas/203_service_requests.sql` — hàm `create_tickets_for_service_request` (auto)

**Hành động**: Sau khi tạo ticket, gọi `createAutoTransfer` chuyển sản phẩm `customer_installed` → `in_service`.

**Lý do chọn thời điểm tạo ticket** (không phải lúc submit request): Vì đây là lúc sản phẩm đã thực sự được nhận (`receipt_status = received`) và bắt đầu xử lý kỹ thuật.

**Lưu ý**: Chỉ thực hiện khi:
- Sản phẩm có serial_number
- Sản phẩm đang ở `customer_installed`

**Approach**: Implement ở TypeScript (router) thay vì SQL trigger vì:
- `createAutoTransfer` đã có sẵn ở TypeScript
- Dễ debug, dễ maintain
- Consistent với code hiện tại

**Cụ thể**:
- Trong hàm `create_tickets_for_service_request` (SQL) — KHÔNG sửa, vì hàm này chạy trong trigger và không thể gọi TypeScript
- Thay vào đó, tạo một procedure mới trong tickets router: sau khi ticket được tạo (cả manual và auto), check và chuyển kho
- Đối với auto-create: thêm logic chuyển kho vào event sau khi ticket tạo xong, hoặc thêm vào flow xử lý service request received

### 2. Mốc 3: Thêm transfer cho outcome `repaired` và `unrepairable`

**File**: `src/server/routers/tickets.ts` — hàm `setOutcome`

**Hành động**: Sau block `if (outcome === "warranty_replacement")`, thêm block mới:

```typescript
// Repaired or unrepairable: return product to customer
if ((outcome === "repaired" || outcome === "unrepairable") && ticket.serial_number) {
  // Lookup in_service + customer_installed warehouses
  // createAutoTransfer: in_service → customer_installed
}
```

### 3. Mốc 3: Sửa đích warranty_replacement (sản phẩm hỏng)

**File**: `src/server/routers/tickets.ts` — hàm `setOutcome`

**Thay đổi**: Transfer 2 (sản phẩm hỏng) đổi đích từ `in_service` thành `rma_staging`:

```
// Hiện tại:  customer_installed → in_service
// Sửa thành: in_service → rma_staging
```

**Lưu ý**: Vì ở Mốc 1 sản phẩm đã chuyển sang `in_service`, nên lúc set outcome sản phẩm hỏng đang ở `in_service` (không phải `customer_installed` nữa). Cần sửa cả source lẫn destination.

## File thay đổi

1. `src/server/routers/tickets.ts` — sửa `setOutcome` + thêm logic chuyển kho khi tạo ticket
2. Không cần sửa schema, enum, hay tạo file mới
