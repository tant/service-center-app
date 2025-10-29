"use client";

/**
 * Serial Entry Drawer Component
 * Main interface for entering serial numbers for receipt items
 * Features: bulk entry, validation, progress tracking, CSV import
 */

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SerialValidationDisplay } from "./serial-validation-display";
import { SerialProgressBar } from "./serial-progress-bar";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const validateMutation = trpc.inventory.serials.validateSerials.useMutation();
  const addSerialsMutation = trpc.inventory.receipts.addSerials.useMutation();
  const bulkAddMutation = trpc.inventory.serials.bulkAddSerials.useMutation();
  const csvImportMutation = trpc.inventory.serials.bulkImportCSV.useMutation();

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
      toast.error(`You can only add ${remaining} more serial(s). You entered ${serials.length}.`);
      return;
    }

    try {
      const result = await validateMutation.mutateAsync({ serialNumbers: serials });
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

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;

      try {
        await csvImportMutation.mutateAsync({
          receiptItemId,
          csvData,
        });

        toast.success("CSV imported successfully!");
        onSuccess();
        setCsvFile(null);
        event.target.value = "";
      } catch (error: any) {
        toast.error(error.message || "CSV import failed");
        setCsvFile(null);
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  const isProcessing =
    validateMutation.isPending ||
    addSerialsMutation.isPending ||
    csvImportMutation.isPending;

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
          <SerialProgressBar current={currentSerialCount} total={declaredQuantity} />

          {remaining === 0 && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-300">
              Tất cả số serial đã được nhập! Bạn có thể đóng hộp thoại này.
            </div>
          )}

          {remaining > 0 && (
            <>
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
                <>
                  <div>
                    <Label htmlFor="serials">
                      Serial Numbers <span className="text-muted-foreground">(one per line)</span>
                    </Label>
                    <Textarea
                      id="serials"
                      placeholder={`SN001\nSN002\nSN003\n\n(Max ${remaining} serials)`}
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      rows={12}
                      className="font-mono text-sm mt-2"
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can paste multiple serials at once
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleValidate}
                      disabled={!serialInput.trim() || isProcessing}
                      className="flex-1"
                    >
                      {validateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Validate Serials"
                      )}
                    </Button>

                    {validationResult && validationResult.summary.allValid && (
                      <Button
                        onClick={handleAdd}
                        disabled={isProcessing}
                        variant="default"
                        className="flex-1"
                      >
                        {addSerialsMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          `Add ${validationResult.summary.total} Serial(s)`
                        )}
                      </Button>
                    )}
                  </div>

                  {validationResult && <SerialValidationDisplay validation={validationResult} />}
                </>
              )}

              {/* CSV Import Mode */}
              {mode === "csv" && (
                <div className="space-y-4">
                  <div className="rounded-md border-2 border-dashed p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-sm font-medium">
                        Click to upload CSV file
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
                      CSV format: serial_number (one per line)
                    </p>
                    {csvFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Uploading: {csvFile.name}
                      </p>
                    )}
                  </div>

                  {csvImportMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing CSV...
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
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: Warranty information will be managed separately in the Products page
                    </p>
                  </div>
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
