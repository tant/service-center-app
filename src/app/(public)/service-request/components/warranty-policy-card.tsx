import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconShieldCheck, IconClock, IconTools, IconAlertTriangle } from "@tabler/icons-react";

const POLICY_POINTS = [
  {
    icon: IconShieldCheck,
    title: "Thời hạn bảo hành chính hãng",
    description:
      "Bảo hành 12 tháng cho thiết bị mới, 6 tháng cho linh kiện thay thế kể từ ngày bàn giao.",
  },
  {
    icon: IconTools,
    title: "Quy trình xử lý minh bạch",
    description:
      "Tất cả yêu cầu đều được đánh giá sơ bộ trong 24 giờ và thông báo tiến độ qua email.",
  },
  {
    icon: IconClock,
    title: "Thời gian sửa chữa cam kết",
    description:
      "Trung bình 3–5 ngày làm việc tùy loại thiết bị; có dịch vụ ưu tiên cho trường hợp khẩn cấp.",
  },
  {
    icon: IconAlertTriangle,
    title: "Các trường hợp từ chối bảo hành",
    description:
      "Sản phẩm hỏng do va đập, vào nước hoặc tự ý sửa chữa không thuộc phạm vi bảo hành.",
  },
];

export function WarrantyPolicyCard() {
  return (
    <section>
      <Card className="border-none bg-background shadow-xl shadow-black/5">
        <CardHeader className="space-y-3 sm:space-y-4">
          <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Chính sách bảo hành
          </CardTitle>
          <CardDescription className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Chúng tôi cam kết minh bạch trong toàn bộ quy trình bảo hành và sửa
            chữa. Dưới đây là những điểm quan trọng bạn cần biết trước khi gửi
            thiết bị.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8">
          <ul className="grid gap-6 sm:grid-cols-2">
            {POLICY_POINTS.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-5 text-left shadow-sm shadow-black/5"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Icon className="size-5" stroke={1.5} />
                  <span className="text-base font-semibold sm:text-lg">
                    {title}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {description}
                </p>
              </li>
            ))}
          </ul>
          <div>
            <Button asChild variant="link" className="h-auto px-0 text-base font-semibold">
              <Link href="/policies/warranty">Xem đầy đủ chính sách</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
