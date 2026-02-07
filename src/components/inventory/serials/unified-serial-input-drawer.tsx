"use client";

/**
 * Unified Serial Input Drawer Component
 * Single component for all 3 document types: Receipt, Issue, Transfer
 * Redesigned for better UX: Focus on primary action (textarea)
 * Issue #17: CSV import removed
 * Issue #21: Implement chunking to avoid "URI too long" error
 */

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Settings2,
  X,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

// Issue #21: Chunk size to avoid "URI too long" error
// 50 serials @ ~12 chars each = ~600 chars (safe for URL encoding)
const SERIAL_CHUNK_SIZE = 50;

/**
 * Issue #14: Parse backend validation errors into structured format
 * Backend returns errors in 2 formats:
 * 1. Serial "ABC123" đã tồn tại trong "Kho Chính". Không thể nhập mua hàng với serial đã có.
 * 2. Serial đã có trong phiếu nhập khác: ABC123, ABC456
 */
function parseValidationErrors(errorMessage: string): ValidationError[] {
  if (!errorMessage) return [];

  const lines = errorMessage.split("\n").filter((line) => line.trim());
  const errors: ValidationError[] = [];

  for (const line of lines) {
    // Format 1: Serial "XXX" <error message>
    const quotedMatch = line.match(/Serial "([^"]+)" (.+)/);
    if (quotedMatch) {
      errors.push({
        serial: quotedMatch[1],
        error: quotedMatch[2],
      });
      continue;
    }

    // Format 2: Serial <error message>: XXX, YYY
    // Example: "Serial đã có trong phiếu nhập khác: SP501, SP502"
    const colonMatch = line.match(/Serial (.+?):\s*(.+)/);
    if (colonMatch) {
      const errorText = colonMatch[1]; // "đã có trong phiếu nhập khác"
      const serialsText = colonMatch[2]; // "SP501, SP502"
      const serials = serialsText.split(",").map((s) => s.trim());

      for (const serial of serials) {
        errors.push({
          serial,
          error: errorText,
        });
      }
      continue;
    }

    // Fallback: If line contains "Serial" but doesn't match patterns above
    // Just show the whole line as error
    if (line.includes("Serial")) {
      errors.push({
        serial: "Unknown",
        error: line,
      });
    }
  }

  return errors;
}

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

interface ProcessingProgress {
  current: number;
  total: number;
  percentage: number;
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
  const [processingProgress, setProcessingProgress] =
    useState<ProcessingProgress | null>(null);

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

  // Issue #21: Process serials in chunks to avoid "URI too long" error
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
    setProcessingProgress(null);

    // Split serials into chunks
    const chunks: string[][] = [];
    for (let i = 0; i < inputSerials.length; i += SERIAL_CHUNK_SIZE) {
      chunks.push(inputSerials.slice(i, i + SERIAL_CHUNK_SIZE));
    }

    const totalChunks = chunks.length;
    let processedCount = 0;

    try {
      // Process each chunk sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunk = chunks[chunkIndex];

        // Update progress
        setProcessingProgress({
          current: chunkIndex + 1,
          total: totalChunks,
          percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100),
        });

        if (type === "receipt") {
          // Receipt: Add new serials (validates uniqueness)
          const serialsData = chunk.map((s) => ({
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
            serialNumbers: chunk,
            virtualWarehouseId: warehouseId!,
          });
        } else {
          await selectTransferSerials.mutateAsync({
            transferItemId: itemId,
            serialNumbers: chunk,
            virtualWarehouseId: warehouseId!,
          });
        }

        processedCount += chunk.length;
      }

