/**
 * Bulk Warranty Update Drawer
 * Allows updating warranty dates for multiple products via CSV upload
 * Follows UI_CODING_GUIDE.md Section 6 & 2.6.3 - Uses FormDrawer component
 */

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/components/providers/trpc-provider";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";

interface BulkWarrantyUpdateDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface WarrantyUpdate {
  serial_number: string;
  manufacturer_warranty_end_date: string;
  user_warranty_end_date: string;
}

interface ProcessResult {
  success: Array<{ serial_number: string; message: string }>;
  errors: Array<{ serial_number: string; error: string }>;
  total: number;
  success_count: number;
  error_count: number;
}

export function BulkWarrantyUpdateDrawer({ open, onClose }: BulkWarrantyUpdateDrawerProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string>("");
  const [result, setResult] = React.useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const bulkUpdateMutation = trpc.physicalProducts.bulkUpdateWarranty.useMutation();
  const utils = trpc.useUtils();

  // Reset state when drawer opens/closes
  React.useEffect(() => {
    if (open) {
      setFile(null);
      setError("");
      setResult(null);
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const parseCSV = (text: string): WarrantyUpdate[] => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("File CSV phải có ít nhất 2 dòng (header + dữ liệu)");
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Validate header columns - all 3 columns are required
    const serialIndex = header.indexOf("serial_number");
    if (serialIndex === -1) {
      throw new Error("Thiếu cột bắt buộc: serial_number");
    }

    const manufacturerIndex = header.indexOf("manufacturer_warranty_end_date");
    if (manufacturerIndex === -1) {
      throw new Error("Thiếu cột bắt buộc: manufacturer_warranty_end_date");
    }

    const userIndex = header.indexOf("user_warranty_end_date");
    if (userIndex === -1) {
      throw new Error("Thiếu cột bắt buộc: user_warranty_end_date");
    }

    // Parse data rows
    const updates: WarrantyUpdate[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      const serialNumber = values[serialIndex];
      if (!serialNumber) {
        throw new Error(`Dòng ${i + 1}: Thiếu số serial`);
      }

      const manufacturerDate = values[manufacturerIndex];
      if (!manufacturerDate) {
        throw new Error(`Dòng ${i + 1}: Thiếu ngày hết hạn bảo hành nhà máy`);
      }

      const userDate = values[userIndex];
      if (!userDate) {
        throw new Error(`Dòng ${i + 1}: Thiếu ngày hết hạn bảo hành user`);
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(manufacturerDate)) {
        throw new Error(`Dòng ${i + 1}: Ngày bảo hành nhà máy không đúng định dạng (YYYY-MM-DD): ${manufacturerDate}`);
      }
      if (!dateRegex.test(userDate)) {
        throw new Error(`Dòng ${i + 1}: Ngày bảo hành user không đúng định dạng (YYYY-MM-DD): ${userDate}`);
      }

      updates.push({
        serial_number: serialNumber,
        manufacturer_warranty_end_date: manufacturerDate,
        user_warranty_end_date: userDate,
      });
    }

    return updates;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Vui lòng chọn file CSV");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Vui lòng chọn file CSV");
      return;
    }

    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      // Read file content
      const text = await file.text();

      // Parse CSV
      const updates = parseCSV(text);

      // Call API
      const response = await bulkUpdateMutation.mutateAsync({ updates });

      setResult(response);

      // Invalidate queries to refresh data
      await utils.physicalProducts.listProducts.invalidate();

      // If all successful, close drawer
      if (response.error_count === 0) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xử lý file");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onClose}
      title="Cập Nhật Bảo Hành Hàng Loạt"
      description="Upload file CSV để cập nhật thời hạn bảo hành cho nhiều sản phẩm"
      isSubmitting={isProcessing}
      onSubmit={handleSubmit}
      submitLabel={isProcessing ? "Đang xử lý..." : "Cập nhật"}
      cancelLabel="Đóng"
      submitDisabled={!file || isProcessing}
    >
      {/* Instructions */}
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Định dạng file CSV:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Dòng đầu tiên phải là header (tên cột)</li>
              <li>
                <strong>3 cột bắt buộc:</strong>
                <ul className="list-circle list-inside ml-4 mt-1">
                  <li>serial_number</li>
                  <li>manufacturer_warranty_end_date</li>
                  <li>user_warranty_end_date</li>
                </ul>
              </li>
              <li>Định dạng ngày: YYYY-MM-DD (vd: 2025-12-31)</li>
              <li>
                <strong>Tất cả các trường đều phải có giá trị</strong> - không được để trống
              </li>
              <li className="text-amber-600 dark:text-amber-500">
                <strong>⚠️ Lưu ý:</strong> Số serial phải tồn tại trong hệ thống. Serial không tồn tại sẽ báo lỗi.
              </li>
            </ul>
            <div className="mt-3 p-2 bg-muted rounded text-xs font-mono">
              <p className="font-medium mb-1">Ví dụ file CSV:</p>
              <p>serial_number,manufacturer_warranty_end_date,user_warranty_end_date</p>
              <p>ZT4070-2025-001,2026-12-31,2027-12-31</p>
              <p>ZT4070-2025-002,2026-06-30,2027-06-30</p>
              <p>ZT4070-2025-003,2027-01-15,2028-01-15</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* File Input */}
      <div className="space-y-2">
        <Label htmlFor="csv_file">
          Chọn File CSV <span className="text-destructive">*</span>
        </Label>
        <Input
          ref={fileInputRef}
          id="csv_file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={error ? "border-destructive" : ""}
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            Đã chọn: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <IconX className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-3">
          <Alert variant={result.error_count === 0 ? "default" : "destructive"}>
            <IconCheck className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  Kết quả: {result.success_count}/{result.total} thành công
                </p>
                {result.error_count > 0 && (
                  <p className="text-sm">
                    {result.error_count} lỗi - xem chi tiết bên dưới
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Success List */}
          {result.success.length > 0 && (
            <div className="rounded-lg border p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2 text-green-600">
                ✓ Thành công ({result.success_count})
              </p>
              <div className="space-y-1 text-xs">
                {result.success.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <IconCheck className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-mono">{item.serial_number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error List */}
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-destructive p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2 text-destructive">
                ✗ Lỗi ({result.error_count})
              </p>
              <div className="space-y-1 text-xs">
                {result.errors.map((item, index) => (
                  <div key={index} className="space-y-0.5">
                    <div className="flex items-start gap-2">
                      <IconX className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="font-mono font-medium">{item.serial_number}</span>
                    </div>
                    <p className="text-muted-foreground ml-5">{item.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </FormDrawer>
  );
}
