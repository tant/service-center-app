"use client";

/**
 * Unified Serial Input Drawer Component
 * Single component for all 3 document types: Receipt, Issue, Transfer
 * Simple flow: Enter → Save (with automatic validation)
 */

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SerialProgressBar } from "./serial-progress-bar";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [_csvFile, setCsvFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Mutations based on document type
  const addReceiptSerials = trpc.inventory.receipts.addSerials.useMutation();
  const selectIssueSerials = trpc.inventory.issues.selectSerialsByNumbers.useMutation();
  const selectTransferSerials = trpc.inventory.transfers.selectSerialsByNumbers.useMutation();

  const remaining = quantity - currentSerialCount;

  const getDocumentTypeLabel = () => {
    switch (type) {
      case "receipt": return "Phiếu nhập";
      case "issue": return "Phiếu xuất";
      case "transfer": return "Phiếu chuyển";
    }
  };

  const handleSave = async () => {
    if (!serialInput.trim()) {
      toast.error("Vui lòng nhập ít nhất một số serial");
      return;
    }

    const serials = serialInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (serials.length > remaining) {
      toast.error(`Bạn chỉ có thể thêm ${remaining} serial. Bạn đã nhập ${serials.length}.`);
      return;
    }

    setValidationErrors([]);

    try {
      if (type === "receipt") {
        // Receipt: Add new serials (validates uniqueness)
        const serialsData = serials.map((s) => ({ serialNumber: s }));
        await addReceiptSerials.mutateAsync({
          receiptItemId: itemId,
          serials: serialsData,
        });
      } else if (type === "issue") {
        // Issue: Select existing serials from warehouse
        // First need to find physical product IDs by serial numbers
        // This will be validated in backend
        await selectIssueSerials.mutateAsync({
          issueItemId: itemId,
          serialNumbers: serials,
          virtualWarehouseId: warehouseId!,
        });
      } else {
        // Transfer: Select existing serials from source warehouse
        await selectTransferSerials.mutateAsync({
          transferItemId: itemId,
          serialNumbers: serials,
          virtualWarehouseId: warehouseId!,
        });
      }

      toast.success(`Đã lưu ${serials.length} serial thành công!`);
      onSuccess();
      setSerialInput("");
      setValidationErrors([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Save error:", error);

      // Parse validation errors from backend
      if (error.message) {
        // Try to extract detailed errors if available
        const errorMsg = error.message;

        // Check if it's a structured validation error
        if (errorMsg.includes("Duplicate") || errorMsg.includes("not found") || errorMsg.includes("already")) {
          // Parse individual serial errors
          const errors: ValidationError[] = serials.map(serial => ({
            serial,
            error: errorMsg.includes(serial) ? errorMsg : ""
          })).filter(e => e.error);

          if (errors.length > 0) {
            setValidationErrors(errors);
          } else {
            // Generic error for all
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

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;

      // Parse CSV - extract serial numbers
      const lines = csvData.trim().split("\n");
      const hasHeader = lines[0].toLowerCase().includes("serial");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const serials = dataLines
        .map(line => {
          const parts = line.split(",");
          return parts[0]?.trim();
        })
        .filter(Boolean);

      // Put into textarea
      setSerialInput(serials.join("\n"));
      setCsvFile(null);
      event.target.value = "";
      toast.success(`Đã tải ${serials.length} serial từ CSV`);
    };

    reader.readAsText(file);
  };

  const isProcessing =
    addReceiptSerials.isPending ||
    selectIssueSerials.isPending ||
    selectTransferSerials.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent className="overflow-visible">
        <DrawerHeader>
          <DrawerTitle>Nhập Số Serial - {getDocumentTypeLabel()}</DrawerTitle>
          <DrawerDescription>
            Sản phẩm: <span className="font-medium">{productName}</span>
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-6 px-4 text-sm max-h-[70vh] overflow-y-auto">
          {/* Progress Bar */}
          <SerialProgressBar current={currentSerialCount} total={quantity} />

          {remaining === 0 ? (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-300">
              ✅ Đã nhập/chọn đủ serial! Bạn có thể đóng hộp thoại này.
            </div>
          ) : (
            <>
              {/* Validation Type Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {type === "receipt" && (
                    <span>📝 Serial phải <strong>chưa tồn tại</strong> trong hệ thống</span>
                  )}
                  {type === "issue" && (
                    <span>📦 Serial phải <strong>đã có</strong> trong kho xuất</span>
                  )}
                  {type === "transfer" && (
                    <span>🚚 Serial phải <strong>đã có</strong> trong kho nguồn</span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Mode Switcher */}
              <div className="flex gap-2">
                <Button
                  variant={mode === "manual" ? "default" : "outline"}
                  onClick={() => setMode("manual")}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nhập thủ công
                </Button>
                <Button
                  variant={mode === "csv" ? "default" : "outline"}
                  onClick={() => setMode("csv")}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Nhập CSV
                </Button>
              </div>

              {/* Manual Entry Mode */}
              {mode === "manual" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="serials">
                      Số Serial <span className="text-muted-foreground">(mỗi dòng một số)</span>
                    </Label>
                    <Textarea
                      id="serials"
                      placeholder={`SN001\nSN002\nSN003\n\n(Tối đa ${remaining} serial)`}
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      rows={12}
                      className="font-mono text-sm mt-2"
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Bạn có thể paste nhiều serial cùng lúc
                    </p>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">
                          Có {validationErrors.length} lỗi:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationErrors.map((err, idx) => (
                            <li key={idx}>
                              <span className="font-mono">{err.serial}</span>: {err.error}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={!serialInput.trim() || isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Lưu Serial
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* CSV Import Mode */}
              {mode === "csv" && (
                <div className="space-y-4">
                  <div className="rounded-md border-2 border-dashed p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-sm font-medium">
                        Click để tải file CSV
                      </span>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCsvUpload}
                        disabled={isProcessing}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      CSV format: serial_number (mỗi dòng một số)
                    </p>
                  </div>

                  {serialInput && (
                    <div className="space-y-2">
                      <Label>Preview ({serialInput.split("\n").filter(Boolean).length} serial)</Label>
                      <Textarea
                        value={serialInput}
                        onChange={(e) => setSerialInput(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                        disabled={isProcessing}
                      />
                      <Button
                        onClick={handleSave}
                        disabled={!serialInput.trim() || isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Lưu Serial
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="rounded-md bg-muted p-4 text-sm">
                    <p className="font-medium mb-2">CSV Format Example:</p>
                    <pre className="font-mono text-xs bg-background p-2 rounded overflow-x-auto">
{`serial_number
SN001
SN002
SN003`}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">
              Đóng
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
