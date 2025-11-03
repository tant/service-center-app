/**
 * Story 1.13: Convert to Ticket Modal
 * AC 6, 7: Convert service request to ticket with pre-populated data
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequestDetails } from "@/hooks/use-service-request";
// useConvertToTicket is deprecated - tickets are auto-created via trigger
import { IconLoader2, IconUser, IconPackage, IconAlertCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConvertToTicketModalProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertToTicketModal({ requestId, open, onOpenChange }: ConvertToTicketModalProps) {
  const router = useRouter();
  const { data: request, isLoading } = useRequestDetails(requestId);
  // const { convertToTicket, isConverting } = useConvertToTicket(); // DEPRECATED
  const isConverting = false; // Placeholder

  const [serviceType, setServiceType] = useState<"warranty" | "paid">("warranty");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleConvert = () => {
    // DEPRECATED: This functionality is no longer available
    // Tickets are auto-created when staff updates request status to 'received'
    toast.error("This feature is deprecated. Please update request status to 'received' instead.");
    onOpenChange(false);

    // convertToTicket(
    //   {
    //     request_id: requestId,
    //     service_type: serviceType,
    //     priority,
    //     additional_notes: additionalNotes || undefined,
    //   },
    //   {
    //     onSuccess: (data: any) => {
    //       toast.success(`Đã tạo phiếu dịch vụ ${data.ticket.ticket_number}`);
    //       onOpenChange(false);
    //       // Navigate to ticket detail page
    //       router.push(`/operations/tickets/${data.ticket.id}`);
    //     },
    //     onError: (error: any) => {
    //       toast.error(`Lỗi: ${error.message}`);
    //     },
    //   }
    // );
  };

  const handleCancel = () => {
    setServiceType("warranty");
    setPriority("normal");
    setAdditionalNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="convert-to-ticket-dialog">
        <DialogHeader>
          <DialogTitle>Chuyển thành phiếu dịch vụ</DialogTitle>
          <DialogDescription>
            Tạo phiếu dịch vụ từ yêu cầu của khách hàng. Thông tin sẽ được tự động điền.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : request ? (
          <div className="space-y-4">
            {/* Pre-populated Information */}
            <Alert>
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                Thông tin dưới đây sẽ được sử dụng để tạo phiếu dịch vụ mới
              </AlertDescription>
            </Alert>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Thông tin khách hàng
                </CardTitle>
                <CardDescription className="text-xs">
                  Hệ thống sẽ tìm hoặc tạo mới khách hàng với thông tin này
                </CardDescription>
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

            {/* Product Info */}
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
                  <p className="text-muted-foreground">Serial Number</p>
                  <p className="font-mono text-xs font-medium">{request.serial_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mô tả vấn đề</p>
                  <p className="text-xs whitespace-pre-wrap">{request.issue_description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Service Type */}
            <div className="space-y-2">
              <Label>Loại dịch vụ *</Label>
              <RadioGroup value={serviceType} onValueChange={(v) => setServiceType(v as "warranty" | "paid")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warranty" id="warranty" />
                  <Label htmlFor="warranty" className="font-normal">
                    Bảo hành
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid" id="paid" />
                  <Label htmlFor="paid" className="font-normal">
                    Dịch vụ trả phí
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Độ ưu tiên</Label>
              <RadioGroup value={priority} onValueChange={(v) => setPriority(v as "low" | "normal" | "high")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="font-normal">
                    Thấp
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="font-normal">
                    Bình thường
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="font-normal">
                    Cao
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Ghi chú bổ sung</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Thêm ghi chú nếu cần (tùy chọn)"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Ghi chú này sẽ được thêm vào comment đầu tiên của phiếu dịch vụ
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isConverting}>
                Hủy
              </Button>
              <Button onClick={handleConvert} disabled={isConverting}>
                {isConverting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo phiếu...
                  </>
                ) : (
                  "Tạo phiếu dịch vụ"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Không tìm thấy yêu cầu</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
