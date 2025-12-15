/**
 * Confirm Delivery Modal
 * Modal for confirming product delivery to customer
 * Transitions ticket from ready_for_pickup to completed
 */

"use client";

import { IconPackage } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmDeliveryModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: string;
}

export function ConfirmDeliveryModal({
  open,
  onClose,
  ticketId,
  ticketNumber,
}: ConfirmDeliveryModalProps) {
  const [notes, setNotes] = useState("");
  const router = useRouter();

  const confirmDelivery = trpc.tickets.confirmDelivery.useMutation({
    onSuccess: () => {
      toast.success(`Phiếu ${ticketNumber} đã hoàn thành!`);
      setNotes("");
      onClose();
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    confirmDelivery.mutate({
      ticket_id: ticketId,
      delivery_notes: notes.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            Xác nhận bàn giao
          </DialogTitle>
          <DialogDescription>
            Xác nhận khách hàng đã nhận sản phẩm cho phiếu {ticketNumber}. Sau
            khi xác nhận, phiếu sẽ được đánh dấu hoàn thành.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Ghi chú bàn giao (tùy chọn)</Label>
            <Textarea
              id="delivery-notes"
              placeholder="Ghi chú thêm về việc bàn giao..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={confirmDelivery.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={confirmDelivery.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={confirmDelivery.isPending}
          >
            {confirmDelivery.isPending
              ? "Đang xử lý..."
              : "Xác nhận đã bàn giao"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
