# Yêu cầu: Lớp Yêu cầu Dịch vụ

## Thông tin tài liệu

**ID Tài liệu**: REQ-SRL-001
**Phiên bản**: 1.0
**Ngày**: 2025-10-22
**Trạng thái**: Bản nháp
**Tài liệu liên quan**:
- REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md
- TASK_WORKFLOW_ARCHITECTURE.md
- USER_JOURNEY.md

---

## Bối cảnh kinh doanh

### Mục đích

Lớp Yêu cầu Dịch vụ cung cấp một giao diện cho khách hàng để khởi tạo các yêu cầu dịch vụ và thu hẹp khoảng cách giữa kỳ vọng của khách hàng và quy trình xử lý phiếu dịch vụ nội bộ. Nó đóng vai trò là một điểm tiếp nhận và xác minh quan trọng:

1.  **Xác thực tính đủ điều kiện bảo hành** thông qua xác minh số sê-ri
2.  **Nắm bắt kỳ vọng của khách hàng** trước khi nhận sản phẩm vật lý
3.  **Cho phép theo dõi minh bạch** thông qua cổng thông tin công khai
4.  **Giảm khối lượng công việc cho lễ tân** thông qua dữ liệu được điền sẵn
5.  **Quản lý sự khác biệt** giữa sản phẩm dự kiến và sản phẩm thực tế nhận được

### Các bên liên quan chính

-   **Khách hàng**: Tạo yêu cầu dịch vụ trực tuyến hoặc trực tiếp
-   **Nhân viên lễ tân**: Chuyển đổi yêu cầu thành phiếu dịch vụ, xác minh sản phẩm
-   **Kỹ thuật viên**: Tham khảo kỳ vọng của khách hàng trong quá trình chẩn đoán
-   **Quản lý**: Theo dõi các chỉ số chuyển đổi từ yêu cầu sang phiếu dịch vụ

### Giá trị kinh doanh

-   **Giảm thời gian chờ đợi**: Thông tin khách hàng được điền sẵn giúp tăng tốc độ đăng ký trực tiếp
-   **Cổng bảo hành**: Ngăn chặn các mặt hàng không được bảo hành xâm nhập vào quy trình bảo hành
-   **Sự hài lòng của khách hàng**: Theo dõi minh bạch và giao tiếp chủ động
-   **Dấu vết kiểm toán**: Lịch sử hoàn chỉnh từ yêu cầu ban đầu đến khi hoàn thành dịch vụ

---

## Yêu cầu chức năng

### FR-SRL-001: Cổng xác minh số sê-ri

**Mô tả**: Hệ thống phải xác minh số sê-ri dựa trên cơ sở dữ liệu sản phẩm vật lý trước khi cho phép tạo yêu cầu dịch vụ.

**Quy tắc kinh doanh**:
-   Số sê-ri phải tồn tại trong bảng `physical_products`
-   Hệ thống hiển thị thông tin sản phẩm sau khi xác minh thành công
-   Số sê-ri không hợp lệ ngăn chặn việc tạo yêu cầu với thông báo lỗi rõ ràng
-   Có thể thêm nhiều số sê-ri tuần tự trong một yêu cầu

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN xác minh số sê-ri sản phẩm của mình trực tuyến
ĐỂ TÔI biết liệu sản phẩm của mình có đủ điều kiện bảo hành hay không trước khi gửi đi
```

**Tiêu chí chấp nhận**:
- [ ] Trường nhập số sê-ri có hỗ trợ máy quét mã vạch
- [ ] Xác minh thời gian thực (cuộc gọi AJAX khi hoàn thành nhập liệu)
- [ ] Hiển thị: Model sản phẩm, trạng thái bảo hành (công ty/nhà sản xuất/hết hạn)
- [ ] Thông báo lỗi rõ ràng cho các số sê-ri không được nhận dạng
- [ ] Hỗ trợ thêm nhiều sản phẩm trong một yêu cầu duy nhất

**Ghi chú kỹ thuật**:
```typescript
// Điểm cuối API
POST /api/public/verify-serial
{
  "serial_number": "SN123456789"
}

// Phản hồi
{
  "valid": true,
  "product": {
    "id": "uuid",
    "serial_number": "SN123456789",
    "model": "iPhone 14 Pro",
    "brand": "Apple",
    "warranty_status": "company_warranty", // hoặc "manufacturer_warranty" hoặc "expired"
    "warranty_end_date": "2025-12-31"
  }
}
```

---

### FR-SRL-002: Tạo yêu cầu dịch vụ công khai

**Mô tả**: Khách hàng có thể tạo yêu cầu dịch vụ trực tuyến mà không cần xác thực, sử dụng một liên kết theo dõi duy nhất để truy cập trong tương lai.

**Quy tắc kinh doanh**:
-   Không cần đăng nhập để tạo yêu cầu
-   Mã theo dõi được tạo làm mã định danh duy nhất (định dạng: `SR-YYYYMMDD-XXXXX`)
-   Yêu cầu email + số điện thoại của khách hàng để liên hệ
-   Yêu cầu có thể chứa 1+ sản phẩm đã được xác minh
-   Mỗi phiên yêu cầu tạo MỘT yêu cầu dịch vụ (cho phép nhiều sản phẩm)

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN tạo một yêu cầu dịch vụ trực tuyến trước khi gửi sản phẩm của mình
ĐỂ trung tâm dịch vụ chuẩn bị sẵn sàng để nhận thiết bị của tôi
```

