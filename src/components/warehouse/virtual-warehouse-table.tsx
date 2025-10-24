"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5.2: Virtual warehouses table (read-only)
 *
 * Displays the 5 seeded virtual warehouses with color-coded badges
 */

import { IconDatabase, IconBox } from "@tabler/icons-react";
import { useVirtualWarehouses } from "@/hooks/use-warehouse";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WAREHOUSE_TYPE_COLORS, WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";
import type { WarehouseType } from "@/types/enums";

export function VirtualWarehouseTable() {
  const { warehouses, isLoading } = useVirtualWarehouses();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5" />
              Kho Ảo
            </CardTitle>
            <CardDescription>
              Các loại kho ảo (virtual warehouses) đại diện cho trạng thái logic của sản phẩm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : warehouses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Không tìm thấy kho ảo nào
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại Kho</TableHead>
                  <TableHead>Tên Hiển Thị</TableHead>
                  <TableHead>Mô Tả</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const warehouseType = warehouse.warehouse_type as WarehouseType;
                  const color = WAREHOUSE_TYPE_COLORS[warehouseType];
                  const label = WAREHOUSE_TYPE_LABELS[warehouseType];

                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <code className="rounded bg-muted px-2 py-0.5 text-xs">
                            {warehouse.warehouse_type}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IconBox className="h-4 w-4 text-muted-foreground" />
                          {label || warehouse.display_name}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {warehouse.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                          {warehouse.is_active ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Lưu ý:</strong> Kho ảo là các loại kho cố định trong hệ thống,
            đại diện cho trạng thái logic của sản phẩm (bảo hành, RMA, hỏng, đang sử dụng, linh kiện).
            Không thể chỉnh sửa hoặc xóa các kho ảo này.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
