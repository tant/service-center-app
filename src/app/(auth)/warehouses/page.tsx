"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5: Warehouse management UI at /dashboard/warehouses
 *
 * Features:
 * - Tab-based interface for Physical and Virtual warehouses
 * - Physical warehouses table with CRUD operations
 * - Virtual warehouses table (read-only, showing seeded data)
 * - Create/Edit warehouse modal
 */

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhysicalWarehouseTable } from "@/components/warehouse/physical-warehouse-table";
import { VirtualWarehouseTable } from "@/components/warehouse/virtual-warehouse-table";

export default function WarehousesPage() {
  const [activeTab, setActiveTab] = useState("physical");

  return (
    <>
      <PageHeader title="Quản lý Kho" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="physical">Kho Vật Lý</TabsTrigger>
                <TabsTrigger value="virtual">Kho Ảo</TabsTrigger>
              </TabsList>

              <TabsContent value="physical" className="mt-6">
                <PhysicalWarehouseTable />
              </TabsContent>

              <TabsContent value="virtual" className="mt-6">
                <VirtualWarehouseTable />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
