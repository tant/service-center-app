"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5.2: Virtual warehouses table with create/edit capabilities
 *
 * Displays virtual warehouses with ability to create and edit (admin/manager only)
 */

import * as React from "react";
import {
  IconDatabase,
  IconBox,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualWarehouses } from "@/hooks/use-warehouse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WAREHOUSE_TYPE_COLORS, WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";
import type { WarehouseType } from "@/types/enums";
import type { VirtualWarehouse } from "@/types/warehouse";
import { VirtualWarehouseFormModal } from "./virtual-warehouse-form-modal";
import { useRole } from "@/hooks/use-role";

// Extended type to include new fields from migration
type VirtualWarehouseWithPhysical = VirtualWarehouse & {
  name?: string | null;
  physical_warehouse_id?: string | null;
  physical_warehouse?: {
    id: string;
    name: string;
    code: string;
    location: string | null;
  } | null;
};

const columns: ColumnDef<VirtualWarehouseWithPhysical>[] = [
  {
    accessorKey: "name",
    header: "Tên Kho Ảo",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2 font-medium">
          <IconBox className="h-4 w-4 text-muted-foreground" />
          {row.original.name}
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "warehouse_type",
    header: "Loại Kho",
    cell: ({ row }) => {
      const warehouseType = row.original.warehouse_type as WarehouseType;
      const color = WAREHOUSE_TYPE_COLORS[warehouseType];
      const label = WAREHOUSE_TYPE_LABELS[warehouseType];

      return (
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm">{label}</span>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "Mô Tả",
    cell: ({ row }) => (
      <div className="max-w-md">
        {row.original.description || "—"}
      </div>
    ),
  },
  {
    accessorKey: "physical_warehouse",
    header: "Kho Vật Lý",
    cell: ({ row }) => {
      const physicalWarehouse = row.original.physical_warehouse as any;
      return (
        <div className="text-sm">
          {physicalWarehouse ? (
            <span>
              {physicalWarehouse.name} <code className="text-xs text-muted-foreground">({physicalWarehouse.code})</code>
            </span>
          ) : (
            <span className="text-muted-foreground italic">Hệ thống</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Trạng Thái",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "secondary"}>
        {row.original.is_active ? "Hoạt động" : "Không hoạt động"}
      </Badge>
    ),
  },
];

export function VirtualWarehouseTable() {
  // Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<VirtualWarehouseWithPhysical | null>(null);

  const { warehouses, isLoading } = useVirtualWarehouses();
  const { isManagerOrAbove } = useRole();

  // Check if user is admin or manager
  const canManageWarehouses = isManagerOrAbove;

  // Add actions column if user can manage warehouses
  const columnsWithActions: ColumnDef<VirtualWarehouseWithPhysical>[] = canManageWarehouses
    ? [
        ...columns,
        {
          id: "actions",
          header: "Thao Tác",
          cell: ({ row }) => {
            const warehouse = row.original;
            // Only allow editing user-created warehouses (those with physical_warehouse_id)
            const canEdit = warehouse.physical_warehouse_id !== null;

            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWarehouse(warehouse);
                    setIsFormModalOpen(true);
                  }}
                  disabled={!canEdit}
                >
                  <IconEdit className="h-4 w-4" />
                  <span className="ml-2">Sửa</span>
                </Button>
              </div>
            );
          },
        },
      ]
    : columns;

  const table = useReactTable({
    data: warehouses as VirtualWarehouseWithPhysical[],
    columns: columnsWithActions,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const handleCreateNew = () => {
    setSelectedWarehouse(null);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedWarehouse(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Create Button */}
      {canManageWarehouses && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Danh Sách Kho Ảo</h3>
            <p className="text-sm text-muted-foreground">
              Quản lý kho ảo được liên kết với các kho vật lý
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <IconPlus className="mr-2 h-4 w-4" />
            Thêm Kho Ảo
          </Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg border py-8 text-center text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : table.getRowModel().rows?.length === 0 ? (
        <div className="rounded-lg border py-8 text-center text-muted-foreground">
          Không tìm thấy kho ảo nào
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4">
            {/* Page Info */}
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Trang {table.getState().pagination.pageIndex + 1} trên{" "}
              {table.getPageCount()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-8">
              {/* Page Size Selector */}
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page-virtual" className="text-sm font-medium">
                  Số dòng mỗi trang
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page-virtual">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                {/* First Page (desktop only) */}
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Đến trang đầu</span>
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Trang trước</span>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>

                {/* Next Page */}
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Trang tiếp</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page (desktop only) */}
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Đến trang cuối</span>
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info Note */}
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Lưu ý:</strong> Kho ảo đại diện cho trạng thái logic của sản phẩm và được liên kết với kho vật lý.
          Kho hệ thống (không có kho vật lý) không thể chỉnh sửa.
          {canManageWarehouses && " Bạn có thể tạo thêm kho ảo mới được liên kết với các kho vật lý."}
        </p>
      </div>

      {/* Form Modal */}
      <VirtualWarehouseFormModal
        open={isFormModalOpen}
        onClose={handleCloseModal}
        warehouse={selectedWarehouse}
      />
    </div>
  );
}
