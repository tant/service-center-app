/**
 * Story 1.12: Service Request Tracking Page
 * AC 8: Status-specific messages and next steps for customer
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_MESSAGES: Record<
  string,
  {
    title: string;
    message: string;
    nextSteps: string[];
  }
> = {
  submitted: {
    title: "Đã gửi yêu cầu",
    message:
      "Chúng tôi đã nhận được yêu cầu dịch vụ của bạn. Đội ngũ sẽ xem xét trong vòng 24 giờ.",
    nextSteps: [
      "Kiểm tra email để nhận xác nhận",
      "Lưu mã theo dõi để tra cứu sau",
      "Chúng tôi sẽ liên hệ nếu cần thông tin bổ sung",
    ],
  },
  received: {
    title: "Đã tiếp nhận",
    message:
      "Đội ngũ của chúng tôi đang xem xét yêu cầu và sẽ bắt đầu xử lý sớm.",
    nextSteps: [
      "Không cần thực hiện thêm bước nào",
      "Chúng tôi sẽ cập nhật khi bắt đầu xử lý",
      "Thời gian xem xét ước tính: 1-2 ngày làm việc",
    ],
  },
  processing: {
    title: "Đang xử lý",
    message: "Sản phẩm của bạn đang được kỹ thuật viên xử lý dịch vụ.",
    nextSteps: [
      "Thời gian xử lý thường là 3-5 ngày làm việc",
      "Chúng tôi sẽ thông báo khi hoàn thành",
      "Liên hệ nếu bạn có thắc mắc",
    ],
  },
  completed: {
    title: "Đã hoàn thành!",
    message: "Dịch vụ đã hoàn tất và sản phẩm của bạn đã sẵn sàng.",
    nextSteps: [
      "Kiểm tra email để biết chi tiết nhận hàng/giao hàng",
      "Mang theo mã theo dõi khi đến nhận",
      "Liên hệ để sắp xếp giao hàng nếu áp dụng",
    ],
  },
  cancelled: {
    title: "Đã hủy",
    message: "Yêu cầu dịch vụ đã bị hủy.",
    nextSteps: [
      "Kiểm tra email để biết lý do hủy",
      "Liên hệ hỗ trợ nếu cần làm rõ",
      "Gửi yêu cầu mới nếu cần",
    ],
  },
};

interface StatusMessageProps {
  status: string;
}

export function StatusMessage({ status }: StatusMessageProps) {
  const messageData = STATUS_MESSAGES[status] || STATUS_MESSAGES.submitted;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>{messageData.title}</CardTitle>
        <CardDescription>{messageData.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium">Các bước tiếp theo:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {messageData.nextSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
