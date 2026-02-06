/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Inventory products page for managing physical products
 */

import { ProductInventoryTable } from "@/components/inventory/product-inventory-table";
import { PageHeader } from "@/components/page-header";

export default function InventoryProductsPage() {
  return (
    <>
      <PageHeader title="Kho Sản Phẩm" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <ProductInventoryTable />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
