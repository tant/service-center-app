/**
 * Service Request Creation Page
 * Following UI_CODING_GUIDE.md Section 7 - Dedicated Add/Edit Pages
 */

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ServiceRequestForm } from "@/components/forms/service-request-form";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";

export default function NewServiceRequestPage() {
  const router = useRouter();

  const createRequest = trpc.serviceRequest.submit.useMutation({
    onSuccess: (data) => {
      const statusMessage =
        data.status === "received"
          ? "và đang tự động tạo phiếu sửa chữa"
          : data.status === "pickingup"
            ? "và đang chờ lấy hàng"
            : "";
      toast.success(
        `Đã tạo phiếu yêu cầu ${data.tracking_token} ${statusMessage}`,
      );
      router.push("/operations/service-requests");
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const saveDraft = trpc.serviceRequest.saveDraft.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã lưu nháp ${data.tracking_token}`);
      router.push("/operations/service-requests");
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = (data: any) => {
    createRequest.mutate(data);
  };

  const handleSaveDraft = (data: any) => {
    saveDraft.mutate(data);
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")) {
      router.back();
    }
  };

  return (
    <>
      <PageHeader
        title="Tạo phiếu yêu cầu dịch vụ"
        backHref="/operations/service-requests"
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 lg:px-6">
            <ServiceRequestForm
              mode="create"
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              isSubmitting={createRequest.isPending || saveDraft.isPending}
            />
          </div>
        </div>
      </div>

      {/* Page Footer with Actions */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background p-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={createRequest.isPending || saveDraft.isPending}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const form = document.getElementById(
              "service-request-form",
            ) as HTMLFormElement;
            if (form) {
              const event = new Event("submit-draft", {
                bubbles: true,
                cancelable: true,
              });
              form.dispatchEvent(event);
            }
          }}
          disabled={createRequest.isPending || saveDraft.isPending}
        >
          {saveDraft.isPending ? "Đang lưu..." : "Lưu nháp"}
        </Button>
        <Button
          type="submit"
          form="service-request-form"
          disabled={createRequest.isPending || saveDraft.isPending}
        >
          {createRequest.isPending ? "Đang tạo..." : "Tạo phiếu yêu cầu"}
        </Button>
      </div>
    </>
  );
}
