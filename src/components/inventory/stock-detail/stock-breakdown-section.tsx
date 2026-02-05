"use client";

/**
 * Stock Breakdown Section Component
 * Displays stock distribution across physical and virtual warehouses
 */

import { Box, Warehouse } from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockStatusBadge } from "../shared/stock-status-badge";

interface StockBreakdownSectionProps {
  productId: string;
}

export function StockBreakdownSection({
  productId,
}: StockBreakdownSectionProps) {
  const { data: stockDetail, isLoading } =
    trpc.inventory.stock.getProductStockDetail.useQuery({
      productId,
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stockDetail || stockDetail.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Không có dữ liệu tồn kho
        </CardContent>
      </Card>
    );
  }

  // Group by physical warehouse
  type StockItem = (typeof stockDetail)[number];
  const byPhysical = stockDetail.reduce<Record<string, StockItem[]>>(
    (acc, item) => {
      const key = item.physical_warehouse_name || "Không có vị trí vật lý";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {},
  );

  // Group by virtual warehouse type
  type VirtualWarehouseGroup = {
    type: string;
    name: string;
    total_declared: number;
    total_actual: number;
  };
  const byVirtual = stockDetail.reduce<Record<string, VirtualWarehouseGroup>>(
    (acc, item) => {
      const key = item.warehouse_type;
      if (!acc[key]) {
        acc[key] = {
          type: key,
          name: item.virtual_warehouse_name,
          total_declared: 0,
          total_actual: 0,
        };
      }
      acc[key].total_declared += item.declared_quantity;
      acc[key].total_actual += item.actual_serial_count;
      return acc;
    },
    {},
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* By Physical Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Warehouse className="h-5 w-5" />
            Theo Kho Vật Lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(byPhysical).map(([warehouseName, items]) => {
              const totalDeclared = items.reduce(
                (sum, item) => sum + item.declared_quantity,
                0,
              );
              const totalActual = items.reduce(
                (sum, item) => sum + item.actual_serial_count,
                0,
              );
              const gap = totalActual - totalDeclared;

              return (
                <div key={warehouseName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{warehouseName}</h4>
                    <Badge variant="outline">{items.length} kho ảo</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Khai báo:</span>
                      <span className="ml-2 font-medium">
                        {totalDeclared.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Thực tế:</span>
                      <span className="ml-2 font-medium">
                        {totalActual.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chênh:</span>
                      <span
                        className={`ml-2 font-medium ${
                          gap > 0
                            ? "text-yellow-600"
                            : gap < 0
                              ? "text-red-600"
                              : ""
                        }`}
                      >
                        {gap > 0 ? `+${gap}` : gap}
                      </span>
                    </div>
                  </div>
                  {/* Virtual warehouses within this physical warehouse */}
                  <div className="mt-3 space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.virtual_warehouse_id}
                        className="flex items-center justify-between text-xs pl-4 py-1 border-l-2"
                      >
                        <span className="text-muted-foreground">
                          {item.virtual_warehouse_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>
                            {item.declared_quantity} /{" "}
                            {item.actual_serial_count}
                          </span>
                          <StockStatusBadge status={item.stock_status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* By Virtual Warehouse Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Box className="h-5 w-5" />
            Theo Kho Ảo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại kho</TableHead>
                <TableHead className="text-right">Khai báo</TableHead>
                <TableHead className="text-right">Thực tế</TableHead>
                <TableHead className="text-right">Chênh lệch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(byVirtual).map((item) => {
                const gap = item.total_actual - item.total_declared;
                return (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {item.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.total_declared.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.total_actual.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          gap > 0
                            ? "text-yellow-600"
                            : gap < 0
                              ? "text-red-600"
                              : ""
                        }
                      >
                        {gap > 0 ? `+${gap}` : gap}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