      // Success!
      toast.success(
        totalChunks > 1
          ? `Đã lưu ${serialCount} serial thành công (${totalChunks} batches)!`
          : `Đã lưu ${serialCount} serial thành công!`,
      );
      onSuccess();
      setSerialInput("");
      setValidationErrors([]);
      setProcessingProgress(null);
      setWarrantyOpen(false);
      setManufacturerWarrantyDate("");
      setUserWarrantyDate("");
      onOpenChange(false);
    } catch (error: any) {
      setProcessingProgress(null);

      // Check if it's a tRPC validation error (CONFLICT, BAD_REQUEST, NOT_FOUND)
      const isValidationError = [
        "CONFLICT",
        "BAD_REQUEST",
        "NOT_FOUND",
      ].includes(error.data?.code);

      // Only log system errors to console, not validation errors
      if (!isValidationError) {
        console.error("System error:", error);
      }

      const errorMsg = error.message || "Không thể lưu serial";

      // Issue #14: Parse validation errors and populate state
      if (isValidationError) {
        const parsedErrors = parseValidationErrors(errorMsg);

        if (parsedErrors.length > 0) {
          // Set validation errors to show detailed error list
          setValidationErrors(parsedErrors);

          // Show summary toast
          toast.error(
            `Có ${parsedErrors.length} serial không hợp lệ. Vui lòng kiểm tra và sửa lỗi.`,
          );
        } else {
          // Fallback: Show raw error message if parsing failed
          toast.error(errorMsg);
        }
      } else {
        // System errors - show generic message
        toast.error("Lỗi hệ thống. Vui lòng thử lại sau.");
      }

      // Show how many were saved before error
      if (processedCount > 0) {
        toast.info(
          `Đã lưu ${processedCount}/${serialCount} serial trước khi gặp lỗi`,
        );
      }
    }
  };

  // Issue #14: Remove invalid serials from textarea
  // Smart removal: For duplicate errors, keep first occurrence; for other errors, remove all
  const handleRemoveInvalidSerials = () => {
    const invalidSerialSet = new Set(validationErrors.map((e) => e.serial));
    const seenSerials = new Map<string, number>(); // Track occurrences
    const resultSerials: string[] = [];
    let removedCount = 0;

    for (const serial of inputSerials) {
      const occurrenceCount = seenSerials.get(serial) || 0;

      if (invalidSerialSet.has(serial)) {
        // Check if error is about duplication
        const error = validationErrors.find((e) => e.serial === serial);
        const isDuplicateError =
          error?.error.includes("trùng") ||
          error?.error.includes("duplicate") ||
          error?.error.toLowerCase().includes("bị trùng");

        if (isDuplicateError && occurrenceCount === 0) {
          // Keep first occurrence for duplicate errors
          resultSerials.push(serial);
          seenSerials.set(serial, 1);
        } else {
          // Remove: either duplicate occurrence or non-duplicate error
          removedCount++;
        }
      } else {
        // Valid serial, keep it
        resultSerials.push(serial);
        seenSerials.set(serial, occurrenceCount + 1);
      }
    }

    setSerialInput(resultSerials.join("\n"));
    setValidationErrors([]);
    toast.success(
      `Đã xóa ${removedCount} serial không hợp lệ. Còn lại ${resultSerials.length} serial.`,
    );
  };

  // Issue #17: CSV import functionality removed

  const isProcessing =
    addReceiptSerials.isPending ||
    selectIssueSerials.isPending ||
    selectTransferSerials.isPending ||
    processingProgress !== null;

  const hasWarrantySet = manufacturerWarrantyDate || userWarrantyDate;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className="overflow-visible flex flex-col h-full">
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
                            : validationErrors.length > 0
                              ? "text-orange-600 dark:text-orange-400 font-medium"
                              : ""
                        }
                      >
                        Đã nhập {serialCount} serial{" "}
                        {serialCount > remaining &&
                          `(vượt ${serialCount - remaining})`}
                        {validationErrors.length > 0 &&
                          serialCount <= remaining &&
                          `(${validationErrors.length} lỗi)`}
                      </span>
                    ) : (
                      "Có thể paste nhiều serial cùng lúc"
                    )}
                  </span>
                  {/* Issue #17: CSV upload removed */}
                </div>

                {/* Issue #14: Show serial breakdown when there are errors */}
                {validationErrors.length > 0 && serialCount > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {serialCount - validationErrors.length} hợp lệ
                    </span>
                    <span className="text-destructive">
                      ✗ {validationErrors.length} không hợp lệ
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Errors - Issue #14 */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">
                        Có {validationErrors.length} serial không hợp lệ:
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveInvalidSerials}
                        className="h-6 px-2 text-xs -mt-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Xóa các serial lỗi
                      </Button>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {validationErrors.slice(0, 5).map((err) => (
                        <li key={err.serial}>
                          <span className="font-mono font-semibold">
                            {err.serial}
                          </span>
                          : {err.error}
                        </li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li className="text-muted-foreground">
                          ...và {validationErrors.length - 5} lỗi khác
                        </li>
                      )}
                    </ul>
                    <div className="mt-2 text-xs text-muted-foreground">
                      💡 Tip: Click "Xóa các serial lỗi" để tự động loại bỏ các
                      serial không hợp lệ
                    </div>
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
                  serialCount === 0 ||
                  serialCount > remaining ||
                  isProcessing ||
                  validationErrors.length > 0
                }
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {processingProgress
                      ? `Đang lưu... (${processingProgress.current}/${processingProgress.total})`
                      : "Đang lưu..."}
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
