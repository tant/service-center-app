Trạng thái phiếu yêu cầu dịch vụ (Service Request Statuses)
📋 Danh sách trạng thái
Hệ thống có 5 trạng thái cho phiếu yêu cầu dịch vụ:

🔄 Luồng nghiệp vụ (Business Workflow)
📝 Chi tiết từng trạng thái
1️⃣ SUBMITTED (Đã gửi)
Định nghĩa: Yêu cầu mới được gửi từ cổng công khai
Khi nào xảy ra:
Khách hàng điền form trên public portal
Hệ thống tự động tạo tracking token (ví dụ: SR-2025-001)
Vai trò xử lý: Không có (trạng thái tự động)
Hành động tiếp theo:
Staff (admin/manager/reception) xem xét yêu cầu
Chuyển sang received hoặc rejected
Metadata: submitted_ip, user_agent, created_at
2️⃣ RECEIVED (Đã tiếp nhận)
Định nghĩa: Staff đã xác nhận nhận và xem xét yêu cầu
Khi nào xảy ra:
Staff nhấn nút "Chấp nhận" trong queue
Hoặc gọi API updateStatus với status: "received"
Vai trò xử lý: Admin, Manager, Reception
Hành động tiếp theo:
Staff tạo service ticket từ yêu cầu này
Chuyển sang processing
Metadata: reviewed_at, reviewed_by_id
Email notification: request_received được gửi cho khách hàng
3️⃣ PROCESSING (Đang xử lý)
Định nghĩa: Yêu cầu đã được chuyển thành service ticket
Khi nào xảy ra:
Staff nhấn "Chuyển thành phiếu dịch vụ"
Hệ thống tạo ticket mới trong bảng service_tickets
Link ticket vào yêu cầu qua ticket_id
Vai trò xử lý: Admin, Manager, Reception
Hành động tiếp theo:
Kỹ thuật viên xử lý ticket
Khi ticket status = 'completed', yêu cầu chuyển sang converted
Metadata: converted_at, ticket_id
Email notification: ticket_created được gửi cho khách hàng với ticket number
4️⃣ REJECTED (Đã từ chối)
Định nghĩa: Yêu cầu không đủ điều kiện hoặc không hợp lệ
Khi nào xảy ra:
Staff nhấn nút "Từ chối" trong queue
Cần nhập lý do từ chối (rejection_reason)
Vai trò xử lý: Admin, Manager, Reception
Lý do từ chối thường gặp:
Sản phẩm hết hạn bảo hành
Thông tin không đầy đủ
Yêu cầu trùng lặp
Không thuộc phạm vi dịch vụ
Metadata: rejected_at, rejected_by_id, rejection_reason
Email notification: request_rejected được gửi cho khách hàng kèm lý do
Trạng thái cuối: Đây là trạng thái terminal (không chuyển tiếp)
5️⃣ CONVERTED (Đã hoàn thành)
Định nghĩa: Service ticket đã hoàn thành, yêu cầu đã được giải quyết
Khi nào xảy ra:
Ticket liên kết (ticket_id) có status = 'completed'
Hệ thống tự động cập nhật (hoặc manual)
Vai trò xử lý: Technician (hoàn thành ticket) → System auto-update
Hành động tiếp theo:
Nếu delivery_method = 'delivery_requested': Chờ xác nhận giao hàng
Nếu delivery_method = 'self_pickup': Khách hàng đến lấy
Email notification: service_completed được gửi cho khách hàng
Trạng thái cuối: Đây là trạng thái terminal (thành công)