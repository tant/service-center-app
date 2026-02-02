/**
 * Physical Product Detail Page
 * Displays comprehensive information for a single physical product (by ID or serial number)
 */

import { PhysicalProductDetail } from "@/components/inventory/physical-product-detail";
import { PageHeader } from "@/components/page-header";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PhysicalProductDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Chi Tiết Sản Phẩm Vật Lý"
        useBackNavigation
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <PhysicalProductDetail productId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
