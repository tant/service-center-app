"use client";

/**
 * Unified Serial Input Drawer Component
 * Single component for all 3 document types: Receipt, Issue, Transfer
 * Redesigned for better UX: Focus on primary action (textarea)
 * Issue #17: CSV import removed
 */

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

type DocumentType = "receipt" | "issue" | "transfer";

interface UnifiedSerialInputDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DocumentType;
  itemId: string;
  productName: string;
  quantity: number;
  currentSerialCount: number;
  warehouseId?: string; // For issue/transfer - to validate serials exist in this warehouse
  onSuccess: () => void;
}

interface ValidationError {
  serial: string;
  error: string;
}

export function UnifiedSerialInputDrawer({
  open,
  onOpenChange,
  type,
  itemId,
  productName,
  quantity,
  currentSerialCount,
  warehouseId,
  onSuccess,
}: UnifiedSerialInputDrawerProps) {
  const isMobile = useIsMobile();
  const [serialInput, setSerialInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );

  // Warranty fields (only for receipt type)
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [manufacturerWarrantyDate, setManufacturerWarrantyDate] = useState("");
  const [userWarrantyDate, setUserWarrantyDate] = useState("");

  // Mutations based on document type
  const addReceiptSerials = trpc.inventory.receipts.addSerials.useMutation();
  const selectIssueSerials =
    trpc.inventory.issues.selectSerialsByNumbers.useMutation();
  const selectTransferSerials =
    trpc.inventory.transfers.selectSerialsByNumbers.useMutation();

  const remaining = quantity - currentSerialCount;

  // Count serials in input
  const inputSerials = serialInput
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const serialCount = inputSerials.length;

  const getDocumentTypeLabel = () => {
    switch (type) {
      case "receipt":
        return "Phiếu nhập";
      case "issue":
        return "Phiếu xuất";
      case "transfer":
        return "Phiếu chuyển";
    }
  };

  const getValidationHint = () => {
    switch (type) {
      case "receipt":
        return "Serial phải chưa tồn tại trong hệ thống";
      case "issue":
        return "Serial phải đã có trong kho xuất";
      case "transfer":
        return "Serial phải đã có trong kho nguồn";
    }
  };

  const handleSave = async () => {
    if (!serialInput.trim()) {
      toast.error("Vui lòng nhập ít nhất một số serial");
      return;
    }

    if (serialCount > remaining) {
      toast.error(
        `Bạn chỉ có thể thêm ${remaining} serial. Bạn đã nhập ${serialCount}.`,
      );
      return;
    }

    setValidationErrors([]);

    try {
      if (type === "receipt") {
        // Receipt: Add new serials (validates uniqueness)
        const serialsData = inputSerials.map((s) => ({
          serialNumber: s,
          // Apply warranty dates if set
          ...(manufacturerWarrantyDate && {
            manufacturerWarrantyEndDate: manufacturerWarrantyDate,
          }),
          ...(userWarrantyDate && {
            userWarrantyEndDate: userWarrantyDate,
          }),
        }));
        await addReceiptSerials.mutateAsync({
          receiptItemId: itemId,
          serials: serialsData,
        });
      } else if (type === "issue") {
        await selectIssueSerials.mutateAsync({
          issueItemId: itemId,
          serialNumbers: inputSerials,
          virtualWarehouseId: warehouseId!,
        });
      } else {
        await selectTransferSerials.mutateAsync({
          transferItemId: itemId,
          serialNumbers: inputSerials,
          virtualWarehouseId: warehouseId!,
        });
      }

      toast.success(`Đã lưu ${serialCount} serial thành công!`);
      onSuccess();
      setSerialInput("");
      setValidationErrors([]);
      setWarrantyOpen(false);
      setManufacturerWarrantyDate("");
      setUserWarrantyDate("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Save error:", error);

      if (error.message) {
        const errorMsg = error.message;

        if (
          errorMsg.includes("Duplicate") ||
          errorMsg.includes("not found") ||
          errorMsg.includes("already")
        ) {
          const errors: ValidationError[] = inputSerials
            .map((serial) => ({
              serial,
              error: errorMsg.includes(serial) ? errorMsg : "",
            }))
            .filter((e) => e.error);

          if (errors.length > 0) {
            setValidationErrors(errors);
          } else {
            toast.error(errorMsg);
          }
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error("Không thể lưu serial");
      }
    }
  };

  // Issue #17: CSV import functionality removed

  const isProcessing =
    addReceiptSerials.isPending ||
    selectIssueSerials.isPending ||
    selectTransferSerials.isPending;

  const hasWarrantySet = manufacturerWarrantyDate || userWarrantyDate;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className="overflow-visible flex flex-col max-h-[95vh]">
        {/* Header with inline progress */}
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base">
              {getDocumentTypeLabel()}
            </DrawerTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {currentSerialCount}/{quantity}
              </span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentSerialCount / quantity) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{productName}</p>
        </DrawerHeader>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {remaining === 0 ? (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-300">
              Đã nhập đủ serial! Bạn có thể đóng hộp thoại này.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary: Serial Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="serials" className="text-sm font-medium">
                    Số Serial
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {getValidationHint()}
                  </span>
                </div>
                <Textarea
                  id="serials"
                  placeholder={`Nhập mỗi serial một dòng...\n\nVD:\nSN001\nSN002\nSN003`}
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  rows={isMobile ? 8 : 12}
                  className="font-mono text-sm resize-none"
                  disabled={isProcessing}
                  autoFocus
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {serialCount > 0 ? (
                      <span
                        className={
                          serialCount > remaining
                            ? "text-destructive font-medium"
                            : ""
                        }
                      >
                        Đã nhập {serialCount} serial{" "}
                        {serialCount > remaining &&
                          `(vượt ${serialCount - remaining})`}
                      </span>
                    ) : (
                      "Có thể paste nhiều serial cùng lúc"
                    )}
                  </span>
                  {/* Issue #17: CSV upload removed */}
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">
                      Có {validationErrors.length} lỗi:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {validationErrors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>
                          <span className="font-mono">{err.serial}</span>:{" "}
                          {err.error}
                        </li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>...và {validationErrors.length - 5} lỗi khác</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warranty Section - Collapsible (only for receipt) */}
              {type === "receipt" && (
                <Collapsible open={warrantyOpen} onOpenChange={setWarrantyOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-between w-full py-2 px-3 text-sm rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        <span>Tùy chọn bảo hành</span>
                        {hasWarrantySet && (
                          <span className="text-xs text-primary">
                            (đã thiết lập)
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${warrantyOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-lg bg-muted/30">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="manufacturer-warranty"
                          className="text-xs"
                        >
                          Hết hạn BH Nhà máy
                        </Label>
                        <DatePicker
                          id="manufacturer-warranty"
                          value={manufacturerWarrantyDate}
                          onChange={(value) =>
                            setManufacturerWarrantyDate(value)
                          }
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="user-warranty" className="text-xs">
                          Hết hạn BH User
                        </Label>
                        <DatePicker
                          id="user-warranty"
                          value={userWarrantyDate}
                          onChange={(value) => setUserWarrantyDate(value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <DrawerFooter className="pt-2 border-t">
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Đóng
              </Button>
            </DrawerClose>
            {remaining > 0 && (
              <Button
                onClick={handleSave}
                disabled={
                  serialCount === 0 || serialCount > remaining || isProcessing
                }
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {serialCount > 0 ? `Lưu ${serialCount} serial` : "Lưu"}
                  </>
                )}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
