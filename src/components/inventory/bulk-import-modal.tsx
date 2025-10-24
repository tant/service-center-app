/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Modal for bulk CSV import of physical products
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconUpload, IconFileDownload, IconX, IconAlertCircle } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBulkProductImport } from "@/hooks/use-warehouse";
import { toast } from "sonner";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string>("");

  const { bulkImportAsync, isImporting, result } = useBulkProductImport();

  const downloadTemplate = () => {
    const headers = [
      "serial_number",
      "product_id",
      "physical_warehouse_id",
      "virtual_warehouse_type",
      "condition",
      "warranty_start_date",
      "warranty_months",
      "supplier_name",
      "purchase_date",
      "purchase_price",
      "notes",
    ];

    const exampleRows = [
      [
        "ABC12345",
        "uuid-of-product",
        "uuid-of-warehouse",
        "warranty_stock",
        "new",
        "2024-01-01",
        "12",
        "ABC Tech Supplier",
        "2024-01-01",
        "5000000",
        "Initial stock",
      ],
      [
        "DEF67890",
        "uuid-of-product",
        "",
        "rma_staging",
        "refurbished",
        "2024-02-15",
        "6",
        "XYZ Refurb Co",
        "2024-02-10",
        "3000000",
        "Refurbished unit",
      ],
    ];

    const csvContent = [headers, ...exampleRows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "product_import_template.csv";
    link.click();

    toast.success("Đã tải xuống file mẫu CSV");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setParseError("Vui lòng chọn file CSV");
      toast.error("Vui lòng chọn file CSV");
      return;
    }

    setSelectedFile(file);
    setParseError("");
    setParsedData([]);

    // Parse CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          throw new Error("File CSV phải có ít nhất 1 dòng header và 1 dòng dữ liệu");
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim());

        // Parse rows
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(",").map((v) => v.trim());
          const row: any = {};

          headers.forEach((header, i) => {
            row[header] = values[i] || "";
          });

          // Add row number for error reporting
          row._rowNumber = index + 2; // +2 because header is row 1 and arrays are 0-indexed

          return row;
        });

        setParsedData(data);
        toast.success(`Đã đọc ${data.length} dòng dữ liệu từ file CSV`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Lỗi khi đọc file CSV";
        setParseError(errorMessage);
        toast.error(errorMessage);
      }
    };

    reader.onerror = () => {
      setParseError("Lỗi khi đọc file");
      toast.error("Lỗi khi đọc file");
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Vui lòng chọn file CSV và đọc dữ liệu");
      return;
    }

    try {
      // Transform parsed data to match API schema
      const products = parsedData.map((row) => ({
        serial_number: row.serial_number.toUpperCase(),
        product_id: row.product_id,
        physical_warehouse_id: row.physical_warehouse_id || undefined,
        virtual_warehouse_type: row.virtual_warehouse_type,
        condition: row.condition,
        warranty_start_date: row.warranty_start_date || undefined,
        warranty_months: row.warranty_months ? parseInt(row.warranty_months) : undefined,
        supplier_name: row.supplier_name || undefined,
        purchase_date: row.purchase_date || undefined,
        purchase_price: row.purchase_price ? parseFloat(row.purchase_price) : undefined,
        notes: row.notes || undefined,
      }));

      await bulkImportAsync({ products });

      // Don't close immediately - show results
    } catch (error) {
      // Error handling is done in the hook
      console.error("Bulk import error:", error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedData([]);
    setParseError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nhập Sản Phẩm Hàng Loạt</DialogTitle>
          <DialogDescription>
            Tải lên file CSV để nhập nhiều sản phẩm cùng lúc
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download template button */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <IconFileDownload className="mr-2 h-4 w-4" />
              Tải File Mẫu CSV
            </Button>
            <p className="text-sm text-muted-foreground">
              Tải file mẫu để xem cấu trúc dữ liệu
            </p>
          </div>

          {/* File upload */}
          <div>
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-upload")?.click()}
              disabled={isImporting}
              className="w-full"
            >
              <IconUpload className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Chọn File CSV"}
            </Button>
          </div>

          {/* Parse error */}
          {parseError && (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Data preview */}
          {parsedData.length > 0 && !result && (
            <div>
              <h4 className="mb-2 font-medium">
                Xem trước dữ liệu ({parsedData.length} dòng)
              </h4>
              <div className="max-h-60 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Warehouse Type</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Warranty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {row.serial_number}
                        </TableCell>
                        <TableCell className="text-xs">{row.product_id}</TableCell>
                        <TableCell className="text-xs">{row.virtual_warehouse_type}</TableCell>
                        <TableCell className="text-xs">{row.condition}</TableCell>
                        <TableCell className="text-xs">
                          {row.warranty_months ? `${row.warranty_months} tháng` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 5 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Hiển thị 5 / {parsedData.length} dòng
                </p>
              )}
            </div>
          )}

          {/* Import results */}
          {result && (
            <div className="space-y-2">
              <Alert>
                <AlertDescription>
                  <strong>Kết quả nhập:</strong> {result.success_count} thành công,{" "}
                  {result.error_count} lỗi
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-destructive">
                    Lỗi ({result.errors.length})
                  </h4>
                  <div className="max-h-60 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dòng</TableHead>
                          <TableHead>Serial</TableHead>
                          <TableHead>Lỗi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {error.serial}
                            </TableCell>
                            <TableCell className="text-xs text-destructive">
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            {result ? "Đóng" : "Hủy"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={isImporting || parsedData.length === 0}>
              {isImporting ? "Đang nhập..." : `Nhập ${parsedData.length} Sản Phẩm`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
