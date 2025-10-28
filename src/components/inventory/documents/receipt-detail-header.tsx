"use client";

/**
 * Receipt Detail Header Component
 * Displays header information for a stock receipt
 */

import { StockReceiptWithRelations } from "@/types/inventory";
import { DocumentStatusBadge } from "../shared/document-status-badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, FileText, Package, Warehouse } from "lucide-react";

interface ReceiptDetailHeaderProps {
  receipt: StockReceiptWithRelations;
}

// REDESIGNED: Simplified to 2 types
const RECEIPT_TYPE_LABELS: Record<string, string> = {
  normal: "Phiếu nhập bình thường",
  adjustment: "Phiếu điều chỉnh (kiểm kê)",
};

export function ReceiptDetailHeader({ receipt }: ReceiptDetailHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{receipt.receipt_number}</CardTitle>
          <DocumentStatusBadge status={receipt.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Loại phiếu</div>
                <div className="text-sm text-muted-foreground">
                  {RECEIPT_TYPE_LABELS[receipt.receipt_type] || receipt.receipt_type}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Warehouse className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Kho nhập</div>
                <div className="text-sm text-muted-foreground">
                  {(receipt as any).virtual_warehouse?.name || "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Ngày nhập</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(receipt.receipt_date), "dd/MM/yyyy")}
                </div>
              </div>
            </div>

            {receipt.expected_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Ngày dự kiến</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(receipt.expected_date), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Người tạo</div>
                <div className="text-sm text-muted-foreground">
                  {receipt.created_by?.full_name || "-"}
                </div>
              </div>
            </div>

            {receipt.approved_by && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Người duyệt</div>
                  <div className="text-sm text-muted-foreground">
                    {receipt.approved_by.full_name}
                  </div>
                </div>
              </div>
            )}

            {receipt.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Ghi chú</div>
                  <div className="text-sm text-muted-foreground">{receipt.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
