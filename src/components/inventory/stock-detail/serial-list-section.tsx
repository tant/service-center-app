"use client";

/**
 * Serial List Section Component
 * Displays paginated list of serial numbers with filters and bulk actions
 */

import { ChevronLeft, ChevronRight, Hash, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getWarrantyStatus } from "@/utils/warranty";

interface SerialListSectionProps {
  productId: string;
}

type ConditionFilter =
  | "all"
  | "new"
  | "refurbished"
  | "used"
  | "faulty"
  | "for_parts";
type WarrantyFilter = "all" | "active" | "expiring_soon" | "expired";

export function SerialListSection({ productId }: SerialListSectionProps) {
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilter>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<WarrantyFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(
    new Set(),
  );
  const pageSize = 20;

  const { data, isLoading } = trpc.physicalProducts.listProducts.useQuery({
    product_id: productId,
    search,
    condition: conditionFilter === "all" ? undefined : (conditionFilter as any),
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const products = data?.products || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Filter by warranty status on client side
  const filteredProducts = useMemo(() => {
    if (warrantyFilter === "all") return products;

    return products.filter((product: any) => {
      const warrantyEndDate =
        product.user_warranty_end_date ||
        product.manufacturer_warranty_end_date;
      const status = getWarrantyStatus(warrantyEndDate);
      return status === warrantyFilter;
    });
  }, [products, warrantyFilter]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedSerials);
      filteredProducts.forEach((p: any) => newSelected.add(p.id));
      setSelectedSerials(newSelected);
    } else {
      setSelectedSerials(new Set());
    }
  };

  const handleSelectSerial = (serialId: string, checked: boolean) => {
    const newSelected = new Set(selectedSerials);
    if (checked) {
      newSelected.add(serialId);
    } else {
      newSelected.delete(serialId);
    }
    setSelectedSerials(newSelected);
  };

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p: any) => selectedSerials.has(p.id));
  const isSomeSelected = filteredProducts.some((p: any) =>
    selectedSerials.has(p.id),
  );

  const handleClearSelection = () => {
    setSelectedSerials(new Set());
  };

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
          {selectedSerials.size > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {selectedSerials.size} đã chọn
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
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

        {/* Quick Filter Pills */}
        <div className="space-y-3">
          {/* Condition Filters */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Tình trạng:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={conditionFilter === "all" ? "default" : "outline"}
                onClick={() => {
                  setConditionFilter("all");
                  setPage(1);
                }}
                className="h-7"
              >
                Tất cả
              </Button>
              <Button
                size="sm"
                variant={conditionFilter === "new" ? "default" : "outline"}
                onClick={() => {
                  setConditionFilter("new");
                  setPage(1);
                }}
                className="h-7"
              >
                Mới
              </Button>
              <Button
                size="sm"
                variant={
                  conditionFilter === "refurbished" ? "default" : "outline"
                }
                onClick={() => {
                  setConditionFilter("refurbished");
                  setPage(1);
                }}
                className="h-7"
              >
                Tân trang
              </Button>
              <Button
                size="sm"
                variant={conditionFilter === "used" ? "default" : "outline"}
                onClick={() => {
                  setConditionFilter("used");
                  setPage(1);
                }}
                className="h-7"
              >
                Đã qua SD
              </Button>
              <Button
                size="sm"
                variant={conditionFilter === "faulty" ? "default" : "outline"}
                onClick={() => {
                  setConditionFilter("faulty");
                  setPage(1);
                }}
                className="h-7"
              >
                Lỗi
              </Button>
              <Button
                size="sm"
                variant={
                  conditionFilter === "for_parts" ? "default" : "outline"
                }
                onClick={() => {
                  setConditionFilter("for_parts");
                  setPage(1);
                }}
                className="h-7"
              >
                Tháo LK
              </Button>
            </div>
          </div>

          {/* Warranty Filters */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Bảo hành:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={warrantyFilter === "all" ? "default" : "outline"}
                onClick={() => {
                  setWarrantyFilter("all");
                  setPage(1);
                }}
                className="h-7"
              >
                Tất cả
              </Button>
              <Button
                size="sm"
                variant={warrantyFilter === "active" ? "default" : "outline"}
                onClick={() => {
                  setWarrantyFilter("active");
                  setPage(1);
                }}
                className="h-7"
              >
                Còn BH
              </Button>
              <Button
                size="sm"
                variant={
                  warrantyFilter === "expiring_soon" ? "default" : "outline"
                }
                onClick={() => {
                  setWarrantyFilter("expiring_soon");
                  setPage(1);
                }}
                className="h-7"
              >
                Sắp hết BH
              </Button>
              <Button
                size="sm"
                variant={warrantyFilter === "expired" ? "default" : "outline"}
                onClick={() => {
                  setWarrantyFilter("expired");
                  setPage(1);
                }}
                className="h-7"
              >
                Hết BH
              </Button>
            </div>
          </div>
        </div>

        {/* Selection Counter */}
        {selectedSerials.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
            <span className="text-sm font-medium">
              {selectedSerials.size} serial đã chọn
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSelection}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Bỏ chọn
            </Button>
          </div>
        )}

        {/* Table with Checkboxes */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={cn(
                      isSomeSelected &&
                        !isAllSelected &&
                        "data-[state=checked]:bg-muted-foreground",
                    )}
                  />
                </TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Kho ảo</TableHead>
                <TableHead>Vị trí vật lý</TableHead>
                <TableHead>Tình trạng</TableHead>
                <TableHead>Bảo hành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không tìm thấy serial numbers nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => {
                  const warrantyEndDate =
                    product.user_warranty_end_date ||
                    product.manufacturer_warranty_end_date;
                  const warrantyStatus = getWarrantyStatus(warrantyEndDate);
                  const isSelected = selectedSerials.has(product.id);

                  return (
                    <TableRow
                      key={product.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        isSelected && "bg-muted/30",
                      )}
                      onClick={() =>
                        handleSelectSerial(product.id, !isSelected)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectSerial(product.id, checked as boolean)
                          }
                          aria-label={`Select ${product.serial_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        <Link
                          href={`/inventory/products/${product.id}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
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
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              Hiển thị{" "}
              {filteredProducts.length > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
              {Math.min(page * pageSize, filteredProducts.length)} của{" "}
              {data?.total || 0} serial numbers
              {warrantyFilter !== "all" && " (đã lọc)"}
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
