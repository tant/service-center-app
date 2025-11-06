# Lộ trình triển khai trang `/service-request`

## 1. Mục tiêu
- Thiết kế lại trang tổng quan để giới thiệu dịch vụ, định hướng người dùng vào 2 luồng chính (tạo yêu cầu, tra cứu).
- Duy trì tính nhất quán với design system hiện hữu (Card, Button, spacing, typography).
- Chuẩn bị cấu trúc tài liệu để theo dõi tiến độ và cập nhật trạng thái phát triển của trang tra cứu.

## 2. Phạm vi
- Trang `/service-request` (landing).
- Trang con `/service-request/create` chứa wizard cũ.
- Trang con `/service-request/track` (placeholder, trạng thái “đang phát triển”).
- Không thay đổi logic backend, API hoặc luồng gửi yêu cầu hiện có.

## 3. Công việc chi tiết

| Nhóm việc | Mô tả | Trạng thái |
| --- | --- | --- |
| Phân tích UI/DS | Rà soát token màu, typography, component Card/Button hiện tại. | ☑ (2025-11-06) |
| Cập nhật routing | Dịch chuyển wizard sang `/service-request/create`, tạo placeholder `/service-request/track`. | ☑ (di chuyển wizard hoàn tất) |
| Dựng `LandingHero` | Tạo section hero với background, heading, mô tả, CTA kép, xử lý trạng thái coming soon. | ☑ |
| Dựng `WarrantyPolicyCard` | Tạo card chính sách, bullet highlights, CTA dẫn trang chi tiết. | ☑ |
| Hook điều hướng | Liên kết CTA tới route tương ứng (router push / link). | ☑ (`Tạo yêu cầu` hoạt động, `Tra cứu` disabled theo trạng thái phát triển) |
| Responsive & dark mode | Kiểm tra breakpoints, overlay contrast, focus state. | ☑ (review tailwind lớp responsive/dark) |
| Accessibility | Đảm bảo heading structure, aria cho nút disabled, alt ảnh. | ☑ (heading H1/H2, button disabled + tooltip) |
| Testing | Manual QA trên desktop/mobile, chạy `pnpm lint`. | ☑ (`pnpm lint` chạy, còn lỗi từ codebase hiện hữu: webpack param, `any`, format docs) |
| Tài liệu bàn giao | Mô tả component, props, cách thay đổi nội dung/ảnh. | ☐ |

## 4. Phụ thuộc & yêu cầu
- Ảnh hero chuẩn bị sẵn (định dạng `.webp` hoặc `.jpg`, tối thiểu 1600×900).
- Nội dung chính sách bảo hành mới nhất từ team vận hành.
- Xác nhận copywriting cuối từ marketing trước khi deploy.

## 5. Rủi ro & phương án
- **Tra cứu chưa sẵn**: triển khai trạng thái disabled + tooltip, ghi chú trong backlog khi ready.
- **Contrast nền ảnh**: dự phòng gradient fallback và kiểm tra WCAG.
- **Thay đổi routing**: đảm bảo deeplink cũ vào `/service-request` vẫn hoạt động bằng cách redirect CTA “Tạo yêu cầu” đúng wizard.

## 6. Tiến trình & liên hệ
- Chủ nhiệm: _(cập nhật tên)_.
- Review UI: _(cập nhật)_.
- QA: _(cập nhật)_.
- Dự kiến hoàn thành UI desktop/mobile: _(ngày)_.
- Dự kiến bàn giao QA: _(ngày)_.

> Ghi chú: Cập nhật trạng thái bằng cách đánh dấu `☐` → `☑` và thêm ngày/thông tin vào bảng khi hoàn thành từng hạng mục.
