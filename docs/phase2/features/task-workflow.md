# Hệ thống Quy trình Công việc (Task Workflow)

**Tài liệu Tính năng**
**Cập nhật lần cuối:** 2025-10-27

---

## Tổng quan

Hệ thống Quy trình Công việc cho phép thực thi dịch vụ một cách có cấu trúc và có thể theo dõi thông qua các mẫu công việc được định sẵn. Nó biến các phiếu sửa chữa từ việc theo dõi trạng thái đơn giản thành các quy trình làm việc chi tiết, từng bước một.

### Các lợi ích chính

*   **Tiêu chuẩn hóa:** Đảm bảo chất lượng dịch vụ nhất quán.
*   **Khả năng truy vết:** Cung cấp một lộ trình kiểm toán đầy đủ cho mỗi công việc.
*   **Linh hoạt:** Hỗ trợ cả chế độ thực thi nghiêm ngặt theo trình tự và linh hoạt.
*   **Minh bạch:** Theo dõi tiến độ thời gian thực cho quản lý và kỹ thuật viên.

---

## Các Khái niệm Cốt lõi

### 1. Loại Công việc (Task Types)

Là các đơn vị công việc có thể tái sử dụng trong nhiều mẫu khác nhau (ví dụ: "Chẩn đoán ban đầu", "Thay pin").

**Thuộc tính của Task Type:**
- **Tên (name)**: Tên mô tả công việc (tối thiểu 3 ký tự, tối đa 255 ký tự)
- **Mô tả (description)**: Mô tả chi tiết về công việc (tùy chọn)
- **Danh mục (category)**: Phân loại công việc (7 danh mục cố định)
  - Kiểm tra
  - Sửa chữa
  - Thay thế
  - Vệ sinh
  - Cài đặt
  - Kiểm tra cuối
  - Khác
- **Thời gian ước tính (estimated_duration_minutes)**: Số phút dự kiến hoàn thành (tùy chọn)
- **Yêu cầu ghi chú (requires_notes)**: Bắt buộc nhập ghi chú khi hoàn thành
- **Yêu cầu ảnh (requires_photo)**: Bắt buộc chụp ảnh khi hoàn thành
- **Trạng thái hoạt động (is_active)**: Chỉ task types đang hoạt động mới có thể sử dụng trong templates

**Quản lý Task Types:**
- **Quyền truy cập:** Admin, Manager
- **Tạo mới:** Thêm task type mới với form validation
- **Chỉnh sửa:** Cập nhật thông tin task type (không cho phép duplicate tên)
- **Kích hoạt/Vô hiệu hóa:** Toggle trạng thái active
  - Không thể vô hiệu hóa task type đang được sử dụng trong active templates
  - Hệ thống tự động kiểm tra và ngăn chặn với thông báo lỗi rõ ràng

### 2. Mẫu Công việc (Task Templates)

Là các quy trình được định sẵn, kết hợp nhiều loại công việc theo một trình tự cụ thể. Mỗi mẫu có thể ở một trong hai chế độ:

*   **Chế độ Nghiêm ngặt (Strict Mode):** Các công việc phải được hoàn thành theo đúng thứ tự.
*   **Chế độ Linh hoạt (Flexible Mode):** Các công việc có thể được hoàn thành không theo thứ tự, nhưng sẽ có cảnh báo.

### 3. Các Công việc của Phiếu sửa chữa (Service Ticket Tasks)

Là các phiên bản công việc được tạo ra khi một mẫu được áp dụng cho một phiếu sửa chữa. Mỗi công việc có một vòng đời trạng thái:

```
pending → in_progress → completed
   ↓            ↓
blocked      skipped
```

---

## Các tính năng

### Quản lý Mẫu công việc

*   **Quyền truy cập:** Admin, Manager.
*   **Khả năng:** Tạo, sửa (tạo phiên bản mới), và xóa các mẫu công việc.

### Thực thi Công việc

