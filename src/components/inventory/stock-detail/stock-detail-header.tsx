"use client";

/**
 * Stock Detail Header Component
 * Displays product information and key stock metrics with condition breakdown
 */

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  XCircle,
} from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StockDetailHeaderProps {
  productId: string;
}

export function StockDetailHeader({ productId }: StockDetailHeaderProps) {
  const { data: stockDetail, isLoading } =
    trpc.inventory.stock.getProductStockDetail.useQuery({
      productId,
    });

  // Get aggregated stock info
  const { data: aggregated, isLoading: isLoadingAggregated } =
    trpc.inventory.stock.getAggregated.useQuery({});
  const productAggregated = aggregated?.find(
    (item) => item.product_id === productId,
  );

  // Get condition breakdown
  const { data: breakdown, isLoading: isLoadingBreakdown } =
    trpc.physicalProducts.getProductConditionBreakdown.useQuery({
      product_id: productId,
    });

  // Get product info from first stock record
  const productInfo = stockDetail?.[0];

  if (isLoading || isLoadingAggregated || isLoadingBreakdown) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!productInfo) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Không tìm thấy thông tin sản phẩm
        </CardContent>
      </Card>
    );
  }

  // Check for low stock warning
  const minimumQuantity = productInfo.minimum_quantity || 0;
  const currentStock = productAggregated?.total_actual || 0;
  const hasLowStockWarning =
    minimumQuantity > 0 && currentStock < minimumQuantity;

  // Available stock = total - in_service - dead_stock
  // Chỉ tính sản phẩm active ở các kho khác (main, warranty_stock, parts, etc.)
  const availableStock =
    currentStock -
    (breakdown?.by_warehouse.in_service || 0) -
    (breakdown?.by_warehouse.dead_stock || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg font-semibold">
                {productInfo.product_name}
              </CardTitle>
              {productInfo.sku && (
                <p className="text-sm text-muted-foreground mt-1">
                  SKU: {productInfo.sku}
                </p>
              )}
            </div>
          </div>
          {hasLowStockWarning && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Stock thấp
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Low Stock Warning Alert */}
        {hasLowStockWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cảnh báo: Tồn kho ({currentStock}) thấp hơn mức tối thiểu (
              {minimumQuantity})
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Stock */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tổng Tồn Kho</p>
            <p className="text-2xl font-bold">{currentStock}</p>
          </div>

          {/* Available Stock */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">Sẵn Dùng</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {availableStock}
            </p>
          </div>

          {/* In Service */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-muted-foreground">Đang Bảo Hành</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {breakdown?.by_warehouse.in_service || 0}
            </p>
          </div>

          {/* Faulty */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <p className="text-xs text-muted-foreground">Lỗi/Hỏng</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {breakdown?.by_warehouse.dead_stock || 0}
            </p>
          </div>
        </div>

        {/* Condition Breakdown - Compact Pills */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Phân loại tình trạng:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 border-green-200">
              Mới: {breakdown?.by_condition.new || 0}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 border-blue-200">
              Tân trang: {breakdown?.by_condition.refurbished || 0}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 border-gray-200">
              Đã qua SD: {breakdown?.by_condition.used || 0}
            </Badge>
            <Badge variant="outline" className="bg-orange-50 border-orange-200">
              Lỗi: {breakdown?.by_condition.faulty || 0}
            </Badge>
            <Badge variant="outline" className="bg-red-50 border-red-200">
              Tháo LK: {breakdown?.by_condition.for_parts || 0}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
