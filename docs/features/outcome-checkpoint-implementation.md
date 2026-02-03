# Tách biệt Task và Kết quả bảo hành (Outcome Checkpoint)

## Tổng quan

Thay đổi luồng hoàn thành phiếu để phân biệt rõ:
- **Task**: Công việc kỹ thuật (kiểm tra, sửa chữa, test)
- **Outcome**: Quyết định kết quả bảo hành (đã sửa, đổi mới, không sửa được)

### Luồng mới

```
in_progress (tasks) → in_progress (chọn outcome) → ready_for_pickup → completed
                              ↑
                    Checkpoint bắt buộc
```

---

## Việc cần làm

### 1. Database: Thêm field `tasks_completed_at`

**File:** `docs/data/schemas/201_service_tickets.sql`

**Mô tả:** Thêm field để đánh dấu thời điểm tất cả task hoàn thành

```sql
ALTER TABLE service_tickets
ADD COLUMN tasks_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN service_tickets.tasks_completed_at IS
  'Timestamp when all required tasks were completed. NULL means tasks not yet done or ticket has no tasks.';
```

**Lý do:** Phân biệt trạng thái "đang làm task" vs "task xong, chờ chọn outcome"

---

### 2. Entity Adapter: Bỏ auto-transition, set `tasks_completed_at`

**File:** `src/server/services/entity-adapters/service-ticket-adapter.ts`

**Hàm:** `onTaskComplete()` (dòng 156-196)

**Thay đổi:**

```typescript
// TRƯỚC
if (allComplete && ticket?.status === "in_progress") {
  await ctx.supabaseAdmin
    .from("service_tickets")
    .update({ status: "ready_for_pickup" })
    .eq("id", task.entity_id);
}

// SAU
if (allComplete && ticket?.status === "in_progress") {
  // Chỉ đánh dấu tasks đã hoàn thành, KHÔNG chuyển status
  await ctx.supabaseAdmin
    .from("service_tickets")
    .update({
      tasks_completed_at: new Date().toISOString(),
      updated_by: task.assigned_to_id
    })
    .eq("id", task.entity_id)
    .is("tasks_completed_at", null); // Chỉ update nếu chưa set

  // Log thông báo
  await ctx.supabaseAdmin
    .from("service_ticket_comments")
    .insert({
      ticket_id: task.entity_id,
      comment: "Tất cả công việc đã hoàn thành. Vui lòng chọn kết quả xử lý.",
      comment_type: "system",
      is_internal: true,
      created_by: task.assigned_to_id,
    });
}
```

---

### 3. API: Rename và điều chỉnh `completeTicket` → `setOutcome`

**File:** `src/server/routers/tickets.ts`

**Thay đổi:**

| Trước | Sau |
|-------|-----|
| Tên: `completeTicket` | Tên: `setOutcome` |
| Status đích: `completed` | Status đích: `ready_for_pickup` |
| Set `completed_at` | Không set `completed_at` |
| Điều kiện: `in_progress` hoặc `ready_for_pickup` | Điều kiện: `in_progress` AND (`tasks_completed_at` IS NOT NULL OR không có task) |

**Schema mới:**

```typescript
const setOutcomeSchema = z.object({
  ticket_id: z.string().uuid(),
  outcome: z.enum(["repaired", "warranty_replacement", "unrepairable"]),
  replacement_product_id: z.string().uuid().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.outcome !== "warranty_replacement" || data.replacement_product_id,
  { message: "Phải chọn sản phẩm thay thế khi đổi bảo hành" }
);
```

**Logic mới:**

