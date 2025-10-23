# Yêu cầu: Hệ thống quy trình công việc

## Thông tin tài liệu

**ID Tài liệu**: REQ-TWS-001
**Phiên bản**: 1.0
**Ngày**: 2025-10-22
**Trạng thái**: Bản nháp
**Tài liệu liên quan**:
- REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md
- REQ_SERVICE_REQUEST_LAYER.md
- TASK_WORKFLOW_ARCHITECTURE.md

---

## Bối cảnh kinh doanh

### Mục đích

Hệ thống quy trình công việc chuyển đổi quy trình phiếu dịch vụ từ một tiến trình dựa trên trạng thái đơn giản sang một quy trình làm việc có cấu trúc, từng bước, đảm bảo tính nhất quán, trách nhiệm và kiểm soát chất lượng. Nó giải quyết nhu cầu về:

1.  **Quy trình dịch vụ được tiêu chuẩn hóa**: Đảm bảo mọi loại sản phẩm đều nhận được chất lượng dịch vụ nhất quán
2.  **Điều phối nhóm**: Phân công nhiệm vụ rõ ràng giúp tránh nhầm lẫn về việc ai làm gì
3.  **Theo dõi tiến độ**: Khả năng hiển thị chi tiết về tiến độ phiếu dịch vụ ngoài trạng thái đơn giản
4.  **Thích ứng động**: Chuyển đổi mẫu khi loại dịch vụ thay đổi (bảo hành → sửa chữa có tính phí)
5.  **Đảm bảo chất lượng**: Danh sách kiểm tra và các bước xác minh giúp giảm thiểu sai sót

### Các bên liên quan chính

-   **Kỹ thuật viên**: Thực hiện nhiệm vụ, cập nhật tiến độ, ghi lại kết quả
-   **Quản lý**: Giám sát việc tuân thủ quy trình làm việc, xác định các điểm nghẽn
-   **Nhân viên lễ tân**: Hiểu tiến độ dịch vụ khi khách hàng hỏi
-   **Khách hàng**: Hưởng lợi từ việc cung cấp dịch vụ nhất quán, chất lượng cao

### Giá trị kinh doanh

-   **Giảm sai sót**: Danh sách kiểm tra đảm bảo không bỏ qua bước nào
-   **Đào tạo nhanh hơn**: Kỹ thuật viên mới tuân theo các quy trình làm việc rõ ràng
-   **Ước tính tốt hơn**: Dữ liệu nhiệm vụ lịch sử cải thiện dự đoán thời gian
-   **Tuân thủ kiểm toán**: Lịch sử nhiệm vụ hoàn chỉnh cho các yêu cầu bảo hành
-   **Tối ưu hóa quy trình**: Xác định các bước mất nhiều thời gian nhất

---

## Yêu cầu chức năng

### FR-TWS-001: Quản lý mẫu công việc

**Mô tả**: Hệ thống cung cấp các mẫu công việc được xác định trước cho các tình huống dịch vụ khác nhau mà quản trị viên có thể tùy chỉnh.

**Các loại mẫu**:
1.  **Theo loại bảo hành**: Dịch vụ bảo hành, Sửa chữa có tính phí, Thay thế
2.  **Theo loại sản phẩm**: iPhone, MacBook, iPad, v.v.
3.  **Theo độ phức tạp của dịch vụ**: Tiêu chuẩn, Phức tạp, Nhanh

**Quy tắc kinh doanh**:
-   Mỗi loại sản phẩm có thể có nhiều mẫu (một mẫu cho mỗi loại bảo hành)
-   Các mẫu chứa danh sách các nhiệm vụ được sắp xếp theo thứ tự
-   Các nhiệm vụ có: tên, mô tả, thời gian ước tính, vai trò người được giao mặc định
-   Các mẫu có thể hoạt động/không hoạt động (phiên bản)
-   Chỉ vai trò Quản trị viên mới có thể tạo/chỉnh sửa mẫu

**Câu chuyện người dùng**:
```
LÀ một quản trị viên
TÔI MUỐN xác định các quy trình công việc tiêu chuẩn cho các loại dịch vụ khác nhau
ĐỂ tất cả các kỹ thuật viên tuân theo các quy trình nhất quán
```

**Tiêu chí chấp nhận**:
- [ ] Trình chỉnh sửa mẫu với tính năng sắp xếp nhiệm vụ kéo và thả
- [ ] Thư viện nhiệm vụ: các định nghĩa nhiệm vụ có thể tái sử dụng
- [ ] Gán mẫu cho các loại sản phẩm
- [ ] Lịch sử phiên bản cho các thay đổi mẫu
- [ ] Xem trước mẫu trước khi kích hoạt
- [ ] Sao chép mẫu hiện có để tạo các biến thể

**Cấu trúc mẫu**:
```typescript
interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  product_type_id: string;
  service_type: 'warranty' | 'paid' | 'replacement';
  status: 'active' | 'inactive';
  version: number;

  tasks: TemplateTask[];

  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface TemplateTask {
  sequence_order: number; // 1, 2, 3, v.v.
  task_type_id: string; // Tham chiếu đến bảng task_types
  is_required: boolean;
  estimated_duration_minutes: number;
  default_assignee_role: 'technician' | 'manager' | 'reception';
  dependencies?: string[]; // ID nhiệm vụ phải hoàn thành trước
}
```

---