**Tiêu chí chấp nhận**:
- [ ] Biểu mẫu công khai có thể truy cập tại `/request` hoặc `/request?serial=XXX` (được điền sẵn)
- [ ] Trình hướng dẫn nhiều bước: Thông tin liên hệ → Xác minh sản phẩm → Mô tả sự cố → Xác nhận
- [ ] Tạo mã theo dõi duy nhất (SR-YYYYMMDD-XXXXX)
- [ ] Gửi email xác nhận với liên kết theo dõi
- [ ] Cho phép thêm nhiều sản phẩm với mô tả sự cố riêng lẻ
- [ ] Hiển thị dòng thời gian dịch vụ ước tính

**Luồng công việc**:
```
Hành trình của khách hàng (Yêu cầu trực tuyến):
1. Điều hướng đến biểu mẫu yêu cầu công khai
2. Nhập thông tin liên hệ (tên, điện thoại, email)
3. Thêm sản phẩm:
   a. Nhập/quét số sê-ri
   b. Hệ thống xác minh và hiển thị thông tin sản phẩm
   c. Khách hàng mô tả các triệu chứng sự cố
   d. Thêm vào yêu cầu
   e. Lặp lại cho các sản phẩm bổ sung
4. Xem lại tóm tắt yêu cầu
5. Gửi yêu cầu
6. Nhận email xác nhận với liên kết theo dõi
```

---

### FR-SRL-003: Tạo yêu cầu dịch vụ cho khách hàng vãng lai

**Mô tả**: Nhân viên lễ tân có thể tạo yêu cầu dịch vụ thay mặt cho khách hàng vãng lai với quy trình làm việc được sắp xếp hợp lý.

**Quy tắc kinh doanh**:
-   Nhân viên xác thực qua đăng nhập hệ thống (vai trò: Lễ tân hoặc cao hơn)
-   Số điện thoại được sử dụng làm khóa tra cứu khách hàng
-   Dữ liệu khách hàng hiện có được tự động điền
-   Sản phẩm được xác minh tại thời điểm tạo
-   Yêu cầu ngay lập tức được chuyển đổi thành phiếu dịch vụ (trạng thái: `received`)

**Câu chuyện người dùng**:
```
LÀ một nhân viên lễ tân
TÔI MUỐN nhanh chóng tạo một yêu cầu dịch vụ cho khách hàng vãng lai
ĐỂ TÔI có thể giảm thiểu thời gian chờ đợi của khách hàng trong quá trình đăng ký
```

**Tiêu chí chấp nhận**:
- [ ] Giao diện nhân viên tại `/dashboard/requests/new`
- [ ] Tìm kiếm số điện thoại với tính năng tự động hoàn thành cho khách hàng hiện có
- [ ] Xác minh sê-ri với hỗ trợ máy quét mã vạch
- [ ] Chuyển đổi sang phiếu dịch vụ bằng một cú nhấp chuột
- [ ] In biên nhận phiếu dịch vụ cho khách hàng
- [ ] Bỏ qua email xác nhận (khách hàng có mặt trực tiếp)

**Luồng công việc**:
```
Hành trình của khách hàng vãng lai:
1. Nhân viên hỏi số điện thoại của khách hàng
2. Hệ thống truy xuất dữ liệu khách hàng hiện có (nếu có)
3. Nhân viên xác minh/cập nhật thông tin khách hàng
4. Khách hàng trình bày sản phẩm
5. Nhân viên quét số sê-ri (xác minh)
6. Khách hàng mô tả sự cố
7. Nhân viên tạo yêu cầu và ngay lập tức chuyển đổi thành phiếu dịch vụ
8. Hệ thống gán số phiếu dịch vụ (SV-YYYY-NNN)
9. Nhân viên cung cấp số theo dõi cho khách hàng
10. Khách hàng để lại sản phẩm tại trung tâm dịch vụ
```

---

### FR-SRL-004: Mối quan hệ Yêu cầu-Phiếu dịch vụ (1:N)

**Mô tả**: Một yêu cầu dịch vụ duy nhất có thể tạo ra nhiều phiếu dịch vụ dựa trên độ phức tạp của sản phẩm hoặc loại dịch vụ.

**Quy tắc kinh doanh**:
-   Một yêu cầu dịch vụ → Một hoặc nhiều phiếu dịch vụ
-   Hành vi mặc định: 1 yêu cầu → 1 phiếu dịch vụ (chứa tất cả các sản phẩm)
-   Nhân viên lễ tân có thể chia thành nhiều phiếu dịch vụ nếu cần
-   Mỗi phiếu dịch vụ theo dõi một tập hợp con các sản phẩm từ yêu cầu ban đầu
-   Tiêu chí chia tách: Các loại dịch vụ khác nhau, kỹ thuật viên khác nhau, sửa chữa phức tạp

**Câu chuyện người dùng**:
```
LÀ một nhân viên lễ tân
TÔI MUỐN chia một yêu cầu nhiều sản phẩm thành các phiếu dịch vụ riêng biệt
ĐỂ các kỹ thuật viên khác nhau có thể làm việc trên các thiết bị khác nhau cùng một lúc
```

**Tiêu chí chấp nhận**:
- [ ] Mặc định: Một phiếu dịch vụ duy nhất chứa tất cả các sản phẩm từ yêu cầu
- [ ] Tùy chọn chia yêu cầu trong quá trình tạo phiếu dịch vụ
- [ ] Liên kết các phiếu dịch vụ trở lại yêu cầu ban đầu (dấu vết kiểm toán)
- [ ] Trang theo dõi của khách hàng hiển thị tất cả các phiếu dịch vụ từ yêu cầu của họ
- [ ] Không thể chia tách sau khi trạng thái phiếu dịch vụ thay đổi từ `pending`