```typescript
setOutcome: publicProcedure
  .use(requireOperationsStaff)
  .input(setOutcomeSchema)
  .mutation(async ({ input, ctx }) => {
    // 1. Validate ticket
    const ticket = await getTicket(input.ticket_id);

    // Phải đang in_progress
    if (ticket.status !== "in_progress") {
      throw new Error("Chỉ có thể chọn kết quả cho phiếu đang xử lý");
    }

    // Nếu có task, phải hoàn thành hết
    const hasTasks = await hasAnyTasks(input.ticket_id);
    if (hasTasks && !ticket.tasks_completed_at) {
      throw new Error("Phải hoàn thành tất cả công việc trước khi chọn kết quả");
    }

    // 2. Validate replacement product (nếu warranty_replacement)
    // ... (giữ nguyên logic hiện tại)

    // 3. Update ticket
    await ctx.supabaseAdmin
      .from("service_tickets")
      .update({
        status: "ready_for_pickup",  // Chuyển sang sẵn sàng bàn giao
        outcome: input.outcome,
        replacement_product_id: input.replacement_product_id,
        // KHÔNG set completed_at
      })
      .eq("id", input.ticket_id);

    // 4. Di chuyển SP thay thế (nếu có)
    // ... (giữ nguyên logic hiện tại)

    // 5. Gửi email thông báo khách
    // ... (giữ nguyên logic hiện tại)
  });
```

---

### 4. API: Thêm procedure `confirmDelivery`

**File:** `src/server/routers/tickets.ts`

**Mô tả:** Xác nhận khách đã nhận hàng, chuyển `ready_for_pickup` → `completed`

```typescript
confirmDelivery: publicProcedure
  .use(requireOperationsStaff)
  .input(z.object({
    ticket_id: z.string().uuid(),
    delivery_notes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Validate
    const ticket = await getTicket(input.ticket_id);

    if (ticket.status !== "ready_for_pickup") {
      throw new Error("Chỉ có thể xác nhận bàn giao cho phiếu sẵn sàng bàn giao");
    }

    if (!ticket.outcome) {
      throw new Error("Phiếu chưa có kết quả xử lý");
    }

    // 2. Update ticket
    await ctx.supabaseAdmin
      .from("service_tickets")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.ticket_id);

    // 3. Log comment
    await ctx.supabaseAdmin
      .from("service_ticket_comments")
      .insert({
        ticket_id: input.ticket_id,
        comment: "Khách hàng đã nhận sản phẩm." +
          (input.delivery_notes ? ` Ghi chú: ${input.delivery_notes}` : ""),
        comment_type: "status_change",
        is_internal: false,
      });

    // 4. Gửi email cảm ơn (optional)
  });
```

---

### 5. UI: Cập nhật Ticket Detail Page

**File:** `src/app/(auth)/operations/tickets/[id]/page.tsx`

**Thay đổi:**

1. **Thêm section "Kết quả xử lý"** hiển thị khi:
   - `status === "in_progress"` AND
   - (`tasks_completed_at !== null` OR không có task) AND
   - `outcome === null`

2. **Hiển thị inline form** thay vì modal (UX tốt hơn)

```tsx
{/* Section: Kết quả xử lý */}
{ticket.status === "in_progress" &&
 (ticket.tasks_completed_at || !hasTasks) &&
 !ticket.outcome && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Kết quả xử lý
      </CardTitle>
      <CardDescription>
        Chọn kết quả sau khi hoàn thành sửa chữa
      </CardDescription>
    </CardHeader>
    <CardContent>
      <OutcomeSelector
        ticketId={ticket.id}
        warrantyType={ticket.warranty_type}
        onSuccess={() => refetch()}
      />
    </CardContent>
  </Card>
)}
```

---

### 6. UI: Tạo component `OutcomeSelector`

**File:** `src/components/outcome-selector.tsx` (tạo mới)

**Mô tả:** Form chọn outcome inline (không phải modal)

