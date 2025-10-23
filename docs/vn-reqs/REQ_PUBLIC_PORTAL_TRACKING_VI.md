# Yêu cầu: Cổng thông tin công khai & Theo dõi

## Thông tin tài liệu

**ID Tài liệu**: REQ-PPT-001
**Phiên bản**: 1.0
**Ngày**: 2025-10-22
**Trạng thái**: Bản nháp
**Tài liệu liên quan**:
- REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md
- REQ_SERVICE_REQUEST_LAYER.md
- REQ_TASK_WORKFLOW_SYSTEM.md
- USER_JOURNEY.md

---

## Bối cảnh kinh doanh

### Mục đích

Hệ thống Cổng thông tin công khai & Theo dõi cung cấp cho khách hàng khả năng hiển thị minh bạch, theo thời gian thực về các yêu cầu dịch vụ và phiếu sửa chữa của họ mà không cần xác thực. Nó đóng vai trò là giao diện chính hướng tới khách hàng nhằm:

1.  **Xây dựng lòng tin**: Cập nhật tiến độ minh bạch giúp giảm bớt lo lắng của khách hàng
2.  **Giảm tải hỗ trợ**: Theo dõi tự phục vụ làm giảm các cuộc gọi "thiết bị của tôi ở đâu?"
3.  **Nâng cao trải nghiệm**: Giao tiếp chủ động giúp khách hàng luôn được thông báo
4.  **Cho phép tự phục vụ**: Khách hàng có thể thực hiện các hành động (phê duyệt sửa chữa, xác nhận giao hàng) trực tuyến
5.  **Duy trì quyền riêng tư**: Theo dõi an toàn mà không để lộ dữ liệu kinh doanh nhạy cảm

### Các bên liên quan chính

-   **Khách hàng**: Người dùng chính tìm kiếm cập nhật trạng thái dịch vụ
-   **Nhân viên lễ tân**: Chia sẻ liên kết theo dõi và mã QR với khách hàng
-   **Ban quản lý**: Theo dõi sự tương tác của khách hàng với cổng thông tin theo dõi

### Giá trị kinh doanh

-   **Giảm khối lượng cuộc gọi**: Giảm 40-60% các cuộc gọi hỏi về trạng thái
-   **Cải thiện sự hài lòng**: Khách hàng đánh giá cao sự minh bạch và kiểm soát
-   **Phê duyệt nhanh hơn**: Phê duyệt trực tuyến nhanh hơn so với việc gọi điện thoại qua lại
-   **Sự khác biệt hóa thương hiệu**: Trải nghiệm dịch vụ hiện đại, minh bạch
-   **Hiệu quả hoạt động**: Nhân viên tập trung vào dịch vụ, không phải cập nhật trạng thái

---

## Yêu cầu chức năng

### FR-PPT-001: Truy cập không cần xác thực qua Mã theo dõi

**Mô tả**: Khách hàng có thể truy cập thông tin theo dõi bằng mã theo dõi duy nhất mà không cần đăng nhập/tạo tài khoản.

**Phương thức truy cập**:
1.  **URL trực tiếp**: `https://domain.com/track/{tracking_token}`
2.  **Mã QR**: Quét mã QR được in trên biên nhận
3.  **Liên kết Email**: Nhấp vào liên kết trong email thông báo
4.  **Nhập thủ công**: Nhập số theo dõi trên trang theo dõi

**Cân nhắc bảo mật**:
-   Mã theo dõi hoạt động như một sự ủy quyền (sở hữu = quyền truy cập)
-   Độ phức tạp của mã: SR-YYYYMMDD-XXXXX (khó đoán)
-   Giới hạn tốc độ: Tối đa 20 yêu cầu mỗi mã mỗi giờ
-   Không hiển thị dữ liệu tài chính nhạy cảm (chỉ tổng số)
-   Không để lộ thông tin cá nhân của kỹ thuật viên

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN kiểm tra trạng thái dịch vụ của mình mà không cần tạo tài khoản
ĐỂ TÔI có thể nhận được cập nhật nhanh chóng và dễ dàng
```

**Tiêu chí chấp nhận**:
- [ ] URL với mã theo dõi tải trang theo dõi
- [ ] Quét mã QR chuyển hướng đến trang theo dõi
- [ ] Mã không hợp lệ hiển thị thông báo lỗi thân thiện
- [ ] Không yêu cầu xác thực
- [ ] Hết thời gian phiên: 30 phút không hoạt động
- [ ] Hoạt động trên trình duyệt di động và máy tính để bàn

---

### FR-PPT-002: Hiển thị trạng thái thời gian thực

**Mô tả**: Hiển thị trạng thái dịch vụ hiện tại với các chỉ báo tiến trình trực quan và dòng thời gian.

**Các thành phần hiển thị trạng thái**:

**1. Thanh tiến trình**
```
Đã gửi → Đã nhận → Chẩn đoán → Sửa chữa → Hoàn thành
   ●───────────●──────────●─────────○────────○
  Xong       Xong      Hiện tại    Chờ xử lý   Chờ xử lý
