"use client";

/**
 * Issue Detail Header Component
 * Displays header information for a stock issue
 */

import { StockIssueWithRelations } from "@/types/inventory";
import { DocumentStatusBadge } from "../shared/document-status-badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, FileText, Package, Warehouse } from "lucide-react";

interface IssueDetailHeaderProps {
  issue: StockIssueWithRelations;
}

// REDESIGNED: Simplified to 2 types
const ISSUE_TYPE_LABELS: Record<string, string> = {
  normal: "Phiếu xuất bình thường",
  adjustment: "Phiếu điều chỉnh (kiểm kê)",
};

export function IssueDetailHeader({ issue }: IssueDetailHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{issue.issue_number}</CardTitle>
          <DocumentStatusBadge status={issue.status} />
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
                  {ISSUE_TYPE_LABELS[issue.issue_type] || issue.issue_type}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Warehouse className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Kho xuất</div>
                <div className="text-sm text-muted-foreground">
                  {(issue as any).virtual_warehouse?.name || "-"}
                </div>
              </div>
            </div>

            {(issue as any).to_virtual_warehouse?.name && (
              <div className="flex items-start gap-2">
                <Warehouse className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Kho đích</div>
                  <div className="text-sm text-muted-foreground">
                    {(issue as any).to_virtual_warehouse.name}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Ngày xuất</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(issue.issue_date), "dd/MM/yyyy")}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Người tạo</div>
                <div className="text-sm text-muted-foreground">
                  {issue.created_by?.full_name || "-"}
                </div>
              </div>
            </div>

            {issue.approved_by && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Người duyệt</div>
                  <div className="text-sm text-muted-foreground">
                    {issue.approved_by.full_name}
                  </div>
                </div>
              </div>
            )}

            {issue.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Ghi chú</div>
                  <div className="text-sm text-muted-foreground">{issue.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
