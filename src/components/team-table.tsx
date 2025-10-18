"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
  IconKey,
  IconLayoutColumns,
  IconPlus,
  IconShield,
  IconToggleLeft,
  IconToggleRight,
  IconUser,
  IconUserCheck,
  IconUserX,
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
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Separator } from "@/components/ui/separator";
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
import { useIsMobile } from "@/hooks/use-mobile";

// TODO: REMOVE IN PRODUCTION - Sample data generator imports for development/testing only
import { IconDatabase } from "@tabler/icons-react";

export const teamSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  avatar_url: z.string().nullable(),
  role: z.enum(["admin", "manager", "technician", "reception"]),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Kéo để sắp xếp lại</span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof teamSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
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
    accessorKey: "full_name",
    header: "Tài khoản",
    cell: ({ row }) => {
      return <TeamMemberViewer member={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.email}</div>
    ),
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => (
      <Badge
        variant={row.original.role === "admin" ? "default" : "secondary"}
        className="text-xs"
      >
        {row.original.role === "admin"
          ? "Quản trị viên"
          : row.original.role === "manager"
            ? "Quản lý"
            : row.original.role === "technician"
              ? "Kỹ thuật viên"
              : "Lễ tân"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_active ? "default" : "destructive"}
        className="gap-1"
      >
        {row.original.is_active ? (
          <IconUserCheck className="size-3" />
        ) : (
          <IconUserX className="size-3" />
        )}
        {row.original.is_active ? "Hoạt động" : "Vô hiệu hóa"}
      </Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Tạo lúc",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm">
        {new Date(row.original.created_at).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row, table }) => (
      <QuickActions
        member={row.original}
        allMembers={table.options.data as z.infer<typeof teamSchema>[]}
        onUpdate={(updatedMember) => {
          // This will be set by the table component
          const meta = table.options.meta as any;
          if (meta?.updateMember) {
            meta.updateMember(updatedMember);
          }
        }}
      />
    ),
  },
];

interface QuickActionsProps {
  member: z.infer<typeof teamSchema>;
  allMembers: z.infer<typeof teamSchema>[];
  onUpdate: (updatedMember: z.infer<typeof teamSchema>) => void;
}