```tsx
interface OutcomeSelectorProps {
  ticketId: string;
  warrantyType: "warranty" | "paid" | "goodwill";
  onSuccess: () => void;
}

export function OutcomeSelector({ ticketId, warrantyType, onSuccess }: OutcomeSelectorProps) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState<string | null>(null);

  const setOutcomeMutation = trpc.tickets.setOutcome.useMutation();
  const { data: replacements } = trpc.tickets.getAvailableReplacements.useQuery(
    { ticket_id: ticketId },
    { enabled: outcome === "warranty_replacement" && warrantyType === "warranty" }
  );

  return (
    <div className="space-y-4">
      {/* Outcome options */}
      <RadioGroup value={outcome} onValueChange={setOutcome}>
        <div className="flex gap-4">
          <RadioGroupItem value="repaired" label="Đã sửa chữa" />
          {warrantyType === "warranty" && (
            <RadioGroupItem value="warranty_replacement" label="Đổi sản phẩm mới" />
          )}
          <RadioGroupItem value="unrepairable" label="Không thể sửa" />
        </div>
      </RadioGroup>

      {/* Replacement selector */}
      {outcome === "warranty_replacement" && (
        <Select value={replacementId} onValueChange={setReplacementId}>
          {replacements?.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.serial_number} - {p.product.name}
            </SelectItem>
          ))}
        </Select>
      )}

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={!canSubmit}>
        Xác nhận kết quả
      </Button>
    </div>
  );
}
```

---

### 7. UI: Cập nhật Ticket Actions

**File:** `src/components/ticket-actions.tsx`

**Thay đổi:**

1. **Bỏ nút "Hoàn thành phiếu"** (outcome chọn inline, không qua modal)

2. **Thêm nút "Xác nhận bàn giao"** khi `status === "ready_for_pickup"`

```tsx
{ticket.status === "ready_for_pickup" && (
  <Button onClick={() => setShowDeliveryModal(true)}>
    <CheckCircle className="mr-2 h-4 w-4" />
    Xác nhận bàn giao
  </Button>
)}
```

---

### 8. UI: Tạo modal `ConfirmDeliveryModal`

**File:** `src/components/modals/confirm-delivery-modal.tsx` (tạo mới)

**Mô tả:** Modal xác nhận khách đã nhận hàng

```tsx
interface ConfirmDeliveryModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: string;
}

export function ConfirmDeliveryModal({ ... }) {
  const [notes, setNotes] = useState("");
  const confirmMutation = trpc.tickets.confirmDelivery.useMutation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận bàn giao</DialogTitle>
          <DialogDescription>
            Xác nhận khách hàng đã nhận sản phẩm cho phiếu {ticketNumber}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Ghi chú bàn giao (tùy chọn)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleConfirm}>Xác nhận đã bàn giao</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 9. Cập nhật constants

**File:** `src/lib/constants/ticket-status.ts`

**Thêm mô tả rõ hơn:**

```typescript
export const TICKET_STATUS_LABELS = {
  pending: "Chờ xử lý",
  in_progress: "Đang xử lý",
  ready_for_pickup: "Sẵn sàng bàn giao",  // Đã có outcome
  completed: "Hoàn thành",                 // Khách đã nhận
  cancelled: "Đã hủy",
};
```

---

## Thứ tự thực hiện

| # | Việc | Độ ưu tiên | Dependency |
|---|------|------------|------------|
| 1 | Database: Thêm `tasks_completed_at` | Cao | - |
| 2 | Entity Adapter: Bỏ auto-transition | Cao | #1 |
| 3 | API: Đổi `completeTicket` → `setOutcome` | Cao | #1 |
| 4 | API: Thêm `confirmDelivery` | Cao | - |
| 5 | UI: Component `OutcomeSelector` | Cao | #3 |
| 6 | UI: Cập nhật Ticket Detail | Cao | #5 |
| 7 | UI: Component `ConfirmDeliveryModal` | Trung bình | #4 |
| 8 | UI: Cập nhật Ticket Actions | Trung bình | #7 |
| 9 | Cleanup: Xóa `complete-ticket-modal.tsx` | Thấp | #5, #6 |

---

## Migration

Với các phiếu hiện có:
- `ready_for_pickup` không có `outcome` → Giữ nguyên, yêu cầu chọn outcome khi mở
- `completed` không có `outcome` → Set `outcome = 'repaired'` mặc định
