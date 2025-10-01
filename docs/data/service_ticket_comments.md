# Cấu trúc dữ liệu bình luận phiếu dịch vụ (Service Ticket Comments Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu của bảng `service_ticket_comments` - bảng quản lý các bình luận, ghi chú trong quá trình xử lý phiếu dịch vụ. Bảng này cho phép theo dõi toàn bộ quá trình tương tác và ghi chú từ lúc tiếp nhận đến khi hoàn thành dịch vụ.

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `ticket_id` | UUID | ✅ | ID phiếu dịch vụ (khóa ngoại tới service_tickets) |
| `user_id` | UUID | ✅ | ID người tạo bình luận (khóa ngoại tới profiles.user_id) |
| `comment_text` | Text | ✅ | Nội dung bình luận/ghi chú |
| `comment_type` | Enum | ✅ | Loại bình luận |
| `is_internal` | Boolean | ✅ | Bình luận nội bộ hay công khai với khách hàng - Mặc định true |

### 2. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo bình luận |

## Enum Values

### Comment Type
- `note` - Ghi chú thông thường
- `status_change` - Thay đổi trạng thái
- `customer_communication` - Trao đổi với khách hàng
- `diagnosis` - Kết quả chẩn đoán
- `repair_progress` - Tiến độ sửa chữa
- `parts_added` - Thêm linh kiện
- `quality_check` - Kiểm tra chất lượng
- `customer_approval` - Phê duyệt từ khách hàng

## Ví dụ JSON Schema

### Ghi chú thông thường (Internal Note)
```json
{
  "id": "comment-uuid-001",
  "ticket_id": "ticket-uuid-001",
  "user_id": "technician-uuid-001",
  "comment_text": "Đã kiểm tra thiết bị, màn hình bị vỡ hoàn toàn, cần thay thế nguyên bộ",
  "comment_type": "diagnosis",
  "is_internal": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Trao đổi với khách hàng (Customer Communication)
```json
{
  "id": "comment-uuid-002",
  "ticket_id": "ticket-uuid-001",
  "user_id": "reception-uuid-001",
  "comment_text": "Đã liên hệ khách hàng, xác nhận chi phí sửa chữa 10.050.000 VND. Khách hàng đồng ý tiến hành sửa chữa.",
  "comment_type": "customer_communication",
  "is_internal": false,
  "created_at": "2024-01-15T11:15:00Z"
}
```

### Thay đổi trạng thái (Status Change)
```json
{
  "id": "comment-uuid-003",
  "ticket_id": "ticket-uuid-001",
  "user_id": "technician-uuid-001",
  "comment_text": "Đã hoàn thành thay thế màn hình và kiểm tra chất lượng. Chuyển trạng thái sang 'completed'",
  "comment_type": "status_change",
  "is_internal": true,
  "created_at": "2024-01-15T16:45:00Z"
}
```

## Relationships và Constraints

### Foreign Keys:
- `ticket_id` → `service_tickets.id`
- `user_id` → `profiles.user_id`

### Indexes:
- Index trên `ticket_id` để query nhanh theo phiếu dịch vụ
- Index trên `user_id` để theo dõi hoạt động của nhân viên
- Index trên `comment_type` để lọc theo loại bình luận
- Index trên `is_internal` để phân biệt bình luận nội bộ/công khai

## Query Examples

### Lấy tất cả bình luận của một phiếu dịch vụ:
```sql
SELECT stc.*, p.full_name as author_name
FROM service_ticket_comments stc
JOIN profiles p ON stc.user_id = p.user_id
WHERE stc.ticket_id = 'ticket-uuid-001'
ORDER BY stc.created_at ASC;
```

### Lấy chỉ bình luận công khai (cho khách hàng xem):
```sql
SELECT stc.*, p.full_name as author_name
FROM service_ticket_comments stc
JOIN profiles p ON stc.user_id = p.user_id
WHERE stc.ticket_id = 'ticket-uuid-001' 
AND stc.is_internal = false
ORDER BY stc.created_at ASC;
```

### Lấy lịch sử thay đổi trạng thái:
```sql
SELECT stc.*, p.full_name as author_name
FROM service_ticket_comments stc
JOIN profiles p ON stc.user_id = p.user_id
WHERE stc.ticket_id = 'ticket-uuid-001' 
AND stc.comment_type = 'status_change'
ORDER BY stc.created_at ASC;
```

### Thống kê hoạt động theo nhân viên:
```sql
SELECT p.full_name, COUNT(*) as total_comments,
       COUNT(CASE WHEN stc.comment_type = 'customer_communication' THEN 1 END) as customer_interactions
