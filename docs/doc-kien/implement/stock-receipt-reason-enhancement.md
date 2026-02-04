# Mở rộng phân loại Phiếu Nhập Kho (Stock Receipt Reason)

## Tổng quan

Mở rộng phiếu nhập kho từ 2 loại (normal, adjustment) thành 4 loại để phân biệt rõ nguồn gốc hàng nhập và áp dụng validation phù hợp.

## Lý do thay đổi

1. **Truy xuất nguồn gốc**: Biết hàng nhập từ đâu (mua mới, khách trả, RMA về)
2. **Validation chính xác**: Tránh nhập sai loại phiếu (ví dụ: nhập serial đang ở kho khác)
3. **Liên kết dữ liệu**: Gắn customer_id khi nhập hàng trả lại

---

## Các loại phiếu nhập kho mới

| Loại | Mô tả | customer_id | rma_reference |
|------|-------|-------------|---------------|
| `purchase` | Nhập mua hàng từ NCC/NSX | ❌ | ❌ |
| `customer_return` | Nhập hàng trả lại từ khách | ✅ Bắt buộc | ❌ |
| `rma_return` | Nhập RMA về từ NCC | ❌ | Optional |
| `adjustment` | Điều chỉnh kiểm kê | ❌ | ❌ |

---

## Schema Changes

### 1. Thêm enum mới

```sql
-- File: docs/data/schemas/100_enums_and_sequences.sql

DROP TYPE IF EXISTS public.stock_receipt_reason CASCADE;
CREATE TYPE public.stock_receipt_reason AS ENUM (
  'purchase',        -- Nhập mua hàng từ NCC/NSX
  'customer_return', -- Nhập hàng trả lại từ khách hàng
  'rma_return'       -- Nhập RMA về từ NCC
);
COMMENT ON TYPE public.stock_receipt_reason IS 'Lý do nhập kho: mua hàng, khách trả lại, RMA về';

GRANT USAGE ON TYPE public.stock_receipt_reason TO authenticated;
```

### 2. Thêm columns vào stock_receipts

```sql
-- File: docs/data/schemas/XXX_stock_receipt_reason.sql (migration mới)

-- Thêm column reason
ALTER TABLE public.stock_receipts
ADD COLUMN reason public.stock_receipt_reason DEFAULT 'purchase';

-- Thêm column customer_id (cho customer_return)
ALTER TABLE public.stock_receipts
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- Thêm column rma_reference (cho rma_return)
ALTER TABLE public.stock_receipts
ADD COLUMN rma_reference TEXT;

-- Comment
COMMENT ON COLUMN public.stock_receipts.reason IS 'Lý do nhập kho';
COMMENT ON COLUMN public.stock_receipts.customer_id IS 'Khách hàng trả lại (bắt buộc khi reason = customer_return)';
COMMENT ON COLUMN public.stock_receipts.rma_reference IS 'Mã tham chiếu RMA (optional khi reason = rma_return)';

-- Index cho query theo reason
CREATE INDEX idx_stock_receipts_reason ON public.stock_receipts(reason);
```

---

## Backend Validation Logic

### 1. Validation theo loại phiếu

```typescript
// File: src/server/routers/inventory/receipts.ts

// Trong mutation create:
if (input.reason === 'customer_return' && !input.customerId) {
  throw new Error('Vui lòng chọn khách hàng khi nhập hàng trả lại');
}
```

### 2. Validation khi nhập serial

```typescript
// File: src/server/routers/inventory/receipts.ts (hoặc serials.ts)

async function validateSerialForReceipt(
  serialNumber: string,
  reason: StockReceiptReason,
  supabase: SupabaseClient
) {
  // Tìm physical_product với serial này
  const { data: existingProduct } = await supabase
    .from('physical_products')
    .select('id, serial_number, virtual_warehouse_id, virtual_warehouses(warehouse_type, name)')
    .eq('serial_number', serialNumber)
    .single();

  if (!existingProduct) {
    // Serial không tồn tại → OK cho tất cả loại, sẽ tạo mới
    return { action: 'create', existingProduct: null };
  }

  const currentWarehouseType = existingProduct.virtual_warehouses?.warehouse_type;
  const currentWarehouseName = existingProduct.virtual_warehouses?.name;

  switch (reason) {
    case 'purchase':
      // Nhập mua hàng: serial phải KHÔNG tồn tại
      throw new Error(
        `Serial "${serialNumber}" đã tồn tại trong "${currentWarehouseName}". ` +
        `Không thể nhập mua hàng với serial đã có.`
      );

    case 'customer_return':
      // Nhập hàng trả lại: serial phải ở customer_installed
      if (currentWarehouseType === 'customer_installed') {
        return { action: 'transfer', existingProduct };
      }
      throw new Error(
        `Serial "${serialNumber}" đang ở "${currentWarehouseName}", không phải hàng đã bán. ` +
        `Vui lòng kiểm tra lại hoặc chọn loại phiếu phù hợp.`
      );

    case 'rma_return':
      // Nhập RMA về: serial phải ở rma_staging
      if (currentWarehouseType === 'rma_staging') {
        return { action: 'transfer', existingProduct };
      }
      throw new Error(
        `Serial "${serialNumber}" đang ở "${currentWarehouseName}", không phải hàng chờ RMA. ` +
        `Vui lòng kiểm tra lại hoặc chọn loại phiếu phù hợp.`
      );

    case 'adjustment':
      // Điều chỉnh: cho phép serial mới hoặc đã tồn tại
      return { action: 'adjust', existingProduct };

    default:
      throw new Error('Loại phiếu không hợp lệ');
  }
}
```

