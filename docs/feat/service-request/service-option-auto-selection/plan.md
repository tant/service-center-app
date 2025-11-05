# Auto chọn `service_option` theo trạng thái bảo hành

## Bối cảnh
- Khi lưu nháp phiếu yêu cầu dịch vụ, backend yêu cầu mỗi sản phẩm phải có `service_option`.
- Form nội bộ hiện chưa quản lý trường này, dẫn đến lỗi 400 khi lưu nháp.
- API tra cứu serial (`serviceRequest.lookupSerial`) đã trả về `warranty_status`, có thể tận dụng để tự động chọn phương án dịch vụ mặc định.

## Mục tiêu
- Tự động gán `service_option` cho từng sản phẩm dựa vào thông tin bảo hành.
- Hiển thị rõ lựa chọn này trên giao diện để nhân viên dễ hiểu và có thể chỉnh tay nếu cần.
- Đảm bảo payload gửi lên `serviceRequest.saveDraft` (và `submit`) luôn hợp lệ.

## Phạm vi
- Cập nhật form nội bộ (`ServiceRequestForm`) và các component con liên quan.
- Không thay đổi logic backend ngoài việc đã yêu cầu.
- Sẵn sàng mở rộng để nhân viên chỉnh tay `service_option`.

## Giải pháp đề xuất
1. **Mở rộng dữ liệu form**
   - Thêm trường `service_option` vào `ProductItem`.
   - Cập nhật `buildFormData()` để đưa các trường mới vào payload.
   - Không tạo trường `service_option_notes` vì database hiện không hỗ trợ.
2. **Tự động gán giá trị**
   - Trong `ProductSerialInput`, theo dõi kết quả lookup:
     - `warranty_status` = `active` hoặc `expiring_soon` ⇒ `service_option = "warranty"`.
     - `warranty_status` = `expired` hoặc `no_warranty` hoặc không tra cứu được ⇒ `service_option = "paid"`.
   - Chỉ tự động gán khi serial hợp lệ và chưa có giá trị người dùng tự chỉnh.
3. **Giao diện hiển thị**
   - Hiển thị badge trạng thái trong `SerialLookupResult` để thông báo giá trị auto gán.
   - Thêm nhóm radio cho từng sản phẩm trong form để nhân viên có thể chuyển `warranty` ↔ `paid`.
4. **Quản lý override của người dùng**
   - Nếu nhân viên chỉnh thủ công, đánh dấu cờ để không ghi đè bằng auto logic cho tới khi serial thay đổi.
5. **Xử lý trường hợp không lookup**
   - Khi serial chưa đủ 5 ký tự hoặc lookup thất bại, set mặc định `service_option = "paid"` để payload hợp lệ.
6. **Đồng bộ với các luồng khác**
   - Kiểm tra các trang edit/view phiếu (`operations/service-requests/[id]`) để đảm bảo render đúng nhãn mới.

## Đầu việc chi tiết
- [ ] Cập nhật type + state trong `ServiceRequestForm`.
- [ ] Truyền callback `onAutoSelectServiceOption` từ form vào `ProductSerialInput`.
- [ ] Gọi callback trong `useEffect` của `ProductSerialInput` khi lookup thành công.
- [ ] Bổ sung badge trạng thái và nhóm radio cho phép chỉnh tay `service_option`.
- [ ] Đảm bảo `buildFormData()` tạo payload đầy đủ `service_option`.
- [ ] Rà soát `ServiceRequestForm` ở màn hình edit để tái sử dụng logic mới.
- [ ] Viết test/unit nhỏ cho hook hoặc component (nếu khả thi) hoặc bổ sung test e2e khi cần.

## Kiểm thử & xác nhận
- Thử nhập serial còn hạn bảo hành ⇒ `service_option` hiển thị “Bảo hành”.
- Thử serial hết hạn ⇒ hiển thị “Thu phí”.
- Thử chỉnh tay radio từ “Bảo hành” sang “Thu phí” (và ngược lại) ⇒ giữ giá trị khi lưu nháp.
- Kiểm tra payload gửi lên qua devtools / log mutation.
- Thử nhiều sản phẩm trong cùng phiếu để chắc chắn state độc lập.

## Rủi ro & câu hỏi mở
- Có còn tình huống kinh doanh cần `service_option = "replacement"` trong tương lai gần không?
- Khi API lookup báo sản phẩm đang sửa (`current_ticket_id`), cần chặn hay chỉ cảnh báo?
- Cần cập nhật tài liệu/quy trình đào tạo nào sau khi UI tự động chọn `service_option`?