FROM service_ticket_comments stc
JOIN profiles p ON stc.user_id = p.user_id
WHERE stc.created_at >= '2024-01-01'
GROUP BY p.user_id, p.full_name
ORDER BY total_comments DESC;
```

## Use Cases và Business Logic

### 1. **Timeline phiếu dịch vụ**
- Hiển thị chronological timeline của tất cả hoạt động
- Phân biệt bình luận nội bộ và công khai

### 2. **Customer Portal**
- Khách hàng chỉ xem được bình luận có `is_internal = false`
- Theo dõi tiến độ sửa chữa theo thời gian thực

### 3. **Internal Communication**
- Nhân viên giao tiếp nội bộ về kỹ thuật
- Ghi chú quan trọng cho ca làm việc tiếp theo

### 4. **Audit Trail**
- Theo dõi ai đã làm gì, khi nào
- Trách nhiệm giải trình cho từng bước xử lý

## Ghi chú quan trọng

1. **Permissions**: 
   - Tất cả nhân viên có thể tạo bình luận
   - **Không cho phép chỉnh sửa comment** sau khi tạo (immutable)
   - Admin có thể xóa bình luận (trong trường hợp đặc biệt)

2. **Validation**:
   - `comment_text` không được rỗng
   - `comment_type` phải thuộc enum values
   - `user_id` phải tồn tại và active

3. **Auto-generated Comments** (System-generated Audit Trail):
   Hệ thống tự động tạo comment để ghi nhận mọi thay đổi quan trọng trong phiếu dịch vụ. Tất cả comment tự động có `is_internal = true` và được tạo bởi user thực hiện hành động.

   **Các tình huống tự động tạo comment:**

   a. **Thay đổi trạng thái (Status Changes)**
      - **Trigger**: Khi status của ticket thay đổi qua `updateTicketStatus` hoặc `updateTicket` mutations
      - **Format**: `"🔄 Trạng thái đã thay đổi từ '{old_status_label}' sang '{new_status_label}'"`
      - **Ví dụ**:
        - `"🔄 Trạng thái đã thay đổi từ 'Chờ xử lý' sang 'Đang sửa chữa'"`
        - `"🔄 Trạng thái đã thay đổi từ 'Đang sửa chữa' sang 'Hoàn thành'"`
      - **is_internal**: `true`
      - **Implementation**: Mutation success callback trong `updateTicketStatus`/`updateTicket`

   b. **Quản lý linh kiện (Parts Management)**

      **Thêm linh kiện mới:**
      - **Trigger**: Khi thêm linh kiện qua `addTicketPart` mutation
      - **Format**: `"➕ Đã thêm linh kiện: {part_name} (SKU: {sku}) - SL: {quantity} × {unit_price_formatted} = {total_price_formatted}"`
      - **Ví dụ**: `"➕ Đã thêm linh kiện: Màn hình iPhone 15 Pro Max (SKU: IP15PM-LCD-01) - SL: 1 × 9.500.000 ₫ = 9.500.000 ₫"`
      - **is_internal**: `true`
      - **Ghi chú thêm**: `"💰 Tổng chi phí linh kiện: {new_parts_total_formatted} | Tổng hóa đơn: {new_total_cost_formatted}"`

      **Cập nhật linh kiện:**
      - **Trigger**: Khi cập nhật số lượng/giá qua `updateTicketPart` mutation
      - **Format**: `"✏️ Đã cập nhật linh kiện: {part_name}"`
      - **Chi tiết thay đổi**:
        - Nếu thay đổi số lượng: `"  • Số lượng: {old_quantity} → {new_quantity}"`
        - Nếu thay đổi đơn giá: `"  • Đơn giá: {old_price_formatted} → {new_price_formatted}"`
        - `"  • Thành tiền: {old_total_formatted} → {new_total_formatted}"`
      - **Ví dụ**:
        ```
        ✏️ Đã cập nhật linh kiện: Màn hình iPhone 15 Pro Max
          • Số lượng: 1 → 2
          • Thành tiền: 9.500.000 ₫ → 19.000.000 ₫
        💰 Tổng chi phí linh kiện: 19.000.000 ₫ | Tổng hóa đơn: 19.600.000 ₫
        ```
      - **is_internal**: `true`

      **Xóa linh kiện:**
      - **Trigger**: Khi xóa linh kiện qua `deleteTicketPart` mutation
      - **Format**: `"➖ Đã xóa linh kiện: {part_name} (SKU: {sku}) - SL: {quantity} × {unit_price_formatted} = {total_price_formatted}"`
      - **Ví dụ**: `"➖ Đã xóa linh kiện: Pin iPhone 15 Pro Max (SKU: IP15PM-BAT-01) - SL: 1 × 850.000 ₫ = 850.000 ₫"`
      - **is_internal**: `true`
      - **Ghi chú thêm**: `"💰 Tổng chi phí linh kiện: {new_parts_total_formatted} | Tổng hóa đơn: {new_total_cost_formatted}"`

   c. **Thay đổi chi phí (Cost Changes)**

      **Cập nhật phí dịch vụ:**
      - **Trigger**: Khi thay đổi `service_fee` qua `updateTicket` mutation
      - **Format**: `"💵 Phí dịch vụ đã thay đổi: {old_fee_formatted} → {new_fee_formatted}"`
      - **Ví dụ**: `"💵 Phí dịch vụ đã thay đổi: 500.000 ₫ → 750.000 ₫"`
      - **is_internal**: `true`
      - **Ghi chú**: `"💰 Tổng hóa đơn mới: {new_total_cost_formatted}"`

      **Cập nhật phí kiểm tra:**
      - **Trigger**: Khi thay đổi `diagnosis_fee` qua `updateTicket` mutation
      - **Format**: `"🔍 Phí kiểm tra đã thay đổi: {old_fee_formatted} → {new_fee_formatted}"`
      - **Ví dụ**: `"🔍 Phí kiểm tra đã thay đổi: 100.000 ₫ → 150.000 ₫"`
      - **is_internal**: `true`

      **Áp dụng/thay đổi giảm giá:**
      - **Trigger**: Khi thay đổi `discount_amount` qua `updateTicket` mutation
      - **Format**:
        - Thêm mới: `"🎁 Đã áp dụng giảm giá: {discount_formatted}"`
        - Thay đổi: `"🎁 Giảm giá đã thay đổi: {old_discount_formatted} → {new_discount_formatted}"`
        - Xóa: `"🎁 Đã hủy giảm giá: {old_discount_formatted}"`
      - **Ví dụ**: `"🎁 Đã áp dụng giảm giá: 500.000 ₫ (khách hàng thân thiết)"`
      - **is_internal**: `false` (khách hàng nên biết về giảm giá)
      - **Ghi chú**: `"💰 Tổng hóa đơn sau giảm giá: {new_total_cost_formatted}"`

   d. **Thay đổi thông tin phiếu (Ticket Information Updates)**

      **Thay đổi độ ưu tiên:**
      - **Trigger**: Khi thay đổi `priority_level` qua `updateTicket` mutation
      - **Format**: `"⚠️ Độ ưu tiên đã thay đổi: {old_priority_label} → {new_priority_label}"`
      - **Ví dụ**: `"⚠️ Độ ưu tiên đã thay đổi: Bình thường → Khẩn cấp"`
      - **is_internal**: `false` (quan trọng cho khách hàng biết)

      **Thay đổi loại bảo hành:**
      - **Trigger**: Khi thay đổi `warranty_type` qua `updateTicket` mutation
      - **Format**: `"📋 Loại bảo hành đã thay đổi: {old_warranty_label} → {new_warranty_label}"`
      - **Ví dụ**: `"📋 Loại bảo hành đã thay đổi: Trả phí → Bảo hành"`
      - **is_internal**: `false` (khách hàng cần biết về thay đổi bảo hành)

      **Phân công kỹ thuật viên:**
      - **Trigger**: Khi thay đổi `assigned_to` qua `updateTicket` mutation
      - **Format**:
        - Phân công mới: `"👤 Đã phân công cho: {technician_name}"`
        - Chuyển giao: `"👤 Chuyển giao từ {old_technician_name} sang {new_technician_name}"`
        - Hủy phân công: `"👤 Đã hủy phân công cho {old_technician_name}"`
      - **Ví dụ**: `"👤 Đã phân công cho: Nguyễn Văn A"`
      - **is_internal**: `true`

      **Cập nhật mô tả vấn đề:**
      - **Trigger**: Khi thay đổi `issue_description` qua `updateTicket` mutation
      - **Format**: `"📝 Mô tả vấn đề đã được cập nhật"`
      - **is_internal**: `true`
      - **Note**: Không hiển thị nội dung cũ/mới để tránh comment quá dài

      **Thêm ghi chú:**
      - **Trigger**: Khi thêm/cập nhật `notes` qua `updateTicket` mutation
      - **Format**: `"📌 Ghi chú đã được cập nhật"`
      - **is_internal**: `true`

   e. **Tạo phiếu dịch vụ mới (Ticket Creation)**
      - **Trigger**: Khi tạo ticket mới qua `createTicket` mutation
      - **Format**:
        ```
        🎫 Phiếu dịch vụ mới được tạo
        📱 Sản phẩm: {product_name} ({product_brand} {product_type})
        👤 Khách hàng: {customer_name} - {customer_phone}
        📋 Loại: {warranty_type_label} | Ưu tiên: {priority_label}
        💰 Ước tính chi phí: {initial_total_cost_formatted}
        ```
      - **Ví dụ**:
        ```
        🎫 Phiếu dịch vụ mới được tạo
        📱 Sản phẩm: iPhone 15 Pro Max (Apple Điện thoại)
        👤 Khách hàng: Nguyễn Văn A - 0901234567
        📋 Loại: Trả phí | Ưu tiên: Bình thường
        💰 Ước tính chi phí: 10.050.000 ₫
        ```
      - **is_internal**: `false` (thông tin tổng quan cho khách hàng)

   **Quy tắc chung cho Auto-generated Comments:**
   - **Timestamp**: Sử dụng thời gian thực tế của mutation (server time)
   - **created_by**: User ID của người thực hiện hành động (không phải system)
   - **is_internal**: Mặc định `true`, trừ các trường hợp đặc biệt (giảm giá, ưu tiên, bảo hành, tạo ticket)
   - **Format nhất quán**: Sử dụng emoji và cấu trúc rõ ràng
   - **Locale**: Tất cả số tiền format theo định dạng Việt Nam (VND)
   - **Atomicity**: Mỗi thay đổi tạo 1 comment riêng (không gộp nhiều thay đổi)
   - **Immutable**: Không được sửa/xóa comment tự động sau khi tạo

4. **Notifications**:
   - Tự động thông báo khi có comment mới cho khách hàng
   - Internal notification cho team members

5. **Default Values**:
   - `is_internal`: `true` (mặc định là nội bộ)
   - `comment_type`: `note`

6. **Rich Text Support**:
   - Hỗ trợ markdown formatting
   - Có thể đính kèm hình ảnh (URLs)

## Tích hợp với các bảng khác

### Với `service_tickets`:
- Mỗi ticket có thể có nhiều comments
- Comments cung cấp detailed history của ticket

### Với `profiles`:
- Mỗi comment ghi nhận author
- Theo dõi productivity của nhân viên

### Với `notifications`:
- Comment mới trigger notification
- Customer-facing comments gửi thông báo cho khách hàng

## Implementation Guidelines (Hướng dẫn triển khai)

### 1. **Cấu trúc Auto-comment Helper Function**

Tạo một helper function để tạo auto-comment một cách nhất quán:

```typescript
// src/server/utils/auto-comment.ts
interface AutoCommentParams {
  ticketId: string;
  userId: string;
  comment: string;
  isInternal?: boolean;
  supabaseAdmin: SupabaseClient;
}

