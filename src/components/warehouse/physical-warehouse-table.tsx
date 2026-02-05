"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5.1: Physical warehouses table with CRUD operations
 */

import {
  IconBuildingWarehouse,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconTrash,
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
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDeletePhysicalWarehouse,
  usePhysicalWarehouses,
} from "@/hooks/use-warehouse";
import type { PhysicalWarehouse } from "@/types/warehouse";
import { WarehouseFormModal } from "./warehouse-form-modal";

const columns: ColumnDef<PhysicalWarehouse>[] = [
  {
    accessorKey: "name",
    header: "Tên Kho",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2 font-medium">
          <IconBuildingWarehouse className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.name}</span>
          {(row.original as any).is_system_default && (
            <Badge
              variant="outline"
              className="ml-1 bg-primary/10 text-primary border-primary/30"
            >
              Mặc Định
            </Badge>
          )}
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "location",
    header: "Địa Điểm",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconMapPin className="h-4 w-4 text-muted-foreground" />
        {row.original.location}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Mô Tả",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">{row.original.description || "—"}</div>
    ),
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
  {
    id: "actions",
    header: () => <div className="text-right">Hành động</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onEdit: (warehouse: PhysicalWarehouse) => void;
        onDelete: (id: string) => void;
      };
      const isSystemDefault = (row.original as any).is_system_default;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta.onEdit(row.original)}
          >
            <IconEdit className="h-4 w-4" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSystemDefault}
                    onClick={() => meta.onDelete(row.original.id)}
                  >
                    <IconTrash className="h-4 w-4 text-destructive" />
                  </Button>
                </span>
              </TooltipTrigger>
              {isSystemDefault && (
                <TooltipContent>
                  <p>Không thể xóa kho mặc định của hệ thống</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];

export function PhysicalWarehouseTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    React.useState<PhysicalWarehouse | null>(null);

  // Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Get ALL warehouses (both active and inactive)
  const { warehouses, isLoading } = usePhysicalWarehouses();
  const { deleteWarehouse } = useDeletePhysicalWarehouse();

  // Filter warehouses based on search query and status
  const filteredWarehouses = React.useMemo(() => {
    let filtered = warehouses;

    // Filter by status
    if (statusFilter === "active") {
      filtered = filtered.filter((w) => w.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((w) => !w.is_active);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (warehouse) =>
          warehouse.name.toLowerCase().includes(query) ||
          warehouse.location.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [warehouses, searchQuery, statusFilter]);

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa kho này?")) {
      deleteWarehouse({ id });
    }
  };

  const handleEdit = (warehouse: PhysicalWarehouse) => {
    setEditingWarehouse(warehouse);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingWarehouse(null);
  };

  const table = useReactTable({
    data: filteredWarehouses,
    columns,
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
    meta: {
      onEdit: handleEdit,
      onDelete: handleDelete,
    },
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Search and Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder="Tìm kiếm theo tên kho hoặc địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">Thêm Kho Mới</span>
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-lg border py-8 text-center text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : table.getRowModel().rows?.length === 0 ? (
          <div className="rounded-lg border py-8 text-center text-muted-foreground">
            {searchQuery ? "Không tìm thấy kho phù hợp" : "Chưa có kho nào"}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header, index) => (
                        <TableHead
                          key={header.id}
                          className={
                            index === 0
                              ? "pl-4 lg:pl-6"
                              : index === headerGroup.headers.length - 1
                                ? "pr-4 lg:pr-6"
                                : ""
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
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
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={
                            index === 0
                              ? "pl-4 lg:pl-6"
                              : index === row.getVisibleCells().length - 1
                                ? "pr-4 lg:pr-6"
                                : ""
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <TablePagination table={table} labelId="rows-per-page" />
          </>
        )}
      </div>

      <WarehouseFormModal
        open={showCreateModal || !!editingWarehouse}
        onClose={handleCloseModal}
        warehouse={editingWarehouse}
      />
    </>
  );
}