### FR-TWS-002: Thư viện loại công việc mặc định

**Mô tả**: Hệ thống cung cấp một thư viện được cấu hình sẵn các loại công việc phổ biến, đóng vai trò là các khối xây dựng cho các mẫu.

**Các loại công việc mặc định** (Ví dụ):

| Danh mục | Loại công việc | Mô tả | Thời lượng điển hình |
|---|---|---|---|
| **Tiếp nhận** | Kiểm tra ban đầu | Kiểm tra trực quan, ghi lại hư hỏng | 10 phút |
| **Tiếp nhận** | Xác minh sê-ri | Xác minh sê-ri khớp với hồ sơ | 5 phút |
| **Chẩn đoán** | Chạy kiểm tra chẩn đoán | Thực hiện bộ chẩn đoán tiêu chuẩn | 30 phút |
| **Chẩn đoán** | Xác định nguyên nhân gốc | Xác định lý do hỏng hóc | 20 phút |
| **Chẩn đoán** | Chuẩn bị ước tính chi phí | Tính toán chi phí sửa chữa | 15 phút |
| **Phê duyệt** | Chờ khách hàng phê duyệt | Trạng thái chờ quyết định của khách hàng | N/A |
| **Sửa chữa** | Thay thế linh kiện | Thay thế linh kiện vật lý | 45 phút |
| **Sửa chữa** | Khôi phục phần mềm | Cài đặt lại HĐH, cập nhật | 60 phút |
| **Sửa chữa** | Hiệu chuẩn & Kiểm tra | Hiệu chuẩn sau sửa chữa | 20 phút |
| **QA** | Kiểm tra chất lượng | Xác minh sửa chữa đáp ứng tiêu chuẩn | 15 phút |
| **QA** | Kiểm tra cuối cùng | Kiểm tra chức năng toàn diện | 30 phút |
| **Đóng** | Vệ sinh thiết bị | Vệ sinh vật lý trước khi trả lại | 10 phút |
| **Đóng** | Đóng gói để giao hàng | Chuẩn bị cho khách hàng nhận | 5 phút |
| **Đóng** | Cập nhật kho | Ghi lại các bộ phận đã sử dụng | 10 phút |

**Quy tắc kinh doanh**:
-   Quản trị viên có thể thêm các loại công việc tùy chỉnh
-   Các loại công việc có thể được phân loại (thẻ)
-   Chỉ xóa nếu không được sử dụng trong bất kỳ mẫu hoạt động nào
-   Mỗi loại công việc có ước tính thời lượng mặc định

**Câu chuyện người dùng**:
```
LÀ một quản trị viên
TÔI MUỐN một thư viện các loại công việc tiêu chuẩn
ĐỂ TÔI có thể nhanh chóng xây dựng các mẫu mà không cần tạo lại các nhiệm vụ phổ biến
```

**Tiêu chí chấp nhận**:
- [ ] Giao diện CRUD loại công việc (Chỉ quản trị viên)
- [ ] Hệ thống phân loại/gắn thẻ
- [ ] Tìm kiếm và lọc các loại công việc
- [ ] Theo dõi việc sử dụng (có bao nhiêu mẫu sử dụng mỗi loại)
- [ ] Không thể xóa các loại công việc đang được sử dụng

---

### FR-TWS-003: Tự động tạo công việc khi tạo phiếu dịch vụ

**Mô tả**: Khi một phiếu dịch vụ được tạo, hệ thống sẽ tự động tạo các công việc dựa trên mẫu thích hợp.

**Logic lựa chọn mẫu**:
```
1. Xác định loại sản phẩm từ phiếu dịch vụ
2. Xác định loại dịch vụ:
   - NẾU bảo hành hợp lệ → mẫu "bảo hành"
   - NẾU thay thế được phê duyệt → mẫu "thay thế"
   - KHÁC → mẫu "có tính phí"
3. Tải mẫu cho (loại_sản_phẩm + loại_dịch_vụ)
4. Tạo các phiên bản công việc từ mẫu
5. Giao cho các kỹ thuật viên mặc định dựa trên vai trò
```

**Quy tắc kinh doanh**:
-   Việc tạo công việc diễn ra đồng thời với việc tạo phiếu dịch vụ
-   Mỗi công việc có ID duy nhất, được liên kết với ticket_id
-   Trạng thái ban đầu: `pending` (ngoại trừ công việc đầu tiên có thể là `in_progress`)
-   Thứ tự được giữ nguyên từ mẫu
-   Người được giao mặc định có thể bị nhân viên lễ tân ghi đè

**Câu chuyện người dùng**:
```
LÀ một nhân viên lễ tân
TÔI MUỐN các công việc được tạo tự động khi tôi tạo một phiếu dịch vụ
ĐỂ TÔI không phải thiết lập quy trình làm việc theo cách thủ công
```

**Tiêu chí chấp nhận**:
- [ ] Các công việc được tạo trong một giao dịch cơ sở dữ liệu duy nhất với phiếu dịch vụ
- [ ] Mẫu chính xác được chọn dựa trên loại sản phẩm + dịch vụ
- [ ] Các công việc được sắp xếp theo sequence_order
- [ ] Các phân công mặc định được điền
- [ ] Số lượng công việc được hiển thị trên tóm tắt phiếu dịch vụ

