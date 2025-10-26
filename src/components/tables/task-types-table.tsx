/**
 * Task Types Table Component
 * Display and manage task type definitions
 */

"use client";

import * as React from "react";
import {
  IconPlus,
  IconEdit,
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
import { Badge } from "@/components/ui/badge";
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
import { useTaskTypes } from "@/hooks/use-workflow";
import type { TaskType } from "@/types/workflow";

const columns: ColumnDef<TaskType>[] = [
  {
    accessorKey: "name",
    header: "Tên Loại Công Việc",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.name}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "category",
    header: "Danh Mục",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.category || "Khác"}
      </Badge>
    ),
  },
  {
    accessorKey: "description",
    header: "Mô Tả",
    cell: ({ row }) => (
      <div className="max-w-md truncate">
        {row.original.description || "—"}
      </div>
    ),
  },
  {
    accessorKey: "estimated_duration_minutes",
    header: "Thời Gian Ước Tính",
    cell: ({ row }) => {
      const minutes = row.original.estimated_duration_minutes;
      if (!minutes) return "—";
      
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${mins}m`;
      }
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
  {
    id: "actions",
    header: () => <div className="text-right">Hành động</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onEdit: (taskType: TaskType) => void;
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

export function TaskTypesTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingTaskType, setEditingTaskType] = React.useState<TaskType | null>(null);

  // Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { taskTypes, isLoading } = useTaskTypes();

  // Filter task types based on search query
  const filteredTaskTypes = React.useMemo(() => {
    if (!searchQuery) return taskTypes;

    return taskTypes.filter((taskType) => {
      const query = searchQuery.toLowerCase();
      return (
        taskType.name.toLowerCase().includes(query) ||
        taskType.category?.toLowerCase().includes(query) ||
        taskType.description?.toLowerCase().includes(query)
      );
    });
  }, [taskTypes, searchQuery]);

  const handleEdit = (taskType: TaskType) => {
    setEditingTaskType(taskType);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTaskType(null);
  };

  const table = useReactTable({
    data: filteredTaskTypes,
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
    <div className="flex flex-col gap-4">
      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Tìm kiếm theo tên, danh mục hoặc mô tả..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
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

          {/* Create Button */}
          <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
            <IconPlus className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">Thêm Loại Công Việc</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg border py-8 text-center text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : table.getRowModel().rows?.length === 0 ? (
        <div className="rounded-lg border py-8 text-center text-muted-foreground">
          {searchQuery ? "Không tìm thấy loại công việc phù hợp" : "Chưa có loại công việc nào"}
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

      {/* TODO: Add Task Type Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              {editingTaskType ? "Chỉnh sửa" : "Thêm"} Loại Công Việc
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Chức năng này đang được phát triển.
            </p>
            <Button onClick={handleCloseModal}>Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { TaskTypesTable };
