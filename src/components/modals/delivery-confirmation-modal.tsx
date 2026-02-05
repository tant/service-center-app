// Delivery Confirmation Modal
// Story 1.14: Customer Delivery Confirmation Workflow

"use client";

import {
  IconCheck,
  IconLoader,
  IconPackage,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirmDelivery } from "@/hooks/use-delivery";

interface DeliveryConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    id: string;
    ticket_number: string;
    customer: {
      name: string;
      phone: string;
    };
    product: {
      name: string;
    };
  };
}

export function DeliveryConfirmationModal({
  open,
  onOpenChange,
  ticket,
}: DeliveryConfirmationModalProps) {
  const router = useRouter();

  const { confirmDeliveryAsync, isConfirming } = useConfirmDelivery();

  const handleConfirm = async () => {
    try {
      await confirmDeliveryAsync({
        ticket_id: ticket.id,
      });

      toast.success(`Đã xác nhận giao hàng cho phiếu ${ticket.ticket_number}`);
      handleClose();
      router.refresh();
    } catch (error) {
      console.error("Delivery confirmation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi xác nhận giao hàng",
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác nhận giao hàng</DialogTitle>
          <DialogDescription>
            Xác nhận đã giao sản phẩm cho khách hàng - Phiếu{" "}
            {ticket.ticket_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Khách hàng:</span>
                  <span className="text-sm">{ticket.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Số điện thoại:</span>
                  <span className="text-sm">{ticket.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconPackage className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sản phẩm:</span>
                  <span className="text-sm">{ticket.product.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Xác nhận đã bàn giao sản phẩm cho khách hàng. Hành động này sẽ
                đóng phiếu (chuyển sang trạng thái hoàn thành).
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isConfirming}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <IconLoader className="h-4 w-4 mr-1 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-1" />
                  Xác nhận giao hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