```

**2. Chế độ xem dòng thời gian**
```
✅ 22/10, 10:30 SA - Yêu cầu dịch vụ đã được tạo
✅ 22/10, 02:00 CH - Thiết bị đã được nhận tại trung tâm dịch vụ
✅ 22/10, 03:15 CH - Bắt đầu chẩn đoán
⏳ 22/10, 04:30 CH - Đang chẩn đoán
⏸️ Ước tính hoàn thành: 24/10, 2025
```

**3. Huy hiệu trạng thái hiện tại**
-   Chỉ báo trạng thái được mã hóa màu (xanh lá, vàng, cam, xanh dương)
-   Mô tả trạng thái bằng ngôn ngữ đơn giản
-   Hành động dự kiến tiếp theo được nêu rõ ràng

**Quy tắc kinh doanh**:
-   Cập nhật trạng thái theo thời gian thực (không cần làm mới trang qua WebSocket hoặc thăm dò)
-   Ngày hoàn thành ước tính được hiển thị nếu có
-   Ngôn ngữ thân thiện với khách hàng (không có thuật ngữ kỹ thuật)
-   Chỉ hiển thị các sự kiện liên quan đến khách hàng (ẩn các hoạt động nội bộ)

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN xem tiến trình trực quan của dịch vụ của mình
ĐỂ TÔI hiểu thiết bị của mình đang ở đâu trong quy trình
```

**Tiêu chí chấp nhận**:
- [ ] Thanh tiến trình hiển thị các bước đã hoàn thành được tô sáng
- [ ] Dòng thời gian hiển thị các sự kiện theo thứ tự thời gian
- [ ] Huy hiệu trạng thái được hiển thị nổi bật
- [ ] Thiết kế đáp ứng trên thiết bị di động
- [ ] Tự động làm mới sau mỗi 60 giây
- [ ] Có nút làm mới thủ công

---

### FR-PPT-003: Hiển thị chi tiết dịch vụ

**Mô tả**: Hiển thị thông tin dịch vụ toàn diện liên quan đến khách hàng.

**Thông tin được hiển thị**:

**Thông tin yêu cầu**:
-   Số theo dõi (lớn, nổi bật)
-   Tên và thông tin liên hệ của khách hàng
-   Ngày tạo yêu cầu
-   Nguồn (trực tuyến hoặc tại cửa hàng)

**Thông tin sản phẩm**:
-   Model và số sê-ri của sản phẩm
-   Mô tả sự cố được báo cáo
-   Tình trạng bảo hành (còn hiệu lực hoặc đã hết hạn)

**Tiến trình dịch vụ**:
-   Giai đoạn hiện tại (tiến trình công việc được đơn giản hóa)
-   Kỹ thuật viên được chỉ định (chỉ tên, ví dụ: "KTV: Minh")
-   Các dịch vụ đã thực hiện (danh sách)
-   Các bộ phận đã thay thế (danh sách với mô tả)

**Thông tin tài chính**:
-   Phí chẩn đoán (nếu có)
-   Phí dịch vụ
-   Chi phí bộ phận (chi tiết)
-   Tổng chi phí (không bao gồm chi tiết giảm giá)
-   Tình trạng thanh toán (Chờ xử lý, Đã thanh toán, Đã thanh toán một phần)

**Biện pháp bảo vệ quyền riêng tư**:
-   Không có tên đầy đủ hoặc thông tin liên hệ của kỹ thuật viên
-   Không có phân tích chi phí nội bộ (lợi nhuận lao động so với bộ phận)
-   Không có ghi chú của nhân viên hiển thị cho khách hàng
-   Không có thông tin khách hàng khác hiển thị

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN xem thông tin chi tiết về dịch vụ của mình
ĐỂ TÔI biết chính xác những gì đang được thực hiện và chi phí là bao nhiêu
```

**Tiêu chí chấp nhận**:
- [ ] Tất cả thông tin liên quan đến khách hàng được hiển thị
- [ ] Dữ liệu nội bộ nhạy cảm được ẩn
- [ ] Phân tích tài chính rõ ràng và chính xác
- [ ] Chi tiết sản phẩm bao gồm tình trạng bảo hành
- [ ] Dịch vụ/bộ phận được cập nhật theo thời gian thực

---

### FR-PPT-004: Theo dõi yêu cầu nhiều sản phẩm

**Mô tả**: Đối với các yêu cầu có nhiều sản phẩm, phân biệt rõ ràng trạng thái của từng mặt hàng.

**Mẫu hiển thị**:
-   Hiển thị trạng thái yêu cầu tổng thể
-   Liệt kê các sản phẩm riêng lẻ dưới dạng thẻ có thể mở rộng
-   Mỗi sản phẩm hiển thị trạng thái phiếu sửa chữa độc lập
-   Hoàn thành tổng thể khi tất cả các sản phẩm đã xong

**Bố cục ví dụ**:
```
Yêu cầu SR-20251022-00001
Trạng thái: Đang tiến hành (1 trong 2 thiết bị đã hoàn thành)

