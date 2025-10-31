"use client";

/**
 * Receipt Items Table Component
 * Displays items in a receipt with serial entry functionality
 */

import { useState } from "react";
import { StockReceiptWithRelations } from "@/types/inventory";
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
import { Plus, Trash2 } from "lucide-react";
import { UnifiedSerialInputDrawer } from "../serials/unified-serial-input-drawer";

interface ReceiptItemsTableProps {
  receipt: StockReceiptWithRelations;
  onSerialsAdded: () => void;
}

export function ReceiptItemsTable({ receipt, onSerialsAdded }: ReceiptItemsTableProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddSerials = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDrawerOpen(true);
  };

  const handleSuccess = () => {
    onSerialsAdded();
  };

  const handleOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setSelectedItemId(null);
    }
  };

  const selectedItem = receipt.items?.find((item) => item.id === selectedItemId);

  // Allow editing when: draft, pending_approval, approved, or completed
  // v2.0 Workflow: Serial entry is non-blocking and can continue even after approval/completion
  const canEdit = receipt.status === "draft" || receipt.status === "pending_approval" || receipt.status === "approved" || receipt.status === "completed";

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
                <TableHead className="text-right">Số lượng khai báo</TableHead>
                <TableHead className="text-right">Số serial đã nhập</TableHead>
                <TableHead>Tiến độ</TableHead>
                {canEdit && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!receipt.items || receipt.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    Chưa có sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                receipt.items.map((item) => {
                  const serialCount = item.serials?.length || 0;
                  const progress = (serialCount / item.declared_quantity) * 100;
                  const isComplete = serialCount === item.declared_quantity;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product?.name || "Unknown Product"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.product?.sku || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.declared_quantity < 0 ? "text-red-600 font-medium" : ""}>
                          {item.declared_quantity}
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
                            onClick={() => handleAddSerials(item.id)}
                            disabled={isComplete}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden lg:inline">
                              {serialCount === 0 ? "Thêm serial" : "Bổ sung"}
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

      {selectedItem && (
        <UnifiedSerialInputDrawer
          open={isDrawerOpen}
          onOpenChange={handleOpenChange}
          type="receipt"
          itemId={selectedItem.id}
          productName={selectedItem.product?.name || ""}
          quantity={selectedItem.declared_quantity}
          currentSerialCount={selectedItem.serials?.length || 0}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
