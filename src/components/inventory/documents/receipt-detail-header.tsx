"use client";

/**
 * Receipt Detail Header Component
 * Displays header information for a stock receipt
 */

import { StockReceiptWithRelations, StockReceiptReason } from "@/types/inventory";
import { DocumentStatusBadge } from "../shared/document-status-badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, FileText, Package, Warehouse, Users, Tag } from "lucide-react";

interface ReceiptDetailHeaderProps {
  receipt: StockReceiptWithRelations;
}

// REDESIGNED: Simplified to 2 types
const RECEIPT_TYPE_LABELS: Record<string, string> = {
  normal: "Phiếu nhập bình thường",
  adjustment: "Phiếu điều chỉnh (kiểm kê)",
};

// Receipt reason labels and styles
const RECEIPT_REASON_CONFIG: Record<StockReceiptReason, { label: string; className: string }> = {
  purchase: {
    label: "Nhập mua hàng",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  customer_return: {
    label: "Nhập hàng trả lại",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  rma_return: {
    label: "Nhập RMA về",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

export function ReceiptDetailHeader({ receipt }: ReceiptDetailHeaderProps) {
  const reasonConfig = receipt.reason ? RECEIPT_REASON_CONFIG[receipt.reason] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl">{receipt.receipt_number}</CardTitle>
            {reasonConfig && (
              <Badge variant="secondary" className={reasonConfig.className}>
                {reasonConfig.label}
              </Badge>
            )}
          </div>
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
                  {receipt.virtual_warehouse?.name || "-"}
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

            {/* Customer for customer_return */}
            {receipt.reason === "customer_return" && receipt.customer && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Khách hàng trả lại</div>
                  <div className="text-sm text-muted-foreground">
                    {receipt.customer.name}
                    {receipt.customer.phone && ` (${receipt.customer.phone})`}
                  </div>
                </div>
              </div>
            )}

            {/* RMA Reference for rma_return */}
            {receipt.reason === "rma_return" && receipt.rma_reference && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Mã RMA</div>
                  <div className="text-sm text-muted-foreground">{receipt.rma_reference}</div>
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