**Triển khai SQL**:
```sql
-- Hàm kích hoạt để tự động tạo công việc
CREATE OR REPLACE FUNCTION generate_ticket_tasks()
RETURNS TRIGGER AS $$
DECLARE
  template_id UUID;
  task_template RECORD;
BEGIN
  -- Tìm mẫu thích hợp
  SELECT id INTO template_id
  FROM task_templates
  WHERE product_type_id = NEW.product_id
    AND service_type = NEW.service_type
    AND status = 'active'
  ORDER BY version DESC
  LIMIT 1;

  -- Nếu không tìm thấy mẫu, bỏ qua việc tạo công việc
  IF template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Tạo công việc từ mẫu
  INSERT INTO service_ticket_tasks (
    ticket_id,
    task_type_id,
    sequence_order,
    status,
    assigned_to,
    estimated_duration_minutes
  )
  SELECT
    NEW.id,
    tt.task_type_id,
    tt.sequence_order,
    'pending',
    get_default_assignee(tt.default_assignee_role, NEW.id),
    tt.estimated_duration_minutes
  FROM task_templates_tasks tt
  WHERE tt.template_id = template_id
  ORDER BY tt.sequence_order;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_tasks
  AFTER INSERT ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_tasks();
```

---

### FR-TWS-004: Phân công và quyền sở hữu công việc

**Mô tả**: Mỗi công việc được giao cho một thành viên nhóm cụ thể, người chịu trách nhiệm hoàn thành nó.

**Quy tắc phân công**:
-   **Phân công mặc định**: Dựa trên vai trò người được giao mặc định của mẫu
-   **Ghi đè thủ công**: Quản lý/lễ tân có thể phân công lại công việc
-   **Tự phân công**: Kỹ thuật viên có thể nhận các công việc chưa được phân công
-   **Phân công lại**: Các công việc có thể được phân công lại nếu người được giao không có mặt

**Trạng thái phân công**:
-   **Chưa được phân công**: Không có người cụ thể (hiển thị là "Nhóm kỹ thuật viên")
-   **Đã được phân công**: Người cụ thể được phân công
-   **Đã nhận**: Kỹ thuật viên đã nhận từ nhóm chưa được phân công

**Quy tắc kinh doanh**:
-   Không thể giao cho người dùng có vai trò không tương thích
-   Thay đổi phân công được ghi lại trong lịch sử công việc
-   Thông báo được gửi đến kỹ thuật viên mới được phân công
-   Cân bằng khối lượng công việc: hiển thị số lượng công việc cho mỗi kỹ thuật viên

**Câu chuyện người dùng**:
```
LÀ một người quản lý
TÔI MUỐN giao công việc cho các kỹ thuật viên cụ thể
ĐỂ TÔI có thể cân bằng khối lượng công việc và tận dụng các kỹ năng chuyên môn
```

**Tiêu chí chấp nhận**:
- [ ] Giao/phân công lại công việc cho thành viên nhóm
- [ ] Lọc công việc theo người được giao
- [ ] Xem khối lượng công việc của kỹ thuật viên (số lượng công việc đang mở)
- [ ] Lịch sử phân công trong nhật ký kiểm toán
- [ ] Email/thông báo khi phân công

---

### FR-TWS-005: Vòng đời trạng thái công việc

**Mô tả**: Các công việc tiến triển qua các trạng thái được xác định từ khi tạo đến khi hoàn thành.

**Định nghĩa trạng thái**:

| Trạng thái | Mô tả | Có thể chỉnh sửa? | Trạng thái tiếp theo |
|---|---|---|---|
| `pending` | Chưa bắt đầu | Không | `in_progress`, `blocked`, `cancelled` |
| `in_progress` | Đang được thực hiện tích cực | Có | `completed`, `blocked`, `pending` |
| `blocked` | Không thể tiếp tục do phụ thuộc/sự cố | Có | `in_progress`, `cancelled` |
| `completed` | Đã hoàn thành thành công | Không | N/A (kết thúc) |
| `cancelled` | Bỏ qua hoặc không còn cần thiết | Không | N/A (kết thúc) |

**Quy tắc kinh doanh**:
-   Chỉ kỹ thuật viên được giao mới có thể thay đổi trạng thái công việc
-   Quản lý có thể ghi đè (được ghi lại trong nhật ký kiểm toán)
-   Trạng thái `completed` yêu cầu ghi chú hoàn thành
-   Trạng thái `blocked` yêu cầu mô tả về người chặn
-   Không thể đánh dấu công việc là đã hoàn thành nếu các công việc tiền nhiệm bắt buộc chưa hoàn thành

**Câu chuyện người dùng**:
```
LÀ một kỹ thuật viên
TÔI MUỐN cập nhật trạng thái công việc khi tôi làm việc
ĐỂ mọi người đều biết tiến độ hiện tại
```

**Tiêu chí chấp nhận**:
- [ ] Cập nhật trạng thái bằng một cú nhấp chuột (hành động nhanh)
- [ ] Các trường bắt buộc dựa trên trạng thái (ví dụ: ghi chú để hoàn thành)
- [ ] Các chỉ báo trạng thái trực quan (màu sắc, biểu tượng)
- [ ] Theo dõi dấu thời gian cho mỗi thay đổi trạng thái
- [ ] Xác thực ngăn chặn các chuyển đổi trạng thái không hợp lệ

