/**
 * Story 1.15: Email Notification System
 * Public page for customers to unsubscribe from email notifications
 * AC 7: Unsubscribe link in every email
 */

"use client";

import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const EMAIL_TYPE_LABELS: Record<
  string,
  { label: string; description: string }
> = {
  request_submitted: {
    label: "Xác nhận yêu cầu đã gửi",
    description: "Nhận email khi bạn gửi yêu cầu dịch vụ",
  },
  request_received: {
    label: "Yêu cầu đã được tiếp nhận",
    description: "Nhận email khi nhân viên tiếp nhận yêu cầu của bạn",
  },
  request_rejected: {
    label: "Yêu cầu bị từ chối",
    description: "Nhận email khi yêu cầu không được chấp nhận",
  },
  ticket_created: {
    label: "Tạo phiếu dịch vụ",
    description: "Nhận email khi phiếu dịch vụ được tạo",
  },
  service_completed: {
    label: "Dịch vụ hoàn thành",
    description: "Nhận email khi dịch vụ của bạn hoàn thành",
  },
  delivery_confirmed: {
    label: "Xác nhận giao hàng",
    description: "Nhận email xác nhận khi bạn nhận sản phẩm",
  },
};

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const type = searchParams?.get("type") || "";

  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    request_submitted: true,
    request_received: true,
    request_rejected: true,
    ticket_created: true,
    service_completed: true,
    delivery_confirmed: true,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load customer's current preferences
  const { data: customer } = trpc.customers.getByEmail.useQuery(
    { email },
    { enabled: !!email },
  );

  useEffect(() => {
    if (customer?.email_preferences) {
      setPreferences(customer.email_preferences as Record<string, boolean>);
    }
  }, [customer]);

  // If a specific type is provided, unsubscribe from that type automatically
  useEffect(() => {
    if (type && EMAIL_TYPE_LABELS[type]) {
      setPreferences((prev) => ({ ...prev, [type]: false }));
    }
  }, [type]);

  const updatePreferencesMutation =
    trpc.customers.updateEmailPreferences.useMutation();

  const handleSave = async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      await updatePreferencesMutation.mutateAsync({
        email,
        preferences,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (emailType: string) => {
    setPreferences((prev) => ({
      ...prev,
      [emailType]: !prev[emailType],
    }));
  };

  const handleUnsubscribeAll = () => {
    setPreferences({
      request_submitted: false,
      request_received: false,
      request_rejected: false,
      ticket_created: false,
      service_completed: false,
      delivery_confirmed: false,
    });
  };

  const handleSubscribeAll = () => {
    setPreferences({
      request_submitted: true,
      request_received: true,
      request_rejected: true,
      ticket_created: true,
      service_completed: true,
      delivery_confirmed: true,
    });
  };

  if (!email) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Email không hợp lệ</CardTitle>
            <CardDescription>
              Vui lòng sử dụng liên kết từ email của bạn để truy cập trang này.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Quản lý đăng ký email</CardTitle>
              <CardDescription>{email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSaved && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>Đã lưu cài đặt của bạn!</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Chọn loại email bạn muốn nhận. Bỏ chọn để hủy đăng ký.
              </p>
            </div>

            {Object.entries(EMAIL_TYPE_LABELS).map(
              ([key, { label, description }]) => (
                <div
                  key={key}
                  className="flex items-start space-x-3 p-3 hover:bg-muted rounded-lg"
                >
                  <Checkbox
                    id={key}
                    checked={preferences[key]}
                    onCheckedChange={() => handleToggle(key)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={key} className="cursor-pointer font-medium">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu cài đặt"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleUnsubscribeAll}
              disabled={isLoading}
            >
              Hủy tất cả
            </Button>
            <Button
              variant="outline"
              onClick={handleSubscribeAll}
              disabled={isLoading}
            >
              Đăng ký tất cả
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Bạn có thể thay đổi cài đặt này bất cứ lúc nào</li>
              <li>
                Một số email quan trọng có thể vẫn được gửi ngay cả khi bạn hủy
                đăng ký
              </li>
              <li>Thay đổi có hiệu lực ngay lập tức</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl mx-auto py-12">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
