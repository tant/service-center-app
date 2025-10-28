/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Table component for displaying and managing physical products inventory
 */

"use client";

import * as React from "react";
import {
  IconPlus,
  IconEdit,
  IconFileDownload,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
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
import { usePhysicalProducts } from "@/hooks/use-warehouse";
import { trpc } from "@/components/providers/trpc-provider";
import { ProductRegistrationModal } from "./product-registration-modal";
import { BulkImportModal } from "./bulk-import-modal";
import { WarrantyStatusBadge } from "./warranty-status-badge";
import { WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";
import type { PhysicalProduct } from "@/types/warehouse";

// Extended type with relations from API
type PhysicalProductWithRelations = PhysicalProduct & {
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

const CONDITION_LABELS = {
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

const columns: ColumnDef<PhysicalProductWithRelations>[] = [
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
    cell: ({ row }) => (
      <div>
        <Badge variant="outline" className="mb-1">
          {row.original.virtual_warehouse?.name || "Không xác định"}
        </Badge>
        {row.original.physical_warehouse && (
          <div className="text-xs text-muted-foreground">
            {row.original.physical_warehouse.name}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "condition",
    header: "Tình Trạng",
    cell: ({ row }) => (
      <Badge variant={CONDITION_COLORS[row.original.condition as keyof typeof CONDITION_COLORS]}>
        {CONDITION_LABELS[row.original.condition as keyof typeof CONDITION_LABELS]}
      </Badge>
    ),
  },
  {
    accessorKey: "warranty_end_date",
    header: "Bảo Hành",
    cell: ({ row }) => (
      <WarrantyStatusBadge warrantyEndDate={row.original.warranty_end_date} />
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Hành động</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onEdit: (product: PhysicalProductWithRelations) => void;
      };
      
      return (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta.onEdit(row.original)}
          >
            <IconEdit className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function ProductInventoryTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>("all");
  const [conditionFilter, setConditionFilter] = React.useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = React.useState<string>("all");
  const [showRegistrationModal, setShowRegistrationModal] = React.useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<PhysicalProductWithRelations | null>(null);

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

  // Build filters object
  const filters: any = {};
  if (warehouseFilter && warehouseFilter !== "all") filters.virtual_warehouse_id = warehouseFilter;
  if (conditionFilter && conditionFilter !== "all") filters.condition = conditionFilter;
  if (warrantyFilter && warrantyFilter !== "all") filters.warranty_status = warrantyFilter;
  if (searchQuery) filters.search = searchQuery;

  const { products, total, isLoading } = usePhysicalProducts(filters);

  const handleEdit = (product: PhysicalProductWithRelations) => {
    setEditingProduct(product);
  };

  const handleCloseModal = () => {
    setShowRegistrationModal(false);
    setEditingProduct(null);
  };

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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      onEdit: handleEdit,
    },
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
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

            {/* Bulk Import */}
            <Button variant="outline" size="sm" onClick={() => setShowBulkImportModal(true)}>
              <IconFileDownload className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Nhập Hàng Loạt</span>
            </Button>

            {/* Register Product */}
            <Button variant="outline" size="sm" onClick={() => setShowRegistrationModal(true)}>
              <IconPlus className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Đăng Ký Sản Phẩm</span>
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Tìm kiếm theo số serial..."
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

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Tất cả tình trạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tình trạng</SelectItem>
              {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Tất cả bảo hành" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả bảo hành</SelectItem>
              <SelectItem value="active">Còn bảo hành</SelectItem>
              <SelectItem value="expiring_soon">Sắp hết bảo hành</SelectItem>
              <SelectItem value="expired">Hết bảo hành</SelectItem>
              <SelectItem value="no_warranty">Không bảo hành</SelectItem>
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
             (warehouseFilter && warehouseFilter !== "all") || 
             (conditionFilter && conditionFilter !== "all") || 
             (warrantyFilter && warrantyFilter !== "all")
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

      {/* Modals */}
      <ProductRegistrationModal
        open={showRegistrationModal || !!editingProduct}
        onClose={handleCloseModal}
        product={editingProduct}
      />

      <BulkImportModal
        open={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
      />
    </>
  );
}
