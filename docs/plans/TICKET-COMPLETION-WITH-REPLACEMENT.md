# Kế Hoạch Triển Khai: Hoàn Thành Phiếu Với Sản Phẩm Thay Thế

**Ngày tạo:** 2024-12-15
**Trạng thái:** Draft
**Liên quan:** AUTO-TRANSFER-WARRANTY-COMPLETION.md, default-warehouse-system-2025-10.md

---

## 1. Tổng Quan

### 1.1 Mục tiêu
Bổ sung tính năng hoàn thành phiếu dịch vụ với:
- Ghi nhận kết quả xử lý (outcome)
- Chọn sản phẩm thay thế từ kho bảo hành (warranty_stock)
- Tự động chuyển kho khi đổi sản phẩm

### 1.2 Phạm vi
- Chỉ áp dụng cho phiếu có `warranty_type = 'warranty'`
- Không thay đổi flow hiện tại của phiếu `paid` và `goodwill`

### 1.3 Nguyên tắc
- **Đơn giản**: Logic dễ hiểu, không over-engineering
- **Tương thích**: Không phá vỡ flow hiện tại
- **Tuần tự**: Có thể triển khai từng bước

---

## 2. Database Schema

### 2.1 Thêm ENUM `ticket_outcome`

```sql
-- File: docs/data/schemas/100_enums_and_sequences.sql
CREATE TYPE public.ticket_outcome AS ENUM (
  'repaired',              -- Sửa chữa thành công, trả máy cũ
  'warranty_replacement',  -- Đổi sản phẩm mới từ kho bảo hành
  'unrepairable'           -- Không sửa được, không đổi được
);

COMMENT ON TYPE public.ticket_outcome IS 'Kết quả xử lý phiếu dịch vụ';
```

### 2.2 Thêm columns vào `service_tickets`

```sql
-- File: docs/data/schemas/201_service_tickets.sql
ALTER TABLE public.service_tickets
ADD COLUMN IF NOT EXISTS outcome public.ticket_outcome,
ADD COLUMN IF NOT EXISTS replacement_product_id UUID REFERENCES public.physical_products(id);

-- Index cho query sản phẩm thay thế
CREATE INDEX IF NOT EXISTS idx_service_tickets_replacement_product
ON public.service_tickets(replacement_product_id)
WHERE replacement_product_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.service_tickets.outcome IS
'Kết quả xử lý: repaired (sửa được), warranty_replacement (đổi máy), unrepairable (không xử lý được)';

COMMENT ON COLUMN public.service_tickets.replacement_product_id IS
'ID sản phẩm thay thế từ physical_products (chỉ có khi outcome = warranty_replacement)';

-- Constraint: replacement_product_id chỉ có khi outcome = warranty_replacement
ALTER TABLE public.service_tickets
ADD CONSTRAINT chk_replacement_requires_outcome
CHECK (
  (outcome = 'warranty_replacement' AND replacement_product_id IS NOT NULL) OR
  (outcome != 'warranty_replacement' AND replacement_product_id IS NULL) OR
  (outcome IS NULL)
);
```

### 2.3 Migration file

```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_ticket_outcome.sql

BEGIN;

-- Step 1: Add ENUM type
DO $$ BEGIN
  CREATE TYPE public.ticket_outcome AS ENUM (
    'repaired',
    'warranty_replacement',
    'unrepairable'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add columns
ALTER TABLE public.service_tickets
ADD COLUMN IF NOT EXISTS outcome public.ticket_outcome,
ADD COLUMN IF NOT EXISTS replacement_product_id UUID REFERENCES public.physical_products(id);

-- Step 3: Add index
CREATE INDEX IF NOT EXISTS idx_service_tickets_replacement_product
ON public.service_tickets(replacement_product_id)
WHERE replacement_product_id IS NOT NULL;

-- Step 4: Add constraint (skip if already exists)
DO $$ BEGIN
  ALTER TABLE public.service_tickets
  ADD CONSTRAINT chk_replacement_requires_outcome
  CHECK (
    (outcome = 'warranty_replacement' AND replacement_product_id IS NOT NULL) OR
    (outcome != 'warranty_replacement' AND replacement_product_id IS NULL) OR
    (outcome IS NULL)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 5: Add comments
COMMENT ON COLUMN public.service_tickets.outcome IS
'Kết quả xử lý: repaired (sửa được), warranty_replacement (đổi máy), unrepairable (không xử lý được)';

COMMENT ON COLUMN public.service_tickets.replacement_product_id IS
'ID sản phẩm thay thế từ physical_products (chỉ có khi outcome = warranty_replacement)';

COMMIT;
```

