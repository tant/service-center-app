
# Tóm tắt Dự án: Trung tâm Dịch vụ Giai đoạn 2 - Quy trình, Bảo hành & Kho hàng

**Phiên bản:** 1.0
**Ngày:** 2025-10-23
**Mã dự án:** SC-PHASE2
**Trạng thái:** Bản nháp chờ xét duyệt

---

## Tóm tắt Điều hành

Dự án Trung tâm Dịch vụ Giai đoạn 2 nâng cao hệ thống quản lý phiếu dịch vụ hiện có bằng cách giới thiệu ba khả năng quan trọng: **Quản lý Quy trình công việc dựa trên Nhiệm vụ**, **Hỗ trợ Dịch vụ Bảo hành Toàn diện**, và **Quản lý Kho hàng với Theo dõi Sản phẩm Vật lý**.

Hiện tại, hệ thống theo dõi các phiếu dịch vụ thông qua các chuyển đổi trạng thái đơn giản (chờ xử lý → đang xử lý → đã hoàn thành). Giai đoạn 2 biến đổi điều này thành một hệ thống quy trình công việc có cấu trúc, dựa trên nhiệm vụ, đảm bảo tính nhất quán, cho phép xác minh bảo hành và cung cấp khả năng kiểm soát tồn kho chi tiết thông qua quản lý kho hai cấp.

**Vấn đề chính cần giải quyết**: Các trung tâm dịch vụ thiếu quy trình có cấu trúc để quản lý các luồng công việc sửa chữa phức tạp, không thể xác minh điều kiện bảo hành ngay từ đầu và không có cách thức hệ thống để theo dõi sản phẩm vật lý và quản lý hoạt động kho.

**Thị trường mục tiêu**: Các trung tâm dịch vụ và sửa chữa xử lý các yêu cầu bảo hành, quy trình thay thế và quản lý tồn kho cho các sản phẩm điện tử và thiết bị gia dụng.

**Giá trị cốt lõi**: Chuyển đổi từ việc theo dõi phiếu cơ bản thành một nền tảng quản lý dịch vụ toàn diện với khả năng xác minh bảo hành, quy trình công việc theo tiêu chuẩn, quản lý RMA và kiểm soát tồn kho vật lý.

---

## Tuyên bố Vấn đề

### Tình trạng hiện tại và các khó khăn

Ứng dụng Trung tâm Dịch vụ (v1.0) hiện tại cung cấp các nền tảng vững chắc:
- Quản lý vòng đời phiếu dịch vụ với đánh số tự động
- Quản lý quan hệ khách hàng
- Danh mục sản phẩm và theo dõi tồn kho linh kiện
- Kiểm soát truy cập dựa trên vai trò
- Bảng điều khiển phân tích thời gian thực

Tuy nhiên, vẫn còn những khoảng trống quan trọng:

1.  **Không có Quản lý Quy trình công việc có cấu trúc**
    - Kỹ thuật viên dựa vào kiến thức ngầm về quy trình dịch vụ
    - Không có danh sách kiểm tra tiêu chuẩn để đảm bảo chất lượng và tính nhất quán
    - Quản lý không có cái nhìn sâu vào tiến độ công việc chi tiết
    - Kỹ thuật viên mới cần đào tạo sâu rộng để hiểu quy trình dịch vụ
    - **Tác động**: Chất lượng dịch vụ không nhất quán, lỗi trong các bước quan trọng, quá trình hòa nhập chậm

2.  **Không có Hệ thống Xác minh Bảo hành**
    - Không thể xác minh điều kiện bảo hành trước khi nhận sản phẩm
    - Không phân biệt giữa bảo hành của nhà sản xuất và bảo hành của công ty
    - Không có theo dõi tự động ngày hết hạn bảo hành
    - **Tác động**: Nhận các mặt hàng không thuộc diện bảo hành, khách hàng không hài lòng, mất doanh thu

3.  **Không có Theo dõi Sản phẩm Vật lý**
    - Tồn kho linh kiện được theo dõi, nhưng sản phẩm có số sê-ri thì không
    - Không thể truy vết từng sản phẩm riêng lẻ trong vòng đời dịch vụ
    - Không có quy trình RMA (Ủy quyền Trả lại Hàng hóa)
    - **Tác động**: Không thể quản lý việc thay thế sản phẩm, không có dấu vết kiểm toán cho các yêu cầu bảo hành

4.  **Không có Quản lý Kho hàng**
    - Không có sự tách biệt giữa hàng bảo hành, hàng chờ RMA và hàng hỏng
    - Không thể theo dõi sự di chuyển của sản phẩm giữa các địa điểm
    - Không có cảnh báo tồn kho thấp cho hàng thay thế
    - **Tác động**: Hết hàng đối với các sản phẩm thay thế bảo hành quan trọng, tồn kho không có tổ chức

### Tác động có thể định lượng

- **Tính nhất quán của Dịch vụ**: Ước tính 30% kỹ thuật viên bỏ qua các bước xác minh do thiếu danh sách kiểm tra
- **Lỗi Bảo hành**: ~15% yêu cầu bảo hành cần làm lại do vấn đề xác minh điều kiện
- **Khả năng hiển thị Tồn kho**: Quản lý dành 2-3 giờ mỗi tuần để theo dõi thủ công mức tồn kho bảo hành
- **Trải nghiệm Khách hàng**: Chậm trễ trung bình 2 ngày cho khách hàng chờ xác nhận điều kiện bảo hành

### Tại sao các giải pháp hiện tại chưa đủ tốt

- **Hệ thống phiếu chung** (Zendesk, Freshdesk): Được thiết kế cho hỗ trợ CNTT, không phải cho quy trình sửa chữa vật lý
- **Hệ thống quản lý tồn kho** (Zoho Inventory): Thiếu tích hợp phiếu dịch vụ và theo dõi bảo hành
- **Phần mềm cửa hàng sửa chữa** (RepairShopr, Syncro): Đắt đỏ, quá phức tạp, thiếu hỗ trợ tiếng Việt

### Tính cấp thiết và Tầm quan trọng

**Tại sao là bây giờ:**
- Việc áp dụng hệ thống hiện tại đang rất tốt (cả 4 vai trò người dùng đều đang sử dụng tích cực)
- Doanh nghiệp đang mở rộng (3 kỹ thuật viên mới được tuyển trong Q1 2025)
- Lượng yêu cầu bảo hành ngày càng tăng (tăng 40% trong Q4 2024)
- Nền tảng hiện có (kiến trúc, cơ sở dữ liệu, xác thực) đã sẵn sàng để nâng cấp

---

## Giải pháp đề xuất

### Khái niệm cốt lõi và Cách tiếp cận

Giai đoạn 2 xây dựng trên kiến trúc brownfield hiện có để thêm ba mô-đun liên kết với nhau:

