/**
 * Confirm Incoming Request Modal
 * For confirming receipt of items from customers shipping to service center
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUpdateRequestStatus } from "@/hooks/use-service-request";
import { IconCheck, IconX, IconPackage, IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

interface ConfirmIncomingModalProps {
  request: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConfirmIncomingModal({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmIncomingModalProps) {
  const { updateStatus, isUpdating } = useUpdateRequestStatus();
  
  const [itemsChecked, setItemsChecked] = useState(false);
  const [conditionNotes, setConditionNotes] = useState("");
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [discrepancyNotes, setDiscrepancyNotes] = useState("");

  const isValid = () => {
    if (!itemsChecked) return false;
    if (hasDiscrepancy && discrepancyNotes.trim().length < 10) return false;
    return true;
  };

  const handleConfirm = () => {
    if (!request || !isValid()) return;

    updateStatus(
      {
        request_id: request.id,
        status: "received",
      },
      {
        onSuccess: () => {
          toast.success(
            `Đã xác nhận nhận hàng cho yêu cầu ${request.tracking_token}`,
            {
              description: hasDiscrepancy 
                ? "⚠️ Có sai lệch so với mô tả. Vui lòng liên hệ khách hàng."
                : "Trạng thái đã chuyển sang 'Đã tiếp nhận'",
            }
          );
          handleCancel();
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  const handleCancel = () => {
    setItemsChecked(false);
    setConditionNotes("");
    setHasDiscrepancy(false);
    setDiscrepancyNotes("");
    onOpenChange(false);
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            Xác nhận nhận hàng
          </DialogTitle>
          <DialogDescription>
            Kiểm tra và xác nhận đã nhận đúng hàng như mô tả trong yêu cầu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Mã theo dõi
              </div>
              <div className="text-lg font-semibold font-mono">
                {request.tracking_token}
              </div>
            </div>
            <Badge variant="outline">Đã gửi</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Khách hàng
              </div>
              <div className="font-medium">{request.customer_name}</div>
              <div className="text-sm text-muted-foreground">
                {request.customer_phone}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Sản phẩm
              </div>
              <div className="font-medium">{request.product_model}</div>
              <div className="text-sm text-muted-foreground">
                {request.product_brand}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Serial Number
            </div>
            <div className="font-mono text-sm">
              {request.serial_number || (
                <span className="text-muted-foreground">Không có</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Mô tả vấn đề
            </div>
            <div className="text-sm whitespace-pre-wrap bg-background rounded-md p-3 border">
              {request.issue_description}
            </div>
          </div>

          {request.delivery_address && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Địa chỉ gửi hàng
              </div>
              <div className="text-sm">{request.delivery_address}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-row items-start space-x-3 rounded-md border p-4 bg-blue-50/50 dark:bg-blue-950/20">
            <Checkbox
              id="items-checked"
              checked={itemsChecked}
              onCheckedChange={(checked) => setItemsChecked(!!checked)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="items-checked" className="font-semibold cursor-pointer">
                Xác nhận đã kiểm tra hàng
              </Label>
              <p className="text-sm text-muted-foreground">
                Tôi xác nhận đã nhận và kiểm tra hàng gửi từ khách hàng
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition-notes">Ghi chú tình trạng hàng (tùy chọn)</Label>
            <Textarea
              id="condition-notes"
              placeholder="Ví dụ: Hàng nguyên vẹn, đóng gói cẩn thận..."
              className="resize-none"
              rows={3}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mô tả tình trạng bên ngoài của kiện hàng
            </p>
          </div>

          <div className="flex flex-row items-start space-x-3 rounded-md border p-4 bg-yellow-50/50 dark:bg-yellow-950/20">
            <Checkbox
              id="has-discrepancy"
              checked={hasDiscrepancy}
              onCheckedChange={(checked) => {
                setHasDiscrepancy(!!checked);
                if (!checked) setDiscrepancyNotes("");
              }}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="has-discrepancy" className="font-semibold flex items-center gap-2 cursor-pointer">
                <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
                Có sai lệch so với mô tả
              </Label>
              <p className="text-sm text-muted-foreground">
                Đánh dấu nếu hàng nhận được khác với thông tin mô tả trong yêu cầu
              </p>
            </div>
          </div>

          {hasDiscrepancy && (
            <div className="space-y-2">
              <Label htmlFor="discrepancy-notes" className="text-yellow-700 dark:text-yellow-500">
                Chi tiết sai lệch *
              </Label>
              <Textarea
                id="discrepancy-notes"
                placeholder="Mô tả cụ thể điểm khác biệt: serial number không khớp, sản phẩm khác model, thiếu phụ kiện..."
                className="resize-none border-yellow-300"
                rows={4}
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {discrepancyNotes.length}/10 ký tự tối thiểu
              </p>
            </div>
          )}

          {hasDiscrepancy && discrepancyNotes.length >= 10 && (
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Có sai lệch được ghi nhận. Vui lòng liên hệ khách hàng để xác nhận trước khi tiến hành xử lý.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            <IconX className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValid() || isUpdating}
          >
            {isUpdating ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <IconCheck className="h-4 w-4 mr-2" />
                Xác nhận đã nhận
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
