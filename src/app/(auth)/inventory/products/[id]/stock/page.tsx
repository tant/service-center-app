/**
 * Product Stock Detail Page
 * Displays comprehensive stock information for a specific product
 */

import { SerialListSection } from "@/components/inventory/stock-detail/serial-list-section";
import { StockBreakdownSection } from "@/components/inventory/stock-detail/stock-breakdown-section";
import { StockDetailHeader } from "@/components/inventory/stock-detail/stock-detail-header";
import { StockTrendChart } from "@/components/inventory/stock-detail/stock-trend-chart";
import { PageHeader } from "@/components/page-header";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductStockDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Chi Tiết Tồn Kho Sản Phẩm"
        backHref="/inventory/overview"
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            {/* Product Header with Key Metrics */}
            <StockDetailHeader productId={id} />

            {/* Stock Breakdown by Warehouse */}
            <StockBreakdownSection productId={id} />

            {/* Serial Numbers List */}
            <SerialListSection productId={id} />

            {/* Stock Trend Chart */}
            <StockTrendChart productId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