**Mô hình dữ liệu**:
```sql
-- Theo dõi mối quan hệ
service_requests (1) ──< (N) service_tickets
  qua: service_tickets.request_id → service_requests.id

-- Ví dụ về kịch bản chia tách:
Yêu cầu SR-20251022-00001 (2 sản phẩm):
  - Sản phẩm A: iPhone 14 (hư hỏng do nước)
  - Sản phẩm B: MacBook Pro (thay màn hình)

Chia thành:
  - Phiếu dịch vụ SV-2025-001: Chỉ iPhone 14 (giao cho KTV A)
  - Phiếu dịch vụ SV-2025-002: Chỉ MacBook Pro (giao cho KTV B)

Cả hai phiếu dịch vụ đều tham chiếu đến request_id = SR-20251022-00001
```

---

### FR-SRL-005: Luồng trạng thái yêu cầu

**Mô tả**: Các yêu cầu dịch vụ tuân theo một vòng đời trạng thái được xác định từ khi gửi đến khi hoàn thành.

**Định nghĩa trạng thái**:

| Trạng thái | Mô tả | Kích hoạt | Trạng thái tiếp theo |
|---|---|---|---|
| `submitted` | Yêu cầu đã được tạo, đang chờ giao sản phẩm | Khách hàng gửi yêu cầu trực tuyến | `received`, `cancelled` |
| `received` | Sản phẩm đã được nhận tại trung tâm dịch vụ | Nhân viên xác nhận đã nhận | `processing` |
| `processing` | Đã chuyển đổi thành (các) phiếu dịch vụ, đang trong quá trình xử lý | Tạo phiếu dịch vụ | `completed` |
| `completed` | Tất cả các phiếu dịch vụ liên quan đã hoàn thành, khách hàng đã được thông báo | Phiếu dịch vụ cuối cùng được đánh dấu là đã hoàn thành | N/A (kết thúc) |
| `cancelled` | Yêu cầu bị hủy trước khi bảo hành | Khách hàng/nhân viên hủy | N/A (kết thúc) |

**Quy tắc kinh doanh**:
-   Các chuyển đổi trạng thái là tuần tự (không có chuyển động lùi)
-   `submitted` → `received`: Xác nhận thủ công bởi nhân viên lễ tân
-   `received` → `processing`: Tự động khi phiếu dịch vụ được tạo
-   `processing` → `completed`: Tự động khi tất cả các phiếu dịch vụ liên quan hoàn thành
-   `cancelled`: Chỉ được phép ở trạng thái `submitted`

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN theo dõi trạng thái yêu cầu dịch vụ của mình trực tuyến
ĐỂ TÔI biết thiết bị của mình đang ở đâu trong quy trình dịch vụ
```

**Tiêu chí chấp nhận**:
- [ ] Trạng thái được hiển thị trên trang theo dõi công khai
- [ ] Thông báo qua email về mỗi thay đổi trạng thái
- [ ] Lịch sử trạng thái với dấu thời gian hiển thị cho nhân viên
- [ ] Mô tả trạng thái rõ ràng cho khách hàng (không mang tính kỹ thuật)

---

### FR-SRL-006: Đối chiếu sản phẩm dự kiến và thực tế

**Mô tả**: Hệ thống theo dõi sự khác biệt giữa các sản phẩm được liệt kê trong yêu cầu trực tuyến và các sản phẩm thực sự nhận được tại trung tâm dịch vụ.

**Quy tắc kinh doanh**:
-   Yêu cầu trực tuyến liệt kê các sản phẩm "dự kiến" (số sê-ri)
-   Nhân viên lễ tân xác nhận các sản phẩm "thực tế" đã nhận
-   Sự khác biệt được gắn cờ để nhân viên xem xét
-   Các kịch bản phổ biến:
    -   Khách hàng gửi ít sản phẩm hơn so với danh sách
    -   Khách hàng gửi sản phẩm khác với danh sách
    -   Các sản phẩm bổ sung không có trong yêu cầu ban đầu

**Câu chuyện người dùng**:
```
LÀ một nhân viên lễ tân
TÔI MUỐN được cảnh báo khi các sản phẩm nhận được không khớp với yêu cầu
ĐỂ TÔI có thể giải quyết sự khác biệt trước khi tạo phiếu dịch vụ
```

**Tiêu chí chấp nhận**:
- [ ] Hiển thị các sản phẩm dự kiến từ yêu cầu
- [ ] Quét các sản phẩm thực tế khi nhận được
- [ ] Đánh dấu các điểm không khớp (thiếu, thừa, thay thế)
- [ ] Yêu cầu nhân viên xác nhận trước khi tiếp tục
- [ ] Ghi lại sự khác biệt trong lịch sử yêu cầu
- [ ] Tùy chọn cập nhật yêu cầu hoặc liên hệ với khách hàng

**Luồng công việc**:
```
Quy trình đối chiếu:
1. Nhân viên mở yêu cầu đang chờ xử lý (trạng thái: submitted)
2. Hệ thống hiển thị danh sách sản phẩm dự kiến
3. Nhân viên quét từng sản phẩm nhận được
4. Hệ thống so sánh sản phẩm đã quét và sản phẩm dự kiến
5. NẾU không khớp:
   a. Hiển thị cảnh báo với chi tiết
   b. Các tùy chọn của nhân viên:
      - Liên hệ với khách hàng để làm rõ
      - Cập nhật yêu cầu để khớp với sản phẩm thực tế
      - Từ chối sản phẩm (hủy yêu cầu)