┌─────────────────────────────────────────┐
│ 📱 iPhone 14 Pro (SN123456789)         │
│ Phiếu sửa chữa: SV-2025-001                     │
│ Trạng thái: ✅ Hoàn thành                    │
│ Sẵn sàng để nhận                         │
│ [ Xem chi tiết ]                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💻 MacBook Pro 16" (SN987654321)       │
│ Phiếu sửa chữa: SV-2025-002                     │
│ Trạng thái: ⏳ Đang chẩn đoán                 │
│ Ước tính hoàn thành: 24/10            │
│ [ Xem chi tiết ]                         │
└─────────────────────────────────────────┘
```

**Quy tắc kinh doanh**:
-   Mỗi thẻ sản phẩm có thể nhấp để xem chi tiết
-   Thanh tiến trình hiển thị phần trăm hoàn thành tổng thể
-   Thông báo được gửi khi trạng thái của BẤT KỲ sản phẩm nào thay đổi
-   Các tùy chọn nhận/giao hàng xuất hiện khi TẤT CẢ các sản phẩm đã sẵn sàng

**Câu chuyện người dùng**:
```
LÀ một khách hàng có nhiều thiết bị đang được bảo hành
TÔI MUỐN xem trạng thái riêng cho từng thiết bị
ĐỂ TÔI biết cái nào đã sẵn sàng và cái nào vẫn đang được xử lý
```

**Tiêu chí chấp nhận**:
- [ ] Yêu cầu nhiều sản phẩm hiển thị tất cả các mặt hàng
- [ ] Trạng thái phiếu sửa chữa riêng lẻ hiển thị cho mỗi sản phẩm
- [ ] Tiến trình tổng thể được tính toán chính xác
- [ ] Chế độ xem chi tiết có thể mở rộng cho mỗi sản phẩm
- [ ] Xác nhận giao hàng có sẵn khi tất cả đã sẵn sàng

---

### FR-PPT-005: Hành động tương tác của khách hàng

**Mô tả**: Khách hàng có thể thực hiện các hành động cụ thể thông qua cổng thông tin theo dõi.

**Các hành động có sẵn**:

**1. Phê duyệt báo giá sửa chữa** (khi trạng thái phiếu sửa chữa = `awaiting_approval`)
-   Hiển thị kết quả chẩn đoán
-   Hiển thị phân tích chi phí chi tiết
-   Các tùy chọn: "Phê duyệt sửa chữa" hoặc "Từ chối sửa chữa"
-   Đếm ngược thời hạn phê duyệt (mặc định 3 ngày)
-   Giải thích rõ ràng điều gì sẽ xảy ra nếu bị từ chối

**2. Xác nhận phương thức giao hàng** (khi trạng thái phiếu sửa chữa = `awaiting_customer_confirmation`)
-   Xem tóm tắt dịch vụ và hóa đơn
-   Chọn: "Tự nhận" hoặc "Yêu cầu giao hàng"
-   Nếu giao hàng: Cung cấp địa chỉ và thời gian ưu tiên
-   Đếm ngược thời hạn (3 ngày, sau đó tự động chuyển về nhận hàng)

**3. Hủy yêu cầu** (chỉ khi trạng thái = `submitted`)
-   Hủy trước khi nhận sản phẩm
-   Chọn lý do (tùy chọn)
-   Yêu cầu hộp thoại xác nhận

**4. Tải xuống biên nhận/hóa đơn**
-   Tải xuống PDF biên nhận dịch vụ
-   Bao gồm tất cả chi tiết dịch vụ, chi phí, thông tin bảo hành
-   Có sẵn sau khi hoàn thành dịch vụ

**5. Liên hệ trung tâm dịch vụ**
-   Biểu mẫu liên hệ được điền sẵn với bối cảnh phiếu sửa chữa
-   Hiển thị số điện thoại và email
-   Tích hợp trò chuyện trực tiếp (xem xét trong tương lai)

**Quy tắc kinh doanh**:
-   Các hành động chỉ có sẵn khi phiếu sửa chữa ở trạng thái thích hợp
-   Tất cả các hành động được ghi lại với dấu thời gian và địa chỉ IP
-   Email xác nhận được gửi sau mỗi hành động
-   Các hành động không thể hoàn tác (hiển thị cảnh báo)

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN phê duyệt sửa chữa và chọn các tùy chọn giao hàng trực tuyến
ĐỂ TÔI không phải gọi điện hoặc đến trung tâm dịch vụ
```

**Tiêu chí chấp nhận**:
- [ ] Các nút hành động chỉ hiển thị khi áp dụng
- [ ] Hướng dẫn rõ ràng cho mỗi hành động
- [ ] Hộp thoại xác nhận ngăn chặn các hành động vô tình
- [ ] Thông báo thành công sau khi hoàn thành hành động
- [ ] Email xác nhận được gửi cho mỗi hành động
- [ ] Giao diện hành động thân thiện với thiết bị di động

---

### FR-PPT-006: Tích hợp mã QR

**Mô tả**: Tạo và quét mã QR để truy cập theo dõi nhanh chóng.

**Các loại mã QR**:

**1. Mã QR theo dõi** (trên biên nhận của khách hàng)
-   Chứa: URL theo dõi với mã được nhúng
-   Định dạng: `https://domain.com/track/{tracking_token}`
-   Được in trên biên nhận đưa cho khách hàng
-   Có thể quét qua bất kỳ ứng dụng đọc QR nào

**2. Mã QR xác minh nhận hàng** (để tự nhận hàng)
-   Chứa: Mã xác minh + ID phiếu sửa chữa
-   Định dạng: Tải trọng JSON cho ứng dụng quét của nhân viên
-   Hiển thị trên trang theo dõi khi sẵn sàng để nhận hàng
-   Nhân viên quét để xác minh danh tính khách hàng và hoàn tất việc nhận hàng

**Tạo mã QR**:
```typescript
// Mã QR theo dõi
const trackingQrCode = generateQRCode({
  data: `https://sstc.com/track/${trackingToken}`,
  size: 200,
  errorCorrection: 'M'
});

// Mã QR xác minh nhận hàng
const pickupQrCode = generateQRCode({
  data: JSON.stringify({
    type: 'pickup_verification',
    ticket_id: ticketId,
    tracking_token: trackingToken,
    customer_name: customerName,
    verification_code: generateVerificationCode()
  }),
  size: 250,
  errorCorrection: 'H' // Sửa lỗi cao để đảm bảo độ tin cậy
});
```

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN quét mã QR để nhanh chóng truy cập trạng thái dịch vụ của mình
ĐỂ TÔI không phải nhập số theo dõi thủ công
```

