/**
 * Task Types Table Component
 * Display and manage task type definitions
 * Follows UI_CODING_GUIDE.md section 3 (Tabs System)
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
  IconDots,
  IconToggleLeft,
  IconToggleRight,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTaskTypes, useToggleTaskType } from "@/hooks/use-workflow";
import type { TaskType } from "@/types/workflow";
import { TaskTypeForm } from "@/components/forms/task-type-form";

// Category color mappings for visual differentiation
const CATEGORY_COLORS = {
  "Kiểm tra": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  "Sửa chữa": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  "Thay thế": "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  "Vệ sinh": "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  "Cài đặt": "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
  "Kiểm tra cuối": "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
  "Khác": "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
} as const;

// Category icons for visual recognition
const CATEGORY_ICONS = {
  "Kiểm tra": "🔍",
  "Sửa chữa": "🔧",
  "Thay thế": "🔄",
  "Vệ sinh": "✨",
  "Cài đặt": "⚙️",
  "Kiểm tra cuối": "✅",
  "Khác": "📋",
} as const;

const columns: ColumnDef<TaskType>[] = [
  {
    accessorKey: "name",
    header: "Tên Loại Công Việc",
    cell: ({ row }) => {
      const category = row.original.category || "Khác";
      const icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={category}>
            {icon}
          </span>
          <span className="font-medium">{row.original.name}</span>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "category",
    header: "Danh Mục",
    cell: ({ row }) => {
      const category = row.original.category || "Khác";
      const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
      return (
        <Badge variant="outline" className={colorClass}>
          {category}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Mô Tả",
    cell: ({ row }) => (
      <div className="max-w-md truncate">
        {row.original.description || "-"}
      </div>
    ),
  },
  {
    accessorKey: "estimated_duration_minutes",
    header: "Thời Gian (phút)",
    cell: ({ row }) => {
      const duration = row.original.estimated_duration_minutes;
      if (!duration) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }

      // Color coding based on duration
      let colorClass = "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      if (duration > 60) {
        colorClass = "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      } else if (duration > 30) {
        colorClass = "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";
      }

      return (
        <Badge variant="outline" className={colorClass}>
          ⏱️ {duration} phút
        </Badge>
      );
    },
  },
  {
    accessorKey: "requires_notes",
    header: "Yêu Cầu Ghi Chú",
    cell: ({ row }) => (
      <Badge
        variant={row.original.requires_notes ? "default" : "secondary"}
        className={row.original.requires_notes
          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }
      >
        {row.original.requires_notes ? "✓ Có" : "○ Không"}
      </Badge>
    ),
  },
  {
    accessorKey: "requires_photo",
    header: "Yêu Cầu Ảnh",
    cell: ({ row }) => (
      <Badge
        variant={row.original.requires_photo ? "default" : "secondary"}
        className={row.original.requires_photo
          ? "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }
      >
        {row.original.requires_photo ? "📷 Có" : "○ Không"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Trạng Thái",
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_active ? "default" : "destructive"}
        className={row.original.is_active
          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-700"
          : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-300 dark:border-red-700"
        }
      >
        <span className={row.original.is_active ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
          {row.original.is_active ? "●" : "○"}
        </span>
        <span className="ml-1">{row.original.is_active ? "Hoạt động" : "Vô hiệu"}</span>
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Hành Động",
    cell: ({ row, table }) => {
      const taskType = row.original;
      const meta = table.options.meta as {
        onEdit: (taskType: TaskType) => void;
        onToggle: (taskType: TaskType) => void;
      };

      return (
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
            <DropdownMenuItem
              onClick={() => meta.onEdit(taskType)}
              data-testid={`edit-task-type-${taskType.id}`}
            >
              <IconEdit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => meta.onToggle(taskType)}
              data-testid={`toggle-task-type-${taskType.id}`}
            >
              {taskType.is_active ? (
                <>
                  <IconToggleLeft className="mr-2 h-4 w-4" />
                  Vô hiệu hóa
                </>
              ) : (
                <>
                  <IconToggleRight className="mr-2 h-4 w-4" />
                  Kích hoạt
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];

type StatusFilter = "all" | "active" | "inactive";

export function TaskTypesTable() {
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingTaskType, setEditingTaskType] = React.useState<TaskType | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Query with filter based on status
  const filterParam = statusFilter === "all"
    ? undefined
    : { is_active: statusFilter === "active" };

  const { taskTypes, isLoading } = useTaskTypes(filterParam);
  const { toggleTaskType, isToggling } = useToggleTaskType();

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

  const handleToggle = (taskType: TaskType) => {
    if (window.confirm(
      taskType.is_active
        ? `Bạn có chắc muốn vô hiệu hóa loại công việc "${taskType.name}"?`
        : `Bạn có chắc muốn kích hoạt loại công việc "${taskType.name}"?`
    )) {
      toggleTaskType({
        id: taskType.id,
        is_active: !taskType.is_active,
      });
    }
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
      onToggle: handleToggle,
    },
  });

  return (
    <Tabs
      value={statusFilter}
      onValueChange={(value) => setStatusFilter(value as StatusFilter)}
      className="w-full flex-col justify-start gap-6"
    >
      {/* Row 1: Tabs/Select + Action Buttons */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Mobile: Select Dropdown */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="inactive">Đã vô hiệu</SelectItem>
          </SelectContent>
        </Select>

        {/* Desktop: Tab List */}
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="inactive">Đã vô hiệu</TabsTrigger>
        </TabsList>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Tùy chỉnh cột hiển thị">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Tùy chỉnh cột</span>
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

          {/* Create Button with Drawer */}
          <Drawer
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            direction={isMobile ? "bottom" : "right"}
          >
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <IconPlus className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Thêm Loại Công Việc</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>
                  {editingTaskType ? "Chỉnh sửa" : "Thêm"} Loại Công Việc
                </DrawerTitle>
                <DrawerDescription>
                  {editingTaskType
                    ? "Cập nhật thông tin loại công việc."
                    : "Tạo loại công việc mới cho hệ thống."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                <TaskTypeForm
                  taskType={editingTaskType || undefined}
                  onSuccess={handleCloseModal}
                />
              </div>

              <DrawerFooter>
                <Button type="submit" form="task-type-form">
                  {editingTaskType ? "Cập nhật" : "Tạo mới"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={handleCloseModal}>
                    Hủy bỏ
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent value={statusFilter} className="relative flex flex-col gap-4 px-4 lg:px-6">
        {/* Search Bar */}
        <Input
          placeholder="Tìm kiếm theo tên, danh mục hoặc mô tả..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

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
                      data-testid={`task-type-row-${row.original.id}`}
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
            <div className="flex items-center justify-between">
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
      </TabsContent>
    </Tabs>
  );
}
