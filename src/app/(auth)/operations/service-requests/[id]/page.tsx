/**
 * Service Request Detail Page
 * View request details and perform actions
 * Following UI_CODING_GUIDE.md Section 7 - Dedicated Add/Edit Pages
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconLoader2, IconCheck, IconX, IconUser, IconPackage, IconFileText, IconTrash, IconTruck, IconEdit } from "@tabler/icons-react";
import { useRequestDetails, useUpdateRequestStatus, useRejectRequest } from "@/hooks/use-service-request";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/components/providers/trpc-provider";

// Status mapping
const STATUS_MAP = {
  draft: { label: "Nháp", variant: "outline" as const },
  submitted: { label: "Đã gửi", variant: "secondary" as const },
  pickingup: { label: "Chờ lấy hàng", variant: "secondary" as const },
  received: { label: "Đã tiếp nhận", variant: "default" as const },
  processing: { label: "Đang xử lý", variant: "default" as const },
  completed: { label: "Hoàn thành", variant: "default" as const },
  cancelled: { label: "Đã hủy", variant: "destructive" as const },
};

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const { data: request, isLoading, error, refetch } = useRequestDetails(requestId);
  const { updateStatus, isUpdating } = useUpdateRequestStatus();
  const { rejectRequest, isRejecting } = useRejectRequest();

  const deleteDraft = trpc.serviceRequest.deleteDraft.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa bản nháp");
      router.push("/operations/service-requests");
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleAccept = () => {
    if (!request) return;

    if (request.status === "submitted") {
      // Update to received
      updateStatus(
        { request_id: requestId, status: "received" },
        {
          onSuccess: () => {
            toast.success("Đã xác nhận tiếp nhận hàng");
            refetch();
          },
          onError: (error: any) => {
            toast.error(`Lỗi: ${error.message}`);
          },
        }
      );
    }
  };

  const handleReject = () => {
    if (!rejectReason || rejectReason.length < 10) {
      toast.error("Lý do từ chối phải có ít nhất 10 ký tự");
      return;
    }

    rejectRequest(
      { request_id: requestId, rejection_reason: rejectReason },
      {
        onSuccess: () => {
          toast.success("Đã từ chối yêu cầu");
          setShowRejectForm(false);
          setRejectReason("");
          refetch();
        },
        onError: (error: any) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  const handleDeleteDraft = () => {
    if (confirm("Bạn có chắc muốn xóa bản nháp này? Hành động này không thể hoàn tác.")) {
      deleteDraft.mutate({ request_id: requestId });
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Chi tiết yêu cầu" backHref="/operations/service-requests" />
        <div className="flex flex-1 items-center justify-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <PageHeader title="Chi tiết yêu cầu" backHref="/operations/service-requests" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Không tìm thấy yêu cầu</p>
            <p className="text-sm text-muted-foreground">Yêu cầu không tồn tại hoặc đã bị xóa</p>
          </div>
        </div>
      </>
    );
  }

  const status = request.status as keyof typeof STATUS_MAP;
  const statusConfig = STATUS_MAP[status];

  return (
    <>
      <PageHeader title={`Yêu cầu ${request.tracking_token}`} backHref="/operations/service-requests" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 lg:px-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trạng thái</CardTitle>
                    <CardDescription>
                      Tạo {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tên</p>
                  <p className="font-medium">{request.customer_name}</p>
                </div>
                {request.customer_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{request.customer_email}</p>
                  </div>
                )}
                {request.customer_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{request.customer_phone}</p>
                  </div>
                )}
                {request.customer_address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{request.customer_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconPackage className="h-4 w-4" />
                  Danh sách sản phẩm ({request.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.items && request.items.length > 0 ? (
                  <div className="space-y-4">
                    {request.items.map((item: any, index: number) => (
                      <div key={item.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Sản phẩm #{index + 1}</p>
                          {item.ticket && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/operations/tickets/${item.ticket.id}`)}
                            >
                              Xem phiếu {item.ticket.ticket_number}
                            </Button>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Serial Number</p>
                          <p className="font-mono text-sm font-medium">{item.serial_number}</p>
                        </div>
                        {item.issue_description && (
                          <div>
                            <p className="text-sm text-muted-foreground">Mô tả vấn đề</p>
                            <p className="text-sm">{item.issue_description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
                )}
              </CardContent>
            </Card>

            {/* Issue Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconFileText className="h-4 w-4" />
                  Mô tả vấn đề chung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{request.issue_description}</p>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {request.delivery_method && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconTruck className="h-4 w-4" />
                    Phương thức giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Phương thức</p>
                    <p className="font-medium">
                      {request.delivery_method === "pickup" ? "Tự đến lấy" : "Giao hàng"}
                    </p>
                  </div>
                  {request.delivery_method === "delivery" && request.delivery_address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Địa chỉ giao hàng</p>
                      <p className="text-sm">{request.delivery_address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">Từ chối yêu cầu</CardTitle>
                  <CardDescription>
                    Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reject-reason">Lý do từ chối</Label>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{rejectReason.length}/10 ký tự</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      disabled={isRejecting}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isRejecting}
                    >
                      {isRejecting ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang từ chối...
                        </>
                      ) : (
                        "Xác nhận từ chối"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Page Footer with Actions */}
      {request.status === "draft" && (
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background p-4">
          <Button
            variant="outline"
            onClick={handleDeleteDraft}
            disabled={deleteDraft.isPending}
          >
            {deleteDraft.isPending ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <IconTrash className="h-4 w-4 mr-2" />
                Xóa nháp
              </>
            )}
          </Button>
          <Button
            onClick={() => router.push(`/operations/service-requests/${requestId}/edit`)}
            disabled={deleteDraft.isPending}
          >
            <IconEdit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>
      )}
      {(request.status === "submitted" || request.status === "received") && (
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background p-4">
          {!showRejectForm && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={isUpdating || isRejecting}
              >
                <IconX className="h-4 w-4 mr-2" />
                Từ chối
              </Button>
              {request.status === "submitted" && (
                <Button
                  onClick={handleAccept}
                  disabled={isUpdating || isRejecting}
                >
                  {isUpdating ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <IconCheck className="h-4 w-4 mr-2" />
                      Xác nhận tiếp nhận
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