---

## 3. Backend API

### 3.1 Schema Zod

```typescript
// File: src/server/routers/tickets.ts

const completeTicketSchema = z.object({
  ticket_id: z.string().uuid(),
  outcome: z.enum(['repaired', 'warranty_replacement', 'unrepairable']),
  replacement_product_id: z.string().uuid().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Nếu outcome = warranty_replacement thì phải có replacement_product_id
    if (data.outcome === 'warranty_replacement') {
      return !!data.replacement_product_id;
    }
    return true;
  },
  {
    message: 'Phải chọn sản phẩm thay thế khi đổi bảo hành',
    path: ['replacement_product_id'],
  }
);
```

### 3.2 Mutation `completeTicket`

```typescript
// File: src/server/routers/tickets.ts

completeTicket: publicProcedure
  .use(requireOperationsStaff)
  .input(completeTicketSchema)
  .mutation(async ({ input, ctx }) => {
    const { ticket_id, outcome, replacement_product_id, notes } = input;

    // 1. Validate ticket exists and is in correct status
    const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
      .from('service_tickets')
      .select('id, status, warranty_type, customer_id, product_id')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Phiếu không tồn tại' });
    }

    // Chỉ cho phép hoàn thành từ in_progress hoặc ready_for_pickup
    if (!['in_progress', 'ready_for_pickup'].includes(ticket.status)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Không thể hoàn thành phiếu ở trạng thái ${ticket.status}`
      });
    }

    // 2. Nếu đổi máy, validate sản phẩm thay thế
    if (outcome === 'warranty_replacement') {
      // Chỉ phiếu bảo hành mới được đổi máy
      if (ticket.warranty_type !== 'warranty') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Chỉ phiếu bảo hành mới được đổi sản phẩm'
        });
      }

      // Kiểm tra sản phẩm thay thế tồn tại và ở warranty_stock
      const { data: replacementProduct, error: rpError } = await ctx.supabaseAdmin
        .from('physical_products')
        .select('id, serial_number, product_id, virtual_warehouse_type, status')
        .eq('id', replacement_product_id)
        .single();

      if (rpError || !replacementProduct) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sản phẩm thay thế không tồn tại'
        });
      }

      if (replacementProduct.virtual_warehouse_type !== 'warranty_stock') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Sản phẩm phải ở kho bảo hành (warranty_stock). Hiện tại: ${replacementProduct.virtual_warehouse_type}`
        });
      }

      if (replacementProduct.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Sản phẩm không khả dụng. Trạng thái: ${replacementProduct.status}`
        });
      }

      // Kiểm tra cùng loại sản phẩm (product_id)
      if (replacementProduct.product_id !== ticket.product_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sản phẩm thay thế phải cùng loại với sản phẩm trong phiếu'
        });
      }
    }

    // 3. Get profile ID
    const profileId = await getProfileIdFromUserId(ctx.supabaseAdmin, ctx.user!.id);

    // 4. Update ticket
    const { data: updatedTicket, error: updateError } = await ctx.supabaseAdmin
      .from('service_tickets')
      .update({
        status: 'completed',
        outcome,
        replacement_product_id: outcome === 'warranty_replacement' ? replacement_product_id : null,
        completed_at: new Date().toISOString(),
        updated_by: profileId,
        notes: notes || undefined,
      })
      .eq('id', ticket_id)
      .select()
      .single();

    if (updateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Lỗi cập nhật phiếu: ${updateError.message}`
      });
    }

    // 5. Nếu đổi máy, chuyển kho sản phẩm thay thế
    if (outcome === 'warranty_replacement' && replacement_product_id) {
      await ctx.supabaseAdmin
        .from('physical_products')
        .update({
          virtual_warehouse_type: 'customer_installed',
          last_known_customer_id: ticket.customer_id,
          status: 'issued',
        })
        .eq('id', replacement_product_id);

      // Ghi stock_movement
      await ctx.supabaseAdmin
        .from('stock_movements')
        .insert({
          physical_product_id: replacement_product_id,
          movement_type: 'assignment',
          from_warehouse_type: 'warranty_stock',
          to_warehouse_type: 'customer_installed',
          reference_type: 'service_ticket',
          reference_id: ticket_id,
          notes: `Đổi bảo hành cho phiếu ${updatedTicket.ticket_number}`,
          created_by_id: profileId,
        });
    }

    // 6. Tạo comment tự động
    const outcomeLabels = {
      repaired: '✅ Sửa chữa thành công',
      warranty_replacement: '🔄 Đổi sản phẩm bảo hành',
      unrepairable: '❌ Không thể sửa chữa',
    };

    let comment = `${outcomeLabels[outcome]}`;
    if (outcome === 'warranty_replacement') {
      const { data: rp } = await ctx.supabaseAdmin
        .from('physical_products')
        .select('serial_number')
        .eq('id', replacement_product_id)
        .single();
      comment += `\n📦 Serial mới: ${rp?.serial_number || 'N/A'}`;
    }
    if (notes) {
      comment += `\n📝 Ghi chú: ${notes}`;
    }

    await createAutoComment({
      ticketId: ticket_id,
      profileId,
      comment,
      isInternal: false,
      supabaseAdmin: ctx.supabaseAdmin,
    });

    // 7. Gửi email thông báo
    // ... (giữ nguyên logic email hiện có)

    return {
      success: true,
      ticket: updatedTicket,
    };
  }),
```

### 3.3 Query lấy sản phẩm thay thế khả dụng

```typescript
// File: src/server/routers/tickets.ts

getAvailableReplacements: publicProcedure
  .use(requireOperationsStaff)
  .input(z.object({
    ticket_id: z.string().uuid(),
  }))
  .query(async ({ input, ctx }) => {
    // Lấy product_id từ ticket
    const { data: ticket } = await ctx.supabaseAdmin
      .from('service_tickets')
      .select('product_id')
      .eq('id', input.ticket_id)
      .single();

    if (!ticket) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Phiếu không tồn tại' });
    }

    // Lấy danh sách sản phẩm cùng loại trong warranty_stock
    const { data: products, error } = await ctx.supabaseAdmin
      .from('physical_products')
      .select(`
        id,
        serial_number,
        product_condition,
        manufacturer_warranty_end,
        user_warranty_end,
        products (
          id,
          name,
          model
        )
      `)
      .eq('product_id', ticket.product_id)
      .eq('virtual_warehouse_type', 'warranty_stock')
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });
    }

    return products || [];
  }),
```

---

## 4. Frontend UI

### 4.1 Component Card "Sản phẩm đổi trả"

**Vị trí:** Sau Card "Thông tin sản phẩm" trong trang ticket detail

**Điều kiện hiển thị:** `warranty_type === 'warranty'`

```tsx
// File: src/components/ticket-replacement-card.tsx

interface TicketReplacementCardProps {
  ticketId: string;
  ticketStatus: string;
  warrantyType: string;
  outcome?: string;
  replacementProduct?: {
    id: string;
    serial_number: string;
    products: {
      name: string;
      model: string;
    };
  };
}

export function TicketReplacementCard({
  ticketId,
  ticketStatus,
  warrantyType,
  outcome,
  replacementProduct,
}: TicketReplacementCardProps) {
  // Chỉ hiển thị cho phiếu bảo hành
  if (warrantyType !== 'warranty') return null;

  const canSelectReplacement =
    ticketStatus !== 'completed' &&
    ticketStatus !== 'cancelled';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconReplace className="h-5 w-5" />
          Sản phẩm đổi trả
        </CardTitle>
      </CardHeader>
      <CardContent>
        {outcome === 'warranty_replacement' && replacementProduct ? (
          // Đã có sản phẩm thay thế
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sản phẩm:</span>
              <span className="font-medium">{replacementProduct.products.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial:</span>
              <span className="font-mono">{replacementProduct.serial_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span>{replacementProduct.products.model}</span>
            </div>
          </div>
        ) : (
          // Chưa có sản phẩm thay thế
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Chưa chọn sản phẩm thay thế
            </p>
            {canSelectReplacement && (
              <p className="text-sm text-muted-foreground">
                Sử dụng nút "Hoàn thành phiếu" để chọn kết quả xử lý
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4.2 Modal "Hoàn thành phiếu"

```tsx
// File: src/components/modals/complete-ticket-modal.tsx

interface CompleteTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  warrantyType: string;
}

