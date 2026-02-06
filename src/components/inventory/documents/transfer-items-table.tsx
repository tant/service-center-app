"use client";

/**
 * Transfer Items Table Component
 * Displays items in a transfer with serial selection functionality
 */

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnifiedSerialInputDrawer } from "../serials/unified-serial-input-drawer";

interface TransferItemsTableProps {
  transfer: any; // Transfer with relations
  onSerialsSelected: () => void;
}

export function TransferItemsTable({
  transfer,
  onSerialsSelected,
}: TransferItemsTableProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Allow editing when: draft, pending_approval, approved, or completed
  // v2.0 Workflow: Serial selection is non-blocking and can continue even after approval/completion
  const canEdit =
    transfer.status === "draft" ||
    transfer.status === "pending_approval" ||
    transfer.status === "approved" ||
    transfer.status === "completed";

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

  const selectedItem = transfer.items?.find(
    (item: any) => item.id === selectedItemId,
  );

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
                {canEdit && (
                  <TableHead className="text-right">Thao tác</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transfer.items || transfer.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canEdit ? 6 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                transfer.items.map((item: any) => {
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
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isComplete ? "text-green-600 font-semibold" : ""
                          }
                        >
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

      {selectedItem && transfer.from_virtual_warehouse_id && (
        <UnifiedSerialInputDrawer
          open={isDrawerOpen}
          onOpenChange={handleOpenChange}
          type="transfer"
          itemId={selectedItem.id}
          productName={selectedItem.product?.name || ""}
          quantity={selectedItem.quantity}
          currentSerialCount={selectedItem.serials?.length || 0}
          warehouseId={transfer.from_virtual_warehouse_id}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
