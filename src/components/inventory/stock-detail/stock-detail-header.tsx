"use client";

/**
 * Stock Detail Header Component
 * Displays product information and key stock metrics
 */

import { Package } from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
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

  // Get product info from first stock record
  const productInfo = stockDetail?.[0];

  if (isLoading || isLoadingAggregated) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
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
      </CardHeader>
      <CardContent>
        {/* Simplified metrics - aligned with Issue #6 pattern */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            Tổng Tồn Kho
          </span>
          <span className="text-2xl font-bold">
            {productAggregated?.total_actual.toLocaleString() || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