**1. Hệ thống Quy trình công việc**
- Quy trình dựa trên mẫu với các chuỗi nhiệm vụ được xác định trước
- Các mẫu khác nhau cho dịch vụ bảo hành, sửa chữa có tính phí và các kịch bản thay thế
- Thư viện nhiệm vụ với các định nghĩa có thể tái sử dụng (chẩn đoán, sửa chữa, các bước QA)
- Chuyển đổi mẫu động khi loại dịch vụ thay đổi
- Theo dõi tiến độ ở cấp độ nhiệm vụ (không chỉ trạng thái phiếu)

**2. Lớp Dịch vụ Bảo hành**
- Cổng xác minh số sê-ri (cổng thông tin công khai)
- Theo dõi bảo hành hai cấp (bảo hành của nhà sản xuất + công ty)
- Tính toán tự động ngày hết hạn bảo hành
- Tạo yêu cầu dịch vụ trước khi mang sản phẩm đến
- Quản lý sai lệch (sản phẩm dự kiến so với sản phẩm nhận được)

**3. Quản lý Kho hàng**
- Phân cấp hai cấp: Kho vật lý → Kho ảo
- Các loại kho ảo: Hàng bảo hành, Hàng chờ RMA, Hàng hỏng, Đang dịch vụ
- Dữ liệu chính sản phẩm vật lý với theo dõi số sê-ri
- Ghi nhật ký di chuyển hàng hóa với hỗ trợ quét mã vạch
- Cảnh báo tồn kho thấp và điểm đặt hàng lại tự động

### Các điểm khác biệt chính

**so với Theo dõi Trạng thái Đơn giản:**
- Tiến độ chi tiết ở cấp độ nhiệm vụ thay vì trạng thái "đang xử lý" hộp đen
- Danh sách kiểm tra đảm bảo chất lượng và sự hoàn chỉnh
- Dữ liệu lịch sử cho phép cải thiện ước tính thời gian

**so với Hệ thống Tồn kho Chung:**
- Được xây dựng chuyên dụng cho quy trình của trung tâm dịch vụ
- Tích hợp xác minh bảo hành và quản lý RMA
- Kết nối liền mạch giữa phiếu dịch vụ và sản phẩm vật lý

**so với Giải pháp của Đối thủ:**
- Xây dựng trên nền tảng brownfield hiện có (không cần di chuyển)
- An toàn kiểu dữ liệu từ đầu đến cuối (TypeScript + tRPC)
- Hỗ trợ tiếng Việt với tính năng làm sạch tên tệp
- Ngăn xếp mã nguồn mở (không bị khóa nhà cung cấp)

### Tại sao giải pháp này sẽ thành công

1.  **Nâng cấp tăng dần**: Xây dựng trên nền tảng đã được chứng minh thay vì viết lại từ đầu
2.  **Thiết kế lấy người dùng làm trung tâm**: Giải quyết các vấn đề thực tế từ người dùng hệ thống hiện tại
3.  **Nền tảng kỹ thuật**: Tận dụng kiến trúc hiện có (Next.js, Supabase, tRPC)
4.  **ROI rõ ràng**: Giảm lỗi, tăng tốc độ hòa nhập, cải thiện độ chính xác của yêu cầu bảo hành

### Tầm nhìn cấp cao

Sản phẩm biến các trung tâm dịch vụ từ những người xử lý phiếu một cách thụ động thành những người điều phối dịch vụ chủ động với:
- **Chất lượng có thể dự đoán**: Mọi sản phẩm đều nhận được dịch vụ nhất quán thông qua các quy trình có cấu trúc
- **Sự tự tin của khách hàng**: Xác minh bảo hành ngay từ đầu và theo dõi minh bạch
- **Hoạt động xuất sắc**: Khả năng hiển thị tồn kho thời gian thực và cảnh báo tự động
- **Tuân thủ kiểm toán**: Khả năng truy xuất nguồn gốc hoàn chỉnh từ yêu cầu dịch vụ đến khi hoàn thành

---

## Người dùng mục tiêu

### Phân khúc người dùng chính: Kỹ thuật viên Dịch vụ

**Nhân khẩu học:**
- Tuổi: 22-45
- Địa điểm: Việt Nam (TP.HCM, Hà Nội)
- Vai trò: Kỹ thuật viên sửa chữa đồ điện tử và thiết bị gia dụng
- Kinh nghiệm: 1-10 năm trong ngành dịch vụ

**Hành vi và Quy trình làm việc hiện tại:**
- Nhận phiếu được giao từ quản lý
- Tuân theo các quy trình ngầm đã học qua đào tạo
- Cập nhật trạng thái phiếu thủ công (chờ xử lý → đang xử lý → đã hoàn thành)
- Thêm linh kiện và bình luận vào phiếu
- Dựa vào các kỹ thuật viên cao cấp cho các vấn đề phức tạp

**Nhu cầu và Khó khăn cụ thể:**
- Cần danh sách kiểm tra rõ ràng, từng bước cho các sản phẩm không quen thuộc
- Muốn biết tình trạng bảo hành trước khi bắt đầu công việc
- Cần theo dõi linh kiện nào có sẵn để thay thế
- Gặp khó khăn trong việc nhớ tất cả các bước kiểm tra chất lượng
- Muốn ghi lại các phát hiện chẩn đoán một cách có hệ thống

**Mục tiêu họ đang cố gắng đạt được:**
- Hoàn thành sửa chữa hiệu quả mà không có lỗi
- Đáp ứng các tiêu chuẩn chất lượng một cách nhất quán
- Giảm việc làm lại do bỏ qua các bước xác minh
- Xây dựng chuyên môn thông qua học tập có cấu trúc

---

### Phân khúc người dùng phụ: Quản lý Dịch vụ

**Nhân khẩu học:**
- Tuổi: 28-50
- Vai trò: Quản lý vận hành, trưởng nhóm
- Trách nhiệm: Giám sát 5-20 kỹ thuật viên
- Trọng tâm: Kiểm soát chất lượng, phân bổ nguồn lực, sự hài lòng của khách hàng

**Hành vi và Quy trình làm việc hiện tại:**
- Giao phiếu cho kỹ thuật viên
- Theo dõi trạng thái phiếu qua bảng điều khiển
- Xem xét doanh thu và chỉ số hiệu suất hàng tháng
- Xử lý các trường hợp leo thang và các quyết định dịch vụ phức tạp
- Quản lý tồn kho sản phẩm và linh kiện

**Nhu cầu và Khó khăn cụ thể:**
- Không có cái nhìn sâu vào tiến độ cấp nhiệm vụ (phiếu bị kẹt ở trạng thái "đang xử lý" trong nhiều ngày)
- Không thể xác định các điểm nghẽn trong quy trình
- Theo dõi thủ công mức tồn kho bảo hành
- Thiếu dấu vết kiểm toán cho các yêu cầu bảo hành
- Không thể đo lường hiệu quả quy trình

