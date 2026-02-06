"use client";

/**
 * Inventory Tabs Component
 * Provides tab navigation between All Warehouses, Physical, and Virtual views
 */

import {
  ArrowLeftRight,
  Box,
  Layers,
  PackageMinus,
  PackagePlus,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTableAll } from "./inventory-table-all";
import { InventoryTablePhysical } from "./inventory-table-physical";
import { InventoryTableVirtual } from "./inventory-table-virtual";

export function InventoryTabs() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex w-full flex-col justify-start gap-6"
    >
      {/* Tab Header */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Mobile: Select Dropdown */}
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
            <SelectValue placeholder="Chọn view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả kho</SelectItem>
            <SelectItem value="physical">Kho vật lý</SelectItem>
            <SelectItem value="virtual">Kho ảo</SelectItem>
          </SelectContent>
        </Select>

        {/* Desktop: Tab List */}
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Tất cả kho</span>
          </TabsTrigger>
          <TabsTrigger value="physical" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            <span>Kho vật lý</span>
          </TabsTrigger>
          <TabsTrigger value="virtual" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            <span>Kho ảo</span>
          </TabsTrigger>
        </TabsList>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/inventory/documents/issues/new">
            <Button variant="outline" size="sm">
              <PackageMinus className="h-4 w-4" />
              <span className="hidden lg:inline">Tạo phiếu xuất</span>
            </Button>
          </Link>
          <Link href="/inventory/documents/receipts/new">
            <Button variant="outline" size="sm">
              <PackagePlus className="h-4 w-4" />
              <span className="hidden lg:inline">Tạo phiếu nhập</span>
            </Button>
          </Link>
          <Link href="/inventory/documents/transfers/new">
            <Button variant="outline" size="sm">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden lg:inline">Tạo phiếu chuyển</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Contents */}
      <TabsContent
        value="all"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <InventoryTableAll />
      </TabsContent>

      <TabsContent
        value="physical"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <InventoryTablePhysical />
      </TabsContent>

      <TabsContent
        value="virtual"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <InventoryTableVirtual />
      </TabsContent>
    </Tabs>
  );
}
