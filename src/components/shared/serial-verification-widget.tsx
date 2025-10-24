/**
 * Story 1.8: Serial Number Verification and Stock Movements
 * Widget for verifying product warranty status by serial number
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSerialVerification } from "@/hooks/use-warehouse";
import { WarrantyStatusBadge } from "../inventory/warranty-status-badge";
import { IconSearch, IconPackage, IconMapPin, IconAlertCircle } from "@tabler/icons-react";

interface SerialVerificationWidgetProps {
  onVerified?: (productId: string, serialNumber: string) => void;
}

export function SerialVerificationWidget({ onVerified }: SerialVerificationWidgetProps) {
  const [serial, setSerial] = useState("");
  const { verifySerial, isVerifying, data, reset } = useSerialVerification();

  const handleVerify = () => {
    if (!serial) return;

    verifySerial(
      { serial_number: serial },
      {
        onSuccess: (result) => {
          if (result.found && "product" in result && result.product && onVerified) {
            onVerified(result.product.product_id, result.product.serial_number);
          }
        },
      }
    );
  };

  const handleClear = () => {
    setSerial("");
    reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nhập số serial để kiểm tra"
          value={serial}
          onChange={(e) => setSerial(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleVerify();
            if (e.key === "Escape") handleClear();
          }}
        />
        <Button onClick={handleVerify} disabled={!serial || isVerifying}>
          <IconSearch className="mr-2 h-4 w-4" />
          {isVerifying ? "Đang kiểm tra..." : "Kiểm tra"}
        </Button>
        {data && (
          <Button variant="outline" onClick={handleClear}>
            Xóa
          </Button>
        )}
      </div>

      {data && (
        <div>
          {!data.found || !("product" in data) ? (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>{"message" in data ? data.message : "Lỗi không xác định"}</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <IconPackage className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{data.product.product?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {data.product.serial_number}
                    </p>
                  </div>
                </div>
                <WarrantyStatusBadge warrantyEndDate={data.product.warranty_end_date} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Tình trạng</p>
                  <Badge variant="outline" className="capitalize">
                    {data.product.condition === "new" && "Mới"}
                    {data.product.condition === "refurbished" && "Tân trang"}
                    {data.product.condition === "used" && "Đã qua sử dụng"}
                    {data.product.condition === "faulty" && "Lỗi"}
                    {data.product.condition === "for_parts" && "Tháo linh kiện"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Vị trí</p>
                  <div className="flex items-center gap-1">
                    <IconMapPin className="h-3 w-3" />
                    <span>{data.location.virtual?.display_name || "Không xác định"}</span>
                  </div>
                </div>
              </div>

              {data.warranty.startDate && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Thông tin bảo hành</p>
                  <div className="space-y-1">
                    <p>
                      Bắt đầu: {new Date(data.warranty.startDate).toLocaleDateString("vi-VN")}
                    </p>
                    {data.warranty.endDate && (
                      <p>
                        Kết thúc: {new Date(data.warranty.endDate).toLocaleDateString("vi-VN")}
                        {data.warranty.daysRemaining !== null && data.warranty.daysRemaining > 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            (còn {data.warranty.daysRemaining} ngày)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {data.inService && data.product.current_ticket && (
                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                  <IconAlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Sản phẩm này đang trong quá trình sửa chữa (Phiếu:{" "}
                    {data.product.current_ticket.ticket_number})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
