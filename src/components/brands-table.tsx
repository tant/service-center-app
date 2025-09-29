"use client";

import {
  IconBuilding,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEdit,
  IconExternalLink,
  IconLayoutColumns,
  IconPlus,
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
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo_url: z.string().nullable(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  country: z.string().nullable(),
  founded_year: z.number().nullable(),
  products_count: z.number(),
  parts_count: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const columns: ColumnDef<z.infer<typeof brandSchema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Thương hiệu",
    cell: ({ row }) => {
      return <BrandViewer brand={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "country",
    header: "Quốc gia",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.country || (
          <span className="text-muted-foreground italic">Không có thông tin</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "founded_year",
    header: "Năm thành lập",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.founded_year || (
          <span className="text-muted-foreground italic">Không có thông tin</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "products_count",
    header: "Sản phẩm",
    cell: ({ row }) => (
      <div className="text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.original.products_count}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "parts_count",
    header: "Linh kiện",
    cell: ({ row }) => (
      <div className="text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {row.original.parts_count}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Trạng thái",
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Hoạt động" : "Ngừng hoạt động"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Cập nhật",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm">
        {new Date(row.original.updated_at).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => <QuickActions brand={row.original} />,
  },
];

function QuickActions({ brand }: { brand: z.infer<typeof brandSchema> }) {
  const handleEdit = () => {
    // Placeholder for edit functionality
    console.log("Edit brand:", brand.name);
  };

  const handleViewWebsite = () => {
    if (brand.website) {
      window.open(brand.website, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Edit Brand */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <IconEdit className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Chỉnh sửa thương hiệu</p>
        </TooltipContent>
      </Tooltip>

      {/* View Website */}
      {brand.website && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleViewWebsite}
            >
              <IconExternalLink className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Xem website</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function BrandsTable({
  data: initialData,
}: {
  data: z.infer<typeof brandSchema>[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchValue, setSearchValue] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchValue) return data;

    return data.filter((item) => {
      const searchLower = searchValue.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.country?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchValue]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs
      defaultValue="brands-list"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="brands-list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brands-list">DS Thương hiệu</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="brands-list">DS Thương hiệu</TabsTrigger>
          <TabsTrigger value="active">
            Đang hoạt động <Badge variant="secondary">{data.filter(b => b.is_active).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive">Ngừng hoạt động</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Cột</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
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
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Thêm thương hiệu</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="brands-list"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên, quốc gia hoặc mô tả..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không tìm thấy thương hiệu nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
            {table.getFilteredRowModel().rows.length} thương hiệu.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Hàng trên trang
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
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
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Trang {table.getState().pagination.pageIndex + 1} của{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Đến trang đầu</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang trước</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang tiếp</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Đến trang cuối</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="active" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="inactive" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

function BrandViewer({ brand }: { brand: z.infer<typeof brandSchema> }) {
  return (
    <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto">
      <Avatar className="size-8">
        <AvatarImage src={brand.logo_url || ""} />
        <AvatarFallback>
          <IconBuilding className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <div className="font-medium">{brand.name}</div>
        <div className="text-sm text-muted-foreground">
          {brand.description || "Không có mô tả"}
        </div>
      </div>
    </Button>
  );
}