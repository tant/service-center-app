"use client";

/**
 * Issue Detail Header Component
 * Displays header information for a stock issue
 */

import { format } from "date-fns";
import {
  Calendar,
  FileText,
  Package,
  Phone,
  Tag,
  User,
  UserCheck,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  StockIssueReason,
  StockIssueWithRelations,
} from "@/types/inventory";
import { DocumentStatusBadge } from "../shared/document-status-badge";

interface IssueDetailHeaderProps {
  issue: StockIssueWithRelations;
}

// REDESIGNED: Simplified to 2 types
const ISSUE_TYPE_LABELS: Record<string, string> = {
  normal: "Phiếu xuất bình thường",
  adjustment: "Phiếu điều chỉnh (kiểm kê)",
};

// Issue reason labels
const ISSUE_REASON_LABELS: Record<StockIssueReason, string> = {
  sale: "Bán hàng",
  warranty_replacement: "Đổi bảo hành",
  repair: "Sửa chữa (linh kiện)",
  internal_use: "Sử dụng nội bộ",
  sample: "Hàng mẫu",
  gift: "Quà tặng",
  return_to_supplier: "Trả nhà cung cấp",
  damage: "Hàng hỏng/mất",
  other: "Khác",
};

export function IssueDetailHeader({ issue }: IssueDetailHeaderProps) {
  // Determine recipient display name
  const recipientDisplay = issue.customer?.name || issue.recipient_name || null;
  const recipientPhoneDisplay =
    issue.customer?.phone || issue.recipient_phone || null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{issue.issue_number}</CardTitle>
          <DocumentStatusBadge status={issue.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Basic Info */}
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

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Ngày xuất</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(issue.issue_date), "dd/MM/yyyy")}
                </div>
              </div>
            </div>

            {issue.issue_reason && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Lý do xuất</div>
                  <div className="text-sm text-muted-foreground">
                    {ISSUE_REASON_LABELS[issue.issue_reason] ||
                      issue.issue_reason}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Recipient Info */}
          <div className="space-y-3">
            {recipientDisplay && (
              <div className="flex items-start gap-2">
                <UserCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Người nhận</div>
                  <div className="text-sm text-muted-foreground">
                    {recipientDisplay}
                    {issue.customer && (
                      <span className="ml-1 text-xs text-blue-600">
                        (Khách hàng)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {recipientPhoneDisplay && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">SĐT người nhận</div>
                  <div className="text-sm text-muted-foreground">
                    {recipientPhoneDisplay}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Người tạo</div>
                <div className="text-sm text-muted-foreground">
                  {issue.created_by?.full_name || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Notes */}
          <div className="space-y-3">
            {issue.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Ghi chú</div>
                  <div className="text-sm text-muted-foreground">
                    {issue.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