**Mục tiêu họ đang cố gắng đạt được:**
- Đảm bảo chất lượng dịch vụ nhất quán trên tất cả các kỹ thuật viên
- Xác định và giải quyết các điểm nghẽn một cách nhanh chóng
- Duy trì đủ tồn kho thay thế bảo hành
- Chứng minh sự tuân thủ các yêu cầu bảo hành của nhà sản xuất
- Tối ưu hóa phân bổ nguồn lực

---

### Phân khúc người dùng thứ ba: Nhân viên Lễ tân

**Nhân khẩu học:**
- Tuổi: 20-35
- Vai trò: Lễ tân, dịch vụ khách hàng
- Trách nhiệm: Tiếp nhận, giao tiếp với khách hàng

**Hành vi và Quy trình làm việc hiện tại:**
- Tạo phiếu dịch vụ mới khi khách hàng đến
- Tra cứu thông tin khách hàng và sản phẩm
- Trả lời câu hỏi của khách hàng về tình trạng dịch vụ
- Xử lý việc nhận và trả sản phẩm

**Nhu cầu và Khó khăn cụ thể:**
- Không thể xác minh điều kiện bảo hành ngay từ đầu
- Khách hàng đến với sản phẩm không đủ điều kiện (lãng phí thời gian đi lại)
- Thiếu thông tin cập nhật chi tiết về tiến độ để chia sẻ với khách hàng
- Nhập dữ liệu thủ công cho mỗi lần tiếp nhận

**Mục tiêu họ đang cố gắng đạt được:**
- Giảm thời gian chờ của khách hàng khi đăng ký
- Cung cấp thông tin cập nhật chính xác về tình trạng dịch vụ
- Xác minh bảo hành trước khi nhận sản phẩm
- Giảm thiểu việc nhập dữ liệu thông qua các biểu mẫu được điền sẵn

---

## Mục tiêu & Chỉ số Thành công

### Mục tiêu Kinh doanh

1.  **Giảm 40% Lỗi Dịch vụ**
    - Chỉ số: Tỷ lệ phần trăm phiếu cần làm lại do bỏ qua các bước
    - Mục tiêu: Giảm từ 30% xuống 18% vào Q3 2025
    - Đo lường: Theo dõi các phiếu làm lại (trạng thái thay đổi từ đã hoàn thành trở lại đang xử lý)

2.  **Tăng 50% Tốc độ Hòa nhập của Kỹ thuật viên**
    - Chỉ số: Số ngày để đạt năng suất (hoàn thành 3 phiếu một cách độc lập)
    - Mục tiêu: Giảm từ 21 ngày xuống 10 ngày
    - Đo lường: Báo cáo hoàn thành đào tạo của bộ phận nhân sự

3.  **Tăng Độ chính xác của Yêu cầu Bảo hành lên 95%**
    - Chỉ số: Tỷ lệ phần trăm yêu cầu bảo hành được chấp nhận mà không cần làm lại
    - Mục tiêu: Tăng từ 85% lên 95%
    - Đo lường: Tỷ lệ phê duyệt yêu cầu bảo hành từ các nhà sản xuất

4.  **Giảm 60% Tình trạng Hết hàng Tồn kho**
    - Chỉ số: Số lượng sản phẩm thay thế bị trì hoãn do không có hàng
    - Mục tiêu: Giảm từ 15/tháng xuống 6/tháng
    - Đo lường: Các phiếu được đánh dấu "chờ sản phẩm thay thế"

5.  **Cho phép Khách hàng Tự phục vụ 24/7**
    - Chỉ số: Yêu cầu dịch vụ được tạo ngoài giờ làm việc
    - Mục tiêu: 30% yêu cầu được tạo qua cổng thông tin công khai
    - Đo lường: Dấu thời gian tạo yêu cầu dịch vụ

### Chỉ số Thành công của Người dùng

1.  **Tỷ lệ Hoàn thành Nhiệm vụ của Kỹ thuật viên**
    - **Cái gì**: Tỷ lệ phần trăm các nhiệm vụ bắt buộc được đánh dấu hoàn thành
    - **Mục tiêu**: Tỷ lệ hoàn thành nhiệm vụ >95%
    - **Đo lường**: Số lượng nhiệm vụ đã hoàn thành / tổng số nhiệm vụ bắt buộc

2.  **Tỷ lệ Sử dụng Bảng điều khiển của Quản lý**
    - **Cái gì**: Số lượng quản lý hoạt động hàng ngày xem bảng điều khiển quy trình làm việc
    - **Mục tiêu**: 100% quản lý kiểm tra bảng điều khiển hàng ngày
    - **Đo lường**: Phân tích lượt xem trang bảng điều khiển

3.  **Thời gian Xác minh của Lễ tân**
    - **Cái gì**: Thời gian trung bình để xác minh bảo hành và tạo phiếu
    - **Mục tiêu**: Giảm từ 8 phút xuống 3 phút
    - **Đo lường**: Dấu thời gian giữa lúc khách hàng đến và lúc tạo phiếu

4.  **Tỷ lệ Chấp nhận Cổng thông tin Khách hàng**
    - **Cái gì**: Tỷ lệ phần trăm khách hàng sử dụng cổng thông tin theo dõi
    - **Mục tiêu**: 40% khách hàng truy cập liên kết theo dõi ít nhất một lần
    - **Đo lường**: Số lần nhấp chuột duy nhất vào liên kết theo dõi

### Các chỉ số hiệu suất chính (KPIs)

1.  **Tỷ lệ Tuân thủ Quy trình**: Tỷ lệ phần trăm phiếu hoàn thành tất cả các nhiệm vụ bắt buộc (Mục tiêu: >90%)
2.  **Tỷ lệ Thành công Xác minh Bảo hành**: Số sê-ri hợp lệ / tổng số lần thử xác minh (Mục tiêu: >75%)
3.  **Độ chính xác Tồn kho**: Số lượng kiểm kê thực tế khớp với hồ sơ hệ thống (Mục tiêu: >98%)
4.  **Thời gian Hoàn thành Nhiệm vụ Trung bình**: Thời gian trung bình cho mỗi loại nhiệm vụ (Cơ sở: TBD, Cải thiện: -20% vào Q4 2025)
5.  **Thời gian Xử lý RMA**: Số ngày từ khi nhận sản phẩm lỗi đến khi gửi hàng thay thế (Mục tiêu: <7 ngày)

---

## Phạm vi MVP

### Các tính năng cốt lõi (Bắt buộc phải có)