**Xác thực chuyển đổi trạng thái**:
```typescript
// Các chuyển đổi được phép
const VALID_TRANSITIONS = {
  pending: ['in_progress', 'blocked', 'cancelled'],
  in_progress: ['completed', 'blocked', 'pending'],
  blocked: ['in_progress', 'cancelled'],
  completed: [], // Trạng thái kết thúc
  cancelled: []  // Trạng thái kết thúc
};

function validateStatusTransition(oldStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[oldStatus]?.includes(newStatus) ?? false;
}
```

---

### FR-TWS-006: Phụ thuộc công việc đơn giản (Thứ tự)

**Mô tả**: Các công việc được sắp xếp theo thứ tự, với việc thực thi nghiêm ngặt tùy chọn về thứ tự hoàn thành.

**Mô hình phụ thuộc**: **Thứ tự (Đơn giản)**
-   Các công việc được đánh số 1, 2, 3, v.v.
-   Biểu diễn trực quan hiển thị các công việc theo thứ tự
-   Xác thực tùy chọn: Không thể bắt đầu công việc N trước khi công việc N-1 hoàn thành

**Quy tắc kinh doanh**:
-   **Chế độ nghiêm ngặt** (có thể cấu hình cho mỗi mẫu):
    -   Phải hoàn thành các công việc theo thứ tự
    -   Trạng thái công việc bị kiểm soát bởi việc hoàn thành công việc trước đó
    -   Được sử dụng cho các quy trình làm việc quan trọng (ví dụ: dịch vụ bảo hành)

-   **Chế độ linh hoạt** (mặc định):
    -   Các công việc có thể được hoàn thành theo bất kỳ thứ tự nào
    -   Thứ tự là hướng dẫn, không phải là sự thực thi
    -   Được sử dụng cho các sửa chữa thông thường

**Câu chuyện người dùng**:
```
LÀ một kỹ thuật viên
TÔI MUỐN xem các công việc theo thứ tự được đề xuất
ĐỂ TÔI tuân theo các phương pháp hay nhất nhưng có thể thích ứng nếu cần
```

**Tiêu chí chấp nhận**:
- [ ] Các công việc được hiển thị theo sequence_order
- [ ] Chỉ báo trực quan về vị trí hiện tại trong quy trình làm việc
- [ ] Cảnh báo (không chặn) nếu bỏ qua các công việc ở chế độ linh hoạt
- [ ] Chặn cứng ở chế độ nghiêm ngặt
- [ ] Cài đặt mẫu kiểm soát chế độ nghiêm ngặt và linh hoạt

**Triển khai**:
```sql
-- Kiểm tra xem công việc trước đó đã hoàn thành chưa (chế độ nghiêm ngặt)
CREATE OR REPLACE FUNCTION check_task_sequence_gate()
RETURNS TRIGGER AS $$
DECLARE
  template_strict_mode BOOLEAN;
  previous_task_completed BOOLEAN;
BEGIN
  -- Chỉ kiểm tra nếu đánh dấu công việc là đang tiến hành hoặc đã hoàn thành
  IF NEW.status NOT IN ('in_progress', 'completed') THEN
    RETURN NEW;
  END IF;

  -- Kiểm tra xem mẫu có bật chế độ nghiêm ngặt không
  SELECT tt.enforce_strict_order INTO template_strict_mode
  FROM service_tickets st
  JOIN task_templates tt ON tt.id = st.template_id
  WHERE st.id = NEW.ticket_id;

  -- Bỏ qua nếu không phải chế độ nghiêm ngặt
  IF NOT template_strict_mode THEN
    RETURN NEW;
  END IF;

  -- Kiểm tra xem công việc trước đó đã hoàn thành chưa
  SELECT EXISTS (
    SELECT 1
    FROM service_ticket_tasks
    WHERE ticket_id = NEW.ticket_id
      AND sequence_order = NEW.sequence_order - 1
      AND status = 'completed'
  ) INTO previous_task_completed;

  -- Nếu công việc trước đó chưa hoàn thành, chặn
  IF NEW.sequence_order > 1 AND NOT previous_task_completed THEN
    RAISE EXCEPTION 'Không thể bắt đầu công việc % trước khi hoàn thành công việc %',
      NEW.sequence_order, NEW.sequence_order - 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_task_sequence
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_sequence_gate();
```

---

### FR-TWS-007: Chuyển đổi mẫu động (Bảo tồn + Nối thêm)

**Mô tả**: Khi loại dịch vụ thay đổi trong vòng đời của phiếu dịch vụ (ví dụ: bảo hành → sửa chữa có tính phí), hệ thống sẽ cập nhật danh sách công việc một cách thông minh.

**Các kịch bản kích hoạt**:
1.  Xác thực bảo hành không thành công trong quá trình chẩn đoán
2.  Khách hàng từ chối dịch vụ bảo hành, chọn sửa chữa có tính phí
3.  Thay thế được phê duyệt thay đổi thành quy trình làm việc thay thế

**Hành vi chuyển đổi**: **Bảo tồn + Nối thêm**

