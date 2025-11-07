# Kế hoạch kiểm tra & triển khai migration gộp

## 1. Kiểm tra dữ liệu thật
1. Kết nối tới database hiện tại (production/staging) với quyền đọc/ghi.
2. Chạy `psql <connection-url> -f supabase/scripts/check_service_data.sql`.
3. Xử lý mọi dòng cảnh báo:
   - Nếu `delivery_without_address > 0`, bổ sung `delivery_address` cho các yêu cầu có `delivery_method = 'delivery'`.
   - Nếu `items_missing_issue_description > 0`, cập nhật nội dung mô tả trước khi migration ép `NOT NULL`.
   - Bảo đảm `virtual_warehouse_id` đã được map đúng; nếu không, rà soát lại bảng `virtual_warehouses`.
4. Lưu lại kết quả kiểm tra vào ticket/ghi chú triển khai.

## 2. Hợp nhất migration
Các file nhỏ 20251102–20251106 đã bị xoá khỏi repo và thay bằng:

- `supabase/migrations/20251107090000_consolidated_service_requests.sql`
  - Bao gồm toàn bộ thay đổi liên quan `service_requests`, `service_request_items` và trigger `auto_create_tickets_on_received`.

## 3. Triển khai trên môi trường mới
1. Khởi tạo DB mới (local/staging) với `supabase db reset` hoặc `pnpm supabase db reset`.
2. Đảm bảo chuỗi migration chạy theo thứ tự:
   - `20251030024942_init_schema.sql`
   - `20251031000000_update_physical_products_virtual_warehouse.sql`
   - `20251107090000_consolidated_service_requests.sql`
3. Sau khi chạy, dùng `supabase db diff --schema public` hoặc `pg_dump --schema-only` để so sánh với môi trường chuẩn.

> Đã thử `npx supabase db reset` trên máy dev: lệnh chạy thành công, CLI lần lượt áp dụng ba migration trên và seed dữ liệu. Một số NOTICE “column ... does not exist, skipping” xuất hiện do file gộp tự vệ khi cột đã bị xoá sẵn; có thể bỏ qua miễn là toàn bộ lệnh kết thúc “Finished supabase db reset”.

## 4. Cập nhật môi trường đã chạy migration cũ
1. Nếu môi trường production đã chạy tất cả migration nhỏ trước đây, **không chạy lại** file gộp (schema đã ở trạng thái cuối). Thay vào đó:
   - Lưu bản sao các file cũ để tham chiếu lịch sử (git history vẫn còn).
   - Đảm bảo không ai chạy `supabase db reset` bằng code cũ trước khi merge nhánh.
2. Nếu cần reset môi trường đó trong tương lai, dùng bản code mới (có file gộp) để dựng lại từ đầu.

## 5. Kế hoạch khôi phục
- Giữ snapshot DB (pg_dump) trước khi chạy migration gộp.
- Nếu phát hiện lỗi sau khi áp dụng, khôi phục snapshot rồi chỉnh sửa migration gộp trước khi chạy lại.

## 6. Checklist trước khi merge
- [ ] Kết quả script kiểm tra dữ liệu không còn cảnh báo nghiêm trọng.
- [ ] Đã test `supabase db reset` thành công với file gộp.
- [ ] Tài liệu triển khai được chia sẻ cho team liên quan.