**Tiêu chí chấp nhận**:
- [ ] Mã QR được in trên biên nhận của khách hàng
- [ ] Mã QR có thể quét bằng các ứng dụng máy ảnh tiêu chuẩn
- [ ] Trang theo dõi hiển thị QR nhận hàng khi sẵn sàng
- [ ] Mã QR hoạt động ngoại tuyến (URL tĩnh, không động)
- [ ] Độ tương phản cao để quét đáng tin cậy

---

### FR-PPT-007: Tùy chọn thông báo

**Mô tả**: Khách hàng có thể quản lý cách họ nhận cập nhật (email, SMS trong tương lai).

**Tùy chọn ưu tiên**:
-   Thông báo qua email BẬT/TẮT (mặc định: BẬT)
-   Thông báo qua SMS BẬT/TẮT (tính năng tương lai, mặc định: TẮT)
-   Tần suất thông báo: Tất cả cập nhật | Chỉ các mốc quan trọng
-   Số điện thoại liên hệ (cho SMS khi được triển khai)

**Quản lý ưu tiên**:
-   Liên kết trong trang theo dõi: "Cài đặt thông báo"
-   Liên kết ở chân trang email: "Cập nhật tùy chọn thông báo"
-   Các thay đổi áp dụng ngay lập tức
-   Email xác nhận được gửi khi tùy chọn thay đổi

**Thông báo quan trọng** (không thể tắt):
-   Dịch vụ đã hoàn thành
-   Chờ phê duyệt (yêu cầu hành động)
-   Sẵn sàng để nhận (yêu cầu hành động)

**Quy tắc kinh doanh**:
-   Khách hàng có thể giảm thông báo nhưng không thể tắt các thông báo quan trọng
-   Không cho phép hủy đăng ký tất cả các email (email giao dịch)
-   Các tùy chọn được lưu trữ cho mỗi mã theo dõi (không phải tài khoản toàn cục)

**Câu chuyện người dùng**:
```
LÀ một khách hàng
TÔI MUỐN kiểm soát tần suất nhận thông báo
ĐỂ TÔI không bị quá tải với email nhưng vẫn được thông báo
```

**Tiêu chí chấp nhận**:
- [ ] Liên kết tùy chọn thông báo trong trang theo dõi
- [ ] Các nút bật/tắt đơn giản
- [ ] Các thông báo quan trọng được đánh dấu rõ ràng
- [ ] Các thay đổi được lưu ngay lập tức
- [ ] Thông báo xác nhận được hiển thị

---

### FR-PPT-008: Thiết kế đáp ứng ưu tiên thiết bị di động

**Mô tả**: Cổng thông tin theo dõi được tối ưu hóa cho các thiết bị di động (dự kiến hơn 60% lưu lượng truy cập).

**Nguyên tắc thiết kế di động**:
-   **Ưu tiên di động**: Thiết kế cho màn hình nhỏ, nâng cao cho máy tính để bàn
-   **Thân thiện với cảm ứng**: Mục tiêu cảm ứng tối thiểu 44px
-   **Dễ đọc**: Kích thước phông chữ tối thiểu 16px, độ tương phản cao
-   **Tải nhanh**: Hình ảnh được tối ưu hóa, JS tối thiểu
-   **Thân thiện với ngoại tuyến**: Hiển thị dữ liệu được lưu trong bộ nhớ cache nếu mất kết nối

**Điểm ngắt đáp ứng**:
-   Di động: <640px (một cột, bố cục xếp chồng)
-   Máy tính bảng: 640-1024px (hai cột nếu phù hợp)
-   Máy tính để bàn: >1024px (bố cục đầy đủ với thanh bên)

**Các tính năng dành riêng cho thiết bị di động**:
-   **Nhấp để gọi**: Số điện thoại có thể chạm để gọi
-   **Nhấp để gửi email**: Địa chỉ email mở ứng dụng thư
-   **Thêm vào lịch**: Thêm cuộc hẹn nhận hàng vào lịch điện thoại
-   **Chia sẻ liên kết**: Bảng chia sẻ gốc để chia sẻ liên kết theo dõi

**Mục tiêu hiệu suất**:
-   First Contentful Paint: <1,5 giây trên 3G
-   Time to Interactive: <3 giây trên 3G
-   Điểm hiệu suất Lighthouse: >90

**Câu chuyện người dùng**:
```
LÀ một khách hàng trên thiết bị di động
TÔI MUỐN trang theo dõi hoạt động trơn tru trên điện thoại của mình
ĐỂ TÔI có thể kiểm tra trạng thái ở bất cứ đâu, bất cứ lúc nào
```

**Tiêu chí chấp nhận**:
- [ ] Thiết kế đáp ứng được kiểm tra trên iOS và Android
- [ ] Các mục tiêu cảm ứng đáp ứng các nguyên tắc trợ năng
- [ ] Không có cuộn ngang trên thiết bị di động
- [ ] Thời gian tải nhanh trên các kết nối chậm
- [ ] Hoạt động ngoại tuyến với dữ liệu được lưu trong bộ nhớ cache

---

### FR-PPT-009: Hỗ trợ đa ngôn ngữ

**Mô tả**: Hỗ trợ tiếng Việt và tiếng Anh trong cổng thông tin công khai.

