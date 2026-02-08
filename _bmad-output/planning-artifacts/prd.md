---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-service-center-app-2026-02-08.md
workflowType: 'prd'
approach: code-based
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: brownfield
status: complete
---

# Product Requirements Document - service-center-app

**Author:** Tan
**Date:** 2026-02-08

---

## Tổng Quan

Hệ thống quản lý trung tâm bảo hành (Service Center App) — thay thế hoàn toàn Frappe/ERPNext đang dùng. Frappe quá nặng, khó tùy chỉnh cho nghiệp vụ bảo hành thực tế, và giao diện không phù hợp nhân viên Việt Nam.

**Giải pháp:** Web app nội bộ xây từ đầu, đúng nghiệp vụ bảo hành — quản lý phiếu dịch vụ, kho theo serial, task-based workflow, RMA, email tracking. Giao diện tiếng Việt, phân quyền RBAC, dễ bảo trì và mở rộng bởi team nội bộ.

**Đối tượng:** 5 vai trò — Kỹ thuật viên, Tiếp nhận, Quản lý, Admin, Khách hàng (trang public).

---

## Tiêu Chí Thành Công

### Mục Tiêu

Thay thế hoàn toàn hệ thống Frappe/ERPNext. Tất cả nghiệp vụ chạy trên hệ thống mới.

### Tiêu Chí Kỹ Thuật

- Hệ thống hoạt động ổn định trên server nội bộ
- Phân quyền RBAC đầy đủ 4 vai trò
- RLS database-level cho tất cả bảng
- Audit logging cho mọi thao tác quan trọng

---

## Phạm Vi Sản Phẩm

Dựa trên code thực tế — 39 database tables, 47 pages, 26 API routers:

1. **Quản lý danh mục** — Sản phẩm, linh kiện, thương hiệu
2. **Quản lý kho** — 7 kho ảo, phiếu nhập/xuất/chuyển kho, serial tracking
3. **Quản lý khách hàng** — CRUD, tìm kiếm theo SĐT/tên/email
4. **Phiếu yêu cầu (Service Request)** — 7 trạng thái, tracking token, trang public
5. **Phiếu dịch vụ (Service Ticket)** — Task-based workflow, cost calculation, attachments
6. **Hệ thống Task** — Polymorphic tasks (5 entity types), workflow templates
7. **RMA** — Quản lý lô đổi trả về hãng
8. **Email notifications** — Templates, rate limiting, tracking
9. **Dashboard & Analytics** — Revenue, metrics, task statistics
10. **Phân quyền & Audit** — RBAC, RLS, audit logs

---

## User Journeys

### Journey 1: Kỹ Thuật Viên — Sửa Chữa Sản Phẩm

**Nhân vật:** Minh, kỹ thuật viên sửa chữa linh kiện điện tử, 3 năm kinh nghiệm.

**Bối cảnh:** Mỗi sáng Minh mở hệ thống để xem danh sách phiếu dịch vụ được gán. Hôm nay có 5 phiếu đang chờ.

**Hành trình:**

1. Minh đăng nhập, vào trang **My Tasks** — thấy danh sách phiếu được gán, sắp xếp theo độ ưu tiên
2. Chọn phiếu SV-2026-042 (priority: urgent) — xem thông tin sản phẩm, serial, mô tả lỗi từ khách
3. Bắt đầu chẩn đoán — cập nhật trạng thái task "Chẩn đoán" sang in_progress, ghi notes
4. Chụp ảnh bo mạch hỏng, upload vào task attachments
5. Xác định sửa được — hoàn thành task chẩn đoán, chuyển sang task "Sửa chữa"
6. Sửa xong — hoàn thành các task, ghi completion notes
7. Kết quả: **repaired** → hệ thống tự chuyển kho (in_service → customer_installed), cập nhật trạng thái phiếu

**Kịch bản B — Không sửa được, cần đổi mới:**

1. Minh chẩn đoán, xác định unrepairable
2. Chọn outcome: **warranty_replacement** → hệ thống hiện danh sách sản phẩm thay thế từ kho warranty_stock
3. Chọn serial thay thế → hệ thống tự động:
   - Sản phẩm lỗi: in_service → rma_staging
   - Sản phẩm thay thế: warranty_stock → customer_installed
   - Tự thêm sản phẩm lỗi vào lô RMA

