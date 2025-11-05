"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServiceRequestWizard } from "./components/service-request-wizard";

export default function ServiceRequestPage() {
  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu dịch vụ</CardTitle>
          <CardDescription>
            Luồng nhiều bước đang được tái cấu trúc theo tài liệu mới. Một số
            tính năng sẽ được bổ sung ở các bước tiếp theo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceRequestWizard />
        </CardContent>
      </Card>
    </div>
  );
}