**Tùy chọn ngôn ngữ**:
-   **Chính**: Tiếng Việt (mặc định cho thị trường Việt Nam)
-   **Phụ**: Tiếng Anh (cho khách hàng quốc tế)
-   Nút chuyển đổi ngôn ngữ ở đầu trang (cờ VN | EN)
-   Tùy chọn ngôn ngữ được lưu trong cookie của trình duyệt

**Nội dung được dịch**:
-   Tất cả các nhãn và nút giao diện người dùng
-   Mô tả trạng thái
-   Thông báo qua email
-   Thông báo lỗi
-   Văn bản trợ giúp và chú giải công cụ

**Quy tắc kinh doanh**:
-   Dữ liệu dịch vụ (ghi chú, mô tả) vẫn giữ nguyên ngôn ngữ gốc
-   Tự động phát hiện ngôn ngữ trình duyệt trong lần truy cập đầu tiên
-   Ngôn ngữ giao diện nhân viên độc lập với cổng thông tin công khai

**Câu chuyện người dùng**:
```
LÀ một khách hàng quốc tế
TÔI MUỐN xem thông tin theo dõi bằng tiếng Anh
ĐỂ TÔI có thể hiểu trạng thái dịch vụ
```

**Tiêu chí chấp nhận**:
- [ ] Nút chuyển đổi ngôn ngữ được hiển thị nổi bật
- [ ] Tất cả nội dung tĩnh được dịch
- [ ] Tùy chọn ngôn ngữ tồn tại qua các phiên
- [ ] Không yêu cầu hỗ trợ RTL (VN và EN đều là LTR)
- [ ] Định dạng ngày/giờ được bản địa hóa

---

### FR-PPT-010: Phân tích và theo dõi tương tác

**Mô tả**: Theo dõi sự tương tác của khách hàng với cổng thông tin theo dõi để có thông tin chi tiết và cải tiến.

**Các chỉ số được theo dõi**:
-   Lượt xem trang cho mỗi mã theo dõi
-   Thời gian dành cho trang theo dõi
-   Các hành động được thực hiện (phê duyệt, xác nhận giao hàng)
-   Tỷ lệ quét mã QR
-   Tỷ lệ nhấp qua liên kết email
-   Loại thiết bị (di động so với máy tính để bàn)
-   Loại trình duyệt
-   Tỷ lệ thoát (lượt xem một trang)

**Cân nhắc về quyền riêng tư**:
-   Không theo dõi nhận dạng cá nhân (tuân thủ GDPR)
-   Chỉ phân tích tổng hợp
-   Không có pixel theo dõi của bên thứ ba
-   Biểu ngữ đồng ý cookie nếu được yêu cầu bởi khu vực pháp lý

**Thông tin chi tiết kinh doanh**:
-   Xác định khách hàng có mức độ tương tác thấp để theo dõi
-   Tối ưu hóa thời gian thông báo dựa trên tỷ lệ mở
-   Cải thiện trải nghiệm di động dựa trên dữ liệu thiết bị
-   Thử nghiệm A/B các thay đổi bố cục

**Câu chuyện người dùng**:
```
LÀ một chủ doanh nghiệp
TÔI MUỐN hiểu cách khách hàng sử dụng cổng thông tin theo dõi
ĐỂ TÔI có thể cải thiện trải nghiệm và tăng cường sự tương tác
```

**Tiêu chí chấp nhận**:
- [ ] Bảng điều khiển phân tích cho ban quản lý
- [ ] Triển khai theo dõi tuân thủ quyền riêng tư
- [ ] Không ảnh hưởng đến hiệu suất tải trang
- [ ] Có cơ chế từ chối
- [ ] Chính sách lưu giữ dữ liệu được xác định (90 ngày)

---

## Mô hình dữ liệu

### Bảng phiên theo dõi

```sql
CREATE TABLE tracking_sessions (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bối cảnh
  tracking_token VARCHAR(20) NOT NULL REFERENCES service_requests(tracking_token),

  -- Dữ liệu phiên
  session_id VARCHAR(100) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(50),

  -- Tương tác
  first_visit_at TIMESTAMP DEFAULT now(),
  last_visit_at TIMESTAMP DEFAULT now(),
  page_views INT DEFAULT 1,
  actions_taken JSONB DEFAULT '[]', -- Mảng các đối tượng hành động

  -- Nguồn
  referrer VARCHAR(255), -- 'email', 'qr_code', 'direct', 'search'
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),

  -- Tùy chọn
  language_preference VARCHAR(10) DEFAULT 'vi',
  notification_preferences JSONB
);

-- Chỉ mục
CREATE INDEX idx_tracking_sessions_token ON tracking_sessions(tracking_token);
CREATE INDEX idx_tracking_sessions_session ON tracking_sessions(session_id);
CREATE INDEX idx_tracking_sessions_first_visit ON tracking_sessions(first_visit_at);
```

---

### Bảng hành động của khách hàng

```sql
CREATE TABLE customer_actions (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bối cảnh
  tracking_token VARCHAR(20) NOT NULL REFERENCES service_requests(tracking_token),
  ticket_id UUID REFERENCES service_tickets(id),
  session_id VARCHAR(100),

  -- Chi tiết hành động
  action_type VARCHAR(50) NOT NULL, -- 'approve_repair', 'decline_repair', 'confirm_delivery', 'cancel_request', 'download_receipt'
  action_data JSONB, -- Dữ liệu dành riêng cho hành động

  -- Siêu dữ liệu
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMP DEFAULT now(),

  -- Kết quả
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Chỉ mục
CREATE INDEX idx_customer_actions_token ON customer_actions(tracking_token);
CREATE INDEX idx_customer_actions_ticket ON customer_actions(ticket_id);
CREATE INDEX idx_customer_actions_type ON customer_actions(action_type);
CREATE INDEX idx_customer_actions_performed ON customer_actions(performed_at DESC);
```