**Yêu cầu phát hiện:** Task management, phiếu dịch vụ, chuyển kho tự động, attachments, outcome workflow

---

### Journey 2: Tiếp Nhận — Tạo Phiếu Yêu Cầu Bảo Hành

**Nhân vật:** Lan, nhân viên tiếp nhận tại quầy.

**Bối cảnh:** Khách hàng mang sản phẩm đến yêu cầu bảo hành.

**Hành trình:**

1. Lan vào trang **Service Requests → New**, nhập thông tin khách: SĐT → hệ thống tự điền nếu khách đã có
2. Nếu khách mới: nhập họ tên, SĐT, email, địa chỉ → tạo khách hàng mới
3. Nhập serial number sản phẩm → hệ thống xác minh: sản phẩm tồn tại, còn bảo hành hay không
4. Mô tả lỗi, chụp ảnh sản phẩm khi nhận
5. Submit → trạng thái submitted, hệ thống tạo tracking token gửi email cho khách
6. Khi nhận được sản phẩm thực tế → chuyển sang received
7. Tạo phiếu dịch vụ từ phiếu yêu cầu → phiếu tự sinh mã SV-YYYY-NNN

**Kịch bản B — Khách tự tạo online:**

1. Khách vào trang public /service-request, tự điền thông tin + serial
2. Hệ thống tạo phiếu draft → submitted
3. Lan xem danh sách phiếu mới trên hệ thống, review và xác nhận
4. Liên hệ khách lấy sản phẩm hoặc hẹn gửi → pickingup → received

**Yêu cầu phát hiện:** Quản lý khách hàng, xác minh serial, trang public, email notification, tracking token

---

### Journey 3: Quản Lý — Giám Sát Vận Hành & RMA

**Nhân vật:** Hùng, quản lý trung tâm bảo hành.

**Bối cảnh:** Hùng cần nắm tổng quan hoạt động hàng ngày và xử lý RMA hàng tháng.

**Hành trình giám sát:**

1. Mở **Dashboard** — xem tổng quan: phiếu đang xử lý, phiếu quá hạn, tồn kho theo kho ảo
2. Vào **Tickets** — lọc theo trạng thái, gán kỹ thuật viên cho phiếu chưa gán
3. Kiểm tra **Task Progress** — xem tiến độ tasks của từng phiếu, phát hiện phiếu bị blocked
4. Xem **Inventory Overview** — kiểm tra tồn kho warranty_stock để đảm bảo đủ hàng thay thế

**Hành trình RMA:**

1. Vào **RMA** — xem danh sách sản phẩm trong rma_staging
2. Tạo lô RMA mới (RMA-YYYYMMDD-XXX) — chọn supplier, gom serial cần gửi trả
3. Ghi mã vận đơn, gửi lô → trạng thái submitted
4. Khi nhận hàng thay thế từ hãng → tạo phiếu nhập kho (lý do: rma_return) → hàng vào warranty_stock

**Hành trình quản lý danh mục:**

1. Vào **Catalog** — thêm sản phẩm mới, cập nhật thông tin, quản lý brands
2. Vào **Parts** — quản lý linh kiện, giá vốn, tồn kho linh kiện
3. Cấu hình **Workflows** — tạo/chỉnh sửa workflow templates cho từng loại phiếu

**Yêu cầu phát hiện:** Dashboard analytics, RMA management, workflow templates, inventory overview, team assignment

---

### Journey 4: Quản Trị — Cấu Hình Hệ Thống

**Nhân vật:** Admin, quản trị viên hệ thống.

**Hành trình:**

1. Vào **Management → Team** — tạo tài khoản nhân viên mới, gán vai trò (manager/technician/reception)
2. Vào **Admin → App Settings** — cấu hình hệ thống (email SMTP, thông tin công ty...)
3. Xem **Audit Logs** — kiểm tra lịch sử thao tác quan trọng: ai đổi role, ai chuyển kho lớn
4. Quản lý **Warehouses** — cấu hình kho vật lý, kiểm tra kho ảo

**Yêu cầu phát hiện:** User management, system settings, audit logs, warehouse configuration

---

### Journey 5: Khách Hàng — Tự Tạo Yêu Cầu Qua Trang Public

**Nhân vật:** Anh Tuấn, khách hàng có sản phẩm cần bảo hành.

