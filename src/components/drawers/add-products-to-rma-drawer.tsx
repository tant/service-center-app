"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useAddProductsToRMA,
  useValidateRMASerials,
} from "@/hooks/use-warehouse";

interface AddProductsToRMADrawerProps {
  batchId: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

interface ValidationResult {
  serial_number: string;
  status: "valid" | "invalid" | "duplicate" | "not_found";
  message?: string;
  product_id?: string;
  product_name?: string;
}

export function AddProductsToRMADrawer({
  batchId,
  trigger,
  onSuccess,
}: AddProductsToRMADrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [serialInput, setSerialInput] = React.useState("");
  const [validationResults, setValidationResults] = React.useState<
    ValidationResult[]
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { validateAsync, isValidating } = useValidateRMASerials();
  const { addProducts, isAdding } = useAddProductsToRMA();

  const parseSerialNumbers = (text: string): string[] => {
    // Split by newline, comma, semicolon, or multiple spaces
    // Then trim and filter out empty strings
    return text
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSerialInput(text);
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    const serialNumbers = parseSerialNumbers(serialInput);
    if (serialNumbers.length === 0) return;

    try {
      const results = await validateAsync({
        serial_numbers: serialNumbers,
      });

      setValidationResults(results);
    } catch (error) {
      console.error("Validation error:", error);
      // Error toast is already handled by the hook
    }
  };

  const handleSubmit = () => {
    const validProducts = validationResults
      .filter((r) => r.status === "valid" && r.product_id)
      .map((r) => r.product_id!);

    if (validProducts.length === 0) return;

    addProducts(
      {
        batch_id: batchId,
        product_ids: validProducts,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSerialInput("");
          setValidationResults([]);
          onSuccess?.();
        },
      },
    );
  };

  const handleReset = () => {
    setSerialInput("");
    setValidationResults([]);
  };

  const validCount = validationResults.filter(
    (r) => r.status === "valid",
  ).length;
  const invalidCount = validationResults.filter(
    (r) => r.status !== "valid",
  ).length;

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={isMobile ? "max-h-[90vh]" : "max-w-2xl"}>
        <div className="flex h-full flex-col">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>Thêm sản phẩm vào lô RMA</DrawerTitle>
            <DrawerDescription>
              Nhập danh sách serial number (mỗi dòng 1 serial) hoặc upload file
              text
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            <div className="flex flex-col gap-4 pb-4">
          {/* Input Area */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="serial-input" className="text-sm font-medium">
                Danh sách Serial Number
              </Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isValidating || isAdding}
                >
                  <IconUpload className="mr-2 h-4 w-4" />
                  Upload file
                </Button>
                {serialInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isValidating || isAdding}
                  >
                    <IconX className="mr-2 h-4 w-4" />
                    Xóa
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              id="serial-input"
              placeholder="Nhập hoặc paste danh sách serial number&#10;Ví dụ:&#10;SN001&#10;SN002&#10;SN003"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
              disabled={isValidating || isAdding}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {parseSerialNumbers(serialInput).length} serial number được nhập
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleValidate}
                disabled={
                  serialInput.trim().length === 0 || isValidating || isAdding
                }
              >
                {isValidating ? "Đang kiểm tra..." : "Kiểm tra"}
              </Button>
            </div>
          </div>

          {/* Validation Results */}
          {validationResults.length > 0 && (
            <>
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm">
                      <IconCheck className="h-4 w-4 text-green-600" />
                      <strong>{validCount}</strong> hợp lệ
                    </span>
                    {invalidCount > 0 && (
                      <span className="flex items-center gap-1 text-sm">
                        <IconAlertCircle className="h-4 w-4 text-destructive" />
                        <strong>{invalidCount}</strong> lỗi
                      </span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="overflow-hidden rounded-lg border">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {result.status === "valid" ? (
                              <IconCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <IconAlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {result.serial_number}
                          </TableCell>
                          <TableCell className="text-sm">
                            {result.product_name || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {result.status === "valid" ? (
                              <span className="text-green-600">Hợp lệ</span>
                            ) : result.status === "not_found" ? (
                              <span className="text-destructive">
                                Không tìm thấy
                              </span>
                            ) : result.status === "duplicate" ? (
                              <span className="text-amber-600">Trùng lặp</span>
                            ) : (
                              <span className="text-destructive">
                                {result.message}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2 shrink-0 border-t pt-4">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" disabled={isAdding}>
                Hủy
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={validCount === 0 || isAdding}
            >
              {isAdding ? "Đang thêm..." : `Thêm ${validCount} sản phẩm`}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