async function createAutoComment({
  ticketId,
  userId,
  comment,
  isInternal = true,
  supabaseAdmin,
}: AutoCommentParams) {
  const { error } = await supabaseAdmin
    .from("service_ticket_comments")
    .insert({
      ticket_id: ticketId,
      comment: comment,
      is_internal: isInternal,
      created_by: userId,
    });

  if (error) {
    console.error("Failed to create auto-comment:", error);
    // Don't throw - auto-comments shouldn't break main operations
  }
}
```

### 2. **Integration Points trong tRPC Mutations**

**a. Status Changes (`updateTicketStatus`, `updateTicket`):**
```typescript
// Trong mutation success callback
onSuccess: async (result, variables) => {
  const oldStatus = currentTicket.status;
  const newStatus = variables.status;

  if (oldStatus !== newStatus) {
    const oldLabel = STATUS_FLOW[oldStatus].label;
    const newLabel = STATUS_FLOW[newStatus].label;

    await createAutoComment({
      ticketId: variables.id,
      userId: user.id,
      comment: `🔄 Trạng thái đã thay đổi từ '${oldLabel}' sang '${newLabel}'`,
      isInternal: true,
      supabaseAdmin: ctx.supabaseAdmin,
    });
  }
}
```

**b. Parts Management (`addTicketPart`, `updateTicketPart`, `deleteTicketPart`):**
```typescript
// addTicketPart - sau khi thêm thành công
const formattedPrice = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
}).format(partData.total_price);