**1. Quản lý Mẫu Nhiệm vụ (Admin)**
- **Mô tả**: Giao diện quản trị để tạo và quản lý các mẫu quy trình làm việc
- **Lý do**: Nền tảng cho tất cả chức năng quy trình; phải tồn tại trước khi kỹ thuật viên có thể sử dụng nhiệm vụ
- **Tiêu chí chấp nhận**:
  - Các thao tác CRUD cho các mẫu nhiệm vụ
  - Gán mẫu cho các loại sản phẩm
  - Xác định chuỗi nhiệm vụ với các phụ thuộc
  - Đặt thời gian ước tính và người được giao mặc định
  - Kích hoạt/hủy kích hoạt mẫu (phiên bản)

**2. Thư viện Nhiệm vụ với các Loại Mặc định**
- **Mô tả**: Thư viện được cấu hình sẵn các loại nhiệm vụ phổ biến (Kiểm tra ban đầu, Kiểm tra chẩn đoán, Thay thế linh kiện, Kiểm tra chất lượng, v.v.)
- **Lý do**: Tăng tốc độ tạo mẫu; cung cấp sự tiêu chuẩn hóa
- **Tiêu chí chấp nhận**:
  - Tối thiểu 15 loại nhiệm vụ được xác định trước trên các danh mục (Tiếp nhận, Chẩn đoán, Sửa chữa, QA, Đóng)
  - Quản trị viên có thể thêm các loại nhiệm vụ tùy chỉnh
  - Chức năng phân loại và tìm kiếm

**3. Thực thi Phiên bản Nhiệm vụ (Quy trình làm việc của Kỹ thuật viên)**
- **Mô tả**: Kỹ thuật viên thực hiện các nhiệm vụ trên phiếu dịch vụ, đánh dấu hoàn thành, thêm các phát hiện
- **Lý do**: Trải nghiệm người dùng cốt lõi cho kỹ thuật viên; thay thế các cập nhật trạng thái hộp đen
- **Tiêu chí chấp nhận**:
  - Xem danh sách nhiệm vụ cho phiếu được giao
  - Đánh dấu nhiệm vụ hoàn thành kèm ghi chú
  - Không thể đánh dấu các nhiệm vụ phụ thuộc cho đến khi các điều kiện tiên quyết hoàn thành
  - Việc hoàn thành nhiệm vụ sẽ kích hoạt chuyển đổi trạng thái phiếu
  - Giao diện người dùng đáp ứng trên di động để sử dụng trong xưởng

**4. Thiết lập Phân cấp Kho hàng (Admin)**
- **Mô tả**: Xác định kho vật lý và kho ảo
- **Lý do**: Nền tảng tổ chức cho quản lý tồn kho
- **Tiêu chí chấp nhận**:
  - Tạo kho vật lý (tên, địa chỉ)
  - Tạo kho ảo với kho vật lý mẹ
  - Các loại kho ảo được cấu hình sẵn (Hàng bảo hành, Hàng chờ RMA, Hàng hỏng, Đang dịch vụ, Linh kiện)

**5. Dữ liệu Chính Sản phẩm Vật lý**
- **Mô tả**: Theo dõi số sê-ri với ngày bảo hành và mối quan hệ sản phẩm
- **Lý do**: Cho phép xác minh bảo hành và truy xuất nguồn gốc sản phẩm
- **Tiêu chí chấp nhận**:
  - CRUD cho các sản phẩm vật lý có số sê-ri
  - Các trường: sê-ri, id_sản_phẩm, thương hiệu, ngày nhập, ngày bảo hành (nhà sản xuất + công ty), tình trạng, vị trí
  - Ràng buộc số sê-ri duy nhất
  - Nhập hàng loạt qua CSV

**6. Xác minh Số Sê-ri (Cổng thông tin Công khai)**
- **Mô tả**: Trang công khai nơi khách hàng xác minh điều kiện bảo hành
- **Lý do**: Ngăn chặn các sản phẩm không thuộc diện bảo hành; giảm tải công việc cho lễ tân
- **Tiêu chí chấp nhận**:
  - Nhập số sê-ri → hiển thị sản phẩm và tình trạng bảo hành
  - Không yêu cầu xác thực
  - Đáp ứng trên di động
  - Thông báo lỗi cho các số sê-ri không hợp lệ

**7. Theo dõi Di chuyển Hàng hóa**
- **Mô tả**: Ghi nhật ký di chuyển sản phẩm giữa các kho
- **Lý do**: Dấu vết kiểm toán cho việc chuyển giao sản phẩm; cho phép theo dõi vị trí
- **Tiêu chí chấp nhận**:
  - Tạo bản ghi di chuyển (sản phẩm, từ_vị_trí, đến_vị_trí, lý do, người_di_chuyển)
  - Tự động di chuyển khi trạng thái phiếu thay đổi
  - Xem lịch sử di chuyển cho mỗi sản phẩm

**8. Cảnh báo Tồn kho Thấp**
- **Mô tả**: Thông báo tự động khi hàng bảo hành giảm xuống dưới ngưỡng
- **Lý do**: Ngăn chặn tình trạng hết hàng đối với tồn kho thay thế quan trọng
- **Tiêu chí chấp nhận**:
  - Xác định điểm đặt hàng lại cho mỗi loại sản phẩm
  - Biểu ngữ cảnh báo trên bảng điều khiển khi tồn kho dưới ngưỡng
  - Thông báo qua email/toast cho quản lý

### Ngoài phạm vi MVP

- **In nhãn mã vạch** - Sử dụng nhãn dán số sê-ri hiện có
- **Quản lý nhà cung cấp và đơn đặt hàng** - Quản lý ngoại tuyến tạm thời
- **Các tính năng kho nâng cao** (vị trí kệ, lộ trình lấy hàng, theo dõi lô)
- **Trung tâm dịch vụ đa địa điểm** - Ban đầu chỉ một địa điểm vật lý
- **Gửi RMA tự động** cho nhà sản xuất - Quy trình thủ công
- **Thông báo trạng thái yêu cầu dịch vụ qua SMS/email** - Chỉ theo dõi qua cổng thông tin
- **Tích hợp tồn kho linh kiện với kho** - Chỉ theo dõi tiêu thụ đơn giản hóa
- **Ứng dụng di động** - Chỉ web đáp ứng trên di động
- **Báo cáo tùy chỉnh** - Sử dụng bảng điều khiển phân tích hiện có
- **Tích hợp phần cứng máy quét mã vạch** - Chấp nhận nhập số sê-ri thủ công

### Tiêu chí Thành công của MVP

**MVP thành công nếu:**
1.  ✅ Hơn 80% phiếu dịch vụ sử dụng quy trình làm việc dựa trên mẫu
2.  ✅ Hơn 50% việc xác minh bảo hành diễn ra qua cổng thông tin công khai
3.  ✅ Mức tồn kho chính xác trong khoảng sai lệch 5%
4.  ✅ Không có tình trạng hết hàng đối với 5 sản phẩm thay thế bảo hành hàng đầu
5.  ✅ Kỹ thuật viên hoàn thành khóa đào tạo MVP trong <4 giờ
6.  ✅ Hệ thống xử lý 100 phiếu dịch vụ đồng thời mà không bị suy giảm hiệu suất