```
TRƯỚC (Mẫu bảo hành):
1. ✅ Kiểm tra ban đầu (đã hoàn thành)
2. ✅ Chạy kiểm tra chẩn đoán (đã hoàn thành)
3. ⏳ Xác định nguyên nhân gốc (đang tiến hành)
4. ⏸️ Chuẩn bị ước tính chi phí (đang chờ xử lý)
5. ⏸️ Thay thế linh kiện (đang chờ xử lý)
6. ⏸️ Kiểm tra chất lượng (đang chờ xử lý)

SAU KHI CHUYỂN ĐỔI (sang Mẫu sửa chữa có tính phí):
1. ✅ Kiểm tra ban đầu (được bảo tồn - đã hoàn thành)
2. ✅ Chạy kiểm tra chẩn đoán (được bảo tồn - đã hoàn thành)
3. ⏳ Xác định nguyên nhân gốc (được bảo tồn - đang tiến hành)
4. ⏸️ Chuẩn bị ước tính chi phí (được bảo tồn - đang chờ xử lý)
5. ⏸️ Chờ khách hàng phê duyệt (MỚI - được nối thêm)
6. ⏸️ Thay thế linh kiện (được bảo tồn - đang chờ xử lý)
7. ⏸️ Xử lý thanh toán (MỚI - được nối thêm)
8. ⏸️ Kiểm tra chất lượng (được bảo tồn - đang chờ xử lý)
```

**Logic**:
1.  Giữ lại tất cả các công việc đã hoàn thành (hồ sơ lịch sử)
2.  Giữ lại tất cả các công việc đang tiến hành (không làm gián đoạn công việc hiện tại)
3.  Xóa các công việc đang chờ xử lý không có trong mẫu mới
4.  Thêm các công việc mới từ mẫu mới không tồn tại
5.  Sắp xếp lại tất cả các công việc để duy trì thứ tự

**Quy tắc kinh doanh**:
-   Chuyển đổi mẫu được ghi lại trong lịch sử phiếu dịch vụ
-   Các công việc đã hoàn thành không bao giờ bị xóa (dấu vết kiểm toán)
-   Người được giao được bảo tồn nếu có thể
-   Yêu cầu phê duyệt của người quản lý để chuyển đổi mẫu
-   Khách hàng được thông báo nếu yêu cầu phê duyệt thay đổi

**Câu chuyện người dùng**:
```
LÀ một kỹ thuật viên
TÔI MUỐN danh sách công việc được cập nhật khi loại dịch vụ thay đổi
ĐỂ TÔI không tuân theo các bước quy trình làm việc đã lỗi thời
```

**Tiêu chí chấp nhận**:
- [ ] Người quản lý có thể kích hoạt chuyển đổi mẫu
- [ ] Hộp thoại xác nhận hiển thị những gì sẽ thay đổi
- [ ] Các công việc đã hoàn thành/đang tiến hành được bảo tồn
- [ ] Các công việc bắt buộc mới được thêm vào
- [ ] Thông báo được gửi đến các kỹ thuật viên được giao
- [ ] Nhật ký kiểm toán ghi lại lý do chuyển đổi