---

### Bảng nhật ký mã QR

```sql
CREATE TABLE qr_code_scans (
  -- Nhận dạng chính
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bối cảnh
  tracking_token VARCHAR(20) NOT NULL REFERENCES service_requests(tracking_token),
  qr_code_type VARCHAR(20) NOT NULL, -- 'tracking', 'pickup_verification'

  -- Chi tiết quét
  scanned_at TIMESTAMP DEFAULT now(),
  scanner_device VARCHAR(50), -- 'ios', 'android', 'web', 'staff_app'
  ip_address INET,

  -- Vị trí (nếu được cấp quyền GPS)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Chỉ mục
CREATE INDEX idx_qr_scans_token ON qr_code_scans(tracking_token);
CREATE INDEX idx_qr_scans_scanned_at ON qr_code_scans(scanned_at DESC);
```

---

## Quy tắc kinh doanh

### BR-PPT-001: Bảo mật mã theo dõi

**Quy tắc**: Mã theo dõi phải đủ ngẫu nhiên để ngăn chặn các cuộc tấn công liệt kê.

**Định dạng mã**: `SR-YYYYMMDD-XXXXX`
-   Phần ngày: Xác định ngày tạo (không bí mật)
-   Phần chuỗi: Số có 5 chữ số (00001-99999)
-   Ngẫu nhiên hóa: Chuỗi hàng ngày được ngẫu nhiên hóa (không tuần tự)

**Biện pháp bảo mật**:
-   Giới hạn tốc độ: 20 yêu cầu mỗi mã mỗi giờ
-   Giới hạn tốc độ dựa trên IP: 100 yêu cầu mỗi IP mỗi giờ
-   Các lần truy cập không thành công được ghi lại
-   Không cho phép liệt kê mã (tìm kiếm bị vô hiệu hóa)

**Thực thi**:
```typescript
// Middleware giới hạn tốc độ
async function trackingRateLimiter(req, res, next) {
  const token = req.params.tracking_token;
  const ip = req.ip;

  // Kiểm tra giới hạn tốc độ dựa trên mã
  const tokenRequests = await redis.incr(`rate:token:${token}`);
  if (tokenRequests === 1) await redis.expire(`rate:token:${token}`, 3600);
  if (tokenRequests > 20) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu cho mã theo dõi này' });
  }

  // Kiểm tra giới hạn tốc độ dựa trên IP
  const ipRequests = await redis.incr(`rate:ip:${ip}`);
  if (ipRequests === 1) await redis.expire(`rate:ip:${ip}`, 3600);
  if (ipRequests > 100) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu từ địa chỉ IP của bạn' });
  }

  next();
}
```

---

### BR-PPT-002: Ủy quyền hành động

**Quy tắc**: Các hành động của khách hàng phải được ủy quyền dựa trên trạng thái và thời gian của phiếu sửa chữa hiện tại.

**Ma trận ủy quyền**:

| Hành động | Được phép khi | Hạn chót |
|---|---|---|
| Hủy yêu cầu | trạng thái = 'submitted' | Bất cứ lúc nào trước khi nhận |
| Phê duyệt sửa chữa | trạng thái = 'awaiting_approval' | Trong vòng 3 ngày |
| Từ chối sửa chữa | trạng thái = 'awaiting_approval' | Trong vòng 3 ngày |
| Xác nhận giao hàng | trạng thái = 'awaiting_customer_confirmation' | Trong vòng 3 ngày |
| Tải xuống biên nhận | trạng thái = 'completed' | Bất cứ lúc nào |

**Thực thi**:
```sql
CREATE OR REPLACE FUNCTION validate_customer_action(
  p_ticket_id UUID,
  p_action_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  ticket_status VARCHAR(50);
  ticket_completed_at TIMESTAMP;
BEGIN
  -- Lấy trạng thái phiếu sửa chữa
  SELECT status, completed_at
  INTO ticket_status, ticket_completed_at
  FROM service_tickets
  WHERE id = p_ticket_id;

  -- Xác thực hành động dựa trên trạng thái
  CASE p_action_type
    WHEN 'approve_repair', 'decline_repair' THEN
      RETURN ticket_status = 'awaiting_approval';

    WHEN 'confirm_delivery' THEN
      RETURN ticket_status = 'awaiting_customer_confirmation'
         AND ticket_completed_at > now() - INTERVAL '3 days';

    WHEN 'download_receipt' THEN
      RETURN ticket_status = 'completed';

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

### BR-PPT-003: Quy tắc hiển thị dữ liệu

**Quy tắc**: Chỉ dữ liệu phù hợp với khách hàng mới được hiển thị trên cổng thông tin theo dõi.

**Dữ liệu bị ẩn**:
-   Tên đầy đủ và thông tin liên hệ của nhân viên
-   Phân tích chi phí nội bộ (lợi nhuận lao động, chênh lệch giá phụ tùng)
-   Ghi chú của nhân viên và bình luận nội bộ
-   Thông tin của các khách hàng khác
-   Chi tiết chẩn đoán nhạy cảm (chỉ hiển thị tóm tắt)

**Dữ liệu hiển thị**:
-   Thông tin của chính khách hàng
-   Chi tiết sản phẩm và tình trạng bảo hành
-   Tiến trình dịch vụ cấp cao
-   Tổng chi phí (không phải phân tích chi tiết)
-   Mô tả trạng thái an toàn công khai

**Thực thi** (chế độ xem cơ sở dữ liệu):
```sql
CREATE VIEW public_tracking_view AS
SELECT
  sr.tracking_token,
  sr.customer_name,
  sr.customer_phone,
  sr.customer_email,
  sr.status,
  sr.created_at,
  sr.expected_products,

  st.ticket_number,
  st.status AS ticket_status,
  st.service_type,
  st.diagnosis_notes, -- Chỉ phiên bản đã được làm sạch
  st.total_cost,
  st.completed_at,

  -- Tiến trình công việc đã được làm sạch (nhãn thân thiện với khách hàng)
  (SELECT json_agg(
    json_build_object(
      'name', COALESCE(customer_task_labels.label, tt.name),
      'status', stt.status,
      'completed_at', stt.completed_at
    )
    ORDER BY stt.sequence_order
  )
  FROM service_ticket_tasks stt
  JOIN task_types tt ON stt.task_type_id = tt.id
  LEFT JOIN customer_task_labels ON tt.id = customer_task_labels.task_type_id
  WHERE stt.ticket_id = st.id
  ) AS tasks