---

## Tầm nhìn sau MVP

### Các tính năng Giai đoạn 2 (3-6 tháng sau MVP)

**Tự động hóa Quy trình Nâng cao:**
- Tự động giao nhiệm vụ dựa trên khối lượng công việc và chuyên môn của kỹ thuật viên
- Theo dõi thời gian nhiệm vụ với phân tích hiệu suất
- Gợi ý tối ưu hóa quy trình dựa trên dữ liệu lịch sử
- Quy trình phê duyệt cho các sản phẩm thay thế có giá trị cao

**Các tính năng Bảo hành Nâng cao:**
- Tích hợp gửi RMA với API của nhà sản xuất
- Tạo tài liệu yêu cầu bảo hành (xuất PDF)
- Tự động hóa thông báo cho khách hàng (email/SMS khi bảo hành được xác minh)
- Báo cáo xu hướng bảo hành (các lỗi phổ biến nhất theo sản phẩm)

**Tối ưu hóa Kho hàng:**
- Ứng dụng di động quét mã vạch để di chuyển hàng hóa
- Theo dõi vị trí kệ trong kho
- Tính toán điểm đặt hàng lại tự động dựa trên xu hướng sử dụng
- Tích hợp nhà cung cấp để quản lý đơn đặt hàng

### Tầm nhìn Dài hạn (1-2 năm)

**Mở rộng Cổng thông tin Khách hàng:**
- Tự tạo phiếu dịch vụ (tải ảnh lên, mô tả sự cố)
- Cập nhật tiến độ nhiệm vụ thời gian thực
- Nhắn tin trực tiếp với kỹ thuật viên
- Tra cứu lịch sử dịch vụ và bảo hành

**Trí tuệ Kinh doanh:**
- Cảnh báo bảo trì dự đoán dựa trên tuổi sản phẩm và các mẫu lỗi
- Bảng điều khiển hiệu suất kỹ thuật viên với các chỉ số hoàn thành nhiệm vụ
- Phân tích chi phí mỗi lần sửa chữa (lao động + linh kiện + chi phí chung)
- Theo dõi sự hài lòng của khách hàng sau dịch vụ

**Tích hợp Hệ sinh thái:**
- Tích hợp cổng bảo hành của nhà sản xuất (tự động gửi yêu cầu)
- Tích hợp nhà vận chuyển để theo dõi RMA
- Tích hợp hệ thống kế toán (tiêu thụ linh kiện → giá vốn hàng bán)
- Tích hợp thương mại điện tử để bán sản phẩm thay thế

### Cơ hội Mở rộng

**Mở rộng Địa lý:**
- Quản lý kho đa địa điểm
- Chuyển sản phẩm giữa các chi nhánh
- Định tuyến yêu cầu dịch vụ theo khu vực

**Mở rộng Loại hình Dịch vụ:**
- Lên lịch bảo trì phòng ngừa
- Quy trình sửa chữa tại chỗ
- Theo dõi dịch vụ lắp đặt

**Các ngành dọc:**
- Trung tâm dịch vụ ô tô
- Cửa hàng sửa chữa thiết bị gia dụng
- Bảo trì thiết bị y tế

---

## Cân nhắc Kỹ thuật

### Yêu cầu Nền tảng

**Nền tảng mục tiêu:**
- Ứng dụng web (trình duyệt máy tính để bàn + máy tính bảng + di động)
- Hỗ trợ trình duyệt tối thiểu: Chrome 90+, Safari 14+, Edge 90+

**Hỗ trợ Trình duyệt/Hệ điều hành:**
- Máy tính để bàn: Windows 10+, macOS 11+, Ubuntu 20.04+
- Di động: iOS 14+, Android 10+
- Máy tính bảng: iPad (iOS 14+), máy tính bảng Android

**Yêu cầu Hiệu suất:**
- Thời gian tải trang: <2 giây trên kết nối 3G
- Thời gian phản hồi API: <500ms cho phân vị thứ 95
- Hỗ trợ 100 người dùng đồng thời
- Truy vấn cơ sở dữ liệu: trung bình <200ms

### Ưu tiên Công nghệ

**Frontend:**
- **Framework**: Next.js 15.5.4 (App Router) - **GIỮ NGUYÊN** hiện có
- **Thư viện UI**: React 19.1.0 - **GIỮ NGUYÊN** hiện có
- **Styling**: Tailwind CSS 4 + shadcn/ui - **GIỮ NGUYÊN** hiện có
- **Quản lý Trạng thái**: TanStack Query + tRPC - **GIỮ NGUYÊN** hiện có
- **Biểu mẫu**: react-hook-form + Zod validation - **GIỮ NGUYÊN** hiện có

**Backend:**
- **Lớp API**: tRPC 11.6.0 - **GIỮ NGUYÊN** hiện có
- **Cơ sở dữ liệu**: Supabase (PostgreSQL 15) - **GIỮ NGUYÊN** hiện có
- **Xác thực**: Supabase Auth - **GIỮ NGUYÊN** hiện có
- **Lưu trữ**: Supabase Storage - **GIỮ NGUYÊN** hiện có

**Cơ sở dữ liệu:**
- **Chính**: PostgreSQL 15 qua Supabase - **GIỮ NGUYÊN** hiện có
- **Bảng mới**:
  - `task_templates`, `task_types`, `template_tasks`
  - `task_instances` (liên kết đến service_tickets)
  - `physical_warehouses`, `virtual_warehouses`
  - `physical_products`, `stock_movements`
  - `service_requests` (cổng thông tin công khai)

**Hosting/Hạ tầng:**
- **Phát triển**: Supabase local (Docker) - **GIỮ NGUYÊN** hiện có
- **Sản xuất**: Vercel (frontend) + Supabase Cloud (backend)
- **Đa người thuê**: Cách ly dựa trên cổng - **GIỮ NGUYÊN** hiện có

### Cân nhắc Kiến trúc

**Cấu trúc Kho mã nguồn:**
- **Monorepo**: Một kho mã nguồn duy nhất - **GIỮ NGUYÊN** codebase brownfield hiện có
- **Các Route mới**:
  - `/workflows` - Quản lý mẫu (Admin)
  - `/tasks` - Thực thi nhiệm vụ (Kỹ thuật viên)
  - `/warehouse` - Quản lý kho (Quản lý)
  - `/public/verify` - Xác minh sê-ri (Công khai)
  - `/public/track` - Theo dõi yêu cầu (Công khai)

**Kiến trúc Dịch vụ:**
- **Mô hình**: Serverless functions qua Next.js API routes - **GIỮ NGUYÊN** hiện có
- **Các tRPC Router mới**:
  - `taskTemplates.*` - CRUD mẫu
  - `taskInstances.*` - Thực thi nhiệm vụ
  - `warehouses.*` - Quản lý kho
  - `physicalProducts.*` - Theo dõi số sê-ri
  - `serviceRequests.*` - Các điểm cuối cổng thông tin công khai

