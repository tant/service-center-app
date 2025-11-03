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
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
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
import { FormDrawer } from "@/components/ui/form-drawer";
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
import { TablePagination } from "@/components/ui/table-pagination";
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
import { PasswordResetButton } from "@/components/team/password-reset-button";
import { RoleChangeButton } from "@/components/team/role-change-button";
import { ToggleActiveButton } from "@/components/team/toggle-active-button";
import { useStaffApi } from "@/hooks/use-staff-api";
import { getRoleLabel, type UserRole } from "@/lib/constants/roles";

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
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <TeamMemberViewer
          member={row.original}
          currentUserRole={meta?.currentUserRole || 'reception'}
        />
      );
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
        {getRoleLabel(row.original.role)}
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
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <QuickActions
          member={row.original}
          allMembers={table.options.data as z.infer<typeof teamSchema>[]}
          currentUserRole={meta?.currentUserRole || 'reception'}
          onUpdate={(updatedMember) => {
            if (meta?.updateMember) {
              meta.updateMember(updatedMember);
            }
          }}
        />
      );
    },
  },
];

interface QuickActionsProps {
  member: z.infer<typeof teamSchema>;
  allMembers: z.infer<typeof teamSchema>[];
  currentUserRole: UserRole;
  onUpdate: (updatedMember: z.infer<typeof teamSchema>) => void;
}

function QuickActions({ member, allMembers, currentUserRole, onUpdate }: QuickActionsProps) {
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

  const handleRoleChange = (newRole: UserRole) => {
    onUpdate({
      ...member,
      role: newRole,
      updated_at: new Date().toISOString(),
    });
  };

  const handleToggleActive = (newStatus: boolean) => {
    onUpdate({
      ...member,
      is_active: newStatus,
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="flex items-center gap-1">
      <RoleChangeButton
        userId={member.user_id}
        currentRole={member.role}
        currentUserRole={currentUserRole}
        isLastActiveAdmin={isLastActiveAdmin}
        onSuccess={handleRoleChange}
      />

      <PasswordResetButton
        userId={member.user_id}
        fullName={member.full_name}
        email={member.email}
        role={member.role}
        currentUserRole={currentUserRole}
      />

      <ToggleActiveButton
        userId={member.user_id}
        isActive={member.is_active}
        isLastActiveAdmin={isLastActiveAdmin}
        onSuccess={handleToggleActive}
      />
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
      data-testid={`team-member-row-${row.original.email}`}
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
  currentUserRole,
}: {
  data: z.infer<typeof teamSchema>[];
  currentUserRole: UserRole;
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
      currentUserRole,
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
            currentUserRole={currentUserRole}
            trigger={
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Thêm nhân viên</span>
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
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
          <TablePagination table={table} labelId="rows-per-page-team" />
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
  currentUserRole: UserRole;
  onSuccess?: () => void;
}

function TeamMemberModal({
  member,
  mode,
  trigger,
  currentUserRole,
  onSuccess,
}: TeamMemberModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: "",
    email: "",
    password: "",
    avatar_url: "",
    role: "technician" as UserRole,
    is_active: true,
  });

  const { createStaff, updateStaff } = useStaffApi();

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
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    if (mode === "add" && formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "add") {
        await createStaff({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      } else {
        if (!member?.user_id) {
          throw new Error("User ID is required for update");
        }

        await updateStaff(member.user_id, {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active,
          avatar_url: formData.avatar_url || null,
        });
      }

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (_error) {
      // Error already handled by useStaffApi
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles: UserRole[] = React.useMemo(() => {
    if (currentUserRole === "manager") {
      return ["technician", "reception"];
    }
    return ["admin", "manager", "technician", "reception"];
  }, [currentUserRole]);

  return (
    <FormDrawer
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      titleElement={
        <div className="flex items-center gap-3">
          {mode === "edit" && (
            <Avatar className="size-10">
              <AvatarImage src={member?.avatar_url || ""} />
              <AvatarFallback>
                <IconUser className="size-5" />
              </AvatarFallback>
            </Avatar>
          )}
          {mode === "add" ? "Thêm Nhân Viên Mới" : member?.full_name}
        </div>
      }
      description={
        mode === "add"
          ? "Tạo tài khoản nhân viên mới với các thông tin bắt buộc."
          : "Chi tiết và tùy chọn quản lý thành viên"
      }
      isSubmitting={isLoading}
      onSubmit={() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }}
      submitLabel={
        isLoading
          ? mode === "add"
            ? "Đang tạo..."
            : "Đang cập nhật..."
          : mode === "add"
            ? "Tạo nhân viên"
            : "Lưu thay đổi"
      }
      cancelLabel="Hủy bỏ"
      headerClassName="gap-1"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input
              id="full_name"
              name="fullName"
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
              name="email"
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
                name="password"
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
                setFormData({ ...formData, role: value as UserRole })
              }
            >
              <SelectTrigger id="roles" className="w-full">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
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
    </FormDrawer>
  );
}

function TeamMemberViewer({
  member,
  currentUserRole,
}: {
  member: z.infer<typeof teamSchema>;
  currentUserRole: UserRole;
}) {
  return (
    <TeamMemberModal
      member={member}
      mode="edit"
      currentUserRole={currentUserRole}
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
