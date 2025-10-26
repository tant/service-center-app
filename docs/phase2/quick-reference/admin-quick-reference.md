# Thẻ tham khảo nhanh cho Admin

**Vai trò:** Quản trị viên | **Cập nhật:** 2025-10-26

---

## Trách nhiệm chính của bạn

*   Giám sát và kiểm soát toàn bộ hệ thống.
*   Quản lý tài khoản và quyền của người dùng.
*   Cấu hình cài đặt hệ thống.
*   Xử lý các hoạt động quan trọng và các trường hợp leo thang.
*   Đảm bảo tính toàn vẹn và bảo mật dữ liệu.

---

## Quản trị Hệ thống

### Cài đặt Hệ thống Ban đầu

*   **Trang:** `/setup`
*   **Hành động:** Lần đầu tiên truy cập trang này, nhập `SETUP_PASSWORD` từ các biến môi trường để tạo tài khoản admin mặc định.

### Quản lý Thành viên Nhóm

*   **Trang:** `/management/team`
*   **Khả năng:**
    *   Xem tất cả nhân viên.
    *   Thêm thành viên mới với các vai trò cụ thể (Admin, Manager, Technician, Reception).
    *   Chỉnh sửa thông tin, vai trò, và đặt lại mật khẩu của người dùng.
    *   Xóa người dùng (không thể hoàn tác).

---

## Quản lý Dữ liệu

### Truy cập Cơ sở dữ liệu Trực tiếp

*   Sử dụng Supabase Dashboard (`http://localhost:54323`) để thực hiện các truy vấn phức tạp, chỉnh sửa nhanh, và xem log.

### Các truy vấn thường dùng

*   **Xem tất cả người dùng:**
    ```sql
    SELECT id, email, created_at FROM auth.users;
    ```
*   **Kiểm tra các bản ghi mồ côi (Orphaned Records):**
    ```sql
    -- Hồ sơ không có người dùng xác thực
    SELECT p.* FROM profiles p LEFT JOIN auth.users u ON p.id = u.id WHERE u.id IS NULL;
    ```

### Sao lưu và Phục hồi

Sử dụng các lệnh của Supabase CLI để sao lưu và phục hồi cơ sở dữ liệu.

```bash
# Sao lưu toàn bộ
pnpx supabase db dump -f backup_full.sql

# Khôi phục từ bản sao lưu
psql -h localhost -U postgres -f backup_full.sql
```

---

## Quản lý Người dùng và Bảo mật

### Phân cấp Vai trò

`Admin` > `Manager` > `Technician` > `Reception`

### Chính sách Bảo mật Cấp hàng (RLS)

*   Tất cả các bảng đều có chính sách RLS để thực thi quyền truy cập ở cấp cơ sở dữ liệu.
*   Các hàm trợ giúp như `is_admin()` được sử dụng trong các chính sách này.

### Quản lý Phiên và Mật khẩu

*   **Chính sách Mật khẩu:** Tối thiểu 8 ký tự.
*   **Quản lý Phiên:** JWT hết hạn sau 1 giờ, được tự động làm mới.

---

## Xử lý sự cố

*   **"Người dùng không thể đăng nhập":** Kiểm tra xem tài khoản có tồn tại và hoạt động không, xác minh mật khẩu, và kiểm tra log xác thực của Supabase.
*   **"Người dùng có quyền không đúng":** Kiểm tra vai trò của người dùng trong trang quản lý nhóm và đảm bảo họ đăng nhập lại sau khi vai trò được thay đổi.
*   **"Migration schema thất bại":** Sử dụng `pnpx supabase db reset` để reset cơ sở dữ liệu cục bộ và áp dụng lại các migration.

---

## Các Nhiệm vụ Bảo trì

*   **Hàng ngày:** Kiểm tra sức khỏe hệ thống, xem lại hoạt động.
*   **Hàng tuần:** Xem xét tài khoản người dùng, kiểm tra kích thước cơ sở dữ liệu, và trạng thái sao lưu.
*   **Hàng tháng:** Thực hiện sao lưu đầy đủ, xem xét và lưu trữ dữ liệu cũ, và kiểm tra các bản cập nhật phần mềm.

**Bạn có toàn quyền kiểm soát hệ thống. Hãy sử dụng nó một cách khôn ngoan.**