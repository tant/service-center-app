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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  IconLoader2,
  IconCheck,
  IconX,
  IconUser,
  IconPackage,
  IconFileText,
  IconTruckDelivery,
  IconInfoCircle,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { useRequestDetails, useUpdateRequestStatus, useRejectRequest } from "@/hooks/use-service-request";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WarrantyStatus } from "@/utils/warranty";

// Status mapping
const STATUS_MAP = {
  submitted: { label: "Đã gửi", variant: "outline" as const },
  received: { label: "Đã tiếp nhận", variant: "secondary" as const },
  processing: { label: "Đang xử lý", variant: "default" as const },
  rejected: { label: "Đã từ chối", variant: "destructive" as const },
  converted: { label: "Đã chuyển", variant: "default" as const },
};

const DELIVERY_METHOD_LABELS: Record<"pickup" | "delivery", string> = {
  pickup: "Khách mang tới",
  delivery: "Giao nhận",
};

const SERVICE_OPTION_LABELS: Record<string, string> = {
  warranty: "Bảo hành",
  paid: "Dịch vụ trả phí",
  replacement: "Đổi sản phẩm",
};

type IssuePhotoMetadata = {
  path?: string | null;
  url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
};

function formatDisplayDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, "dd/MM/yyyy");
}

function formatDisplayDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, "dd/MM/yyyy HH:mm");
}

function normalizeIssuePhotos(value: unknown): IssuePhotoMetadata[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<IssuePhotoMetadata[]>((acc, item) => {
    if (typeof item === "string") {
      acc.push({
        path: item,
        url: item,
        file_name: item.split("/").pop() ?? item,
        file_size: null,
        file_type: null,
      });
      return acc;
    }

    if (item && typeof item === "object") {
      const metadata = item as Record<string, unknown>;
      acc.push({
        path: typeof metadata.path === "string" ? metadata.path : null,
        url: typeof metadata.url === "string" ? metadata.url : null,
        file_name: typeof metadata.file_name === "string" ? metadata.file_name : null,
        file_size: typeof metadata.file_size === "number" ? metadata.file_size : null,
        file_type: typeof metadata.file_type === "string" ? metadata.file_type : null,
      });
    }

    return acc;
  }, []);
}

type WarrantyBadgeVariant = "resolved" | "processing" | "destructive" | "outline";

function getWarrantyBadgeInfo(
  status: WarrantyStatus | null | undefined
): { label: string; variant: WarrantyBadgeVariant } | null {
  if (!status) {
    return null;
  }

  switch (status) {
    case "active":
      return {
        label: "Còn hạn",
        variant: "resolved",
      };
    case "expiring_soon":
      return {
        label: "Sắp hết hạn",
        variant: "processing",
      };
    case "expired":
      return {
        label: "Hết hạn",
        variant: "destructive",
      };
    case "no_warranty":
      return {
        label: "Không có bảo hành",
        variant: "outline",
      };
    default:
      return null;
  }
}

function formatDurationFromDays(days: number) {
  const abs = Math.abs(days);
  if (abs >= 365) {
    const years = Math.floor(abs / 365);
    return years <= 1 ? "1 năm" : `${years} năm`;
  }
  if (abs >= 30) {
    const months = Math.floor(abs / 30);
    return months <= 1 ? "1 tháng" : `${months} tháng`;
  }
  if (abs === 0) {
    return "0 ngày";
  }
  return abs === 1 ? "1 ngày" : `${abs} ngày`;
}