6. Nhân viên xác nhận đối chiếu
7. Trạng thái → received
```

---

### FR-SRL-007: Quy trình xác nhận giao hàng của khách hàng

**Mô tả**: Sau khi hoàn thành dịch vụ, khách hàng phải xác nhận chi tiết giao hàng thông qua cổng thông tin công khai trước khi hoàn tất việc đóng phiếu dịch vụ.

**Quy tắc kinh doanh**:
-   Kích hoạt: Tất cả các sửa chữa đã hoàn thành, trạng thái phiếu dịch vụ → `awaiting_customer_confirmation`
-   Khách hàng nhận được email với liên kết xác nhận
-   Các tùy chọn: Tự nhận hoặc yêu cầu giao hàng
-   Nếu yêu cầu giao hàng: Cung cấp địa chỉ và thời gian ưu tiên
-   Thời gian chờ 3 ngày: Tự động chuyển về tự nhận nếu không có phản hồi
-   Khách hàng có thể xem tóm tắt dịch vụ và chi phí trước khi xác nhận

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN chọn cách nhận thiết bị đã sửa chữa của mình
ĐỂ TÔI có thể chọn phương thức giao hàng thuận tiện nhất
```

**Tiêu chí chấp nhận**:
- [ ] Liên kết xác nhận duy nhất được gửi qua email
- [ ] Hiển thị tóm tắt dịch vụ (các dịch vụ đã thực hiện, chi phí, các bộ phận đã sử dụng)
- [ ] Các tùy chọn: "Tôi sẽ đến lấy" hoặc "Yêu cầu giao hàng"
- [ ] Nếu giao hàng: Biểu mẫu địa chỉ + tùy chọn ngày/giờ
- [ ] Hiển thị thời hạn xác nhận (3 ngày)
- [ ] Tự động chuyển về tự nhận sau khi hết thời gian chờ
- [ ] Thông báo cho nhân viên khi khách hàng xác nhận

**Luồng công việc**:
```
Luồng xác nhận giao hàng:
1. Kỹ thuật viên đánh dấu phiếu dịch vụ là đã hoàn thành
2. Hệ thống gửi email cho khách hàng:
   - Chủ đề: "Thiết bị của bạn đã sẵn sàng - Chọn phương thức giao hàng"
   - Liên kết: https://domain.com/confirm/{tracking_token}
3. Khách hàng nhấp vào liên kết, thấy:
   - Tóm tắt dịch vụ
   - Tổng chi phí
   - Hai nút: "Tự nhận" | "Yêu cầu giao hàng"
4. Khách hàng chọn tùy chọn:
   a. Tự nhận:
      - Hiển thị địa chỉ và giờ làm việc của trung tâm dịch vụ
      - Tạo mã QR để xác minh nhận hàng
      - Trạng thái phiếu dịch vụ → ready_for_pickup
   b. Yêu cầu giao hàng:
      - Biểu mẫu địa chỉ (được điền sẵn nếu có)
      - Lựa chọn ngày/giờ ưu tiên
      - Trạng thái phiếu dịch vụ → ready_for_delivery
      - Tạo nhiệm vụ giao hàng cho nhân viên
5. NẾU không có phản hồi sau 3 ngày:
   - Tự động chọn tự nhận
   - Gửi email nhắc nhở
   - Trạng thái phiếu dịch vụ → ready_for_pickup
```

---

### FR-SRL-008: Chiến lược thông báo qua email (6 thời điểm quan trọng)

**Mô tả**: Thông báo qua email tự động giúp khách hàng được thông báo tại các mốc dịch vụ quan trọng.

**Các thời điểm thông báo**:

1.  **Xác nhận yêu cầu** (Trạng thái: `submitted`)
    -   **Kích hoạt**: Khách hàng gửi yêu cầu trực tuyến
    -   **Nội dung**:
        -   Số theo dõi và liên kết
        -   Các sản phẩm được liệt kê trong yêu cầu
        -   Các bước tiếp theo: Gửi thiết bị hoặc đến trung tâm
        -   Thời gian xác nhận nhận hàng ước tính
    -   **Người nhận**: Email khách hàng

2.  **Đã nhận sản phẩm** (Trạng thái: `received`)
    -   **Kích hoạt**: Nhân viên xác nhận đã nhận sản phẩm
    -   **Nội dung**:
        -   Xác nhận các sản phẩm đã nhận
        -   Bất kỳ sự khác biệt nào được ghi nhận
        -   Thời gian chẩn đoán ước tính (24-48 giờ)
        -   Liên kết theo dõi để cập nhật
    -   **Người nhận**: Email khách hàng

3.  **Chẩn đoán hoàn tất - Yêu cầu hành động** (Phiếu dịch vụ: `awaiting_approval`)
    -   **Kích hoạt**: Kỹ thuật viên hoàn thành chẩn đoán, chờ khách hàng phê duyệt
    -   **Nội dung**:
        -   Tóm tắt chẩn đoán
        -   Các dịch vụ và chi phí được đề xuất
        -   Liên kết yêu cầu phê duyệt
        -   Thời hạn phê duyệt (3 ngày)
    -   **Người nhận**: Email khách hàng

