"use client";

/**
 * Warehouse Selector Component
 * Provides selectors for virtual and physical warehouses
 */

import { trpc } from "@/components/providers/trpc-provider";
import { SearchableSelect } from "@/components/ui/searchable-select";

const VIRTUAL_WAREHOUSE_TYPES = [
  { value: "warranty_stock", label: "Kho Bảo Hành" },
  { value: "rma_staging", label: "Kho RMA" },
  { value: "dead_stock", label: "Kho Hỏng" },
  { value: "in_service", label: "Đang Sử Dụng" },
  { value: "parts", label: "Kho Linh Kiện" },
];

interface VirtualWarehouseSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function VirtualWarehouseSelector({
  value,
  onValueChange,
  placeholder = "Chọn kho ảo...",
  disabled = false,
  className,
}: VirtualWarehouseSelectorProps) {
  return (
    <SearchableSelect
      options={VIRTUAL_WAREHOUSE_TYPES}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Tìm kiếm kho..."
      emptyMessage="Không tìm thấy kho nào."
      disabled={disabled}
      className={className}
    />
  );
}

interface PhysicalWarehouseSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhysicalWarehouseSelector({
  value,
  onValueChange,
  placeholder = "Chọn kho vật lý...",
  disabled = false,
  className,
}: PhysicalWarehouseSelectorProps) {
  const { data: warehouses, isLoading } = trpc.warehouse.listPhysicalWarehouses.useQuery();

  const options = (warehouses || []).map((w: any) => ({
    value: w.id,
    label: w.name,
    description: w.location || undefined,
  }));

  return (
    <SearchableSelect
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={isLoading ? "Đang tải..." : placeholder}
      searchPlaceholder="Tìm kiếm kho..."
      emptyMessage="Không tìm thấy kho nào."
      disabled={disabled || isLoading}
      className={className}
    />
  );
}