**Yêu cầu Tích hợp:**
- **Hệ thống hiện tại**: Tích hợp với bảng `service_tickets` hiện tại
- **Quét mã vạch**: API camera HTML5 để đọc mã vạch trên di động (tương lai)
- **Email**: Tích hợp SMTP tùy chọn cho thông báo (sau MVP)

**Bảo mật/Tuân thủ:**
- **Chính sách RLS**: Mở rộng Row Level Security hiện có cho các bảng mới
- **Các điểm cuối công khai**: Giới hạn tốc độ truy cập vào xác minh sê-ri để ngăn chặn lạm dụng
- **Quyền riêng tư dữ liệu**: Không có PII trong các yêu cầu dịch vụ cho đến khi được chuyển đổi thành phiếu
- **Dấu vết kiểm toán**: Tất cả các di chuyển kho được ghi lại với user_id và dấu thời gian

---

## Ràng buộc & Giả định

### Ràng buộc

**Ngân sách:**
- **Ngân sách Phát triển**: Sử dụng đội ngũ hiện có (không cần tuyển mới)
- **Ngân sách Hạ tầng**: ~$200/tháng cho Supabase Pro (cam kết hiện có + lưu trữ bảng mới)
- **Không có Phần mềm Thương mại**: Chỉ sử dụng ngăn xếp mã nguồn mở (không có phí bản quyền)

**Thời gian:**
- **Giao MVP**: 8-10 tuần kể từ khi khởi động dự án
- **Các tính năng Giai đoạn 2**: +3-6 tháng sau MVP
- **Năng lực Đội ngũ**: 1 lập trình viên full-stack + 1 kiến trúc sư (bán thời gian)

**Nguồn lực:**
- **Đội ngũ Phát triển**: Đội ngũ hiện tại đã quen thuộc với codebase brownfield
- **Kiểm thử**: Ban đầu kiểm thử thủ công (không có đội QA)
- **Tài liệu**: Phải cập nhật các tài liệu kiến trúc hiện có trong `docs/architecture/`

**Kỹ thuật:**
- **Ràng buộc Brownfield**: Phải duy trì khả năng tương thích ngược với quy trình `service_tickets` hiện có
- **Cơ sở dữ liệu**: Không được phá vỡ các chính sách RLS hoặc cấu trúc bảng hiện có
- **Hiệu suất**: Phần cứng hiện có (máy tính xách tay của lập trình viên, Supabase Docker cục bộ)
- **Không có Thay đổi Gây đổ vỡ**: Các vai trò và quyền của người dùng hiện tại phải tiếp tục hoạt động

### Các Giả định chính

**Sự chấp nhận của Người dùng:**
- Nhân viên lễ tân sẽ nhập số sê-ri thủ công ban đầu (quét mã vạch Giai đoạn 2)
- Quản lý sẽ xác định các mẫu nhiệm vụ trước khi đào tạo kỹ thuật viên
- Kỹ thuật viên cảm thấy thoải mái với các quy trình làm việc dựa trên danh sách kiểm tra
- Khách hàng sẽ sử dụng cổng thông tin công khai nếu được nhắc qua mã QR/liên kết

**Tính sẵn có của Dữ liệu:**
- Dữ liệu số sê-ri có thể được nhập hàng loạt từ các tệp Excel/CSV hiện có
- Ngày bảo hành lịch sử có sẵn cho các sản phẩm hiện có
- Dữ liệu tồn kho linh kiện hiện tại là chính xác

**Quy trình Kinh doanh:**
- Quy trình dịch vụ có thể được tiêu chuẩn hóa (không phải mọi phiếu đều là duy nhất)
- Việc xác minh bảo hành có thể diễn ra trước khi mang sản phẩm đến
- Nhân viên kho sẽ được đào tạo về việc ghi nhật ký di chuyển hàng hóa

**Kỹ thuật:**
- Ngăn xếp Supabase cục bộ hiện tại có thể xử lý thêm các bảng cơ sở dữ liệu
- tRPC có thể hỗ trợ các điểm cuối công khai (không xác thực) để xác minh sê-ri
- React Hook Form có thể xử lý việc tạo yêu cầu dịch vụ phức tạp nhiều bước
- Trình duyệt di động hỗ trợ API camera HTML5 để quét mã vạch trong tương lai

**Vận hành:**
- Quản trị viên sẽ dành 1-2 tuần để xác định các mẫu nhiệm vụ ban đầu
- Kỹ thuật viên sẽ cung cấp phản hồi về các định nghĩa nhiệm vụ trong giai đoạn thử nghiệm
- Một địa điểm kho vật lý là đủ cho MVP (TP.HCM)
- Quy trình RMA vẫn là thủ công (không có tích hợp API nhà sản xuất trong MVP)

---

## Rủi ro & Câu hỏi Mở

### Các Rủi ro chính

**1. Độ phức tạp của Định nghĩa Mẫu (Tác động cao, Khả năng xảy ra trung bình)**
- **Rủi ro**: Các mẫu nhiệm vụ quá cứng nhắc → kỹ thuật viên bỏ qua hệ thống
- **Tác động**: Hệ thống không được sử dụng hết, tỷ lệ tuân thủ quy trình thấp
- **Giảm thiểu**:
  - Thu hút các kỹ thuật viên cao cấp tham gia thiết kế mẫu
  - Cho phép "bỏ qua nhiệm vụ" với lý do bắt buộc
  - Tinh chỉnh mẫu lặp đi lặp lại dựa trên dữ liệu sử dụng

**2. Chất lượng Dữ liệu Số Sê-ri (Tác động cao, Khả năng xảy ra cao)**
- **Rủi ro**: Hồ sơ số sê-ri hiện có không đầy đủ hoặc không chính xác
- **Tác động**: Lỗi xác minh bảo hành, khách hàng thất vọng
- **Giảm thiểu**:
  - Sprint làm sạch dữ liệu trước khi ra mắt MVP
  - Cho phép quản lý ghi đè bảo hành thủ công
  - Nâng cấp dần dần: thêm số sê-ri khi sản phẩm được mang đến

**3. Suy giảm Hiệu suất với Tập dữ liệu lớn (Tác động trung bình, Khả năng xảy ra thấp)**
- **Rủi ro**: Bảng phiên bản nhiệm vụ phát triển nhanh chóng → truy vấn chậm
- **Tác động**: Bảng điều khiển bị lag, trải nghiệm người dùng kém
- **Giảm thiểu**:
  - Chỉ mục cơ sở dữ liệu trên `ticket_id`, `status`, `created_at`
  - Lưu trữ các nhiệm vụ đã hoàn thành sau 12 tháng
  - Phân trang trên danh sách nhiệm vụ (giới hạn 50 mỗi trang)

