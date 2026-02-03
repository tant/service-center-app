/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Table component for displaying and managing physical products inventory
 */

"use client";

import * as React from "react";
import {
  IconEdit,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconFileUpload,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { usePhysicalProducts } from "@/hooks/use-warehouse";
import { trpc } from "@/components/providers/trpc-provider";
import { EditProductDrawer } from "./edit-product-drawer";
import { BulkWarrantyUpdateDrawer } from "./bulk-warranty-update-drawer";
import { createProductColumns, CONDITION_LABELS } from "./product-inventory-table-columns";
import type { PhysicalProduct } from "@/types/warehouse";

// Extended type with relations from API
export type PhysicalProductWithRelations = PhysicalProduct & {
  product?: {
    id: string;
    name: string;
    sku: string | null;
    brand?: {
      name: string;
    };
  };
  physical_warehouse?: {
    id: string;
    name: string;
  };
  virtual_warehouse?: {
    id: string;
    name: string;
    warehouse_type: string;
  };
};

export function ProductInventoryTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>("all");
  const [editingProduct, setEditingProduct] = React.useState<PhysicalProductWithRelations | null>(null);
  const [showBulkWarrantyUpdate, setShowBulkWarrantyUpdate] = React.useState(false);

  // Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch virtual warehouses for filter dropdown
  const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery();

  // Build filters object - use useMemo to prevent infinite re-renders
  const filters = React.useMemo(() => {
    const f: {
      virtual_warehouse_id?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {};

    if (warehouseFilter && warehouseFilter !== "all") {
      f.virtual_warehouse_id = warehouseFilter;
    }
    if (searchQuery && searchQuery.trim()) {
      f.search = searchQuery.trim();
    }

    // Add pagination
    f.limit = pagination.pageSize;
    f.offset = pagination.pageIndex * pagination.pageSize;

    return f;
  }, [warehouseFilter, searchQuery, pagination.pageSize, pagination.pageIndex]);

  const { products, total, isLoading } = usePhysicalProducts(filters);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [warehouseFilter, searchQuery]);

  const router = useRouter();

  const handleEdit = React.useCallback((product: PhysicalProductWithRelations) => {
    setEditingProduct(product);
  }, []);

  const handleCloseDrawer = React.useCallback(() => {
    setEditingProduct(null);
  }, []);

  // Memoize table meta to prevent re-renders
  const tableMeta = React.useMemo(() => ({
    onEdit: handleEdit,
  }), [handleEdit]);

  // Create columns
  const columns = React.useMemo(() => createProductColumns(), []);

  const table = useReactTable({
    data: products,
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
    manualSorting: true, // Disable auto-sorting
    manualFiltering: true, // Disable auto-filtering
    manualPagination: true, // Disable auto-pagination
    pageCount: Math.ceil(total / pagination.pageSize),
    meta: tableMeta,
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Bulk Warranty Update Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkWarrantyUpdate(true)}
            >
              <IconFileUpload className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Cập nhật bảo hành</span>
              <span className="lg:hidden ml-2">BH</span>
            </Button>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Tùy chỉnh cột</span>
                  <span className="lg:hidden ml-2">Cột</span>
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            placeholder="Tìm kiếm theo số serial, tên sản phẩm, hoặc SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Tất cả kho ảo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kho ảo</SelectItem>
              {virtualWarehouses?.map((vw) => (
                <SelectItem key={vw.id} value={vw.id}>
                  {vw.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Hiển thị {table.getRowModel().rows.length} / {total} sản phẩm
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-lg border py-8 text-center text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : table.getRowModel().rows?.length === 0 ? (
          <div className="rounded-lg border py-8 text-center text-muted-foreground">
            {searchQuery ||
             (warehouseFilter && warehouseFilter !== "all")
              ? "Không tìm thấy sản phẩm phù hợp"
              : "Chưa có sản phẩm nào"}
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
                      className="cursor-pointer"
                      onClick={() => router.push(`/inventory/products/${row.original.id}`)}
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
                <div className="ml-8 hidden items-center gap-2 lg:flex">
                  <Label htmlFor="rows-per-page" className="text-sm font-medium">
                    Số dòng mỗi trang
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
      </div>

      {/* Edit Drawer */}
      <EditProductDrawer
        open={!!editingProduct}
        onClose={handleCloseDrawer}
        product={editingProduct}
      />

      {/* Bulk Warranty Update Drawer */}
      <BulkWarrantyUpdateDrawer
        open={showBulkWarrantyUpdate}
        onClose={() => setShowBulkWarrantyUpdate(false)}
      />
    </>
  );
}
