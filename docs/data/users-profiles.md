# Cấu trúc dữ liệu profiles (User Profiles Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu của bảng `profiles` - bảng bổ sung cho Supabase Auth để quản lý thông tin nghiệp vụ và phân quyền trong hệ thống service center.

## Tích hợp với Supabase Auth

Bảng `profiles` liên kết với Supabase Auth thông qua `user_id` (foreign key tới `auth.users.id`). Supabase Auth quản lý authentication, bảng `profiles` quản lý authorization và thông tin nghiệp vụ.

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `user_id` | UUID | ✅ | ID liên kết với auth.users (unique) |
| `full_name` | String | ✅ | Tên đầy đủ của user |
| `avatar_url` | String/URL | ❌ | URL avatar của user |
| `email` | String | ✅ | Email (sync từ auth.users) |

### 2. Thông tin phân quyền (Authorization)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `roles` | Array[String] | ✅ | Danh sách roles (admin, manager, technician, reception) |
| `is_active` | Boolean | ✅ | Tài khoản có đang hoạt động không |

### 3. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo profile |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID | ❌ | ID admin tạo profile |
| `updated_by` | UUID | ❌ | ID admin cập nhật cuối |

## Ví dụ JSON Schema

```json
{
  "id": "profile-uuid-001",
  "user_id": "auth-user-uuid-001",
  "full_name": "Nguyễn Văn A",
  "avatar_url": "https://example.com/avatars/user1.jpg",
  "email": "nguyenvana@company.com",
  "roles": ["technician", "reception"],
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "admin-uuid-001",
  "updated_by": "admin-uuid-001"
}
```

## Roles và Permissions

### Role Definitions

#### `reception`
**Mô tả**: Nhân viên tiếp nhận
**Permissions**:
- Tạo phiếu dịch vụ mới
- Xem thông tin phiếu dịch vụ
- Comment vào phiếu dịch vụ

#### `technician`
**Mô tả**: Kỹ thuật viên sửa chữa
**Permissions**:
- Tạo phiếu dịch vụ mới
- Xem thông tin phiếu dịch vụ
- Thêm/bớt linh kiện trong phiếu dịch vụ
- Comment vào phiếu dịch vụ
- Đổi status phiếu dịch vụ

#### `manager`
**Mô tả**: Quản lý trung tâm
**Permissions**:
- Tất cả quyền của `reception` + `technician`
- Quản lý products (CRUD)
- Quản lý parts (CRUD)

#### `admin`
**Mô tả**: Quản trị hệ thống
**Permissions**:
- Tất cả quyền của `manager`
- Tạo user mới
- Đổi roles của user
- Quản lý hệ thống

### Permission Matrix

| Action | reception | technician | manager | admin |
|--------|-----------|------------|---------|-------|
| Tạo phiếu dịch vụ | ✅ | ✅ | ✅ | ✅ |
| Xem phiếu dịch vụ | ✅ | ✅ | ✅ | ✅ |
| Comment phiếu dịch vụ | ✅ | ✅ | ✅ | ✅ |
| Thêm/bớt linh kiện | ❌ | ✅ | ✅ | ✅ |
| Đổi status phiếu | ❌ | ✅ | ✅ | ✅ |
| Quản lý products | ❌ | ❌ | ✅ | ✅ |
| Quản lý parts | ❌ | ❌ | ✅ | ✅ |
| Tạo user | ❌ | ❌ | ❌ | ✅ |
| Đổi roles user | ❌ | ❌ | ❌ | ✅ |

### Multi-Role Logic
- User có thể có nhiều roles: `["technician", "reception"]`
- Permission cuối cùng = union của tất cả permissions từ các roles
- Ví dụ: User có roles `["technician", "reception"]` sẽ có tất cả permissions của cả 2 roles

## Relationships và Constraints

### Foreign Keys:
- `user_id` → `auth.users.id` (unique constraint)
- `created_by` → `profiles.user_id`
- `updated_by` → `profiles.user_id`

### Triggers:
- Tự động tạo profile khi user đăng ký (via Supabase trigger)
- Sync email từ `auth.users` khi có thay đổi

## Query Examples

### Kiểm tra permission của user:
```sql
-- Function để check permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles 
  FROM profiles 
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Logic kiểm tra permission dựa trên roles
  -- (Implementation chi tiết tùy theo business logic)
  
  RETURN false; -- placeholder
END;
$$ LANGUAGE plpgsql;
```

### Lấy thông tin user với roles:
```sql
SELECT p.*, u.email as auth_email, u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id = 'user-uuid-001';
```

## Ghi chú quan trọng

1. **Indexing**: 
   - Unique index trên `user_id`
   - Index trên `roles` để query nhanh
   - Index trên `is_active`

2. **Validation**: 
   - `roles` chỉ chứa các giá trị hợp lệ: admin, manager, technician, reception
   - `user_id` phải tồn tại trong `auth.users`
   - `email` format hợp lệ

3. **Security**: 
   - Chỉ admin mới có quyền thay đổi `roles`
   - RLS policies dựa trên roles để kiểm soát truy cập
   - Không cho phép user tự thay đổi roles của mình

4. **Sync với Auth**: 
   - Email có thể sync từ `auth.users` hoặc override
   - Avatar có thể lưu trong storage và link URL
   - Trigger tự động tạo profile khi có user mới

5. **Default Values**:
   - `roles`: `["reception"]` (role mặc định)
   - `is_active`: `true`

6. **Business Logic**:
   - Permission được tính động từ tất cả roles
   - Inactive user không có permission nào
   - Multi-role cho phép phân công linh hoạt