**Hành trình:**

1. Truy cập trang public `/service-request` (không cần đăng nhập)
2. Nhập thông tin: tên, SĐT, email, địa chỉ
3. Thêm sản phẩm: nhập serial number, mô tả lỗi, chụp ảnh
4. Submit → nhận email xác nhận với tracking token
5. Vào `/service-request/track` → nhập tracking token → xem trạng thái phiếu realtime
6. Nhận email khi phiếu hoàn tất → đến lấy sản phẩm hoặc chờ giao

**Yêu cầu phát hiện:** Public pages (không auth), email notifications, tracking system, form submission

---

### Tóm Tắt Yêu Cầu Từ Journeys

| Journey | Capabilities |
|---------|-------------|
| Kỹ thuật viên | Task management, ticket workflow, stock movements, attachments |
| Tiếp nhận | Service requests, customer management, serial verification, ticket creation |
| Quản lý | Dashboard, RMA, workflow config, team assignment, inventory overview |
| Quản trị | User management, system settings, audit logs |
| Khách hàng | Public pages, tracking, email notifications |

---

## Yêu Cầu Web App

### Tổng Quan Nền Tảng

- **Loại ứng dụng:** SPA (Single Page Application) với Next.js App Router
- **Rendering:** Server-side rendering (SSR) cho trang public, client-side cho trang authenticated
- **Responsive:** Desktop-first (nhân viên dùng PC tại văn phòng), mobile-friendly cho trang public

### Hỗ Trợ Trình Duyệt

- Chrome, Firefox, Edge (phiên bản hiện tại và 2 phiên bản trước)
- Safari cho trang public (khách hàng trên mobile)

### Hiệu Năng

- Trang authenticated: tải < 3 giây cho lần đầu, < 1 giây cho navigation tiếp theo
- Trang public: tải < 2 giây
- API response: < 500ms cho các thao tác CRUD thông thường
- Concurrent users: ~20 nhân viên + vài khách hàng trên trang public

### SEO

- Không cần SEO cho trang authenticated
- Trang public: SEO cơ bản (meta tags, title)

### Khả Năng Tiếp Cận (Accessibility)

- Tối thiểu WCAG 2.1 Level A cho trang public (khách hàng)
- Hỗ trợ keyboard navigation cho toàn bộ form nhập liệu
- Color contrast ratio tối thiểu 4.5:1 cho text, 3:1 cho UI components
- Semantic HTML (headings, landmarks, labels) cho screen readers
- Trang authenticated: best-effort accessibility (nhân viên nội bộ, ưu tiên hiệu quả sử dụng)

### Bảo Mật Web

- HTTPS bắt buộc
- CSRF protection
- XSS prevention
- Rate limiting cho API endpoints
- Session management qua Supabase Auth

---

## Phân Pha Phát Triển

### Phạm Vi Đầy Đủ (Không Phân MVP)

Hệ thống được phát triển đầy đủ, không chia MVP — đây là brownfield project thay thế hệ thống cũ, phải đáp ứng tất cả nghiệp vụ đang vận hành.

**Toàn bộ tính năng đã triển khai trong code:**

1. **Quản lý danh mục** — Products, Brands, Parts, product-parts mapping
2. **Quản lý kho** — 7 kho ảo, phiếu nhập/xuất/chuyển, serial tracking, stock movements
3. **Quản lý khách hàng** — CRUD, tìm kiếm, auto-fill
4. **Phiếu yêu cầu** — 7 trạng thái, tracking token, trang public, items theo serial
5. **Phiếu dịch vụ** — Task-based workflow, cost calculation, parts used, attachments, outcomes
6. **Hệ thống Task** — Polymorphic (5 entity types), workflow templates, task library
7. **RMA** — Batch management, auto-numbering, serial tracking
8. **Email notifications** — 6 templates, retry, tracking, rate limiting
9. **Dashboard** — Overview, notifications, task progress, revenue analytics
10. **Phân quyền** — RBAC 4 vai trò, RLS, audit logging

### Rủi Ro & Giảm Thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| Dữ liệu migration từ Frappe | Viết script migration riêng, test trên staging |
| Nhân viên chưa quen hệ thống mới | Giao diện đơn giản, training trực tiếp |
| Server nội bộ downtime | Backup tự động, deploy lại nhanh |