4.  **Dịch vụ hoàn tất** (Phiếu dịch vụ: `completed`)
    -   **Kích hoạt**: Tất cả các sửa chữa đã hoàn tất
    -   **Nội dung**:
        -   Các dịch vụ đã thực hiện
        -   Phân tích tổng chi phí
        -   Yêu cầu xác nhận giao hàng
        -   Liên kết để chọn nhận/giao hàng
    -   **Người nhận**: Email khách hàng

5.  **Sẵn sàng để nhận/giao hàng** (Phiếu dịch vụ: `ready_for_pickup` hoặc `ready_for_delivery`)
    -   **Kích hoạt**: Khách hàng xác nhận nhận hàng HOẶC giao hàng đã được lên lịch
    -   **Nội dung**:
        -   Nhận hàng: Địa chỉ trung tâm dịch vụ, giờ làm việc, mã QR
        -   Giao hàng: Ngày/giờ giao hàng ước tính
        -   Hóa đơn cuối cùng
        -   Những gì cần mang theo (phương thức thanh toán, giấy tờ tùy thân)
    -   **Người nhận**: Email khách hàng

6.  **Nhắc nhở hạn chót** (Nhiều trình kích hoạt khác nhau)
    -   **Kích hoạt**: 1 ngày trước hạn chót tự động chuyển đổi
    -   **Nội dung**:
        -   Hành động được yêu cầu (phê duyệt hoặc xác nhận giao hàng)
        -   Hạn chót hiện tại
        -   Hậu quả của việc không hành động (hành vi tự động chuyển đổi)
        -   Liên kết hành động nhanh
    -   **Người nhận**: Email khách hàng

**Quy tắc kinh doanh**:
-   Tất cả các email đều bao gồm liên kết theo dõi đến cổng thông tin công khai
-   Email sử dụng ngôn ngữ đơn giản (tránh thuật ngữ kỹ thuật)
-   Bao gồm thông tin liên hệ của trung tâm dịch vụ để giải đáp thắc mắc
-   Không cung cấp tùy chọn hủy đăng ký (email giao dịch)
-   Ghi lại tất cả các email đã gửi trong hệ thống (dấu vết kiểm toán)

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN nhận được các cập nhật qua email kịp thời về yêu cầu dịch vụ của mình
ĐỂ TÔI luôn được thông báo mà không cần phải liên tục kiểm tra trang theo dõi
```

**Tiêu chí chấp nhận**:
- [ ] Mẫu email cho tất cả 6 thời điểm
- [ ] Hỗ trợ tiếng Việt
- [ ] Thiết kế email đáp ứng trên thiết bị di động
- [ ] Các nút kêu gọi hành động rõ ràng
- [ ] Xác nhận giao hàng (biên nhận đã đọc)
- [ ] Logic thử lại cho các lần gửi không thành công

---

## Mô hình dữ liệu

### Bảng yêu cầu dịch vụ

```sql
CREATE TABLE service_requests (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(20) NOT NULL UNIQUE, -- Định dạng: SR-YYYYMMDD-XXXXX

  -- Thông tin khách hàng
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,

  -- Nguồn yêu cầu
  source VARCHAR(20) NOT NULL CHECK (source IN ('online', 'walk_in')),
  created_by_staff_id UUID REFERENCES profiles(id), -- NULL nếu trực tuyến

  -- Theo dõi trạng thái
  status VARCHAR(20) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'received', 'processing', 'completed', 'cancelled')),

  -- Sản phẩm và sự cố (JSON để linh hoạt)
  expected_products JSONB NOT NULL, -- Mảng {serial_number, issue_description}
  actual_products JSONB, -- Được điền khi nhận, có thể khác với dự kiến
  discrepancies TEXT, -- Ghi chú về sự khác biệt giữa dự kiến và thực tế

  -- Dấu thời gian
  created_at TIMESTAMP DEFAULT now(),
  received_at TIMESTAMP, -- Khi trạng thái → received
  processing_at TIMESTAMP, -- Khi phiếu dịch vụ đầu tiên được tạo
  completed_at TIMESTAMP, -- Khi tất cả các phiếu dịch vụ hoàn thành
  updated_at TIMESTAMP DEFAULT now(),

  -- Chỉ mục
  CONSTRAINT tracking_token_format CHECK (tracking_token ~ '^SR-[0-9]{8}-[0-9]{5}$')
);

-- Chỉ mục để tăng hiệu suất
CREATE INDEX idx_requests_tracking_token ON service_requests(tracking_token);
CREATE INDEX idx_requests_customer_phone ON service_requests(customer_phone);
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_created_at ON service_requests(created_at DESC);

-- Kích hoạt tự động cập nhật dấu thời gian
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Lược đồ JSON cho expected_products**:
```json
[
  {
    "serial_number": "SN123456789",
    "product_id": "uuid",
    "product_name": "iPhone 14 Pro",
    "warranty_status": "company_warranty",
    "issue_description": "Màn hình bị nứt sau khi rơi, cảm ứng không phản hồi"
  },
  {
    "serial_number": "SN987654321",
    "product_id": "uuid",
    "product_name": "MacBook Pro 16\"",
    "warranty_status": "manufacturer_warranty",
    "issue_description": "Pin hết rất nhanh, chỉ kéo dài 2 giờ"
  }
]
```

---

### Bảng liên kết Yêu cầu-Phiếu dịch vụ