await createAutoComment({
  ticketId: input.ticket_id,
  userId: user.id,
  comment: `➕ Đã thêm linh kiện: ${partInfo.name} (SKU: ${partInfo.sku}) - SL: ${input.quantity} × ${formatCurrency(input.unit_price)} = ${formatCurrency(total)}
💰 Tổng chi phí linh kiện: ${formatCurrency(newPartsTotal)} | Tổng hóa đơn: ${formatCurrency(newTotalCost)}`,
  isInternal: true,
  supabaseAdmin: ctx.supabaseAdmin,
});
```

**c. Cost Changes (`updateTicket`):**
```typescript
// Kiểm tra từng trường có thay đổi
const changes = [];

if (oldData.service_fee !== newData.service_fee) {
  await createAutoComment({
    ticketId: input.id,
    userId: user.id,
    comment: `💵 Phí dịch vụ đã thay đổi: ${formatCurrency(oldData.service_fee)} → ${formatCurrency(newData.service_fee)}
💰 Tổng hóa đơn mới: ${formatCurrency(newData.total_cost)}`,
    isInternal: true,
    supabaseAdmin: ctx.supabaseAdmin,
  });
}

// Tương tự cho diagnosis_fee, discount_amount, priority_level, warranty_type, assigned_to...
```

### 3. **Currency Formatting Helper**

```typescript
// src/server/utils/format-currency.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
```

### 4. **Label Mapping Helpers**

```typescript
// src/server/utils/label-helpers.ts
export const PRIORITY_LABELS = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

