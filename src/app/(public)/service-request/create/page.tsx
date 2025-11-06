"use client";

import { ServiceRequestTwoStep } from "./service-request-two-step";

export default function ServiceRequestCreatePage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Tạo yêu cầu dịch vụ
        </h1>
        <p className="text-muted-foreground">
          Hoàn tất yêu cầu chỉ trong 2 bước: xác thực serial và gửi thông tin dịch vụ.
        </p>
      </div>

      <ServiceRequestTwoStep />
    </div>
  );
}
