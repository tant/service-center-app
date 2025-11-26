# Mô tả công việc của Commit 0d49ca57ad33059bf722160bd0f26d2163b0162c

**Tiêu đề Commit:** `feat: thêm serial vào phiếu dịch vụ (đã loại bỏ liên kết sản phẩm vật lý)`

**Mô tả chi tiết:**

Commit này ban đầu giới thiệu chức năng liên kết số serial của sản phẩm vật lý với các phiếu dịch vụ. Tuy nhiên, để đơn giản hóa quản lý và loại bỏ ràng buộc trực tiếp với bảng `physical_products`, cột `physical_product_id` đã được loại bỏ. Chức năng theo dõi sản phẩm bằng số serial vẫn được giữ lại, cho phép ghi nhận số serial trực tiếp trên phiếu dịch vụ.

Cụ thể, các thay đổi sau đã được thực hiện:

1.  **Sửa đổi lược đồ cơ sở dữ liệu (`201_service_tickets.sql`):**
    *   Cột `physical_product_id` đã được loại bỏ khỏi bảng `service_tickets`.
    *   Cột `serial_number` (TEXT, có thể null) được giữ lại để lưu trữ số serial của sản phẩm tại thời điểm tạo phiếu.
    *   Các index và comment liên quan đến `physical_product_id` đã được xóa.
    *   Index và comment liên quan đến `serial_number` được giữ lại.

2.  **Cập nhật hàm `create_tickets_for_service_request` (`203_service_requests.sql`):**
    *   Hàm PostgreSQL `create_tickets_for_service_request` đã được sửa đổi để loại bỏ logic tìm kiếm và chèn `physical_product_id`.
    *   Chức năng tìm kiếm `product_id` từ `public.physical_products` dựa trên `serial_number` vẫn được giữ lại để đảm bảo `product_id` được liên kết chính xác.
    *   `serial_number` vẫn được chèn vào `service_ticket` mới được tạo và bao gồm trong comment ban đầu.

3.  **Cập nhật hiển thị frontend (`src/app/(auth)/operations/tickets/[id]/page.tsx`):**
    *   Trang chi tiết phiếu dịch vụ trong ứng dụng Next.js (`/operations/tickets/[id]/page.tsx`) tiếp tục hiển thị `serial_number` của sản phẩm liên quan đến phiếu.

4.  **Cập nhật định nghĩa kiểu (`src/types/database.types.ts`):**
    *   Các định nghĩa kiểu TypeScript (`Database["public"]["Tables"]["service_tickets"]`) đã được cập nhật để loại bỏ trường `physical_product_id`, đảm bảo an toàn kiểu trong toàn bộ ứng dụng khi tương tác với dữ liệu phiếu dịch vụ. Trường `serial_number` vẫn được giữ lại.

Thay đổi này tinh chỉnh khả năng quản lý phiếu dịch vụ của hệ thống bằng cách theo dõi sản phẩm bằng số serial một cách trực tiếp hơn, giảm bớt sự phụ thuộc vào liên kết trực tiếp đến bảng `physical_products` cho mỗi phiếu dịch vụ.