---

## Functional Requirements

### Quản Lý Danh Mục

- FR1: Manager/Admin có thể tạo, sửa, xóa sản phẩm với thông tin: tên, SKU, thương hiệu, loại, model, mô tả, hình ảnh, thời hạn bảo hành
- FR2: Hệ thống từ chối tạo sản phẩm khi SKU trùng
- FR3: Manager/Admin có thể tạo, sửa, xóa thương hiệu (brands)
- FR4: Manager/Admin có thể tạo, sửa, xóa linh kiện (parts) với thông tin: tên, mã, giá, giá vốn, tồn kho, nhà cung cấp
- FR5: Manager/Admin có thể gán linh kiện cho sản phẩm (product-parts mapping) với số lượng và ghi chú

### Quản Lý Kho

- FR6: Hệ thống quản lý 7 kho ảo: main, warranty_stock, rma_staging, dead_stock, in_service, parts, customer_installed
- FR7: Manager/Admin có thể tạo phiếu nhập kho (stock receipt) với auto-numbering PN-YYYY-NNNN
- FR8: Phiếu nhập kho hỗ trợ 3 lý do: purchase, customer_return, rma_return
- FR9: Mỗi sản phẩm nhập kho được tạo bản ghi theo dõi riêng theo serial number
- FR10: Manager/Admin có thể tạo phiếu xuất kho (stock issue) với nhiều lý do: sale, warranty_replacement, repair, internal_use, return_to_supplier, damage...
- FR11: Manager/Admin có thể tạo phiếu chuyển kho (stock transfer) giữa các kho ảo
- FR12: Hệ thống ghi lại mọi stock movement (immutable audit trail): receipt, transfer, assignment, return, disposal
- FR13: Hệ thống theo dõi trạng thái từng sản phẩm vật lý theo serial: condition (new/refurbished/used/faulty/for_parts), status (active/issued), kho hiện tại
- FR14: Manager/Admin có thể cấu hình ngưỡng tồn kho tối thiểu cho từng sản phẩm theo kho ảo
- FR15: Hệ thống hiển thị tổng quan tồn kho theo kho ảo, cho phép lọc và tìm kiếm

### Quản Lý Khách Hàng

- FR16: Reception/Manager/Admin có thể tạo, sửa khách hàng với: họ tên, SĐT (duy nhất), email, địa chỉ
- FR17: Hệ thống hỗ trợ tìm kiếm khách hàng theo tên, SĐT, email
- FR18: Khi nhập SĐT đã tồn tại, hệ thống tự động điền thông tin khách

### Phiếu Yêu Cầu (Service Request)

- FR19: Khách hàng (public, không cần đăng nhập) có thể tạo phiếu yêu cầu qua trang public
- FR20: Reception/Manager có thể tạo phiếu yêu cầu từ trang nội bộ
- FR21: Mỗi phiếu yêu cầu có tracking token (15 ký tự) duy nhất
- FR22: Phiếu yêu cầu hỗ trợ 7 trạng thái: draft → submitted → pickingup → received → processing → completed → cancelled
- FR23: Phiếu yêu cầu chứa nhiều items, mỗi item có serial number và mô tả lỗi
- FR24: Khách có thể upload ảnh cho mỗi item trong phiếu yêu cầu
- FR25: Khách có thể tra cứu trạng thái phiếu yêu cầu bằng tracking token (trang public)
- FR26: Staff có thể review và xác nhận/từ chối phiếu yêu cầu
- FR27: Hệ thống theo dõi trạng thái nhận hàng (đã nhận/chờ nhận) để kiểm soát việc tạo phiếu dịch vụ
- FR28: Phiếu yêu cầu hỗ trợ gán workflow — tasks phải hoàn thành trước khi xác nhận received

### Phiếu Dịch Vụ (Service Ticket)

