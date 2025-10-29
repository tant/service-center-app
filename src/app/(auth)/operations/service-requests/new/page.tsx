/**
 * Service Request Creation Page
 * Following UI_CODING_GUIDE.md Section 7 - Dedicated Add/Edit Pages
 */

"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ServiceRequestForm } from "@/components/forms/service-request-form";
import { Button } from "@/components/ui/button";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";

export default function NewServiceRequestPage() {
  const router = useRouter();
  const createRequest = trpc.serviceRequest.submit.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã tạo phiếu yêu cầu ${data.tracking_token} với ${data.item_count} sản phẩm`);
      router.push("/operations/service-requests");
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = (data: any) => {
    createRequest.mutate(data);
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")) {
      router.back();
    }
  };

  return (
    <>
      <PageHeader title="Tạo phiếu yêu cầu dịch vụ" backHref="/operations/service-requests" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 lg:px-6">
            <ServiceRequestForm
              mode="create"
              onSubmit={handleSubmit}
              isSubmitting={createRequest.isPending}
            />
          </div>
        </div>
      </div>

      {/* Page Footer with Actions */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background p-4">
        <Button variant="outline" onClick={handleCancel} disabled={createRequest.isPending}>
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          form="service-request-form"
          disabled={createRequest.isPending}
        >
          {createRequest.isPending ? "Đang tạo..." : "Tạo phiếu yêu cầu"}
        </Button>
      </div>
    </>
  );
}
