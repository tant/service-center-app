"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequireRole } from "@/components/auth/RequireRole";

export default function AdminAppSettingsPage() {
  return (
    <RequireRole allowedRoles={["admin"]}>
      <PageHeader title="Cài đặt ứng dụng" backHref="/admin" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2 px-4 lg:px-6">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt chung</CardTitle>
                <CardDescription>Thiết lập cấu hình cho ứng dụng</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Đây là trang tạm cho phần Cài đặt Ứng dụng. Tôi sẽ thêm các
                  mục cấu hình (ví dụ: tên ứng dụng, chế độ bảo trì, tích hợp 3rd
                  party) khi có yêu cầu.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin hệ thống</CardTitle>
                <CardDescription>Trạng thái và thông tin hữu ích</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium">Phiên bản</div>
                    <div className="text-sm text-muted-foreground">0.0.0-dev</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Môi trường</div>
                    <div className="text-sm text-muted-foreground">local</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
