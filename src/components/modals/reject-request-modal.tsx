/**
 * Story 1.13: Reject Request Modal
 * AC 8: Reject service request with reason
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRejectRequest } from "@/hooks/use-service-request";
import { IconLoader2, IconAlertTriangle } from "@tabler/icons-react";
import { toast } from "sonner";

interface RejectRequestModalProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common rejection reasons
const REJECTION_REASONS = [
  { value: "custom", label: "Tùy chỉnh..." },
  { value: "out_of_warranty", label: "Sản phẩm hết bảo hành" },
  { value: "not_covered", label: "Vấn đề không thuộc phạm vi bảo hành" },
  { value: "missing_info", label: "Thiếu thông tin cần thiết" },
  { value: "invalid_serial", label: "Serial number không hợp lệ" },
  { value: "duplicate", label: "Yêu cầu trùng lặp" },
  { value: "cannot_service", label: "Không thể cung cấp dịch vụ" },
];

export function RejectRequestModal({ requestId, open, onOpenChange }: RejectRequestModalProps) {
  const { rejectRequest, isRejecting } = useRejectRequest();

  const [selectedReason, setSelectedReason] = useState("custom");
  const [customReason, setCustomReason] = useState("");

  const getRejectionText = () => {
    if (selectedReason === "custom") {
      return customReason;
    }
    const reason = REJECTION_REASONS.find((r) => r.value === selectedReason);
    return reason ? reason.label : "";
  };

  const isValid = () => {
    const text = getRejectionText();
    return text.length >= 10;
  };

  const handleReject = () => {
    if (!requestId || !isValid()) return;

    const rejectionText = getRejectionText();

    rejectRequest(
      {
        request_id: requestId,
        rejection_reason: rejectionText,
      },
      {
        onSuccess: () => {
          toast.success("Đã từ chối yêu cầu dịch vụ");
          handleCancel();
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  const handleCancel = () => {
    setSelectedReason("custom");
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu dịch vụ</DialogTitle>
          <DialogDescription>
            Vui lòng cung cấp lý do từ chối. Khách hàng sẽ nhận được thông báo qua email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Hành động này không thể hoàn tác. Khách hàng sẽ nhận được email thông báo về việc từ chối yêu cầu.
            </AlertDescription>
          </Alert>

          {/* Common Reasons */}
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do từ chối</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Chọn lý do..." />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Textarea */}
          {selectedReason === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">
                Chi tiết lý do từ chối *
              </Label>
              <Textarea
                id="customReason"
                placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                className={customReason.length > 0 && customReason.length < 10 ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {customReason.length}/10 ký tự tối thiểu
              </p>
            </div>
          )}

          {/* Preview */}
          {selectedReason !== "custom" && (
            <div className="space-y-2">
              <Label>Nội dung sẽ gửi cho khách hàng</Label>
              <div className="rounded-md border bg-muted p-3 text-sm">
                {getRejectionText()}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isRejecting}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !isValid()}
            >
              {isRejecting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Từ chối yêu cầu"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
