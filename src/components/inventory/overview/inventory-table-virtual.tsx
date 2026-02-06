"use client";

/**
 * Virtual Warehouse Table Component
 * Displays stock by virtual warehouse type
 */

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VirtualWarehouseTypeSelector } from "../shared/warehouse-selector";

export function InventoryTableVirtual() {
  const [search, setSearch] = useState("");
  const [warehouseType, setWarehouseType] = useState("");

  const { data: stock, isLoading } =
    trpc.inventory.stock.getByVirtualWarehouse.useQuery(
      { warehouseType, search },
      {
        enabled: !!warehouseType,
      },
    );

  return (
    <div className="space-y-4">
      {/* Warehouse Selector and Search */}
      <div className="flex items-center gap-2">
        <VirtualWarehouseTypeSelector
          value={warehouseType}
          onValueChange={setWarehouseType}
          className="w-[250px]"
        />
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            disabled={!warehouseType}
          />
        </div>
      </div>

      {!warehouseType ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Chọn kho ảo để xem tồn kho
        </div>
      ) : (
        <>
          {/* Issue #6: Simplified table with only 5 columns */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Vị trí vật lý</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Xem chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : !stock || stock.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không tìm thấy dữ liệu tồn kho cho kho ảo này.
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.map((item) => (
                    <TableRow
                      key={`${item.product_id}-${item.physical_warehouse_id || "none"}`}
                    >
                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.sku || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.physical_warehouse_name || "Không có vị trí"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.actual_serial_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/inventory/products/${item.product_id}/stock`}
                        >
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
              Hiển thị {stock.length} sản phẩm trong{" "}
              {warehouseType.replace(/_/g, " ")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
