import { PageHeader } from "@/components/page-header";
import { InventoryStatCards } from "@/components/inventory/overview/inventory-stat-cards";
import { InventoryTabs } from "@/components/inventory/overview/inventory-tabs";

export default function InventoryOverviewPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Tổng Quan Kho Hàng" />
        <div className="flex items-center gap-2 px-4 lg:px-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">Live</span>
          <span className="text-xs text-muted-foreground">(Cập nhật 30s)</span>
        </div>
      </div>
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