**4. Sự chống đối trong Đào tạo Người dùng (Tác động cao, Khả năng xảy ra trung bình)**
- **Rủi ro**: Kỹ thuật viên chống lại quy trình mới → tiếp tục sử dụng phương pháp chỉ có trạng thái cũ
- **Tác động**: Việc áp dụng không hoàn chỉnh, lãng phí đầu tư phát triển
- **Giảm thiểu**:
  - Thử nghiệm với 2-3 kỹ thuật viên tiên phong
  - Cho thấy sự tiết kiệm thời gian thông qua theo dõi thời gian nhiệm vụ
  - Sự thực thi của quản lý: yêu cầu hoàn thành nhiệm vụ để hoàn thành phiếu
  - Triển khai dần dần: từng loại sản phẩm một

**5. Tính toàn vẹn Dữ liệu Di chuyển Kho (Tác động trung bình, Khả năng xảy ra trung bình)**
- **Rủi ro**: Nhập di chuyển hàng hóa thủ công → dữ liệu sai lệch so với thực tế
- **Tác động**: Mức tồn kho không chính xác, hết hàng hoặc thừa hàng
- **Giảm thiểu**:
  - Đối chiếu tồn kho vật lý hàng tháng
  - Quét mã vạch (Giai đoạn 2) giảm lỗi nhập thủ công
  - Tự động di chuyển khi có thể (thay đổi trạng thái phiếu)

### Các câu hỏi mở

**Quy trình Kinh doanh:**
1.  **H: Ai chịu trách nhiệm xác định các mẫu nhiệm vụ?**
    - Ứng viên: Quản lý Vận hành + hợp tác với Kỹ thuật viên Cao cấp
    - Quyết định vào: Tuần 1 của dự án

2.  **H: Điều gì xảy ra nếu khách hàng tranh chấp ngày hết hạn bảo hành?**
    - Lựa chọn: Quản lý ghi đè thủ công so với thực thi hệ thống nghiêm ngặt
    - Quyết định vào: Trước khi ra mắt MVP

3.  **H: Chúng ta xử lý các sản phẩm không có số sê-ri (hàng tồn kho cũ) như thế nào?**
    - Lựa chọn: Tạo ID nội bộ so với đánh dấu là "cũ" với theo dõi hạn chế
    - Quyết định vào: Tuần 2 của dự án

4.  **H: Vận chuyển RMA: ai trả chi phí vận chuyển?**
    - Tác động: Ảnh hưởng đến việc gộp các lô hàng so với gửi ngay lập tức
    - Quyết định vào: Trước khi triển khai mô-đun kho

**Kỹ thuật:**
5.  **H: Xác minh sê-ri công khai: làm thế nào để ngăn chặn lạm dụng (đoán mò số sê-ri)?**
    - Lựa chọn: Giới hạn tốc độ truy cập so với CAPTCHA so với yêu cầu thông tin khách hàng một phần
    - Quyết định vào: Trước khi phát triển cổng thông tin công khai

6.  **H: Phụ thuộc nhiệm vụ: hỗ trợ các DAG phức tạp (Đồ thị có hướng không chu trình) hay các chuỗi tuyến tính đơn giản?**
    - Lựa chọn: Tuyến tính (MVP) → Phụ thuộc phức tạp (Giai đoạn 2)
    - Quyết định vào: Tuần 3 (trước khi hoàn thiện lược đồ mẫu nhiệm vụ)

7.  **H: Định dạng mã vạch: Mã QR so với mã vạch truyền thống?**
    - Tác động: Hỗ trợ API camera di động khác nhau
    - Quyết định vào: Trước khi lập kế hoạch Giai đoạn 2

8.  **H: Hỗ trợ đa tiền tệ cho việc nhập khẩu sản phẩm quốc tế?**
    - Phạm vi: Ngoài MVP, xác nhận cho Giai đoạn 2
    - Quyết định vào: Trước lộ trình Giai đoạn 2

### Các lĩnh vực cần nghiên cứu thêm

**Trải nghiệm Người dùng:**
- **Chủ đề**: Giao diện người dùng nhiệm vụ tối ưu để sử dụng trong xưởng trên di động (máy tính bảng so với điện thoại)
- **Tại sao**: Kỹ thuật viên có thể không có máy trạm chuyên dụng
- **Phương pháp Nghiên cứu**: Phỏng vấn người dùng với các kỹ thuật viên
- **Thời gian**: Tuần 2-3 của dự án

**Tính khả thi Kỹ thuật:**
- **Chủ đề**: Độ tin cậy của API camera HTML5 trên các thiết bị Android để quét mã vạch
- **Tại sao**: Quét mã vạch là tính năng của Giai đoạn 2 nhưng ảnh hưởng đến các quyết định kiến trúc
- **Phương pháp Nghiên cứu**: Thử nghiệm nguyên mẫu trên 5-10 mẫu thiết bị
- **Thời gian**: Trước khi khởi động Giai đoạn 2

**Tác động Kinh doanh:**
- **Chủ đề**: Thời gian tiết kiệm thực tế từ các danh sách kiểm tra nhiệm vụ
- **Tại sao**: Xác thực các giả định về ROI
- **Phương pháp Nghiên cứu**: Thử nghiệm với 3 kỹ thuật viên trong 2 tuần, đo thời gian hoàn thành
- **Thời gian**: Tuần 6-8 của quá trình phát triển MVP

**Bối cảnh Cạnh tranh:**
- **Chủ đề**: Các đối thủ cạnh tranh xử lý việc xác minh bảo hành như thế nào?
- **Tại sao**: Xác định các phương pháp hay nhất trong ngành
- **Phương pháp Nghiên cứu**: Phân tích cạnh tranh của 3-5 sản phẩm phần mềm cửa hàng sửa chữa
- **Thời gian**: Tuần 1 của dự án (đã có các yêu cầu ban đầu)

---

## Phụ lục

### A. Tóm tắt Nghiên cứu

**Nghiên cứu Thị trường đã thực hiện:**
- Phân tích các tài liệu yêu cầu: `REQ_TASK_WORKFLOW_SYSTEM.md`, `REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md`, `REQ_SERVICE_REQUEST_LAYER.md`
- Xem xét các khả năng của hệ thống hiện tại: `CURRENT_FEATURES.md`
- Kiểm tra kiến trúc brownfield: `docs/architecture/` (10 shards + tài liệu kiến trúc frontend)