export function CompleteTicketModal({
  open,
  onClose,
  ticketId,
  warrantyType,
}: CompleteTicketModalProps) {
  const [outcome, setOutcome] = useState<string>('repaired');
  const [replacementProductId, setReplacementProductId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Query danh sách sản phẩm thay thế (chỉ khi cần)
  const { data: replacements } = trpc.tickets.getAvailableReplacements.useQuery(
    { ticket_id: ticketId },
    { enabled: open && outcome === 'warranty_replacement' }
  );

  const completeTicket = trpc.tickets.completeTicket.useMutation({
    onSuccess: () => {
      toast.success('Đã hoàn thành phiếu');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    completeTicket.mutate({
      ticket_id: ticketId,
      outcome: outcome as any,
      replacement_product_id: outcome === 'warranty_replacement' ? replacementProductId : undefined,
      notes,
    });
  };

  const isWarranty = warrantyType === 'warranty';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hoàn thành phiếu dịch vụ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chọn kết quả */}
          <div className="space-y-2">
            <Label>Kết quả xử lý</Label>
            <RadioGroup value={outcome} onValueChange={setOutcome}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="repaired" id="repaired" />
                <Label htmlFor="repaired">✅ Sửa chữa thành công</Label>
              </div>
              {isWarranty && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warranty_replacement" id="warranty_replacement" />
                  <Label htmlFor="warranty_replacement">🔄 Đổi sản phẩm bảo hành</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unrepairable" id="unrepairable" />
                <Label htmlFor="unrepairable">❌ Không thể sửa chữa</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Chọn sản phẩm thay thế (chỉ hiển thị khi cần) */}
          {outcome === 'warranty_replacement' && (
            <div className="space-y-2">
              <Label>Chọn sản phẩm thay thế *</Label>
              <Select value={replacementProductId} onValueChange={setReplacementProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm từ kho bảo hành" />
                </SelectTrigger>
                <SelectContent>
                  {replacements?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.serial_number} - {product.products?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {replacements?.length === 0 && (
                <p className="text-sm text-destructive">
                  Không có sản phẩm thay thế trong kho bảo hành
                </p>
              )}
            </div>
          )}

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm về kết quả xử lý..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              completeTicket.isPending ||
              (outcome === 'warranty_replacement' && !replacementProductId)
            }
          >
            {completeTicket.isPending ? 'Đang xử lý...' : 'Hoàn thành'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.3 Cập nhật TicketActions

```tsx
// File: src/components/ticket-actions.tsx

// Thêm button "Hoàn thành phiếu"
{canComplete && (
  <Button
    variant="default"
    size="sm"
    onClick={() => setCompleteModalOpen(true)}
  >
    <IconCheck className="h-4 w-4" />
    Hoàn thành phiếu
  </Button>
)}

// Thêm state và modal
const [completeModalOpen, setCompleteModalOpen] = useState(false);
const canComplete = ['in_progress', 'ready_for_pickup'].includes(ticketStatus);

<CompleteTicketModal
  open={completeModalOpen}
  onClose={() => setCompleteModalOpen(false)}
  ticketId={ticketId}
  warrantyType={warrantyType}
/>
```

---

## 5. Cập nhật Trang Ticket Detail

### 5.1 Thêm query replacement product

```tsx
// File: src/app/(auth)/operations/tickets/[id]/page.tsx

// Trong getTicketData, bổ sung select replacement product
const { data: ticket, error } = await supabase
  .from("service_tickets")
  .select(`
    *,
    customers (...),
    products (...),
    replacement_product:physical_products!replacement_product_id (
      id,
      serial_number,
      product_condition,
      products (
        id,
        name,
        model,
        brands (name)
      )
    ),
    ...
  `)
  .eq("id", ticketId)
  .single();
```

### 5.2 Thêm Card sản phẩm đổi trả

```tsx
// Sau Card "Thông tin sản phẩm"
<TicketReplacementCard
  ticketId={ticketId}
  ticketStatus={ticket.status}
  warrantyType={ticket.warranty_type}
  outcome={ticket.outcome}
  replacementProduct={ticket.replacement_product}
/>
```

---

## 6. Thứ Tự Triển Khai

### Phase 1: Database (1-2 giờ)
1. [ ] Tạo migration file
2. [ ] Chạy migration: `pnpx supabase migration up`
3. [ ] Cập nhật schema files trong `docs/data/schemas/`
4. [ ] Regenerate types: `pnpx supabase gen types typescript`

### Phase 2: Backend API (2-3 giờ)
1. [ ] Thêm Zod schema `completeTicketSchema`
2. [ ] Implement mutation `completeTicket`
3. [ ] Implement query `getAvailableReplacements`
4. [ ] Test API với Postman/curl

### Phase 3: Frontend Components (2-3 giờ)
1. [ ] Tạo `TicketReplacementCard` component
2. [ ] Tạo `CompleteTicketModal` component
3. [ ] Cập nhật `TicketActions` component
4. [ ] Cập nhật trang ticket detail

### Phase 4: Testing (1-2 giờ)
1. [ ] Test flow hoàn thành với outcome = repaired
2. [ ] Test flow hoàn thành với outcome = warranty_replacement
3. [ ] Test flow hoàn thành với outcome = unrepairable
4. [ ] Test validation errors
5. [ ] Test chuyển kho tự động

### Phase 5: Documentation (30 phút)
1. [ ] Cập nhật CLAUDE.md nếu cần
2. [ ] Cập nhật AUTO-TRANSFER-WARRANTY-COMPLETION.md

---

## 7. Rollback Plan

### Nếu cần rollback database:
```sql
-- Xóa constraint trước
ALTER TABLE public.service_tickets
DROP CONSTRAINT IF EXISTS chk_replacement_requires_outcome;

-- Xóa columns
ALTER TABLE public.service_tickets
DROP COLUMN IF EXISTS outcome,
DROP COLUMN IF EXISTS replacement_product_id;

-- ENUM không thể xóa dễ dàng, để lại không ảnh hưởng
```

### Nếu cần rollback code:
- Revert commit chứa mutation `completeTicket`
- Xóa các component mới tạo
- Flow cũ `updateTicketStatus` vẫn hoạt động bình thường

---

## 8. Lưu Ý Quan Trọng

1. **Không breaking change**: Flow cũ `updateTicketStatus` vẫn hoạt động
2. **Backward compatible**: Phiếu cũ có `outcome = NULL` vẫn hợp lệ
3. **Constraint linh hoạt**: Cho phép `outcome = NULL` cho phiếu chưa hoàn thành
4. **Đơn giản hóa**: Chưa implement auto-transfer document, chỉ move warehouse trực tiếp
5. **Mở rộng sau**: Có thể bổ sung tạo phiếu chuyển kho tự động ở phase sau

---

## 9. Tài Liệu Tham Khảo

- `docs/architecture/AUTO-TRANSFER-WARRANTY-COMPLETION.md` - Thiết kế tổng thể
- `docs/archive/completed-projects/default-warehouse-system-2025-10.md` - Hệ thống kho
- `src/server/routers/tickets.ts` - Router hiện tại
- `src/app/(auth)/operations/tickets/[id]/page.tsx` - Trang ticket detail
