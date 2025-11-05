# Tạo System User Cho Service Request Comments

## Mục tiêu
- Có một user hệ thống cố định phụ trách các bình luận tự động của ticket.
- Phù hợp ràng buộc `FOREIGN KEY` và RLS hiện tại.
- Không làm lộ system user trong giao diện dành cho nhân viên.

## Thông tin system user
- **UUID**: `00000000-0000-4000-8000-000000000000`
- **Email auth**: `system@service-center.local`
- **Email profile**: `service-system@service-center.local`
- **Full name**: `Service Center System`
- **Role**: `manager`
- **Active**: `true`

## Kế hoạch triển khai
1. **Migraton seed auth + profile**
   - Tạo script SQL chèn user vào `auth.users` (nếu chưa có).
   - Chèn bản ghi tương ứng vào `public.profiles`.
   - Đảm bảo migration id: `20251106104500_seed_system_user.sql`.

2. **Cập nhật trigger auto ticket comment**
   - Sửa `public.auto_create_tickets_on_received()` để dùng `created_by = SYSTEM_USER_ID`.
   - Migration mới `20251106105000_update_auto_ticket_comment_creator.sql`.

3. **Điều chỉnh ứng dụng**
   - UI `TicketComments` nhận diện UUID này và hiển thị badge “Hệ thống”.
   - Loại user hệ thống khỏi dropdown/ danh sách nhân viên nếu có.
   - Docs `README/guide` cập nhật thông tin user hệ thống.

4. **Triển khai**
   - Chạy `npx supabase migration up`.
   - Kiểm thử submit service request (pickup + delivery).
   - Xác nhận bình luận auto hiện đúng, có tag hệ thống.

5. **Theo dõi**
   - Log và monitoring xác nhận bình luận tạo bởi system user.
   - Đảm bảo RLS `service_ticket_comments_insert_policy` hoạt động (role `manager`).

## Ghi chú
- Nếu cần ẩn user khỏi giao diện, thêm filter theo email hoặc flag `is_active`.
- Giữ UUID cố định cho mọi môi trường để script/trigger dùng chung.
