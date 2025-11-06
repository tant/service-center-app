"use client";

import * as React from "react";
import {
  IconEdit,
  IconTrash,
  IconFileText,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconDots,
  IconEye,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteTemplate } from "@/hooks/use-workflow";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { TablePagination } from "@/components/ui/table-pagination";

interface Workflow {
  id: string;
  name: string;
  description?: string;
  service_type: "warranty" | "paid" | "replacement";
  enforce_sequence: boolean; // API field (mapped from DB's strict_sequence)
  is_active: boolean;
  created_at: string;
  tasks?: Array<{
    id: string;
    sequence_order: number;
    is_required: boolean;
    task_type: {
      id: string;
      name: string;
      category?: string;
    };
  }>;
}

interface TemplateListTableInterface {
  templates: Workflow[];
  isLoading: boolean;
  onEdit: (workflowId: string) => void;
  onView: (workflowId: string) => void;
  onCreateNew: () => void;
}

const SERVICE_TYPE_LABELS = {
  warranty: "Bảo hành",
  paid: "Trả phí",
  replacement: "Đổi mới",
};

const SERVICE_TYPE_COLORS = {
  warranty: "bg-blue-500",
  paid: "bg-green-500",
  replacement: "bg-orange-500",
};

export function TemplateListTable({
  templates,
  isLoading,
  onEdit,
  onView,
  onCreateNew,
}: TemplateListTableInterface) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const { deleteTemplate, isDeleting } = useDeleteTemplate();

  const columns: ColumnDef<Workflow>[] = React.useMemo(
    () => [
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
        header: "Tên mẫu",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            className="h-auto p-2 font-medium hover:bg-accent"
            onClick={() => onView(row.original.id)}
          >
            {row.original.name}
          </Button>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "service_type",
        header: "Loại dịch vụ",
        cell: ({ row }) => (
          <Badge
            className={SERVICE_TYPE_COLORS[row.original.service_type]}
          >
            {SERVICE_TYPE_LABELS[row.original.service_type]}
          </Badge>
        ),
      },
      {
        accessorKey: "tasks",
        header: "Công việc",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IconFileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {row.original.tasks?.length || 0}
            </span>
            {row.original.enforce_sequence && (
              <Badge variant="outline" className="text-xs">
                Tuần tự
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Mở menu hành động"
              >
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(row.original.id)}>
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  deleteTemplate({
                    template_id: row.original.id,
                    soft_delete: true,
                  })
                }
                disabled={isDeleting}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onView, deleteTemplate, isDeleting]
  );

  const table = useReactTable({
    data: templates,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Đang tải mẫu...</div>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue="all-templates"
      className="w-full flex-col justify-start gap-6"
    >
      {/* Row 1: Tabs + Buttons */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="all-templates">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn hiển thị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-templates">Tất cả mẫu</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="archived">Đã lưu trữ</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all-templates">Tất cả mẫu</TabsTrigger>
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="archived">Đã lưu trữ</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Cột</span>
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  const columnDisplayNames: Record<string, string> = {
                    name: "Tên mẫu",
                    service_type: "Loại dịch vụ",
                    tasks: "Công việc",
                    created_at: "Ngày tạo",
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnDisplayNames[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateNew} size="sm" variant="outline">
            <IconPlus />
            <span className="hidden lg:inline">Tạo quy trình</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent
        value="all-templates"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        {/* Row 2: Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm mẫu..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Row 3: Table */}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
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
                    Không tìm thấy mẫu nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <TablePagination table={table} labelId="rows-per-page-workflows" />
      </TabsContent>

      {/* Additional tab contents (can be implemented later) */}
      <TabsContent value="active" className="px-4 lg:px-6">
        <div className="text-muted-foreground py-8 text-center">
          Hiển thị mẫu đang hoạt động - sắp ra mắt
        </div>
      </TabsContent>
      <TabsContent value="archived" className="px-4 lg:px-6">
        <div className="text-muted-foreground py-8 text-center">
          Hiển thị mẫu đã lưu trữ - sắp ra mắt
        </div>
      </TabsContent>
    </Tabs>
  );
}