**Triển khai**:
```typescript
async function switchTemplate(
  ticketId: string,
  newTemplateId: string,
  reason: string,
  switchedBy: string
) {
  // 1. Lấy các công việc hiện tại
  const currentTasks = await db.query(`
    SELECT * FROM service_ticket_tasks
    WHERE ticket_id = $1
    ORDER BY sequence_order
  `, [ticketId]);

  // 2. Lấy các công việc của mẫu mới
  const newTemplateTasks = await db.query(`
    SELECT * FROM task_templates_tasks
    WHERE template_id = $1
    ORDER BY sequence_order
  `, [newTemplateId]);

  // 3. Bảo tồn các công việc đã hoàn thành và đang tiến hành
  const preservedTasks = currentTasks.filter(t =>
    ['completed', 'in_progress'].includes(t.status)
  );

  // 4. Xác định các công việc mới cần thêm
  const preservedTaskTypeIds = preservedTasks.map(t => t.task_type_id);
  const newTasks = newTemplateTasks.filter(tt =>
    !preservedTaskTypeIds.includes(tt.task_type_id)
  );

  // 5. Xóa các công việc đang chờ xử lý không có trong mẫu mới
  await db.query(`
    DELETE FROM service_ticket_tasks
    WHERE ticket_id = $1 AND status = 'pending'
  `, [ticketId]);

  // 6. Chèn các công việc mới
  for (const newTask of newTasks) {
    await db.query(`
      INSERT INTO service_ticket_tasks (
        ticket_id, task_type_id, sequence_order,
        status, estimated_duration_minutes
      ) VALUES ($1, $2, $3, 'pending', $4)
    `, [ticketId, newTask.task_type_id, newTask.sequence_order, newTask.estimated_duration_minutes]);
  }

  // 7. Sắp xếp lại tất cả các công việc
  await resequenceTasks(ticketId);

  // 8. Ghi lại việc chuyển đổi mẫu
  await db.query(`
    INSERT INTO ticket_template_changes (
      ticket_id, old_template_id, new_template_id,
      reason, changed_by, changed_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
  `, [ticketId, oldTemplateId, newTemplateId, reason, switchedBy]);
}
```

---

### FR-TWS-008: Hành động hoàn thành công việc (Cập nhật phiếu dịch vụ)

**Mô tả**: Việc hoàn thành một số công việc nhất định sẽ kích hoạt các cập nhật tự động cho phiếu dịch vụ mẹ.

**Hành vi hoàn thành công việc**:

| Loại công việc | Hành động cập nhật phiếu dịch vụ |
|---|---|
| **Chạy kiểm tra chẩn đoán** | Đặt ticket.diagnosis_notes |
| **Chuẩn bị ước tính chi phí** | Đặt ticket.diagnosis_fee, ticket.service_fee |
| **Chờ khách hàng phê duyệt** | Thay đổi trạng thái phiếu dịch vụ thành `awaiting_approval` |
| **Thay thế linh kiện** | Thêm mục vào service_ticket_parts |
| **Kiểm tra cuối cùng** | Đặt ticket.completion_notes |
| **Kiểm tra chất lượng** | Thay đổi trạng thái phiếu dịch vụ thành `completed` (nếu là công việc cuối cùng) |
| **Đóng gói để giao hàng** | Thay đổi trạng thái phiếu dịch vụ thành `awaiting_customer_confirmation` |

**Quy tắc kinh doanh**:
-   Việc hoàn thành công việc có thể kích hoạt thay đổi trạng thái phiếu dịch vụ
-   Việc hoàn thành công việc có thể điền vào các trường phiếu dịch vụ
-   Việc hoàn thành công việc có thể tạo các bản ghi liên quan (sử dụng bộ phận)
-   Nếu công việc bắt buộc cuối cùng được hoàn thành → phiếu dịch vụ tự động chuyển sang giai đoạn tiếp theo

**Câu chuyện người dùng**:
```
LÀ một kỹ thuật viên
TÔI MUỐN việc hoàn thành công việc của mình cập nhật phiếu dịch vụ một cách tự động
ĐỂ TÔI không phải đồng bộ hóa thông tin theo cách thủ công
```

**Tiêu chí chấp nhận**:
- [ ] Biểu mẫu hoàn thành công việc bao gồm các trường phiếu dịch vụ có liên quan
- [ ] Các cập nhật phiếu dịch vụ diễn ra đồng thời với việc hoàn thành công việc
- [ ] Xác thực đảm bảo dữ liệu bắt buộc được cung cấp
- [ ] Nhật ký kiểm toán theo dõi những gì đã thay đổi và tại sao
- [ ] Tiến trình trạng thái tự động khi quy trình làm việc hoàn tất

**Luồng ví dụ**:
```
Kỹ thuật viên hoàn thành công việc "Chuẩn bị ước tính chi phí":
1. Trạng thái công việc → đã hoàn thành
2. Kỹ thuật viên nhập:
   - Ghi chú chẩn đoán: "Hư hỏng do nước, ăn mòn bo mạch chủ"
   - Phí chẩn đoán: 100.000 VNĐ
   - Phí dịch vụ: 500.000 VNĐ
   - Các bộ phận cần thiết: [{"name": "Pin", "cost": 200000}]
3. Hệ thống cập nhật phiếu dịch vụ:
   - ticket.diagnosis_notes = "Hư hỏng do nước..."
   - ticket.diagnosis_fee = 100000
   - ticket.service_fee = 500000
4. Hệ thống chuyển sang công việc tiếp theo: "Chờ khách hàng phê duyệt"
5. Hệ thống thay đổi ticket.status = 'awaiting_approval'
6. Hệ thống gửi email cho khách hàng với yêu cầu phê duyệt
```

---

### FR-TWS-009: Khả năng hiển thị tiến độ công việc

**Mô tả**: Kỹ thuật viên, người quản lý và khách hàng có thể xem tiến độ công việc ở các mức độ chi tiết khác nhau.

**Các mức độ hiển thị**:

**Chế độ xem của kỹ thuật viên**:
-   Tất cả các công việc cho các phiếu dịch vụ được giao
-   Mô tả công việc chi tiết và danh sách kiểm tra
-   Chỉnh sửa trạng thái và ghi chú công việc
-   Xem lịch sử công việc (ai đã làm gì, khi nào)

**Chế độ xem của người quản lý**:
-   Tất cả các công việc trên tất cả các phiếu dịch vụ
-   Lọc theo: trạng thái, người được giao, quá hạn, bị chặn
-   Bảng điều khiển khối lượng công việc (công việc cho mỗi kỹ thuật viên)
-   Ghi đè phân công công việc

**Chế độ xem của khách hàng** (qua cổng thông tin công khai):
-   Tiến độ cấp cao (ví dụ: "Bước 3/8: Đang chẩn đoán")
-   Tên công việc được đơn giản hóa (loại bỏ thuật ngữ kỹ thuật)
-   Không có tên người được giao (quyền riêng tư)
-   Ước tính hoàn thành dựa trên tiến độ công việc

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN xem tiến độ chi tiết trên phiếu dịch vụ của mình
ĐỂ TÔI biết thiết bị của mình đang ở giai đoạn nào
```

**Tiêu chí chấp nhận**:
- [ ] Bảng điều khiển của kỹ thuật viên hiển thị danh sách "Công việc của tôi"
- [ ] Bảng điều khiển của người quản lý hiển thị tổng quan về công việc trên toàn nhóm
- [ ] Trang theo dõi của khách hàng hiển thị tiến độ công việc được đơn giản hóa
- [ ] Trực quan hóa thanh tiến trình (X trong số Y công việc đã hoàn thành)
- [ ] Cập nhật thời gian thực (không cần làm mới trang)

**Nhãn công việc hướng tới khách hàng**:
```typescript
// Tên công việc nội bộ → Nhãn thân thiện với khách hàng
const CUSTOMER_LABELS = {
  'Run Diagnostic Tests': 'Đang chẩn đoán thiết bị của bạn',
  'Identify Root Cause': 'Đang chẩn đoán thiết bị của bạn',
  'Prepare Cost Estimate': 'Đang chuẩn bị ước tính sửa chữa',
  'Await Customer Approval': 'Đang chờ bạn phê duyệt',
  'Replace Component': 'Đang sửa chữa thiết bị của bạn',
  'Software Restore': 'Đang sửa chữa thiết bị của bạn',
  'Quality Check': 'Kiểm tra chất lượng cuối cùng',
  'Final Testing': 'Kiểm tra chất lượng cuối cùng',
  'Package for Delivery': 'Đang chuẩn bị để trả lại'
};
```

---

### FR-TWS-010: Theo dõi thời gian công việc

**Mô tả**: Hệ thống theo dõi thời gian thực tế dành cho các công việc so với thời gian ước tính để cải thiện quy trình.

**Các chỉ số được theo dõi**:
-   **Thời lượng ước tính**: Từ mẫu (cơ sở)
-   **Thời lượng thực tế**: Thời gian bắt đầu → thời gian hoàn thành
-   **Thời gian làm việc tích cực**: Theo dõi thủ công tùy chọn (bộ đếm thời gian)
-   **Thời gian chờ**: Thời gian công việc ở trạng thái `blocked`

**Quy tắc kinh doanh**:
-   Thời gian bắt đầu được ghi lại khi trạng thái → `in_progress`
-   Thời gian kết thúc được ghi lại khi trạng thái → `completed`
-   Thời lượng thực tế = thời gian kết thúc - thời gian bắt đầu (đã trôi qua, không phải công việc tích cực)
-   Dữ liệu lịch sử được sử dụng để cải thiện các ước tính của mẫu

**Câu chuyện người dùng**:
```
LÀ một người quản lý
TÔI MUỐN xem thời gian thực tế dành cho các công việc so với các ước tính
ĐỂ TÔI có thể cải thiện các ước tính thời gian trong tương lai và xác định các điểm nghẽn
```

**Tiêu chí chấp nhận**:
- [ ] Theo dõi thời gian bắt đầu/kết thúc tự động
- [ ] Bộ đếm thời gian thủ công tùy chọn để theo dõi công việc tích cực
- [ ] Bảng điều khiển phân tích công việc hiển thị thời gian trung bình cho mỗi loại công việc
- [ ] Xác định các công việc liên tục vượt quá ước tính
- [ ] Xuất dữ liệu thời gian công việc để phân tích

**Truy vấn phân tích**:
```sql
-- Thời lượng thực tế trung bình so với thời lượng ước tính theo loại công việc
SELECT
  tt.name AS task_type,
  AVG(EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 60) AS avg_actual_minutes,
  AVG(stt.estimated_duration_minutes) AS avg_estimated_minutes,
  COUNT(*) AS sample_size
FROM service_ticket_tasks stt
JOIN task_types tt ON stt.task_type_id = tt.id
WHERE stt.status = 'completed'
  AND stt.started_at IS NOT NULL
GROUP BY tt.id, tt.name
ORDER BY avg_actual_minutes DESC;
```

---

## Mô hình dữ liệu

### Bảng mẫu công việc

```sql
CREATE TABLE task_templates (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Siêu dữ liệu mẫu
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Khả năng áp dụng mẫu
  product_type_id UUID REFERENCES products(id),
  service_type VARCHAR(20) NOT NULL
    CHECK (service_type IN ('warranty', 'paid', 'replacement')),

  -- Cấu hình
  enforce_strict_order BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'draft')),

  -- Kiểm toán
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Ràng buộc duy nhất: một mẫu hoạt động cho mỗi loại sản phẩm + dịch vụ
  CONSTRAINT unique_active_template
    UNIQUE (product_type_id, service_type, status)
    WHERE status = 'active'
);