```sql
CREATE TABLE request_tickets (
  -- Theo dõi mối quan hệ
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,

  -- Siêu dữ liệu
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  split_reason TEXT, -- Tại sao phiếu dịch vụ này được tách ra từ yêu cầu

  -- Khóa chính
  PRIMARY KEY (request_id, ticket_id)
);

-- Chỉ mục để tra cứu
CREATE INDEX idx_request_tickets_request ON request_tickets(request_id);
CREATE INDEX idx_request_tickets_ticket ON request_tickets(ticket_id);
```

---

### Bảng nhật ký thông báo qua email

```sql
CREATE TABLE email_notifications (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Mục tiêu
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- Nội dung
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'request_confirmation', 'product_received', v.v.

  -- Bối cảnh
  related_request_id UUID REFERENCES service_requests(id),
  related_ticket_id UUID REFERENCES service_tickets(id),

  -- Theo dõi giao hàng
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Kiểm toán
  created_at TIMESTAMP DEFAULT now()
);

-- Chỉ mục
CREATE INDEX idx_email_notifications_request ON email_notifications(related_request_id);
CREATE INDEX idx_email_notifications_ticket ON email_notifications(related_ticket_id);
CREATE INDEX idx_email_notifications_sent ON email_notifications(sent_at);
```

---

### Mở rộng phiếu dịch vụ

```sql
-- Thêm các cột vào bảng service_tickets hiện có
ALTER TABLE service_tickets
  ADD COLUMN request_id UUID REFERENCES service_requests(id),
  ADD COLUMN expected_issues TEXT, -- Mô tả của khách hàng từ yêu cầu
  ADD COLUMN delivery_method VARCHAR(20)
    CHECK (delivery_method IN ('self_pickup', 'delivery', 'pending')),
  ADD COLUMN delivery_address TEXT,
  ADD COLUMN delivery_preferred_time TIMESTAMP,
  ADD COLUMN customer_confirmed_at TIMESTAMP;

-- Chỉ mục để tra cứu yêu cầu
CREATE INDEX idx_service_tickets_request ON service_tickets(request_id);
```

---

## Quy tắc kinh doanh

### BR-SRL-001: Yêu cầu xác minh sê-ri

**Quy tắc**: Tất cả các sản phẩm trong một yêu cầu dịch vụ phải có số sê-ri đã được xác minh trước khi gửi.

**Thực thi**:
-   Giao diện người dùng: Vô hiệu hóa nút gửi cho đến khi tất cả các sản phẩm được xác minh
-   Phía máy chủ: Xác thực API từ chối các yêu cầu có sản phẩm chưa được xác minh
-   Cơ sở dữ liệu: Ràng buộc khóa ngoại đảm bảo sản phẩm tồn tại

**Ngoại lệ**: Không có (cổng bảo hành là yêu cầu kinh doanh quan trọng)

**Triển khai SQL**:
```sql
-- Xác thực phía máy chủ trong thủ tục tRPC
const verifiedProducts = await Promise.all(
  products.map(p =>
    supabase
      .from('physical_products')
      .select('id, serial_number, product_id, company_warranty_end_date, manufacturer_warranty_end_date')
      .eq('serial_number', p.serial_number)
      .single()
  )
);

if (verifiedProducts.some(p => !p.data)) {
  throw new Error('Tất cả các số sê-ri phải được xác minh trước khi tạo yêu cầu');
}
```

---

### BR-SRL-002: Xác thực chuyển đổi trạng thái

**Quy tắc**: Các chuyển đổi trạng thái yêu cầu dịch vụ phải tuân theo luồng đã xác định. Không cho phép chuyển động lùi.

**Các chuyển đổi hợp lệ**:
```
submitted → received
submitted → cancelled
received → processing
processing → completed
```

**Các chuyển đổi không hợp lệ** (phải bị từ chối):
-   `received` → `submitted`
-   `completed` → `processing`
-   Bất kỳ chuyển đổi nào từ `completed` hoặc `cancelled`

**Thực thi**:
```sql
-- Ràng buộc kiểm tra cơ sở dữ liệu
CREATE OR REPLACE FUNCTION validate_request_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Các trạng thái kết thúc không thể thay đổi
  IF OLD.status IN ('completed', 'cancelled') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Không thể thay đổi trạng thái từ trạng thái kết thúc %', OLD.status;
  END IF;

  -- Xác thực các chuyển đổi cụ thể
  IF OLD.status = 'submitted' AND NEW.status NOT IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Chuyển đổi không hợp lệ từ submitted sang %', NEW.status;
  END IF;

  IF OLD.status = 'received' AND NEW.status != 'processing' THEN
    RAISE EXCEPTION 'Chuyển đổi không hợp lệ từ received sang %', NEW.status;
  END IF;

  IF OLD.status = 'processing' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Chuyển đổi không hợp lệ từ processing sang %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_request_status_transition
  BEFORE UPDATE OF status ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_request_status_transition();
```

---

### BR-SRL-003: Tính duy nhất của mã theo dõi

**Quy tắc**: Mỗi yêu cầu dịch vụ phải có một mã theo dõi duy nhất theo định dạng `SR-YYYYMMDD-XXXXX`.

**Đặc tả định dạng**:
-   Tiền tố: `SR-`
-   Ngày: `YYYYMMDD` (ngày tạo)
-   Chuỗi: `XXXXX` (chuỗi 5 chữ số hàng ngày bắt đầu từ 00001)