**Những phát hiện chính:**
1.  **Điểm mạnh của Hệ thống Hiện tại**: Nền tảng vững chắc với an toàn kiểu dữ liệu tRPC, 4 vai trò người dùng, tính toán chi phí tự động, dấu vết kiểm toán qua bình luận tự động
2.  **Khó khăn của Người dùng**: Thiếu quy trình có cấu trúc, không có cổng bảo hành, không theo dõi sê-ri
3.  **Nền tảng Kỹ thuật**: Chế độ nghiêm ngặt TypeScript, Supabase RLS, các router tRPC mô-đun - sẵn sàng để nâng cấp
4.  **Nhu cầu Thị trường Việt Nam**: Đã triển khai làm sạch tên tệp, hỗ trợ đa ngôn ngữ TBD

**Phân tích Cạnh tranh:**
- Phần mềm cửa hàng sửa chữa (RepairShopr, Syncro): Nhiều tính năng nhưng đắt đỏ, không hỗ trợ tiếng Việt
- Hệ thống tồn kho chung: Thiếu tích hợp phiếu dịch vụ
- Lợi thế giải pháp tùy chỉnh: Xây dựng cho quy trình cụ thể, tích hợp brownfield

### B. Ý kiến từ các bên liên quan

**Từ các Tài liệu Yêu cầu (Soạn thảo ngày 2025-10-22):**
- Nhu cầu về quy trình công việc được xác định bởi đội vận hành
- Yêu cầu về kho hàng được thúc đẩy bởi những thách thức về tồn kho
- Lớp yêu cầu dịch vụ được thiết kế để giảm tải công việc cho lễ tân
- Lập bản đồ hành trình người dùng đã hoàn thành cho cổng thông tin khách hàng

**Sự chấp nhận Hệ thống Hiện tại (từ CURRENT_FEATURES.md):**
- 4 vai trò người dùng đang tích cực sử dụng hệ thống: Admin, Manager, Technician, Reception
- Vòng đời phiếu dịch vụ ổn định với luồng trạng thái một chiều
- Bảng điều khiển phân tích thời gian thực đang hoạt động
- Các tính năng tự động (đánh số phiếu, tính toán chi phí, bình luận tự động) đã được chứng minh là đáng tin cậy

### C. Tài liệu tham khảo

**Tài liệu Nội bộ:**
- [Các tính năng hiện tại](CURRENT_FEATURES.md) - Toàn bộ danh sách tính năng
- [Tài liệu Kiến trúc](architecture.md) - Chỉ mục chính
- [Kiến trúc Frontend - Hiện tại](architecture/frontend-architecture-current.md) - Trạng thái frontend sản xuất
- [Kiến trúc Frontend - Lộ trình](architecture/frontend-architecture-roadmap.md) - Các cải tiến đã lên kế hoạch
- [Mô hình Dữ liệu](architecture/03-data-models.md) - Lược đồ cơ sở dữ liệu
- [Thiết kế API](architecture/05-api-design.md) - Các thủ tục tRPC
- [Tiêu chuẩn Mã hóa](architecture/08-coding-standards.md) - Các quy ước phát triển

**Thông số kỹ thuật Yêu cầu:**
- `docs/requirements/REQ_TASK_WORKFLOW_SYSTEM.md` - Yêu cầu về nhiệm vụ/quy trình
- `docs/requirements/REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md` - Yêu cầu về kho/tồn kho
- `docs/requirements/REQ_SERVICE_REQUEST_LAYER.md` - Yêu cầu về cổng thông tin công khai

**Ngăn xếp Công nghệ:**
- [Tài liệu Next.js 15](https://nextjs.org/docs)
- [Tài liệu tRPC](https://trpc.io/docs)
- [Tài liệu Supabase](https://supabase.com/docs)
- [Tài liệu React 19](https://react.dev/)

---

## Các bước tiếp theo

### Hành động ngay lập tức

1.  **Tuần 1: Xác thực & Lập kế hoạch Dự án**
    - Xem xét và phê duyệt Tóm tắt Dự án này
    - Cuộc họp khởi động với các bên liên quan (Quản lý + Kỹ thuật viên Cao cấp + Đội ngũ Phát triển)
    - Xác định quyền sở hữu mẫu nhiệm vụ (ai tạo/duy trì)
    - Ưu tiên: Bắt đầu với Quy trình công việc HAY Kho hàng trước?

2.  **Tuần 1-2: Chuẩn bị Dữ liệu**
    - Xuất dữ liệu số sê-ri hiện có (nếu có)
    - Làm sạch dữ liệu: xác thực số sê-ri, ngày bảo hành
    - Xác định 3-5 sản phẩm thử nghiệm cho các mẫu nhiệm vụ ban đầu

3.  **Tuần 2: Thiết kế Kỹ thuật**
    - Thiết kế lược đồ cơ sở dữ liệu cho các bảng mới
    - Lập kế hoạch router tRPC (các điểm cuối và kiểu dữ liệu)
    - Mockup UI/UX cho giao diện thực thi nhiệm vụ
    - Wireframe cho cổng thông tin công khai

4.  **Tuần 3: Tạo Mẫu Thử nghiệm**
    - Làm việc với Kỹ thuật viên Cao cấp để xác định 2 mẫu nhiệm vụ ban đầu
    - Kiểm tra việc thực thi mẫu với 3 phiếu thử nghiệm
    - Tinh chỉnh dựa trên phản hồi trước khi phát triển toàn bộ

5.  **Tuần 4+: Phát triển MVP**
    - Triển khai theo thứ tự ưu tiên:
      1. Quản lý mẫu nhiệm vụ (Admin)
      2. Gieo dữ liệu thư viện nhiệm vụ
      3. Thực thi nhiệm vụ (Kỹ thuật viên)
      4. Sản phẩm vật lý + xác minh sê-ri
      5. Phân cấp kho
      6. Di chuyển hàng hóa
      7. Cảnh báo tồn kho thấp
      8. Cổng thông tin công khai

### Bàn giao cho PM

Tóm tắt Dự án này cung cấp toàn bộ bối cảnh cho **Trung tâm Dịch vụ Giai đoạn 2**. Vui lòng bắt đầu ở 'Chế độ Tạo PRD', xem xét kỹ lưỡng bản tóm tắt để làm việc với người dùng nhằm tạo từng phần của PRD theo mẫu đã chỉ định, yêu cầu làm rõ bất kỳ điều gì cần thiết hoặc đề xuất cải tiến.

**Các lĩnh vực chính cần mở rộng trong PRD:**
- Các câu chuyện người dùng chi tiết cho mỗi tính năng
- Thông số kỹ thuật UI/UX với wireframe
- Định nghĩa lược đồ cơ sở dữ liệu
- Thông số kỹ thuật điểm cuối API
- Các kịch bản kiểm thử và tiêu chí chấp nhận
- Trình tự triển khai và các phụ thuộc
- Kế hoạch đào tạo và chiến lược triển khai

---

**Tóm tắt Dự án v1.0**
**Soạn thảo bởi:** Mary (Chuyên viên Phân tích Kinh doanh)
**Ngày:** 2025-10-23
**Lần xem xét tiếp theo:** Xác thực với các bên liên quan vào Tuần 1

