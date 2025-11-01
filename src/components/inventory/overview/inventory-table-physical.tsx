"use client";

/**
 * Physical Warehouse Table Component
 * Displays stock by physical warehouse location
 */

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockStatusBadge } from "../shared/stock-status-badge";
import { PhysicalWarehouseSelector } from "../shared/warehouse-selector";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";

export function InventoryTablePhysical() {
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const { data: stock, isLoading } = trpc.inventory.stock.getByPhysicalWarehouse.useQuery(
    { warehouseId, search },
    {
      enabled: !!warehouseId,
    }
  );

  return (
    <div className="space-y-4">
      {/* Warehouse Selector and Search */}
      <div className="flex items-center gap-2">
        <PhysicalWarehouseSelector
          value={warehouseId}
          onValueChange={setWarehouseId}
          className="w-[250px]"
        />
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            disabled={!warehouseId}
          />
        </div>
      </div>

      {!warehouseId ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Chọn kho vật lý để xem tồn kho
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kho ảo</TableHead>
                  <TableHead className="text-right">Đã khai báo</TableHead>
                  <TableHead className="text-right">Thực tế</TableHead>
                  <TableHead className="text-right">Chênh lệch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : !stock || stock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy dữ liệu tồn kho cho kho này.
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.map((item) => (
                    <TableRow key={`${item.product_id}-${item.virtual_warehouse_id}`}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                        >
                          {item.virtual_warehouse_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.declared_quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.actual_serial_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {item.serial_gap !== 0 && (
                          <span className={item.serial_gap > 0 ? "text-yellow-600" : "text-red-600"}>
                            {item.serial_gap > 0 ? `+${item.serial_gap}` : item.serial_gap}
                          </span>
                        )}
                        {item.serial_gap === 0 && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge status={item.stock_status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/inventory/products/${item.product_id}/stock`}>
                          <Button variant="outline" size="sm">
                            Xem chi tiết
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {stock && stock.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Hiển thị {stock.length} sản phẩm trong kho này
            </div>
          )}
        </>
      )}
    </div>
  );
}