FROM service_requests sr
LEFT JOIN service_tickets st ON st.request_id = sr.id
WHERE sr.status != 'cancelled';
```

---

### BR-PPT-004: Cơ chế cập nhật thời gian thực

**Quy tắc**: Trang theo dõi phải phản ánh trạng thái hiện tại trong vòng 10 giây sau bất kỳ thay đổi nào.

**Tùy chọn triển khai**:

**Tùy chọn A: WebSocket (Khuyến nghị)**
-   Máy chủ đẩy cập nhật đến các máy khách được kết nối
-   Cập nhật tức thì khi trạng thái phiếu sửa chữa thay đổi
-   Tải máy chủ thấp hơn so với thăm dò

**Tùy chọn B: Thăm dò ngắn (Dự phòng)**
-   Máy khách yêu cầu cập nhật sau mỗi 30-60 giây
-   Hoạt động với tất cả các trình duyệt, không cần cơ sở hạ tầng đặc biệt
-   Tải máy chủ cao hơn

**Thực thi**:
```typescript
// Triển khai WebSocket
io.on('connection', (socket) => {
  // Máy khách đăng ký mã theo dõi
  socket.on('track', (trackingToken) => {
    socket.join(`tracking:${trackingToken}`);
  });

  // Phát cập nhật khi phiếu sửa chữa thay đổi
  async function onTicketUpdate(ticketId) {
    const ticket = await getTicketDetails(ticketId);
    const trackingToken = ticket.request.tracking_token;

    io.to(`tracking:${trackingToken}`).emit('status_update', {
      ticket: sanitizeForPublic(ticket),
      timestamp: new Date()
    });
  }
});
```

---

### BR-PPT-005: Khả năng ngoại tuyến

**Quy tắc**: Trang theo dõi phải hiển thị trạng thái đã biết cuối cùng nếu mất kết nối.

**Hành vi**:
-   Lưu trữ dữ liệu theo dõi trong localStorage của trình duyệt
-   Hiển thị dữ liệu được lưu trong bộ nhớ cache với cảnh báo "Cập nhật lần cuối: X phút trước"
-   Tự động thử lại kết nối
-   Hiển thị biểu ngữ "Ngoại tuyến - đang cố gắng kết nối lại"

**Thực thi**:
```typescript
// Service Worker để hỗ trợ ngoại tuyến
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/track/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return fetch(event.request)
          .then((networkResponse) => {
            // Cập nhật bộ nhớ cache với dữ liệu mới
            caches.open('tracking-v1').then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
            return networkResponse;
          })
          .catch(() => {
            // Mạng không thành công, trả về dữ liệu được lưu trong bộ nhớ cache
            return cachedResponse || new Response('Ngoại tuyến - vui lòng thử lại sau');
          });
      })
    );
  }
});
```

---

## Luồng công việc

### Luồng công việc 1: Hành trình theo dõi của khách hàng

```
┌─────────────────────────────────────────────────────────────┐
│                 HÀNH TRÌNH THEO DÕI CỦA KHÁCH HÀNG                   │
└─────────────────────────────────────────────────────────────┘

KHÁCH HÀNG                        HỆ THỐNG

1. Nhận biên nhận với ◄───────────── Lễ tân in biên nhận
   số theo dõi + mã QR            ├─> Số theo dõi: SR-20251022-00001
                                         └─> Mã QR: URL theo dõi

2. Quét mã QR hoặc ─────────────────> Phát hiện quét qua nhật ký mã QR
   nhấp vào liên kết email

3. Chuyển hướng đến trang theo dõi ◄──────── Tải: /track/SR-20251022-00001
   https://sstc.com/track/             │
   SR-20251022-00001                    ├─> Kiểm tra giới hạn tốc độ (vượt qua)
                                         ├─> Xác thực mã (hợp lệ)
                                         └─> Lấy dữ liệu theo dõi

