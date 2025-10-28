"use client";

/**
 * Transfer Items Table Component
 * Displays items in a transfer with serial selection functionality
 */

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
import { Plus } from "lucide-react";

interface TransferItemsTableProps {
  transfer: any; // Transfer with relations
  onSerialsSelected: () => void;
}

export function TransferItemsTable({ transfer, onSerialsSelected }: TransferItemsTableProps) {
  const canEdit = transfer.status === "draft" || transfer.status === "approved" || transfer.status === "in_transit";

  return (
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
            {!transfer.items || transfer.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">
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
                    <TableCell className="text-right">{item.quantity}</TableCell>
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
                          onClick={() => {
                            // TODO: Implement serial selection
                            alert("Chức năng chọn serial đang được phát triển");
                          }}
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
  );
}