*   **Quyền truy cập:** Technician, Admin, Manager.
*   **Trang "Công việc của tôi":** Hiển thị tất cả các công việc được giao cho người dùng hiện tại.
*   **Hành động:** Bắt đầu, hoàn thành (yêu cầu ghi chú), hoặc chặn một công việc.

### Dashboard Tiến độ Công việc

*   **Quyền truy cập:** Admin, Manager.
*   **Số liệu:** Cung cấp cái nhìn tổng quan về các công việc đang hoạt động, bị chặn, và phân bổ công việc cho các kỹ thuật viên.

### Chuyển đổi Mẫu công việc Động

*   **Quyền truy cập:** Technician, Admin, Manager.
*   **Công dụng:** Cho phép thay đổi mẫu công việc giữa chừng nếu chẩn đoán ban đầu không chính xác. Các công việc đã hoàn thành sẽ được giữ lại.

---

## Quy trình làm việc của Người dùng

1.  **Tạo Mẫu công việc (Quản lý/Admin):** Tạo một quy trình mới bằng cách kết hợp các loại công việc có sẵn.
2.  **Áp dụng Mẫu cho Phiếu sửa chữa (Lễ tân/Kỹ thuật viên):** Khi tạo một phiếu sửa chữa, chọn một mẫu phù hợp. Các công việc sẽ được tự động tạo ra.
3.  **Thực thi Công việc (Kỹ thuật viên):** Trên trang "Công việc của tôi", bắt đầu và hoàn thành các công việc theo trình tự.
4.  **Giám sát Tiến độ (Quản lý/Admin):** Sử dụng dashboard để theo dõi hiệu suất và xác định các điểm nghẽn.

---

## Chi tiết Kỹ thuật

### Các bảng Cơ sở dữ liệu

*   **`task_types`:** Thư viện các định nghĩa công việc có thể tái sử dụng.
*   **`task_templates`:** Các định nghĩa quy trình làm việc.
*   **`task_templates_tasks`:** Bảng nối giữa loại công việc và mẫu.
*   **`service_ticket_tasks`:** Các phiên bản công việc cho các phiếu sửa chữa cụ thể.
*   **`ticket_template_changes`:** Lộ trình kiểm toán cho việc chuyển đổi mẫu.

### Các Thủ tục tRPC

*   **Router:** `workflow` (`/src/server/routers/workflow.ts`)
*   Bao gồm các thủ tục để quản lý loại công việc, mẫu công việc, thực thi công việc, và lấy dữ liệu cho dashboard.

**Task Type Procedures:**
- `taskType.list` - Lấy danh sách task types với filter tùy chọn
  - Input: `{ is_active?: boolean }` (optional)
  - `undefined`: Trả về tất cả task types
  - `true`: Chỉ trả về task types đang hoạt động
  - `false`: Chỉ trả về task types đã vô hiệu hóa
- `taskType.create` - Tạo task type mới (Admin/Manager only)
- `taskType.update` - Cập nhật task type (Admin/Manager only)
  - Validation: Ngăn chặn duplicate name
  - Validation: Kiểm tra task type tồn tại
- `taskType.toggleActive` - Kích hoạt/vô hiệu hóa task type (Admin/Manager only)
  - Validation: Ngăn chặn vô hiệu hóa nếu đang được sử dụng trong active templates
  - Trả về thông báo lỗi chi tiết với số lượng templates đang sử dụng

**Task Template Procedures:**
- `template.list` - Lấy danh sách templates theo product type và service type
- `template.create` - Tạo template mới
- `template.update` - Cập nhật template (tạo version mới)
- `template.delete` - Xóa template (nếu không được sử dụng)
- `template.switchTemplate` - Chuyển đổi template động với audit logging

**Task Execution Procedures:**
- `task.list` - Lấy danh sách tasks theo ticket
- `task.getById` - Lấy chi tiết task
- `task.start` - Bắt đầu thực hiện task
- `task.complete` - Hoàn thành task với notes/photos
- `task.updateStatus` - Cập nhật trạng thái task
- `task.listByTechnician` - Lấy tasks của kỹ thuật viên