-- Chỉ mục
CREATE INDEX idx_task_templates_product ON task_templates(product_type_id);
CREATE INDEX idx_task_templates_status ON task_templates(status);
```

---

### Bảng loại công việc (Thư viện)

```sql
CREATE TABLE task_types (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Định nghĩa loại công việc
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- 'intake', 'diagnosis', 'repair', 'qa', 'closing'

  -- Cài đặt mặc định
  default_duration_minutes INT DEFAULT 30,
  is_system_defined BOOLEAN DEFAULT false, -- Không thể xóa nếu đúng

  -- Kiểm toán
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Chỉ mục
CREATE INDEX idx_task_types_category ON task_types(category);
CREATE INDEX idx_task_types_name ON task_types(name);
```

---

### Bảng nối mẫu công việc

```sql
CREATE TABLE task_templates_tasks (
  -- Khóa chính tổng hợp
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id),

  -- Sắp xếp
  sequence_order INT NOT NULL,

  -- Cấu hình công việc trong mẫu
  is_required BOOLEAN DEFAULT true,
  estimated_duration_minutes INT,
  default_assignee_role VARCHAR(20)
    CHECK (default_assignee_role IN ('technician', 'manager', 'reception', 'any')),

  -- Phụ thuộc tùy chọn (cho các quy trình làm việc phức tạp trong tương lai)
  depends_on_task_type_ids UUID[], -- Mảng các task_type_ids

  -- Kiểm toán
  created_at TIMESTAMP DEFAULT now(),

  PRIMARY KEY (template_id, task_type_id),
  CONSTRAINT unique_sequence_per_template
    UNIQUE (template_id, sequence_order)
);