function QuickActions({ member, allMembers, onUpdate }: QuickActionsProps) {
  // Check if this member is the last active admin
  const isLastActiveAdmin = React.useMemo(() => {
    if (member.role !== "admin" || !member.is_active) {
      return false;
    }

    const activeAdmins = allMembers.filter(
      (m) => m.is_active && m.role === "admin",
    );

    return activeAdmins.length === 1;
  }, [member, allMembers]);

  const handleRoleChange = (newRole: string) => {
    // Prevent changing role of last active admin
    if (member.role === "admin" && isLastActiveAdmin && newRole !== "admin") {
      const errorMessage =
        "Không thể thay đổi vai trò của quản trị viên cuối cùng";
      console.error("[Team] Role change error:", errorMessage, {
        member,
        newRole,
      });
      toast.error(errorMessage);
      return;
    }

    // TODO: Implement actual role change API call
    const successMessage = `Vai trò sẽ được cập nhật thành ${newRole === "admin" ? "Quản trị viên" : newRole === "manager" ? "Quản lý" : newRole === "technician" ? "Kỹ thuật viên" : "Lễ tân"}`;
    console.log("[Team] Role change success:", successMessage, {
      member,
      newRole,
    });
    toast.success(successMessage);
  };

  const handlePasswordChange = () => {
    // TODO: Implement password change modal/form
    const successMessage = "Tính năng thay đổi mật khẩu sắp ra mắt";
    console.log("[Team] Password change:", successMessage, { member });
    toast.success(successMessage);
  };

  const handleToggleActive = () => {
    // Prevent deactivating the last active admin
    if (isLastActiveAdmin && member.is_active) {
      const errorMessage =
        "Không thể vô hiệu hóa tài khoản quản trị viên cuối cùng. Vui lòng nâng cấp người dùng khác lên quản trị viên trước.";
      console.error("[Team] Toggle active error:", errorMessage, {
        member,
        isLastActiveAdmin,
      });
      toast.error(errorMessage, { duration: 5000 });
      return;
    }

    // TODO: Implement active status toggle API call
    const newStatus = !member.is_active;
    const successMessage = `Tài khoản đã được ${newStatus ? "kích hoạt" : "vô hiệu hóa"}`;
    console.log("[Team] Toggle active success:", successMessage, {
      member,
      newStatus,
    });

    // Update local state immediately for instant UI feedback
    onUpdate({
      ...member,
      is_active: newStatus,
      updated_at: new Date().toISOString(),
    });

    toast.success(successMessage);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Change Role */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 text-muted-foreground hover:text-foreground"
              >
                <IconShield className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Thay đổi vai trò</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <div className="px-2 py-1.5 text-sm font-medium">
            Thay đổi vai trò
          </div>
          <DropdownMenuSeparator />
          {["admin", "manager", "technician", "reception"].map((role) => {
            const isCurrentRole = member.role === role;
            const isDisabled =
              member.role === "admin" && isLastActiveAdmin && role !== "admin";

            return (
              <DropdownMenuItem
                key={role}
                onClick={() => !isDisabled && handleRoleChange(role)}
                className={`${isCurrentRole ? "bg-accent" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isDisabled}
              >
                {role === "admin"
                  ? "Quản trị viên"
                  : role === "manager"
                    ? "Quản lý"
                    : role === "technician"
                      ? "Kỹ thuật viên"
                      : "Lễ tân"}
                {isDisabled && (
                  <span className="ml-auto text-xs">(Được bảo vệ)</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Password */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={handlePasswordChange}
          >
            <IconKey className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Đổi mật khẩu</p>
        </TooltipContent>
      </Tooltip>

      {/* Toggle Active/Inactive */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`size-9 p-0 ${
              isLastActiveAdmin && member.is_active
                ? "opacity-50 cursor-not-allowed"
                : ""
            } ${member.is_active ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
            onClick={handleToggleActive}
            disabled={isLastActiveAdmin && member.is_active}
          >
            {member.is_active ? (
              <IconUserCheck className="size-5" />
            ) : (
              <IconUserX className="size-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isLastActiveAdmin && member.is_active
              ? "Không thể vô hiệu hóa quản trị viên cuối cùng"
              : member.is_active
                ? "Nhấn để vô hiệu hóa tài khoản"
                : "Nhấn để kích hoạt tài khoản"}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function DraggableRow({ row }: { row: Row<z.infer<typeof teamSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function TeamTable({
  data: initialData,
}: {
  data: z.infer<typeof teamSchema>[];
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
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const filteredData = React.useMemo(() => {
    if (!searchValue) return data;

    return data.filter((item) => {
      const searchLower = searchValue.toLowerCase();
      return (
        item.full_name.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchValue]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData],
  );

  const updateMember = React.useCallback(
    (updatedMember: z.infer<typeof teamSchema>) => {
      setData((currentData) =>
        currentData.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );
    },
    [],
  );

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
    meta: {
      updateMember,
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((currentData) => {
        const oldIndex = currentData.findIndex((item) => item.id === active.id);
        const newIndex = currentData.findIndex((item) => item.id === over.id);
        return arrayMove(currentData, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      defaultValue="team-list"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="team-list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team-list">DS Nhân viên</SelectItem>
            <SelectItem value="role-management">Quản lý</SelectItem>
            <SelectItem value="staff">Nhân viên</SelectItem>
            <SelectItem value="inactive">Đã vô hiệu</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="team-list">Team List</TabsTrigger>
          <TabsTrigger value="role-management">
            Quản lý{" "}
            <Badge variant="secondary">
              {
                data.filter((m) => m.role === "admin" || m.role === "manager")
                  .length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="staff">
            Nhân viên{" "}
            <Badge variant="secondary">
              {
                data.filter(
                  (m) => m.role === "technician" || m.role === "reception",
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Đã vô hiệu{" "}
            <Badge variant="secondary">
              {data.filter((m) => !m.is_active).length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Columns</span>
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
          <TeamMemberModal
            mode="add"
            trigger={
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Thêm nhân viên</span>
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />

          {/* TODO: REMOVE IN PRODUCTION - Sample data generator for development/testing only */}
          <SampleDataGenerator onSuccess={() => window.location.reload()} />
        </div>
      </div>
      <TabsContent
        value="team-list"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
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
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Không tìm thấy thành viên.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} đã chọn{" "}
            {table.getFilteredRowModel().rows.length} người dùng.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Số dòng trên trang
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
              Trang {table.getState().pagination.pageIndex + 1} trên{" "}
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
      <TabsContent
        value="role-management"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Chức năng quản lý vai trò sắp ra mắt
        </div>
      </TabsContent>
      <TabsContent value="staff" className="flex flex-col px-4 lg:px-6">
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Chức năng lọc nhân viên sắp ra mắt
        </div>
      </TabsContent>
      <TabsContent value="inactive" className="flex flex-col px-4 lg:px-6">
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Chức năng xem người dùng đã vô hiệu sắp ra mắt
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface TeamMemberModalProps {
  member?: z.infer<typeof teamSchema>;
  mode: "add" | "edit";
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

function TeamMemberModal({
  member,
  mode,
  trigger,
  onSuccess,
}: TeamMemberModalProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: "",
    email: "",
    password: "",
    avatar_url: "",
    role: "technician",
    is_active: true,
  });

  // Reset form when modal opens or mode/member changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        full_name: member?.full_name || "",
        email: member?.email || "",
        password: "",
        avatar_url: member?.avatar_url || "",
        role: member?.role || "technician",
        is_active: member?.is_active ?? true,
      });
    }
  }, [open, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.role) {
      const errorMessage = "Vui lòng điền đầy đủ các trường bắt buộc";
      console.error("[Team] Form validation error:", errorMessage, {
        formData,
      });
      toast.error(errorMessage);
      return;
    }

    if (mode === "add" && formData.password.length < 6) {
      const errorMessage = "Mật khẩu phải có ít nhất 6 ký tự";
      console.error("[Team] Password validation error:", errorMessage, {
        passwordLength: formData.password.length,
      });
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "add") {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        const successMessage = "Tạo nhân viên thành công";
        console.log("[Team] Staff created successfully:", successMessage, {
          email: formData.email,
          role: formData.role,
        });
        toast.success(successMessage);
      } else {
        // TODO: Implement update functionality
        const successMessage = "Tính năng cập nhật sắp ra mắt";
        console.log("[Team] Update feature:", successMessage);
        toast.success(successMessage);
      }

      setOpen(false);

      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      console.error("[Team] Submit error:", errorMessage, error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-3">
            {mode === "edit" && (
              <Avatar className="size-10">
                <AvatarImage src={member?.avatar_url || ""} />
                <AvatarFallback>
                  <IconUser className="size-5" />
                </AvatarFallback>
              </Avatar>
            )}
            {mode === "add" ? "Thêm Nhân Viên Mới" : member?.full_name}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "add"
              ? "Tạo tài khoản nhân viên mới với các thông tin bắt buộc."
              : "Chi tiết và tùy chọn quản lý thành viên"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Nhập họ và tên"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Nhập địa chỉ email"
                required
              />
            </div>
            {mode === "add" && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  minLength={6}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Label htmlFor="avatar_url">Đường dẫn Avatar</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="Nhập đường dẫn avatar (tùy chọn)"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="roles">Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as any })
                }
              >
                <SelectTrigger id="roles" className="w-full">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="technician">Kỹ thuật viên</SelectItem>
                  <SelectItem value="reception">Lễ tân</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="is_active">Trạng thái</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_active: value === "active" })
                }
              >
                <SelectTrigger id="is_active" className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Vô hiệu hóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "edit" && member && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      ID Người dùng
                    </Label>
                    <div className="font-mono text-xs">{member.user_id}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">ID Hồ sơ</Label>
                    <div className="font-mono text-xs">{member.id}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Ngày tạo</Label>
                    <div>
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Cập nhật lúc
                    </Label>
                    <div>
                      {new Date(member.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isLoading}
          >
            {isLoading
              ? mode === "add"
                ? "Đang tạo..."
                : "Đang cập nhật..."
              : mode === "add"
                ? "Tạo nhân viên"
                : "Lưu thay đổi"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Hủy bỏ
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// TODO: REMOVE IN PRODUCTION - Sample data generator component for development/testing only
function SampleDataGenerator({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Random data generators
  const firstNames = [
    "John",
    "Jane",
    "Mike",
    "Sarah",
    "David",
    "Lisa",
    "Tom",
    "Anna",
    "Chris",
    "Maria",
    "Alex",
    "Emma",
    "Ryan",
    "Sofia",
    "James",
    "Luna",
    "Kevin",
    "Nina",
    "Paul",
    "Zoe",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
  ];
  const roles = ["admin", "manager", "technician", "reception"];
  const domains = [
    "testcompany.com",
    "example.org",
    "demo.net",
    "sample.io",
    "test.co",
  ];

  const generateRandomName = () => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  };

  const generateRandomEmail = (name: string) => {
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const cleanName = name.toLowerCase().replace(/\s+/g, ".");
    const randomNum = Math.floor(Math.random() * 1000);
    return `${cleanName}.${randomNum}@${domain}`;
  };

  const generateRandomRole = () => {
    return roles[Math.floor(Math.random() * roles.length)] as
      | "admin"
      | "manager"
      | "technician"
      | "reception";
  };

  const handleGenerateSampleData = async () => {
    if (!confirm("This will create 100 test accounts. Are you sure?")) {
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const infoMessage = "Tạo 100 tài khoản mẫu... Có thể mất một lút.";
      console.log("[Team] Sample data generation started:", infoMessage);
      toast.info(infoMessage);

      // Create accounts in batches of 10 to avoid overwhelming the server
      for (let batch = 0; batch < 10; batch++) {
        const batchPromises = [];

        for (let i = 0; i < 10; i++) {
          const accountNumber = batch * 10 + i + 1;
          const fullName = generateRandomName();
          const email = generateRandomEmail(fullName);
          const role = generateRandomRole();

          const accountData = {
            full_name: fullName,
            email: email,
            password: "123456",
            role: role,
          };

          const promise = fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(accountData),
          })
            .then(async (response) => {
              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
                const error = await response.json();
                console.error(
                  `[Team] Failed to create account ${accountNumber}:`,
                  error,
                );
              }
            })
            .catch((error) => {
              errorCount++;
              console.error(
                `[Team] Error creating account ${accountNumber}:`,
                error,
              );
            });

          batchPromises.push(promise);
        }

        // Wait for current batch to complete before starting next batch
        await Promise.all(batchPromises);

        // Show progress
        const progressMessage = `Đã tạo ${(batch + 1) * 10} tài khoản...`;
        console.log(`[Team] Sample data progress:`, progressMessage);
        toast.info(progressMessage);

        // Small delay between batches to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const successMessage = `Tạo dữ liệu mẫu hoàn thành! Đã tạo thành công ${successCount} tài khoản. ${errorCount > 0 ? `${errorCount} thất bại.` : ""}`;
      console.log("[Team] Sample data generation completed:", successMessage, {
        successCount,
        errorCount,
      });
      toast.success(successMessage);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = "Tạo dữ liệu mẫu thất bại";
      console.error(
        "[Team] Sample data generation error:",
        errorMessage,
        error,
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateSampleData}
      disabled={isLoading}
      className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
    >
      <IconDatabase className="size-4" />
      <span className="hidden lg:inline">
        {isLoading ? "Đang thêm..." : "Thêm mẫu"}
      </span>
    </Button>
  );
}

function TeamMemberViewer({ member }: { member: z.infer<typeof teamSchema> }) {
  return (
    <TeamMemberModal
      member={member}
      mode="edit"
      trigger={
        <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto">
          <Avatar className="size-8">
            <AvatarImage src={member.avatar_url || ""} />
            <AvatarFallback>
              <IconUser className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <div className="font-medium">{member.full_name}</div>
          </div>
        </Button>
      }
      onSuccess={() => window.location.reload()}
    />
  );
}