export const WARRANTY_LABELS = {
  warranty: "Bảo hành",
  paid: "Trả phí",
  goodwill: "Thiện chí",
};
```

### 5. **Error Handling Strategy**

**Nguyên tắc**: Auto-comments không được làm fail operation chính

```typescript
try {
  // Main operation (update ticket, add part, etc.)
  const result = await mainOperation();

  // Auto-comment creation (non-blocking)
  try {
    await createAutoComment({...});
  } catch (commentError) {
    // Log error but don't throw
    console.error("Auto-comment failed:", commentError);
    // Optionally: send to error tracking service
  }

  return result;
} catch (error) {
  // Handle main operation error
  throw error;
}
```

### 6. **Testing Strategy**

**Unit Tests:**
- Test auto-comment format cho từng scenario
- Test currency formatting
- Test label mapping

**Integration Tests:**
- Verify auto-comment được tạo sau mỗi mutation
- Verify `is_internal` flag đúng
- Verify `created_by` là user thực hiện hành động

**Example Test:**
```typescript
test("should create auto-comment when status changes", async () => {
  const result = await updateTicketStatus({
    id: ticketId,
    status: "in_progress",
  });

  const comments = await getTicketComments(ticketId);
  const statusChangeComment = comments.find(c =>
    c.comment.includes("Trạng thái đã thay đổi")
  );

  expect(statusChangeComment).toBeDefined();
  expect(statusChangeComment.is_internal).toBe(true);
  expect(statusChangeComment.created_by).toBe(userId);
});
```

### 7. **Performance Considerations**

- **Batch Operations**: Nếu có nhiều thay đổi cùng lúc, tạo tất cả auto-comments trong một transaction
- **Async Operations**: Auto-comment creation nên async và non-blocking
- **Database Indexes**: Đảm bảo có index trên `ticket_id` và `created_at` để query nhanh
- **Caching**: Consider caching label mappings và format functions

### 8. **Migration Strategy**

**Phase 1**: Implement cho operations quan trọng nhất
1. Status changes
2. Parts management
3. Ticket creation

**Phase 2**: Expand to other fields
1. Cost changes
2. Priority/warranty changes
3. Assignment changes

**Phase 3**: Enhancement
1. Rich formatting
2. Customer notifications
3. Analytics integration

### 9. **Monitoring và Analytics**

Track metrics:
- Số lượng auto-comments created per day
- Error rate của auto-comment creation
- Average comments per ticket
- Distribution của comment types (auto vs manual)

### 10. **Future Enhancements**

- **Rich Text Formatting**: Support markdown, links, images
- **Comment Templates**: Pre-defined templates cho common scenarios
- **Multilingual Support**: Support multiple languages
- **Comment Reactions**: Allow users to react to comments
- **Comment Threading**: Reply to specific comments
- **Mention System**: @mention other users
- **Attachment Support**: Attach files/images to comments