-- Chỉ mục
CREATE INDEX idx_template_tasks_template ON task_templates_tasks(template_id);
CREATE INDEX idx_template_tasks_order ON task_templates_tasks(template_id, sequence_order);
```

---

### Bảng công việc phiếu dịch vụ

```sql
CREATE TABLE service_ticket_tasks (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Mối quan hệ
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id),

  -- Sắp xếp và trạng thái
  sequence_order INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'cancelled')),

  -- Phân công
  assigned_to UUID REFERENCES profiles(id),

  -- Theo dõi thời gian
  estimated_duration_minutes INT,
  started_at TIMESTAMP, -- Khi trạng thái → in_progress
  completed_at TIMESTAMP, -- Khi trạng thái → completed
  blocked_at TIMESTAMP, -- Khi trạng thái → blocked

  -- Dữ liệu công việc
  notes TEXT, -- Ghi chú của kỹ thuật viên trong quá trình làm việc
  completion_notes TEXT, -- Ghi chú bắt buộc khi hoàn thành
  blocker_description TEXT, -- Bắt buộc nếu trạng thái = blocked

  -- Dữ liệu kết quả (thay đổi theo loại công việc)
  result_data JSONB, -- Lưu trữ linh hoạt cho các đầu ra dành riêng cho công việc

  -- Kiểm toán
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT unique_sequence_per_ticket
    UNIQUE (ticket_id, sequence_order)
);

-- Chỉ mục
CREATE INDEX idx_ticket_tasks_ticket ON service_ticket_tasks(ticket_id, sequence_order);
CREATE INDEX idx_ticket_tasks_assignee ON service_ticket_tasks(assigned_to, status);
CREATE INDEX idx_ticket_tasks_status ON service_ticket_tasks(status);
CREATE INDEX idx_ticket_tasks_type ON service_ticket_tasks(task_type_id);

-- Tự động cập nhật dấu thời gian
CREATE TRIGGER update_ticket_tasks_timestamps
  BEFORE UPDATE ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tự động đặt started_at khi trạng thái → in_progress
CREATE TRIGGER set_task_started_at
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'in_progress' AND OLD.status != 'in_progress')
  EXECUTE FUNCTION set_started_timestamp();

-- Tự động đặt completed_at khi trạng thái → completed
CREATE TRIGGER set_task_completed_at
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION set_completed_timestamp();
```

---

### Bảng lịch sử công việc (Nhật ký kiểm toán)

```sql
CREATE TABLE task_history (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bối cảnh
  task_id UUID NOT NULL REFERENCES service_ticket_tasks(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id),

  -- Theo dõi thay đổi
  action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'assigned', 'reassigned', 'updated'
  old_value JSONB,
  new_value JSONB,

  -- Người thực hiện
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP DEFAULT now(),

  -- Ghi chú
  notes TEXT
);

-- Chỉ mục
CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_ticket ON task_history(ticket_id);
CREATE INDEX idx_task_history_changed_at ON task_history(changed_at DESC);
```

---

### Bảng lịch sử thay đổi mẫu

```sql
CREATE TABLE ticket_template_changes (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bối cảnh
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,

  -- Thay đổi mẫu
  old_template_id UUID REFERENCES task_templates(id),
  new_template_id UUID REFERENCES task_templates(id),

  -- Lý do và người thực hiện
  reason TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP DEFAULT now(),

  -- Tóm tắt tác động
  tasks_preserved INT, -- Số lượng công việc được giữ lại
  tasks_added INT, -- Số lượng công việc mới được thêm vào
  tasks_removed INT -- Số lượng công việc bị xóa
);

-- Chỉ mục
CREATE INDEX idx_template_changes_ticket ON ticket_template_changes(ticket_id);
CREATE INDEX idx_template_changes_date ON ticket_template_changes(changed_at DESC);
```

---

### Mở rộng phiếu dịch vụ

```sql
-- Thêm các cột vào bảng service_tickets hiện có
ALTER TABLE service_tickets
  ADD COLUMN template_id UUID REFERENCES task_templates(id),
  ADD COLUMN total_estimated_duration_minutes INT, -- Tổng thời gian ước tính của tất cả các công việc
  ADD COLUMN total_actual_duration_minutes INT; -- Tổng thời gian thực tế của tất cả các công việc

-- Chỉ mục để tra cứu mẫu
CREATE INDEX idx_service_tickets_template ON service_tickets(template_id);

-- Kích hoạt để cập nhật total_actual_duration khi các công việc hoàn thành
CREATE OR REPLACE FUNCTION update_ticket_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_tickets
  SET total_actual_duration_minutes = (
    SELECT SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
    FROM service_ticket_tasks
    WHERE ticket_id = NEW.ticket_id
      AND status = 'completed'
      AND started_at IS NOT NULL
      AND completed_at IS NOT NULL
  )
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_ticket_duration
  AFTER UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_ticket_duration();
```

---

## Quy tắc kinh doanh

### BR-TWS-001: Xác thực gán mẫu

**Quy tắc**: Mẫu công việc phải khớp với loại sản phẩm và loại dịch vụ của phiếu dịch vụ.

**Thực thi**:
```sql
-- Hàm xác thực
CREATE OR REPLACE FUNCTION validate_template_assignment()
RETURNS TRIGGER AS $$
DECLARE
  template_product_id UUID;
  template_service_type VARCHAR(20);
BEGIN
```
