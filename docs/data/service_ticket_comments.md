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

3. **Auto-generated Comments**:
   - Tự động tạo comment khi thay đổi status
   - Tự động tạo comment khi thêm/bớt linh kiện
   - Timestamp chính xác cho audit trail

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