4. Xem trang theo dõi ◄─────────────── Hiển thị giao diện theo dõi:
   ┌─────────────────────────────┐     ├─> Thanh tiến trình
   │ 🔍 Theo dõi dịch vụ của bạn       │     ├─> Dòng thời gian
   │ SR-20251022-00001           │     ├─> Chi tiết sản phẩm
   │                              │     ├─> Trạng thái dịch vụ
   │ Trạng thái: Đang chẩn đoán         │     └─> Ước tính hoàn thành
   │                              │
   │ ●───●───●───○───○            │
   │ Đã gửi → Đã nhận →       │
   │ Chẩn đoán → Sửa chữa →         │
   │ Hoàn thành                    │
   │                              │
   │ iPhone 14 Pro                │
   │ Phiếu sửa chữa: SV-2025-001          │
   │                              │
   │ Dòng thời gian:                    │
   │ ✅ 22/10, 10:30 - Đã gửi │
   │ ✅ 22/10, 14:00 - Đã nhận  │
   │ ⏳ 22/10, 15:30 - Chẩn đoán │
   │                              │
   │ Ước tính hoàn thành: 24/10      │
   └─────────────────────────────┘

5. Đăng ký cập nhật ────────────> Kết nối WebSocket
   (tự động)                         └─> Tham gia phòng: tracking:SR-20251022-00001

6. Tiếp tục sử dụng điện thoại ───────────────────────────────────────────
   (trang theo dõi ở chế độ nền)

                    [30 phút sau]

7. Phiếu sửa chữa được cập nhật (nhân viên) ──────────> Kỹ thuật viên hoàn thành chẩn đoán
                                       └─> Trạng thái phiếu sửa chữa: awaiting_approval

8. Nhận cập nhật thời gian thực ◄──────── Phát WebSocket:
   (trang tự động cập nhật)                 └─> sự kiện status_update

9. Xem trạng thái đã cập nhật ◄────────────── Hiển thị lại trang theo dõi:
   ┌─────────────────────────────┐     ├─> Huy hiệu trạng thái mới
   │ Trạng thái: Chờ phê duyệt   │     ├─> Nút hành động xuất hiện
   │                              │     └─> Cập nhật dòng thời gian
   │ ⚠️ Yêu cầu hành động           │
   │                              │
   │ Chẩn đoán hoàn tất:          │
   │ Bộ số hóa màn hình bị lỗi      │
   │ Pin bị chai (65%)       │
   │                              │
   │ Chi phí sửa chữa: 800.000 VNĐ     │
   │ ├─> Chẩn đoán: 100.000       │
   │ ├─> Phụ tùng: 500.000           │
   │ └─> Công lao động: 200.000           │
   │                              │
   │ Phê duyệt trước: 25/10 (3 ngày)  │
   │                              │
   │ [ Phê duyệt sửa chữa ]           │
   │ [ Từ chối sửa chữa ]           │
   └─────────────────────────────┘

10. Cũng nhận được email ◄────────────── Email thông báo được gửi:
    thông báo                        "Yêu cầu hành động: Phê duyệt sửa chữa"

11. Xem lại chi tiết chi phí
    └─> Cuộn qua chẩn đoán

12. Nhấp vào "Phê duyệt sửa chữa" ─────────> Hộp thoại xác nhận:
                                       "Phê duyệt sửa chữa với giá 800.000 VNĐ?"

13. Xác nhận phê duyệt ───────────────> POST /api/public/approve-repair
                                       │
                                       ├─> Xác thực hành động (được phép)
                                       ├─> Cập nhật phiếu sửa chữa: trạng thái = đã phê duyệt
                                       ├─> Ghi nhật ký customer_action
                                       └─> Gửi email xác nhận

14. Xem thông báo thành công ◄──────────── "Sửa chữa đã được phê duyệt! Công việc sẽ sớm bắt đầu."
    └─> Trang cập nhật thành                └─> Cập nhật WebSocket được gửi
        "Đang tiến hành sửa chữa"

15. Tiếp tục theo dõi tiến trình ────────────────────────────────────>
    trong vài ngày tới                 (lặp lại các bước 5-9 khi trạng thái cập nhật)

                    [2 ngày sau]

16. Thông báo cuối cùng ◄───────────── Phiếu sửa chữa đã hoàn thành:
    "Thiết bị sẵn sàng để nhận"          └─> Email + cập nhật WebSocket

17. Mở trang theo dõi ─────────────> Tải trạng thái mới nhất

18. Xem trạng thái hoàn thành ◄────────── Hiển thị chế độ xem hoàn thành:
    ┌─────────────────────────────┐
    │ ✅ Dịch vụ đã hoàn thành!       │
    │                              │
    │ Thiết bị của bạn đã sẵn sàng!        │
    │                              │
    │ Chọn phương thức giao hàng:      │
    │                              │
    │ [ Tự nhận ]              │
    │ [ Yêu cầu giao hàng ]         │
    │                              │
    │ Mã QR để nhận hàng:          │
    │ [   HÌNH ẢNH MÃ QR   ]        │
    │                              │
    │ [ Tải xuống biên nhận ]         │
    └─────────────────────────────┘

19. Chọn "Tự nhận" ───────────> POST /api/public/confirm-delivery
                                       └─> delivery_method: self_pickup

20. Xem chi tiết nhận hàng ◄───────────── Hiển thị hướng dẫn nhận hàng:
    + Mã QR                          ├─> Địa chỉ trung tâm dịch vụ
    + Địa chỉ                           ├─> Giờ hoạt động
    + Giờ                             ├─> Mã QR để xác minh
                                         └─> Tổng số tiền phải trả

21. Đến trung tâm dịch vụ
    └─> Đưa mã QR cho nhân viên ──────> Nhân viên quét mã QR
                                       └─> Xác minh khách hàng + phiếu sửa chữa

22. Nhận thiết bị ◄───────────────── Nhân viên hoàn tất việc nhận hàng:
    + Thanh toán số tiền phải trả                   └─> Phiếu sửa chữa: trạng thái = đã đóng
    + Nhận biên nhận
```
