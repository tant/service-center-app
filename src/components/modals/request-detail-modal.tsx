/**
 * Story 1.13: Request Detail Modal
 * AC 5: Display all request information with actions
 */

"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRequestDetails, useUpdateRequestStatus } from "@/hooks/use-service-request";
import { IconPackage, IconUser, IconMapPin, IconFileText, IconTicket, IconLoader2 } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

interface RequestDetailModalProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert?: () => void;
  onReject?: () => void;
}

export function RequestDetailModal({
  requestId,
  open,
  onOpenChange,
  onConvert,
  onReject,
}: RequestDetailModalProps) {
  const { data: request, isLoading } = useRequestDetails(requestId);
  const { updateStatus, isUpdating } = useUpdateRequestStatus();

  const handleMarkReceived = () => {
    if (!requestId) return;

    updateStatus(
      {
        request_id: requestId,
        status: "received",
      },
      {
        onSuccess: () => {
          toast.success("Đã đánh dấu yêu cầu là đã tiếp nhận");
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      submitted: { label: "Đã gửi", variant: "outline" },
      received: { label: "Đã tiếp nhận", variant: "secondary" },
      processing: { label: "Đang xử lý", variant: "default" },
      rejected: { label: "Đã từ chối", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.submitted;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu dịch vụ</DialogTitle>
          <DialogDescription>
            Xem thông tin đầy đủ và quản lý yêu cầu dịch vụ từ khách hàng
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : request ? (
          <div className="space-y-4">
            {/* Status and Token */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mã theo dõi</p>
                <p className="font-mono text-lg font-bold">{request.tracking_token}</p>
              </div>
              <div>{getStatusBadge(request.status)}</div>
            </div>

            <Separator />

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Tên</p>
                  <p className="font-medium">{request.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{request.customer_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{request.customer_phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconPackage className="h-4 w-4" />
                  Thông tin sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Sản phẩm</p>
                  <p className="font-medium">{request.product_model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Thương hiệu</p>
                  <p className="font-medium">{request.product_brand}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Serial Number</p>
                  <p className="font-mono text-xs font-medium">{request.serial_number}</p>
                </div>
              </CardContent>
            </Card>

            {/* Problem Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconFileText className="h-4 w-4" />
                  Mô tả vấn đề
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="whitespace-pre-wrap">{request.issue_description}</p>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconMapPin className="h-4 w-4" />
                  Phương thức nhận hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium capitalize">
                  {request.delivery_method === "pickup"
                    ? "Đến lấy tại trung tâm"
                    : "Giao hàng tận nơi"}
                </p>
                {request.delivery_address && (
                  <p className="text-muted-foreground mt-2">
                    Địa chỉ: {request.delivery_address}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Linked Ticket */}
            {request.linked_ticket && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconTicket className="h-4 w-4" />
                    Phiếu dịch vụ đã tạo
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>
                    Mã phiếu: <span className="font-mono font-bold">{request.linked_ticket.ticket_number}</span>
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Trạng thái: {request.linked_ticket.status}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground">
              <p>
                Đã gửi:{" "}
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {request.status === "submitted" && (
                <Button
                  variant="outline"
                  onClick={handleMarkReceived}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Đánh dấu đã tiếp nhận
                </Button>
              )}

              {(request.status === "submitted" || request.status === "received") && !request.linked_ticket && (
                <>
                  <Button variant="destructive" onClick={onReject}>
                    Từ chối yêu cầu
                  </Button>
                  <Button variant="default" onClick={onConvert}>
                    Chuyển thành phiếu dịch vụ
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy yêu cầu
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
