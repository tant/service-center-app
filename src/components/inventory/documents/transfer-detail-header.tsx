"use client";

/**
 * Transfer Detail Header Component
 * Displays header information for a stock transfer
 */

import { StockTransfer } from "@/types/inventory";
import { DocumentStatusBadge } from "../shared/document-status-badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, FileText, ArrowRight } from "lucide-react";

interface TransferDetailHeaderProps {
  transfer: any; // StockTransfer with relations
}

export function TransferDetailHeader({ transfer }: TransferDetailHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{transfer.transfer_number}</CardTitle>
          <DocumentStatusBadge status={transfer.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Từ kho</div>
                <div className="text-sm text-muted-foreground">
                  {transfer.from_virtual_warehouse_type}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Đến kho</div>
                <div className="text-sm text-muted-foreground">
                  {transfer.to_virtual_warehouse_type}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Ngày chuyển</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(transfer.transfer_date), "dd/MM/yyyy")}
                </div>
              </div>
            </div>

            {transfer.expected_delivery_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Ngày dự kiến</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(transfer.expected_delivery_date), "dd/MM/yyyy")}
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
                  {transfer.created_by?.full_name || "-"}
                </div>
              </div>
            </div>

            {transfer.approved_by && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Người duyệt</div>
                  <div className="text-sm text-muted-foreground">
                    {transfer.approved_by.full_name}
                  </div>
                </div>
              </div>
            )}

            {transfer.received_by && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Người nhận</div>
                  <div className="text-sm text-muted-foreground">
                    {transfer.received_by.full_name}
                  </div>
                </div>
              </div>
            )}

            {transfer.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Ghi chú</div>
                  <div className="text-sm text-muted-foreground">{transfer.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
