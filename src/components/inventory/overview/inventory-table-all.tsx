"use client";

/**
 * All Warehouses Table Component
 * Displays aggregated stock across all warehouses
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

export function InventoryTableAll() {
  const [search, setSearch] = useState("");

  // Issue #6: Removed status filter
  const { data: stock, isLoading } =
    trpc.inventory.stock.getAggregated.useQuery({
      search,
    });

  return (
    <div className="space-y-4">
      {/* Issue #6: Search only, removed status filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Issue #6: Simplified table with only 4 columns */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="pl-4 lg:pl-6">Sản phẩm</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Tồn kho</TableHead>
              <TableHead className="text-right pr-4 lg:pr-6">
                Xem chi tiết
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : !stock || stock.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy dữ liệu tồn kho nào.
                </TableCell>
              </TableRow>
            ) : (
              stock.map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell className="font-medium pl-4 lg:pl-6">
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sku || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.total_actual.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-4 lg:pr-6">
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
          Hiển thị {stock.length} sản phẩm
        </div>
      )}
    </div>
  );
}
