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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockStatusBadge } from "../shared/stock-status-badge";

export function InventoryTableAll() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "ok" | "warning" | "critical" | undefined
  >();

  const { data: stock, isLoading } =
    trpc.inventory.stock.getAggregated.useQuery({
      search,
      status,
    });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
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
        <Select
          value={status || "all"}
          onValueChange={(v) => setStatus(v === "all" ? undefined : (v as any))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="ok">Bình thường</SelectItem>
            <SelectItem value="warning">Cảnh báo</SelectItem>
            <SelectItem value="critical">Nguy hiểm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="pl-4 lg:pl-6">Sản phẩm</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Đã khai báo</TableHead>
              <TableHead className="text-right">Thực tế</TableHead>
              <TableHead className="text-right">Chênh lệch</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right pr-4 lg:pr-6">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : !stock || stock.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                    {item.total_declared.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.total_actual.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.serial_gap !== 0 && (
                      <span
                        className={
                          item.serial_gap > 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {item.serial_gap > 0
                          ? `+${item.serial_gap}`
                          : item.serial_gap}
                      </span>
                    )}
                    {item.serial_gap === 0 && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge status={item.stock_status} />
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