- FR29: Manager/Reception có thể tạo phiếu dịch vụ từ phiếu yêu cầu, mã tự sinh SV-YYYY-NNN
- FR30: Phiếu dịch vụ hỗ trợ 5 trạng thái: pending → in_progress → ready_for_pickup → completed → cancelled
- FR31: Manager có thể gán kỹ thuật viên cho phiếu dịch vụ
- FR32: Phiếu dịch vụ hỗ trợ 4 mức ưu tiên: low, normal, high, urgent
- FR33: Phiếu dịch vụ hỗ trợ 3 loại bảo hành: warranty, paid, goodwill
- FR34: Kỹ thuật viên có thể chọn 3 kết quả: repaired, warranty_replacement, unrepairable
- FR35: Khi warranty_replacement: hệ thống hiển thị danh sách sản phẩm thay thế từ warranty_stock
- FR36: Phiếu dịch vụ tính chi phí: service_fee, diagnosis_fee, parts_total, discount_amount, total_cost
- FR37: Staff có thể thêm linh kiện đã sử dụng vào phiếu (service_ticket_parts) với đơn giá và số lượng
- FR38: Staff có thể thêm comments/notes vào phiếu (4 loại: note, status_change, assignment, system)
- FR39: Staff có thể upload file đính kèm (attachments) cho phiếu dịch vụ
- FR40: Phiếu dịch vụ hỗ trợ phương thức giao hàng: pickup hoặc delivery (với địa chỉ giao)
- FR41: Hệ thống tự động chuyển kho khi trạng thái phiếu thay đổi theo business rules

### Hệ Thống Task & Workflow

- FR42: Admin/Manager có thể tạo workflow templates với danh sách tasks theo thứ tự
- FR43: Mỗi workflow template hỗ trợ strict_sequence (bắt buộc theo thứ tự) hoặc tự do
- FR44: Hệ thống hỗ trợ polymorphic tasks cho 5 loại entity: service_ticket, inventory_receipt, inventory_issue, inventory_transfer, service_request
- FR45: Tasks hỗ trợ 5 trạng thái: pending → in_progress → completed → blocked/skipped
- FR46: Task completed yêu cầu completion_notes, task blocked yêu cầu blocked_reason
- FR47: Staff có thể upload attachments cho tasks (ảnh chụp, tài liệu)
- FR48: Hệ thống ghi lại lịch sử thay đổi trạng thái task
- FR49: Admin/Manager có thể tạo task library (tasks tái sử dụng) với estimated_duration
- FR50: Manager có thể gán tasks cho kỹ thuật viên cụ thể
- FR51: Hệ thống ghi audit khi đổi workflow template cho phiếu dịch vụ

### RMA

- FR52: Manager có thể tạo lô RMA (batch) với mã tự sinh RMA-YYYYMMDD-XXX
- FR53: Manager có thể gom sản phẩm hỏng (từ rma_staging) vào lô RMA
- FR54: Lô RMA hỗ trợ 4 trạng thái: draft → submitted → completed → cancelled
- FR55: Manager có thể cập nhật mã vận đơn (tracking number) cho lô RMA
- FR56: Khi nhận hàng thay thế từ hãng, tạo phiếu nhập kho lý do rma_return, liên kết với lô RMA

### Email Notifications

- FR57: Hệ thống gửi email tự động khi phiếu yêu cầu submitted (template: request_submitted)
- FR58: Hệ thống gửi email khi staff nhận phiếu yêu cầu (template: request_received)
- FR59: Hệ thống gửi email khi từ chối phiếu yêu cầu (template: request_rejected)
- FR60: Hệ thống gửi email khi tạo phiếu dịch vụ (template: ticket_created)
- FR61: Hệ thống gửi email khi dịch vụ hoàn tất (template: service_completed)
- FR62: Hệ thống gửi email khi xác nhận giao hàng (template: delivery_confirmed)
- FR63: Hệ thống theo dõi trạng thái email: pending → sent → failed → bounced
- FR64: Hệ thống hỗ trợ retry cho email gửi thất bại
- FR65: Khách hàng có thể unsubscribe email thông qua trang /unsubscribe

### Dashboard & Analytics

- FR66: Dashboard hiển thị tổng quan: phiếu đang xử lý, phiếu quá hạn, tồn kho
- FR67: Dashboard hiển thị task progress cho phiếu dịch vụ đang hoạt động
- FR68: Dashboard hiển thị revenue analytics (doanh thu dịch vụ)
- FR69: Hệ thống hiển thị notifications cho staff (phiếu mới, tasks được gán...)

### Phân Quyền & Audit

