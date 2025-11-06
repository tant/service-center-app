/**
 * Story 1.11: Public Service Request Portal
 * AC 9: Success page displays tracking token prominently with instructions
 */

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";

function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast.success("Đã sao chép mã theo dõi");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Không tìm thấy mã theo dõi</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/service-request">
              <Button className="w-full">Tạo yêu cầu mới</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <IconCheck className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Đã gửi yêu cầu thành công!</CardTitle>
            <CardDescription>
              Yêu cầu dịch vụ của bạn đã được ghi nhận. Vui lòng lưu mã theo dõi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>Quan trọng:</strong> Lưu mã theo dõi này để kiểm tra tình trạng yêu cầu.
                Bạn cũng sẽ nhận được email xác nhận.
              </AlertDescription>
            </Alert>

            {/* AC 9: Tracking token displayed prominently */}
            <div className="border-2 border-primary rounded-lg p-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">Mã theo dõi của bạn:</p>
              <div className="font-mono text-2xl md:text-3xl font-bold text-primary break-all">
                {token}
              </div>
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <IconCopy className="mr-2 h-4 w-4" />
                Sao chép mã
              </Button>
            </div>

            {/* AC 9: Instructions */}
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Bước tiếp theo:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Đội ngũ của chúng tôi sẽ xem xét yêu cầu trong vòng 24 giờ</li>
                <li>Bạn sẽ nhận email xác nhận với các bước tiếp theo</li>
                <li>Theo dõi tình trạng yêu cầu bất cứ lúc nào bằng mã theo dõi</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/service-request/create">
                <Button variant="outline" className="w-full">
                  Gửi yêu cầu khác
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ServiceRequestSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
