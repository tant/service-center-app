"use client";

/**
 * Issue Items Table Component
 * Displays items in an issue with serial selection functionality
 */

import { useState } from "react";
import type { StockIssueWithRelations } from "@/types/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UnifiedSerialInputDrawer } from "../serials/unified-serial-input-drawer";
import { Plus } from "lucide-react";

interface IssueItemsTableProps {
  issue: StockIssueWithRelations;
  onSerialsSelected: () => void;
}

export function IssueItemsTable({ issue, onSerialsSelected }: IssueItemsTableProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Allow editing when: draft, pending_approval, approved, or completed
  // v2.0 Workflow: Serial selection is non-blocking and can continue even after approval/completion
  const canEdit = issue.status === "draft" || issue.status === "pending_approval" || issue.status === "approved" || issue.status === "completed";

  const handleSelectSerials = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDrawerOpen(true);
  };

  const handleSuccess = () => {
    onSerialsSelected();
  };

  const handleOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setSelectedItemId(null);
    }
  };

  const selectedItem = issue.items?.find((item) => item.id === selectedItemId);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Danh sách sản phẩm</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Số serial đã chọn</TableHead>
              <TableHead>Tiến độ</TableHead>
              {canEdit && <TableHead className="text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!issue.items || issue.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  Chưa có sản phẩm nào
                </TableCell>
              </TableRow>
            ) : (
              issue.items.map((item) => {
                const serialCount = item.serials?.length || 0;
                const progress = (serialCount / item.quantity) * 100;
                const isComplete = serialCount === item.quantity;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || "Unknown Product"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.product?.sku || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.quantity < 0 ? "text-red-600 font-medium" : ""}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={isComplete ? "text-green-600 font-semibold" : ""}>
                        {serialCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1" />
                        <span className="text-sm text-muted-foreground min-w-[45px] text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectSerials(item.id)}
                          disabled={isComplete}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="hidden lg:inline">
                            {serialCount === 0 ? "Chọn serial" : "Bổ sung"}
                          </span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {selectedItem && issue.virtual_warehouse_id && (
      <UnifiedSerialInputDrawer
        open={isDrawerOpen}
        onOpenChange={handleOpenChange}
        type="issue"
        itemId={selectedItem.id}
        productName={selectedItem.product?.name || ""}
        quantity={selectedItem.quantity}
        currentSerialCount={selectedItem.serials?.length || 0}
        warehouseId={issue.virtual_warehouse_id}
        onSuccess={handleSuccess}
      />
    )}
  </>
  );
}
