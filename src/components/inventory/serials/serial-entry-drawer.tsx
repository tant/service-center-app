"use client";

/**
 * Serial Entry Drawer Component
 * Main interface for entering serial numbers for receipt items
 * Features: bulk entry, validation, progress tracking
 * Issue #13: CSV import removed
 */

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { SerialProgressBar } from "./serial-progress-bar";
import { SerialValidationDisplay } from "./serial-validation-display";

interface SerialEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptItemId: string;
  productName: string;
  declaredQuantity: number;
  currentSerialCount: number;
  onSuccess: () => void;
}

export function SerialEntryDrawer({
  open,
  onOpenChange,
  receiptItemId,
  productName,
  declaredQuantity,
  currentSerialCount,
  onSuccess,
}: SerialEntryDrawerProps) {
  const [serialInput, setSerialInput] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateMutation = trpc.inventory.serials.validateSerials.useMutation();
  const addSerialsMutation = trpc.inventory.receipts.addSerials.useMutation();

  const remaining = declaredQuantity - currentSerialCount;

  const handleValidate = async () => {
    if (!serialInput.trim()) {
      toast.error("Please enter at least one serial number");
      return;
    }

    const serials = serialInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (serials.length > remaining) {
      toast.error(
        `You can only add ${remaining} more serial(s). You entered ${serials.length}.`,
      );
      return;
    }

    try {
      const result = await validateMutation.mutateAsync({
        serialNumbers: serials,
      });
      setValidationResult(result);

      if (result.summary.allValid) {
        toast.success(`All ${result.summary.total} serial(s) are valid!`);
      } else {
        toast.error(`${result.summary.invalid} serial(s) failed validation`);
      }
    } catch (error: any) {
      toast.error(error.message || "Validation failed");
    }
  };

  const handleAdd = async () => {
    if (!validationResult || !validationResult.summary.allValid) return;

    try {
      const serials = validationResult.results
        .filter((r: any) => r.isValid)
        .map((r: any) => ({ serialNumber: r.serialNumber }));

      await addSerialsMutation.mutateAsync({
        receiptItemId,
        serials,
      });

      toast.success(`Added ${serials.length} serial(s) successfully!`);
      onSuccess();
      setSerialInput("");
      setValidationResult(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to add serials");
    }
  };

  const isProcessing =
    validateMutation.isPending || addSerialsMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Thêm Số Serial</SheetTitle>
          <SheetDescription>
            Sản phẩm: <span className="font-medium">{productName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Progress Bar */}
          <SerialProgressBar
            current={currentSerialCount}
            total={declaredQuantity}
          />

          {remaining === 0 && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-300">
              Tất cả số serial đã được nhập! Bạn có thể đóng hộp thoại này.
            </div>
          )}

          {remaining > 0 && (
            <>
              {/* Issue #13: CSV import removed - manual entry only */}
              {/* Step 1: Enter Serials */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    1
                  </div>
                  <Label htmlFor="serials" className="text-base font-medium">
                    Nhập số serial{" "}
                    <span className="text-muted-foreground font-normal">
                      (mỗi dòng một số)
                    </span>
                  </Label>
                </div>
                <Textarea
                  id="serials"
                  placeholder={`SN001\nSN002\nSN003\n\n(Tối đa ${remaining} serial)`}
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Bạn có thể paste nhiều serial cùng lúc
                </p>
              </div>

              {/* Step 2: Validate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      validationResult
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    2
                  </div>
                  <Label className="text-base font-medium">
                    Kiểm tra tính hợp lệ
                  </Label>
                </div>
                <Button
                  onClick={handleValidate}
                  disabled={!serialInput.trim() || isProcessing}
                  className="w-full"
                  variant={
                    validationResult?.summary.allValid ? "outline" : "default"
                  }
                >
                  {validateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : validationResult ? (
                    "Kiểm tra lại"
                  ) : (
                    "Kiểm tra Serial"
                  )}
                </Button>
              </div>

              {validationResult && (
                <SerialValidationDisplay validation={validationResult} />
              )}

              {/* Step 3: Save (only shown after validation) */}
              {validationResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        validationResult.summary.allValid
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      3
                    </div>
                    <Label className="text-base font-medium">
                      Lưu vào hệ thống
                    </Label>
                  </div>
                  <Button
                    onClick={handleAdd}
                    disabled={
                      !validationResult.summary.allValid || isProcessing
                    }
                    variant="default"
                    className="w-full"
                  >
                    {addSerialsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      `💾 Lưu ${validationResult.summary.total} Serial`
                    )}
                  </Button>
                  {!validationResult.summary.allValid && (
                    <p className="text-xs text-destructive">
                      ⚠️ Vui lòng sửa các lỗi trước khi lưu
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