**Logic tạo**:
```sql
CREATE OR REPLACE FUNCTION generate_request_tracking_token()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  sequence_num INT;
  new_token TEXT;
BEGIN
  -- Lấy ngày hôm nay theo định dạng YYYYMMDD
  today_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Tìm số thứ tự cao nhất cho ngày hôm nay
  SELECT COALESCE(
    MAX(
      CAST(
        substring(tracking_token from 'SR-[0-9]{8}-([0-9]{5})')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO sequence_num
  FROM service_requests
  WHERE tracking_token LIKE 'SR-' || today_date || '-%';

  -- Tạo mã
  new_token := 'SR-' || today_date || '-' || LPAD(sequence_num::TEXT, 5, '0');

  NEW.tracking_token := new_token;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_tracking_token
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  WHEN (NEW.tracking_token IS NULL)
  EXECUTE FUNCTION generate_request_tracking_token();
```

---

### BR-SRL-004: Ràng buộc mối quan hệ Yêu cầu-Phiếu dịch vụ

**Quy tắc**:
-   Một yêu cầu dịch vụ có thể có 1+ phiếu dịch vụ
-   Một phiếu dịch vụ có thể thuộc về 0-1 yêu cầu dịch vụ (phiếu dịch vụ của khách vãng lai không có yêu cầu)
-   Không thể tạo phiếu dịch vụ cho các yêu cầu đã bị hủy

**Thực thi**:
```sql
-- Ràng buộc kiểm tra trong logic ứng dụng (tRPC)
async function createTicketFromRequest(requestId: string) {
  // Xác minh yêu cầu ở trạng thái hợp lệ
  const request = await supabase
    .from('service_requests')
    .select('status')
    .eq('id', requestId)
    .single();

  if (!request.data || request.data.status === 'cancelled') {
    throw new Error('Không thể tạo phiếu dịch vụ từ yêu cầu đã bị hủy');
  }

  if (request.data.status !== 'received') {
    throw new Error('Yêu cầu phải ở trạng thái đã nhận trước khi tạo phiếu dịch vụ');
  }

  // Tạo phiếu dịch vụ với tham chiếu request_id
  const ticket = await supabase
    .from('service_tickets')
    .insert({
      request_id: requestId,
      // ... dữ liệu phiếu dịch vụ khác
    });

  // Cập nhật trạng thái yêu cầu thành đang xử lý
  await supabase
    .from('service_requests')
    .update({ status: 'processing', processing_at: new Date() })
    .eq('id', requestId);
}
```

---

### BR-SRL-005: Logic tự động hoàn thành

**Quy tắc**: Một yêu cầu dịch vụ được tự động đánh dấu là `completed` khi TẤT CẢ các phiếu dịch vụ liên quan đạt đến trạng thái kết thúc (`completed`, `cancelled`, `closed`).

**Triển khai**:
```sql
CREATE OR REPLACE FUNCTION auto_complete_service_request()
RETURNS TRIGGER AS $$
DECLARE
  req_id UUID;
  pending_tickets INT;
BEGIN
  -- Lấy request_id từ phiếu dịch vụ đã cập nhật
  req_id := NEW.request_id;

  -- Bỏ qua nếu phiếu dịch vụ không có yêu cầu liên quan
  IF req_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Đếm các phiếu dịch vụ chưa kết thúc cho yêu cầu này
  SELECT COUNT(*)
  INTO pending_tickets
  FROM service_tickets
  WHERE request_id = req_id
    AND status NOT IN ('completed', 'cancelled', 'closed');

  -- Nếu không có phiếu dịch vụ nào đang chờ xử lý, đánh dấu yêu cầu là đã hoàn thành
  IF pending_tickets = 0 THEN
    UPDATE service_requests
    SET
      status = 'completed',
      completed_at = now()
    WHERE id = req_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_request_completion
  AFTER UPDATE OF status ON service_tickets
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled', 'closed'))
  EXECUTE FUNCTION auto_complete_service_request();
```

---

### BR-SRL-006: Tự động chuyển đổi sau 3 ngày để xác nhận của khách hàng

**Quy tắc**: Nếu khách hàng không xác nhận phương thức giao hàng trong vòng 3 ngày kể từ khi hoàn thành dịch vụ, hệ thống sẽ tự động chọn tự nhận.

**Triển khai**:
```sql
-- Công việc được lên lịch (chạy hàng ngày qua cron hoặc pg_cron)
CREATE OR REPLACE FUNCTION auto_fallback_delivery_confirmation()
RETURNS void AS $$
BEGIN
  -- Tìm các phiếu dịch vụ đang chờ xác nhận trong 3+ ngày
  UPDATE service_tickets
  SET
    delivery_method = 'self_pickup',
    status = 'ready_for_pickup',
    updated_at = now()
  WHERE status = 'awaiting_customer_confirmation'
    AND completed_at < now() - INTERVAL '3 days'
    AND delivery_method = 'pending';

  -- Gửi email nhắc nhở
  INSERT INTO email_notifications (
    recipient_email,
    recipient_name,
    subject,
    body,
    template_type,
    related_ticket_id
  )
  SELECT
    c.email,
    c.name,
    'Nhắc nhở: Thiết bị của bạn đã sẵn sàng để nhận',
    'Thiết bị của bạn đã sẵn sàng trong 3 ngày. Chúng tôi đã tự động lên lịch để bạn tự nhận...',
    'auto_fallback_reminder',
    t.id
  FROM service_tickets t
  JOIN customers c ON t.customer_id = c.id
  WHERE t.status = 'ready_for_pickup'
    AND t.delivery_method = 'self_pickup'
    AND t.updated_at >= now() - INTERVAL '1 hour'; -- Cập nhật gần đây
END;
$$ LANGUAGE plpgsql;

-- Lên lịch chạy hàng ngày lúc 9 giờ sáng
SELECT cron.schedule('auto-fallback-delivery', '0 9 * * *', 'SELECT auto_fallback_delivery_confirmation()');
```

