/**
 * Service Request Draft Edit Page
 * Edit draft service request before submission
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ServiceRequestForm } from "@/components/forms/service-request-form";
import { Button } from "@/components/ui/button";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

export default function EditServiceRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  // Fetch request details
  const { data: request, isLoading, error } = trpc.serviceRequest.getDetails.useQuery(
    { request_id: requestId },
    {
      enabled: !!requestId,
    }
  );

  const updateDraft = trpc.serviceRequest.updateDraft.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật bản nháp");
      router.push(`/operations/service-requests/${requestId}`);
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const submitDraft = trpc.serviceRequest.submitDraft.useMutation({
    onSuccess: (data) => {
      const statusMessage = data.status === 'received'
        ? 'và đang tự động tạo phiếu sửa chữa'
        : data.status === 'pickingup'
        ? 'và đang chờ lấy hàng'
        : '';
      toast.success(`Đã gửi yêu cầu ${data.tracking_token} ${statusMessage}`);
      router.push("/operations/service-requests");
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleUpdate = (data: any) => {
    updateDraft.mutate({
      request_id: requestId,
      data,
    });
  };

  const handleSubmit = (data: any) => {
    submitDraft.mutate({
      request_id: requestId,
      data,
    });
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")) {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Chỉnh sửa bản nháp"
          backHref={`/operations/service-requests/${requestId}`}
        />
        <div className="flex flex-1 items-center justify-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <PageHeader
          title="Chỉnh sửa bản nháp"
          backHref="/operations/service-requests"
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Không tìm thấy yêu cầu</p>
            <p className="text-sm text-muted-foreground">
              Yêu cầu không tồn tại hoặc đã bị xóa
            </p>
          </div>
        </div>
      </>
    );
  }

  if (request.status !== "draft") {
    return (
      <>
        <PageHeader
          title="Chỉnh sửa bản nháp"
          backHref={`/operations/service-requests/${requestId}`}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Không thể chỉnh sửa</p>
            <p className="text-sm text-muted-foreground">
              Chỉ có thể chỉnh sửa các yêu cầu ở trạng thái nháp
            </p>
          </div>
        </div>
      </>
    );
  }

  // Transform request data to form data
  const initialData = {
    customer_name: request.customer_name,
    customer_email: request.customer_email || "",
    customer_phone: request.customer_phone || "",
    issue_description: request.issue_description,
    items: request.items?.map((item: any) => ({
      serial_number: item.serial_number,
      issue_description: item.issue_description || "",
    })) || [],
    receipt_status: request.receipt_status as "received" | "pending_receipt",
    preferred_delivery_method: request.delivery_method as "pickup" | "delivery" | undefined,
    delivery_address: request.delivery_address || "",
    workflow_id: request.workflow_id || undefined, // Include workflow_id
  };

  return (
    <>
      <PageHeader
        title={`Chỉnh sửa nháp ${request.tracking_token}`}
        backHref={`/operations/service-requests/${requestId}`}
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 lg:px-6">
            <ServiceRequestForm
              mode="edit"
              initialData={initialData}
              onSubmit={handleUpdate}
              onSubmitAndSend={handleSubmit}
              isSubmitting={updateDraft.isPending || submitDraft.isPending}
            />
          </div>
        </div>
      </div>

      {/* Page Footer with Actions */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background p-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={updateDraft.isPending || submitDraft.isPending}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="outline"
          type="submit"
          form="service-request-form"
          disabled={updateDraft.isPending || submitDraft.isPending}
        >
          {updateDraft.isPending ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
        <Button
          onClick={() => {
            const form = document.getElementById("service-request-form") as HTMLFormElement;
            if (form) {
              const event = new Event("submit-and-send", { bubbles: true, cancelable: true });
              form.dispatchEvent(event);
            }
          }}
          disabled={updateDraft.isPending || submitDraft.isPending}
        >
          {submitDraft.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
        </Button>
      </div>
    </>
  );
}