### 3. Xử lý khi nhập serial

```typescript
// Pseudo-code cho logic xử lý

const validation = await validateSerialForReceipt(serialNumber, reason, supabase);

if (validation.action === 'create') {
  // Tạo physical_product mới
  await supabase.from('physical_products').insert({
    serial_number: serialNumber,
    product_id: productId,
    virtual_warehouse_id: targetWarehouseId,
    // ... other fields
  });
}
else if (validation.action === 'transfer') {
  // Chuyển physical_product từ kho cũ sang kho đích
  await supabase.from('physical_products')
    .update({ virtual_warehouse_id: targetWarehouseId })
    .eq('id', validation.existingProduct.id);
}
```

---

## Frontend Changes

### 1. Form tạo phiếu nhập kho

```tsx
// File: src/app/(auth)/inventory/documents/receipts/new/page.tsx

// Thêm state
const [reason, setReason] = useState<StockReceiptReason>('purchase');
const [customerId, setCustomerId] = useState('');
const [rmaReference, setRmaReference] = useState('');

// UI: Dropdown chọn lý do
<div className="grid gap-2">
  <Label>Lý do nhập kho *</Label>
  <Select value={reason} onValueChange={setReason}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="purchase">Nhập mua hàng</SelectItem>
      <SelectItem value="customer_return">Nhập hàng trả lại</SelectItem>
      <SelectItem value="rma_return">Nhập RMA về</SelectItem>
      <SelectItem value="adjustment">Điều chỉnh kiểm kê</SelectItem>
    </SelectContent>
  </Select>
</div>

// UI: Field Customer (hiển thị khi reason = customer_return)
{reason === 'customer_return' && (
  <div className="grid gap-2">
    <Label className="text-primary">Khách hàng trả lại *</Label>
    <CustomerSelect value={customerId} onChange={setCustomerId} />
  </div>
)}

// UI: Field RMA Reference (hiển thị khi reason = rma_return)
{reason === 'rma_return' && (
  <div className="grid gap-2">
    <Label>Mã tham chiếu RMA</Label>
    <Input
      placeholder="VD: RMA-2024-001"
      value={rmaReference}
      onChange={(e) => setRmaReference(e.target.value)}
    />
  </div>
)}
```

### 2. Hiển thị trong danh sách và chi tiết

```tsx
// Mapping reason sang label tiếng Việt
const RECEIPT_REASON_LABELS = {
  purchase: 'Nhập mua hàng',
  customer_return: 'Nhập hàng trả lại',
  rma_return: 'Nhập RMA về',
  adjustment: 'Điều chỉnh',
};

// Badge màu theo loại
const RECEIPT_REASON_COLORS = {
  purchase: 'bg-blue-100 text-blue-800',
  customer_return: 'bg-orange-100 text-orange-800',
  rma_return: 'bg-purple-100 text-purple-800',
  adjustment: 'bg-gray-100 text-gray-800',
};
```

---

## Type Definitions

```typescript
// File: src/types/inventory.ts

export type StockReceiptReason =
  | 'purchase'
  | 'customer_return'
  | 'rma_return'
  | 'adjustment';

export interface StockReceipt {
  // ... existing fields
  reason: StockReceiptReason;
  customer_id?: string;
  rma_reference?: string;
  customer?: Customer; // joined
}
```

---

## Migration Plan

### Phase 1: Schema
1. Tạo enum `stock_receipt_reason`
2. Thêm columns vào `stock_receipts`
3. Set default `reason = 'purchase'` cho data cũ

### Phase 2: Backend
1. Update tRPC router để accept reason, customer_id, rma_reference
2. Implement validation logic theo loại phiếu
3. Update serial validation

### Phase 3: Frontend
1. Update form tạo phiếu nhập kho
2. Update danh sách phiếu (hiển thị badge reason)
3. Update chi tiết phiếu (hiển thị thông tin customer/rma)

---

## Test Cases

### TC1: Nhập mua hàng với serial mới
- Input: reason=purchase, serial=NEW001
- Expected: Tạo physical_product mới ✓

### TC2: Nhập mua hàng với serial đã tồn tại
- Input: reason=purchase, serial=EXISTING001 (đang ở kho main)
- Expected: Báo lỗi "Serial đã tồn tại" ✓

### TC3: Nhập hàng trả lại với serial ở customer_installed
- Input: reason=customer_return, customer_id=XXX, serial=SOLD001
- Expected: Chuyển serial từ customer_installed về kho đích ✓

### TC4: Nhập hàng trả lại với serial ở kho khác
- Input: reason=customer_return, serial=MAIN001 (đang ở main)
- Expected: Báo lỗi "Serial không phải hàng đã bán" ✓

### TC5: Nhập RMA về với serial ở rma_staging
- Input: reason=rma_return, serial=RMA001
- Expected: Chuyển serial từ rma_staging về kho đích ✓

### TC6: Nhập RMA về với serial mới (NCC gửi hàng thay thế)
- Input: reason=rma_return, serial=NEWRMA001
- Expected: Tạo physical_product mới ✓

---

## Related Changes (Đã hoàn thành)

### Phiếu Chuyển Kho - Chặn customer_installed
- Backend: Validation chặn `customer_installed` làm kho nguồn/đích
- Frontend: Disable option + tooltip hướng dẫn dùng đúng chức năng
- Files:
  - `src/server/routers/inventory/transfers.ts`
  - `src/app/(auth)/inventory/documents/transfers/new/page.tsx`