**Task Analytics Procedures:**
- `task.getProgressSummary` - Tổng quan tiến độ tasks
- `task.getBlockedTasks` - Danh sách tasks bị chặn
- `task.getTechnicianWorkload` - Khối lượng công việc của kỹ thuật viên

---

## UI Components

### Task Type Form (`src/components/forms/task-type-form.tsx`)

Form component để tạo và chỉnh sửa task types với các tính năng:
- **Form Library**: React Hook Form với Zod validation
- **Validation Rules**:
  - Tên: 3-255 ký tự
  - Thời gian ước tính: số nguyên dương hoặc null
- **Categories Dropdown**: 7 danh mục được định nghĩa sẵn
- **Toggle Controls**: Switch components cho requires_notes, requires_photo, is_active
- **Bilingual**: Tất cả labels và messages bằng tiếng Việt

### Task Types Table (`src/components/tables/task-types-table.tsx`)

Data table hiển thị và quản lý task types theo UI_CODING_GUIDE.md:
- **Tabs System** (UI Guide Section 3):
  - Mobile: Select dropdown với 3 options (Tất cả/Đang hoạt động/Đã vô hiệu)
  - Desktop: TabsList với 3 tabs (breakpoint @4xl/main)
  - Filter động theo tab selection
- **TanStack React Table**: Sortable, filterable columns
- **Actions Menu**: Dropdown với Edit và Toggle options
- **Drawer Integration**: Hiển thị form trong drawer (mobile-responsive per UI Guide Section 6)
- **Search**: Tìm kiếm realtime theo tên và danh mục (max-w-sm per UI Guide)
- **Column Visibility**: Người dùng tùy chỉnh cột hiển thị
- **Status Badge**:
  - Active: variant="default" (xanh)
  - Inactive: variant="destructive" (đỏ)
- **Sticky Header**: bg-muted sticky top-0 z-10 (per UI Guide Section 4)
- **Pagination**: Full pagination controls với page size selector

### Custom Hooks (`src/hooks/use-workflow.ts`)

React hooks tích hợp với tRPC:
- `useTaskTypes(filters?)` - Query hook lấy danh sách task types
  - Parameter: `{ is_active?: boolean }` (optional)
  - Hỗ trợ filter theo trạng thái hoạt động
- `useCreateTaskType()` - Mutation hook tạo task type mới
- `useUpdateTaskType()` - Mutation hook cập nhật task type
- `useToggleTaskType()` - Mutation hook toggle active status

**Tính năng chung:**
- Automatic query invalidation sau mutations
- Toast notifications (100% tiếng Việt với hướng dẫn khắc phục)
- Loading states
- Error handling với actionable messages

---

## Cập nhật Gần Đây

**2025-10-27 (Commit a51cca7 - Morning):**
- ✅ Hoàn thành tính năng quản lý Task Type
- ✅ Thêm form tạo/chỉnh sửa với React Hook Form
- ✅ Implement update và toggle procedures với validation
- ✅ UI improvements: Drawer, DropdownMenu, Badge components
- ✅ Dependencies mới: `react-hook-form@^7.65.0`, `@hookform/resolvers@^5.2.2`
- ✅ 7 categories chuẩn hóa cho phân loại task types

**2025-10-27 (Afternoon - UI Enhancement & Filter Feature):**
- ✅ Enhanced `taskType.list` với optional `is_active` filter parameter
- ✅ Implemented Tabs system theo UI_CODING_GUIDE.md section 3
  - 3 tabs: Tất cả / Đang hoạt động / Đã vô hiệu
  - Responsive: Mobile Select ↔ Desktop TabsList (breakpoint @4xl/main)
- ✅ Fixed issue: Deactivated task types không còn biến mất
- ✅ Enhanced hook: `useTaskTypes(filters?)` hỗ trợ filter parameter
- ✅ 100% Vietnamese messages với actionable guidance
- ✅ Full compliance với UI_CODING_GUIDE.md:
  - Section 3: Tabs System ✓
  - Section 4: Tables ✓
  - Section 6: Drawers ✓
  - Section 9: Automation-friendly attributes ✓

**End of Task Workflow Feature Document**