"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhysicalWarehouseTable } from "@/components/warehouse/physical-warehouse-table";
import { VirtualWarehouseTable } from "@/components/warehouse/virtual-warehouse-table";

export function WarehouseContent() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Tabs defaultValue="physical" className="w-full flex-col justify-start gap-6">
            {/* Row 1: View Selector / Tabs */}
            <div className="flex items-center justify-between px-4 lg:px-6">
              {/* Mobile: Select Dropdown */}
              <Select defaultValue="physical">
                <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
                  <SelectValue placeholder="Chọn loại kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Kho Vật Lý</SelectItem>
                  <SelectItem value="virtual">Kho Ảo</SelectItem>
                </SelectContent>
              </Select>

              {/* Desktop: Tab List */}
              <TabsList className="hidden @4xl/main:flex">
                <TabsTrigger value="physical">Kho Vật Lý</TabsTrigger>
                <TabsTrigger value="virtual">Kho Ảo</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <TabsContent value="physical" className="relative flex flex-col gap-4 px-4 lg:px-6">
              <PhysicalWarehouseTable />
            </TabsContent>

            <TabsContent value="virtual" className="relative flex flex-col gap-4 px-4 lg:px-6">
              <VirtualWarehouseTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
