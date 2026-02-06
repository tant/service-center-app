"use client";

/**
 * Serial List Accordion Component
 * Displays expandable serial number list for a product with conditional delete functionality
 * - View mode: Shows serials with copy button
 * - Draft mode: Shows serials with delete button for error correction
 */

import { AlertCircle, Check, Copy, Trash2 } from "lucide-react";
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
import type { StockReceiptSerial } from "@/types/inventory";

interface SerialListAccordionProps {
  serials: StockReceiptSerial[];
  productName: string;
  isDraft: boolean; // Whether receipt is in draft status
  onSerialRemoved?: () => void;
}

export function SerialListAccordion({
  serials,
  productName,
  isDraft,
  onSerialRemoved,
}: SerialListAccordionProps) {
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serialToDelete, setSerialToDelete] =
    useState<StockReceiptSerial | null>(null);

  const removeSerialMutation =
    trpc.inventory.serials.removeSerial.useMutation();

  if (!serials || serials.length === 0) {
    return null;
  }

  const handleCopy = async (serialNumber: string) => {
    try {
      await navigator.clipboard.writeText(serialNumber);
      setCopiedSerial(serialNumber);
      toast.success("Đã copy serial");
      setTimeout(() => setCopiedSerial(null), 2000);
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  const handleDeleteClick = (serial: StockReceiptSerial) => {
    setSerialToDelete(serial);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serialToDelete) return;

    try {
      await removeSerialMutation.mutateAsync({
        serialId: serialToDelete.id,
      });
      toast.success("Đã xóa serial");
      setDeleteDialogOpen(false);
      setSerialToDelete(null);
      onSerialRemoved?.();
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa serial");
    }
  };

  return (
    <>
      <div className="pt-2 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <span className="text-sm font-medium text-muted-foreground">
            📦 Serial Numbers ({serials.length})
          </span>
          {isDraft && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              Chế độ Nháp
            </span>
          )}
        </div>

        {/* Draft Mode Info */}
        {isDraft && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Bạn có thể xóa serial sai trong chế độ Nháp. Sau khi gửi duyệt,
              serial không thể xóa.
            </span>
          </div>
        )}

        {/* Serial List */}
        <div className="space-y-2">
          {serials.map((serial, index) => (
            <div
              key={serial.id}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground font-medium w-6">
                  {index + 1}.
                </span>
                <code className="text-sm font-mono font-medium flex-1 truncate">
                  {serial.serial_number}
                </code>
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              </div>

              <div className="flex items-center gap-1 ml-2">
                {/* Copy Button - Always visible */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopy(serial.serial_number)}
                  title="Copy serial"
                >
                  {copiedSerial === serial.serial_number ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>

                {/* Delete Button - Only in draft mode */}
                {isDraft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(serial)}
                    disabled={removeSerialMutation.isPending}
                    title="Xóa serial"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="text-xs text-muted-foreground text-right pt-2 border-t border-border/50">
          Tổng: {serials.length} serial đã nhập
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa serial</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Bạn có chắc chắn muốn xóa serial này?</p>
              {serialToDelete && (
                <div className="rounded-md bg-muted p-3 mt-2">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Sản phẩm:
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {productName}
                  </p>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Serial:
                  </p>
                  <code className="text-sm font-mono text-foreground">
                    {serialToDelete.serial_number}
                  </code>
                </div>
              )}
              <p className="text-destructive mt-2">
                ⚠️ Hành động này không thể hoàn tác.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSerialToDelete(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={removeSerialMutation.isPending}
            >
              {removeSerialMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