function getWarrantyDetailBadgeLabel(
  status: WarrantyStatus | null | undefined,
  daysRemaining: number | null | undefined
) {
  if (!status) {
    return null;
  }

  const days = typeof daysRemaining === "number" ? daysRemaining : null;

  switch (status) {
    case "active":
      if (days === null || days <= 0) {
        return "Còn hạn";
      }
      return `Còn hạn ${formatDurationFromDays(days)}`;
    case "expiring_soon":
      if (days === null || days <= 0) {
        return "Sắp hết hạn";
      }
      return `Còn hạn ${formatDurationFromDays(days)}`;
    case "expired":
      if (days === null) {
        return "Đã hết hạn";
      }
      if (days === 0) {
        return "Hết hạn hôm nay";
      }
      return `Quá hạn ${formatDurationFromDays(Math.abs(days))}`;
    case "no_warranty":
      return "Không bảo hành";
    default:
      return null;
  }
}

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const { data: request, isLoading, error, refetch } = useRequestDetails(requestId);
  const { updateStatus, isUpdating } = useUpdateRequestStatus();
  const { rejectRequest, isRejecting } = useRejectRequest();

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
  const items = Array.isArray(request.items) ? request.items : [];
  const deliveryMethod = (request.preferred_delivery_method ?? "pickup") as keyof typeof DELIVERY_METHOD_LABELS;
  const deliveryLabel = DELIVERY_METHOD_LABELS[deliveryMethod] ?? "Khác";
  const preferredSchedule = formatDisplayDate(request.preferred_schedule);
  const reviewedAt = formatDisplayDateTime(request.reviewed_at);
  const convertedAt = formatDisplayDateTime(request.converted_at);
  const createdAt = formatDisplayDateTime(request.created_at);
  const updatedAt = formatDisplayDateTime(request.updated_at);
  const reviewedByName = request.reviewed_by?.full_name ?? null;
  const showReviewInfo =
    Boolean(request.reviewed_at) ||
    Boolean(request.reviewed_by) ||
    Boolean(request.rejection_reason) ||
    Boolean(request.converted_at);
  const showSystemInfo = Boolean(createdAt) || Boolean(updatedAt);
  const hasSupportingInfo =
    showReviewInfo || Boolean(request.linked_ticket_id);
  const displayOrDash = (value: string | null | undefined) => {
    if (typeof value !== "string") {
      return "-";
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? value : "-";
  };

  return (
    <>
      <PageHeader title={`Yêu cầu ${request.tracking_token}`} backHref="/operations/service-requests" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-4 md:py-6 lg:px-6">
            <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <Card className="lg:col-span-2">
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

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    Thông tin khách hàng & giao nhận
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Tên</p>
                        <p className="font-medium">
                          {displayOrDash(request.customer_name)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {displayOrDash(request.customer_email)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Số điện thoại</p>
                        <p className="font-medium">
                          {displayOrDash(request.customer_phone)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Địa chỉ</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {displayOrDash(request.customer_address)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Hình thức xử lý</p>
                        <p className="font-medium">
                          {displayOrDash(
                            deliveryLabel
                              ? `${deliveryLabel}${deliveryMethod === "delivery" ? " tại nhà" : ""}`
                              : null,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Thời gian mong muốn</p>
                        <p className="text-sm">
                          {displayOrDash(preferredSchedule)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Địa chỉ giao nhận</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {displayOrDash(request.delivery_address)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ghi chú nhận hàng</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {displayOrDash(request.pickup_notes)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Thông tin liên hệ ưu tiên</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {displayOrDash(request.contact_notes)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />
                    Mô tả & sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Mô tả vấn đề
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {request.issue_description || "Không có mô tả bổ sung."}
                    </p>
                  </section>
                  <Separator />
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconPackage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Thông tin sản phẩm</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Không có thông tin sản phẩm cho yêu cầu này.
                      </p>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue={items[0]?.id ?? `item-0`}
                        className="rounded-md border"
                      >
                        {items.map((item, index) => {
                          const issuePhotos = normalizeIssuePhotos(item.issue_photos);
                          const serviceOptionLabel = item.service_option
                            ? SERVICE_OPTION_LABELS[item.service_option] ?? item.service_option
                            : null;
                          const purchaseDate = formatDisplayDate(item.purchase_date);
                          const accordionValue = item.id ?? `item-${index}`;
                          const modelLabel = item.product_model || "Không xác định";
                          const serialLabel = item.serial_number || "Không có serial";
                          const ticketLabel = item.ticket
                            ? `${item.ticket.ticket_number} · ${item.ticket.status}`
                            : null;
                          const warrantyStatus = (item.warranty_status ?? null) as WarrantyStatus | null;
                          const warrantyEndDateIso =
                            typeof item.warranty_end_date === "string" ? item.warranty_end_date : null;
                          const warrantyEndDateDisplay = formatDisplayDate(warrantyEndDateIso);
                          const warrantyBadge = getWarrantyBadgeInfo(warrantyStatus);
                          const warrantyDetailBadgeLabel = getWarrantyDetailBadgeLabel(
                            warrantyStatus,
                            item.warranty_days_remaining ?? null
                          );
                          const warrantyDetailBadgeVariant = warrantyBadge?.variant ?? "outline";

                          return (
                            <AccordionItem key={accordionValue} value={accordionValue}>
                              <AccordionTrigger className="px-3 border border-transparent hover:border-border hover:bg-muted/50 transition-colors duration-150 hover:shadow-xs hover:no-underline">
                                <div className="flex flex-1 flex-col gap-2 text-left">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      {items.length > 1 && (
                                        <span className="text-xs font-medium uppercase text-muted-foreground">
                                          Sản phẩm {index + 1}
                                        </span>
                                      )}
                                      <span className="font-medium">{modelLabel}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {serviceOptionLabel && (
                                        <Badge variant="outline" className="text-xs">
                                          {serviceOptionLabel}
                                        </Badge>
                                      )}
                                      {warrantyBadge && (
                                        <Badge variant={warrantyBadge.variant} className="text-xs">
                                          {warrantyBadge.label}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span className="font-mono uppercase">{serialLabel}</span>
                                    {ticketLabel && <span>{ticketLabel}</span>}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3">
                                <div className="space-y-3 pt-2">
                                  {item.product_brand && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Thương hiệu</p>
                                      <p className="text-sm font-medium">{item.product_brand}</p>
                                    </div>
                                  )}
                                  {purchaseDate && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Ngày mua</p>
                                      <p className="text-sm">{purchaseDate}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-muted-foreground">Thời hạn bảo hành</p>
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span>
                                        {warrantyEndDateDisplay
                                          ? `${warrantyEndDateDisplay}`
                                          : "Không có thông tin"}
                                      </span>
                                      {warrantyDetailBadgeLabel && (
                                        <Badge variant={warrantyDetailBadgeVariant} className="text-xs">
                                          {warrantyDetailBadgeLabel}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {item.issue_description && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Mô tả vấn đề</p>
                                      <p className="text-sm whitespace-pre-wrap">{item.issue_description}</p>
                                    </div>
                                  )}
                                  {issuePhotos.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Ảnh đính kèm</p>
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        {issuePhotos.map((photo, photoIndex) => (
                                          <div
                                            key={`${accordionValue}-photo-${photoIndex}`}
                                            className="rounded-md border p-2 text-xs"
                                          >
                                            <p className="font-medium">{photo.file_name ?? "Ảnh đính kèm"}</p>
                                            {photo.file_size ? (
                                              <p className="text-muted-foreground">
                                                {(photo.file_size / 1024 / 1024).toFixed(2)} MiB
                                              </p>
                                            ) : null}
                                            {photo.url && (
                                              <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-7 px-2 text-xs"
                                              >
                                                <a href={photo.url} target="_blank" rel="noreferrer">
                                                  Xem ảnh
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {item.ticket && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Phiếu dịch vụ</p>
                                      <p className="text-sm font-mono">
                                        {item.ticket.ticket_number} · {item.ticket.status}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </section>
                </CardContent>
              </Card>

            {hasSupportingInfo ? (
              <div className="space-y-6 lg:col-span-1">
                {showReviewInfo && (
                  <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <IconCalendarEvent className="h-4 w-4" />
                          Thông tin xử lý
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {reviewedByName && (
                          <div>
                            <p className="text-sm text-muted-foreground">Người duyệt</p>
                            <p className="text-sm">{reviewedByName}</p>
                          </div>
                        )}
                        {reviewedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Thời gian duyệt</p>
                            <p className="text-sm">{reviewedAt}</p>
                          </div>
                        )}
                        {request.rejection_reason && (
                          <div>
                            <p className="text-sm text-muted-foreground">Lý do từ chối</p>
                            <p className="text-sm text-destructive whitespace-pre-wrap">
                              {request.rejection_reason}
                            </p>
                          </div>
                        )}
                        {convertedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Chuyển sang phiếu dịch vụ</p>
                            <p className="text-sm">{convertedAt}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                {request.linked_ticket_id && (
                  <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Phiếu dịch vụ đã tạo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/operations/tickets/${request.linked_ticket_id}`)}
                        >
                          Xem phiếu dịch vụ
                        </Button>
                      </CardContent>
                    </Card>
                  )}
              </div>
            ) : null}

            {showSystemInfo && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconInfoCircle className="h-4 w-4" />
                    Thông tin hệ thống
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {createdAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày tạo</p>
                      <p className="text-sm">{createdAt}</p>
                    </div>
                  )}
                  {updatedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cập nhật gần nhất</p>
                      <p className="text-sm">{updatedAt}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

              {showRejectForm && (
                <Card className="border-destructive lg:col-span-2">
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
                    <div className="flex flex-wrap gap-2">
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
      </div>
      {/* Page Footer with Actions */}
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
