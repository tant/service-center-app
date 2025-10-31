import { PageHeader } from "@/components/page-header";
import { InventoryStatCards } from "@/components/inventory/overview/inventory-stat-cards";
import { InventoryTabs } from "@/components/inventory/overview/inventory-tabs";

export default function InventoryOverviewPage() {
  return (
    <>
      <PageHeader title="Tổng Quan Kho Hàng" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <InventoryStatCards />
            </div>
            <InventoryTabs />
          </div>
        </div>
      </div>
    </>
  );
}
