"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhysicalWarehouseTable } from "@/components/warehouse/physical-warehouse-table";
import { VirtualWarehouseTable } from "@/components/warehouse/virtual-warehouse-table";

export function WarehouseContent() {
  const [activeTab, setActiveTab] = useState("physical");

  return (
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
  );
}
