/**
 * Story 1.13: Service Requests Table
 * AC 2, 3: Staff request queue with quick actions
 */

"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconEye, IconCheck, IconX } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { RequestDetailModal } from "@/components/modals/request-detail-modal";
import { RejectRequestModal } from "@/components/modals/reject-request-modal";
import { ConvertToTicketModal } from "@/components/modals/convert-to-ticket-modal";

interface ServiceRequest {
  id: string;
  tracking_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_brand: string;
  product_model: string;
  serial_number: string;
  issue_description: string;
  status: string;
  created_at: string;
  linked_ticket?: {
    id: string;
    ticket_number: string;
    status: string;
  } | null;
}

interface ServiceRequestsTableProps {
  requests: ServiceRequest[];
  isLoading: boolean;
}

export function ServiceRequestsTable({ requests, isLoading }: ServiceRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const handleViewDetails = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowDetailModal(true);
  };

  const handleAccept = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowConvertModal(true);
  };

  const handleReject = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowRejectModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      submitted: { label: "Đã gửi", variant: "outline" },
      received: { label: "Đã tiếp nhận", variant: "secondary" },
      processing: { label: "Đang xử lý", variant: "default" },
      rejected: { label: "Đã từ chối", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.submitted;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          Đang tải yêu cầu dịch vụ...
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium">Không có yêu cầu nào</p>
          <p className="text-sm mt-2">Chưa có yêu cầu dịch vụ mới từ khách hàng</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã theo dõi</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đã gửi</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-xs">
                  {request.tracking_token}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{request.customer_email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.product_model}</p>
                    <p className="text-xs text-muted-foreground">{request.product_brand}</p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {request.serial_number}
                </TableCell>
                <TableCell>
                  {getStatusBadge(request.status)}
                  {request.linked_ticket && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Phiếu: {request.linked_ticket.ticket_number}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(request.created_at), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(request.id)}
                    >
                      <IconEye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                    {request.status === "submitted" || request.status === "received" ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAccept(request.id)}
                        >
                          <IconCheck className="h-4 w-4 mr-1" />
                          Chấp nhận
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                        >
                          <IconX className="h-4 w-4 mr-1" />
                          Từ chối
                        </Button>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <RequestDetailModal
        requestId={selectedRequest}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onConvert={() => {
          setShowDetailModal(false);
          setShowConvertModal(true);
        }}
        onReject={() => {
          setShowDetailModal(false);
          setShowRejectModal(true);
        }}
      />

      <ConvertToTicketModal
        requestId={selectedRequest}
        open={showConvertModal}
        onOpenChange={setShowConvertModal}
      />

      <RejectRequestModal
        requestId={selectedRequest}
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
      />
    </>
  );
}
