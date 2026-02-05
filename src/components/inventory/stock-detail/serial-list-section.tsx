"use client";

/**
 * Serial List Section Component
 * Displays paginated list of serial numbers for the product
 */

import { ChevronLeft, ChevronRight, Hash, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWarrantyStatus } from "@/utils/warranty";

interface SerialListSectionProps {
  productId: string;
}

export function SerialListSection({ productId }: SerialListSectionProps) {
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = trpc.physicalProducts.listProducts.useQuery({
    product_id: productId,
    search,
    condition: condition === "all" ? undefined : (condition as any),
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const products = data?.products || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Hash className="h-5 w-5" />
          Danh Sách Serial Numbers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm serial number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
          <Select
            value={condition}
            onValueChange={(v) => {
              setCondition(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tất cả tình trạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tình trạng</SelectItem>
              <SelectItem value="new">Mới</SelectItem>
              <SelectItem value="refurbished">Tân trang</SelectItem>
              <SelectItem value="used">Đã qua sử dụng</SelectItem>
              <SelectItem value="faulty">Lỗi</SelectItem>
              <SelectItem value="for_parts">Tháo linh kiện</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Kho ảo</TableHead>
                <TableHead>Vị trí vật lý</TableHead>
                <TableHead>Tình trạng</TableHead>
                <TableHead>Bảo hành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không tìm thấy serial numbers nào
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => {
                  const warrantyEndDate =
                    product.user_warranty_end_date ||
                    product.manufacturer_warranty_end_date;
                  const warrantyStatus = getWarrantyStatus(warrantyEndDate);

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono font-medium">
                        <Link
                          href={`/inventory/products/${product.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {product.serial_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {product.virtual_warehouse?.name || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.virtual_warehouse?.physical_warehouse?.name ||
                          "Không có"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.condition === "new"
                              ? "default"
                              : product.condition === "faulty"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {product.condition === "new" && "Mới"}
                          {product.condition === "refurbished" && "Tân trang"}
                          {product.condition === "used" && "Đã qua SD"}
                          {product.condition === "faulty" && "Lỗi"}
                          {product.condition === "for_parts" &&
                            "Tháo linh kiện"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {warrantyStatus === "active" && (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            Còn BH
                          </Badge>
                        )}
                        {warrantyStatus === "expiring_soon" && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                            Sắp hết BH
                          </Badge>
                        )}
                        {warrantyStatus === "expired" && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Hết BH
                          </Badge>
                        )}
                        {warrantyStatus === "no_warranty" && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Không BH
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, data?.total || 0)} của{" "}
              {data?.total || 0} serial numbers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
