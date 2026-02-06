/**
 * Product Inventory Table Column Definitions
 * Extracted for better organization and reusability
 */

import { IconEdit } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PhysicalProductWithRelations } from "./product-inventory-table";
import { WarrantyDateCell } from "./warranty-date-cell";

export const CONDITION_LABELS = {
  new: "Mới",
  refurbished: "Tân trang",
  used: "Đã qua sử dụng",
  faulty: "Lỗi",
  for_parts: "Tháo linh kiện",
};

const CONDITION_COLORS = {
  new: "default",
  refurbished: "secondary",
  used: "outline",
  faulty: "destructive",
  for_parts: "destructive",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  active: "Sẵn sàng",
  transferring: "Đang chuyển",
  issued: "Đã xuất",
  disposed: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "outline",
  active: "default",
  transferring: "secondary",
  issued: "secondary",
  disposed: "destructive",
};

interface TableMeta {
  onEdit: (product: PhysicalProductWithRelations) => void;
}

export function createProductColumns(): ColumnDef<PhysicalProductWithRelations>[] {
  return [
    {
      accessorKey: "serial_number",
      header: "Số Serial",
      cell: ({ row }) => (
        <div className="font-mono font-medium">
          {row.original.serial_number}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "product",
      header: "Sản Phẩm",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.product?.name || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.product?.sku
              ? `SKU: ${row.original.product.sku}`
              : row.original.product?.brand?.name || ""}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "virtual_warehouse",
      header: "Kho",
      cell: ({ row }) => {
        const warehouseName =
          row.original.virtual_warehouse?.name || "Không xác định";

        return (
          <div>
            <Badge variant="outline" className="mb-1">
              {warehouseName}
            </Badge>
            {row.original.physical_warehouse && (
              <div className="text-xs text-muted-foreground">
                {row.original.physical_warehouse.name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "condition",
      header: "Tình Trạng",
      cell: ({ row }) => (
        <Badge
          variant={
            CONDITION_COLORS[
              row.original.condition as keyof typeof CONDITION_COLORS
            ]
          }
        >
          {
            CONDITION_LABELS[
              row.original.condition as keyof typeof CONDITION_LABELS
            ]
          }
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng Thái",
      cell: ({ row }) => (
        <Badge
          variant={
            STATUS_COLORS[row.original.status] as
              | "default"
              | "secondary"
              | "outline"
              | "destructive"
          }
        >
          {STATUS_LABELS[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "manufacturer_warranty_end_date",
      header: "BH Nhà Máy",
      cell: ({ row }) => (
        <WarrantyDateCell date={row.original.manufacturer_warranty_end_date} />
      ),
    },
    {
      accessorKey: "user_warranty_end_date",
      header: "BH Người Dùng",
      cell: ({ row }) => (
        <WarrantyDateCell date={row.original.user_warranty_end_date} />
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Thao tác</div>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as TableMeta;

        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                meta.onEdit(row.original);
              }}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