- FR70: Hệ thống phân quyền RBAC với 4 vai trò: admin, manager, technician, reception
- FR71: Admin có thể tạo, sửa, vô hiệu hóa tài khoản nhân viên và gán vai trò
- FR72: Technician chỉ xem được phiếu dịch vụ được gán cho mình
- FR73: Reception có thể tạo phiếu yêu cầu và khách hàng, không quản lý kho
- FR74: Hệ thống áp dụng Row Level Security (RLS) ở database level cho tất cả bảng
- FR75: Hệ thống ghi audit log cho các thao tác quan trọng: create, update, delete, login, role_change, stock_movement, status_change...
- FR76: Audit log bao gồm: user_id, action, resource_type, old_values, new_values, IP address, timestamp
- FR77: Admin có thể cấu hình system settings (SMTP, thông tin công ty)

### Trang Public

- FR78: Trang public hoạt động không cần đăng nhập
- FR79: Trang public hỗ trợ: tạo phiếu yêu cầu, tra cứu trạng thái, unsubscribe email
- FR80: Trang setup cho phép khởi tạo hệ thống lần đầu (tạo admin account)

---

## Non-Functional Requirements

### Hiệu Năng

- NFR1: API response time < 500ms cho 95th percentile dưới tải bình thường (~20 concurrent users)
- NFR2: Trang public tải hoàn chỉnh < 2 giây trên kết nối mạng nội bộ
- NFR3: Trang authenticated tải < 3 giây lần đầu, < 1 giây cho client-side navigation
- NFR4: Database queries cho listing pages hoàn thành < 200ms với pagination

### Bảo Mật

- NFR5: Tất cả giao tiếp qua HTTPS
- NFR6: Authentication qua hệ thống xác thực tích hợp với session management
- NFR7: Row Level Security (RLS) enforced ở database level — không dữ liệu nào truy cập được ngoài quyền hạn
- NFR8: Audit logging cho mọi thao tác quan trọng: tạo/sửa/xóa dữ liệu, đăng nhập, thay đổi quyền
- NFR9: Rate limiting cho API endpoints
- NFR10: Email rate limiting: tối đa 100 email/ngày
- NFR11: Không lưu mật khẩu trong application code — ủy quyền hoàn toàn cho hệ thống xác thực

### Độ Tin Cậy

- NFR12: Hệ thống khả dụng tối thiểu 99% trong giờ làm việc (8h-18h, thứ 2-7), downtime không quá 30 phút/tuần
- NFR13: Database backup tự động mỗi 24 giờ, lưu trữ tối thiểu 30 ngày, khôi phục trong vòng 1 giờ
- NFR14: Stock movements là immutable records — không thể xóa hoặc sửa, đảm bảo audit trail chính xác

### Khả Năng Bảo Trì

- NFR15: Codebase sử dụng static type checking với strict mode
- NFR16: Database schema có migration scripts, có thể rollback
- NFR17: Developer mới có thể setup local environment trong vòng 30 phút và hiểu kiến trúc cơ bản trong 1 ngày nhờ tài liệu đầy đủ
- NFR18: Hệ thống chỉ hỗ trợ tiếng Việt — không cần i18n framework

---

## Ghi Chú Kỹ Thuật

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.1.6, React 19.2.4, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| API | tRPC 11.6.0 |
| Database | Supabase (PostgreSQL 15) |
| State Management | TanStack Query 5 |
| Deployment | Server nội bộ |

### Quy Tắc Đánh Số Tự Động

| Loại chứng từ | Format |
|--------------|--------|
| Phiếu dịch vụ | SV-YYYY-NNN |
| Phiếu nhập kho | PN-YYYY-NNNN |
| Phiếu xuất kho | PX-YYYY-NNNN |
| Phiếu chuyển kho | PC-YYYY-NNNN |
| Lô RMA | RMA-YYYYMMDD-XXX |

### Kiến Trúc Kho Ảo

| Kho ảo | Mục đích |
|--------|----------|
| main | Kho chính — hàng tồn kho chung |
| warranty_stock | Hàng bảo hành — sẵn sàng đổi mới cho khách |
| rma_staging | Hàng chờ RMA — sản phẩm lỗi chờ gửi trả hãng |
| dead_stock | Hàng hỏng — không thể sửa, chờ xử lý |
| in_service | Đang sửa chữa — sản phẩm trong phiếu dịch vụ |
| parts | Linh kiện — phụ tùng thay thế |
| customer_installed | Đã giao khách — sản phẩm đã bán/giao |