---

## Luồng công việc

### Luồng công việc 1: Chuyển đổi yêu cầu dịch vụ trực tuyến thành phiếu dịch vụ

```
┌─────────────────────────────────────────────────────────────────────┐
│                   LUỒNG YÊU CẦU DỊCH VỤ TRỰC TUYẾN                       │
└─────────────────────────────────────────────────────────────────────┘

KHÁCH HÀNG (Cổng thông tin công khai)                 HỆ THỐNG                        NHÂN VIÊN (Bảng điều khiển)

1. Điều hướng đến /request
   ├─> Nhập thông tin liên hệ
   └─> Nhấp vào "Thêm sản phẩm"

2. Nhập/quét số sê-ri ──────────> Xác minh trong DB physical_products
                                         │
                                         ├─> Hợp lệ: Trả về thông tin sản phẩm
                                         │   + trạng thái bảo hành
                                         │
                                         └─> Không hợp lệ: Hiển thị lỗi
                                             "Không nhận dạng được sê-ri"

3. Xem chi tiết sản phẩm
   ├─> Hiển thị trạng thái bảo hành
   └─> Nhập mô tả sự cố

4. Thêm vào yêu cầu
   └─> Lặp lại cho nhiều sản phẩm hơn

5. Xem lại tóm tắt yêu cầu
   └─> Gửi yêu cầu ───────────────> Tạo mã theo dõi
                                        (SR-YYYYMMDD-XXXXX)
                                         │
                                         ├─> Tạo bản ghi service_request
                                         │   trạng thái: 'submitted'
                                         │
                                         └─> Gửi thông báo qua email
                                             "Xác nhận yêu cầu"

6. Nhận email với
   liên kết theo dõi ◄──────────────────── Email đã gửi

7. Gửi sản phẩm đến trung tâm dịch vụ
   │
   └─> Sản phẩm đến trung tâm ────────────────────────────────────> Lễ tân nhận gói hàng

8. Nhân viên mở các yêu cầu đang chờ xử lý ◄────────────────────────────────────  Bộ lọc: trạng thái='submitted'

9. Nhân viên quét mã theo dõi ──────────────────────────────────────>  Tải chi tiết yêu cầu
                                                                        │
                                                                        └─> Hiển thị các sản phẩm dự kiến

10. Nhân viên quét từng sản phẩm ──────────────────────────────────────>   So sánh thực tế và dự kiến
                                                                         │
                                                                         ├─> Khớp: Dấu kiểm màu xanh lá cây
                                                                         │
                                                                         └─> Không khớp: Cảnh báo màu đỏ
                                                                             ├─> Thiếu sản phẩm
                                                                             ├─> Thừa sản phẩm
                                                                             └─> Sai sản phẩm

11. NẾU có sự khác biệt: ◄──────────────────────────────────────────────  Hiển thị các tùy chọn đối chiếu:
                                                                         [ ] Liên hệ với khách hàng
                                                                         [ ] Cập nhật yêu cầu
                                                                         [ ] Từ chối/hủy

12. Nhân viên xác nhận đã nhận ─────────────────────────────────────────>  Cập nhật yêu cầu:
                                                                        ├─> trạng thái: 'received'
                                                                        ├─> actual_products: [...]
                                                                        ├─> received_at: now()
                                                                        │
                                                                        └─> Gửi thông báo qua email
                                                                            "Đã nhận sản phẩm"

13. Nhận email xác nhận ◄───────────────────────────────────── Email đã gửi

14. Nhân viên nhấp vào "Tạo phiếu dịch vụ" ──────────────────────────────────>   Mở biểu mẫu tạo phiếu dịch vụ
                                                                        (được điền sẵn dữ liệu yêu cầu)

15. Nhân viên hoàn thành phiếu dịch vụ ────────────────────────────────────────>   Tạo service_ticket:
    ├─> Giao kỹ thuật viên                                              ├─> request_id: đã liên kết
    ├─> Đặt mức độ ưu tiên                                                   ├─> Tạo SV-YYYY-NNN
    └─> Xác nhận                                                        ├─> trạng thái: 'pending'
                                                                        │
                                                                        └─> Cập nhật yêu cầu:
                                                                            trạng thái: 'processing'

16. Theo dõi qua cổng thông tin công khai ◄──────────────────────────────────────── Trạng thái yêu cầu + phiếu dịch vụ
    /track/{tracking_token}                                            hiển thị cho khách hàng
```

---

### Luồng công việc 2: Yêu cầu của khách hàng vãng lai

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LUỒNG YÊU CẦU DỊCH VỤ CỦA KHÁCH HÀNG VÃNG LAI                    │
└─────────────────────────────────────────────────────────────────────┘

KHÁCH HÀNG (Trực tiếp)                     NHÂN VIÊN (Lễ tân)                    HỆ THỐNG

1. Khách hàng đến với
   (các) sản phẩm cần bảo hành

2. Nhân viên chào khách hàng ───────────────> Hỏi số điện thoại

3. Cung cấp số điện thoại ────────────────> Tìm kiếm khách hàng theo số điện thoại ────────> Truy vấn bảng khách hàng
                                                                              │
                                                                              ├─> Tìm thấy: Tải dữ liệu
                                                                              │
```
