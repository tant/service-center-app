"use client";

import {
  closestCenter,
  DndContext,
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
  IconDatabase,
  IconEdit,
  IconGripVertical,
  IconLayoutColumns,
  IconMail,
  IconPhone,
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
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/components/providers/trpc-provider";

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;

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

function DraggableRow<TData extends { id: string }>({
  row,
}: {
  row: Row<TData>;
}) {
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

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  searchValue,
  sensors,
  sortableId,
  dataIds,
}: DataTableProps<TData, TValue> & {
  searchValue: string;
  sensors: any;
  sortableId: string;
  dataIds: UniqueIdentifier[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [tableData, setTableData] = React.useState<TData[]>(data);

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTableData((data) => {
        const oldIndex = data.findIndex((item: any) => item.id === active.id);
        const newIndex = data.findIndex((item: any) => item.id === over.id);

        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
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
                  <DraggableRow<TData> key={row.id} row={row} />
                ))}
              </SortableContext>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không tìm thấy khách hàng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
      <div className="flex items-center justify-between border-t px-4 py-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
          {table.getFilteredRowModel().rows.length} khách hàng.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Số dòng mỗi trang
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
    </div>
  );
}

interface CustomerTableProps {
  data: Customer[];
}

export function CustomerTable({ data: initialData }: CustomerTableProps) {
  const [data, _setData] = React.useState(() => initialData);
  const [searchValue, setSearchValue] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const handleCall = (customer: Customer) => {
    if (customer.phone) {
      toast.success(`Gọi điện thoại: ${customer.phone}`);
    } else {
      toast.error("Không có số điện thoại");
    }
  };

  const handleEmail = (customer: Customer) => {
    if (customer.email) {
      toast.success(`Gửi email đến: ${customer.email}`);
    } else {
      toast.error("Không có địa chỉ email");
    }
  };

  const columns: ColumnDef<Customer>[] = [
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
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
      header: "Tên khách hàng",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("email") || "—"}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("phone") || "—"}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
            {customer.address || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-sm">{date.toLocaleDateString("vi-VN")}</div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <div className="flex items-center justify-start space-x-2">
            <CustomerModal
              customer={customer}
              mode="edit"
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Chỉnh sửa khách hàng"
                  data-testid="edit-customer-button"
                >
                  <IconEdit className="h-5 w-5" />
                  <span className="sr-only">Chỉnh sửa</span>
                </Button>
              }
              onSuccess={() => window.location.reload()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCall(customer)}
              className="h-8 w-8 p-0"
              disabled={!customer.phone}
              aria-label="Gọi điện thoại"
              data-testid="call-customer-button"
            >
              <IconPhone className="h-5 w-5" />
              <span className="sr-only">Gọi điện thoại</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEmail(customer)}
              className="h-8 w-8 p-0"
              disabled={!customer.email}
              aria-label="Gửi email"
              data-testid="email-customer-button"
            >
              <IconMail className="h-5 w-5" />
              <span className="sr-only">Gửi email</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const search = searchValue.toLowerCase();

      return name.includes(search);
    });
  }, [data, searchValue]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs
      defaultValue="customers-list"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="customers-list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customers-list">Danh sách khách hàng</SelectItem>
            <SelectItem value="segmentation">Phân loại khách hàng</SelectItem>
            <SelectItem value="communications">Liên hệ</SelectItem>
            <SelectItem value="reports">Báo cáo</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="customers-list">Danh sách khách hàng</TabsTrigger>
          <TabsTrigger value="segmentation">
            Phân loại khách hàng <Badge variant="secondary">8</Badge>
          </TabsTrigger>
          <TabsTrigger value="communications">
            Liên hệ <Badge variant="secondary">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
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
          <CustomerModal
            mode="add"
            trigger={
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Thêm khách hàng</span>
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
          <AddSampleCustomersButton
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>
      <TabsContent
        value="customers-list"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          searchValue={searchValue}
          sensors={sensors}
          sortableId={sortableId}
          dataIds={dataIds}
        />
      </TabsContent>
      <TabsContent
        value="segmentation"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Phân loại khách hàng</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Phân chia khách hàng theo nhóm, độ ưu tiên và giá trị giao dịch.
            </p>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="communications"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Liên hệ</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Quản lý lịch sử liên hệ, gửi email hàng loạt và thông báo.
            </p>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="reports"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Báo cáo</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Báo cáo về hoạt động khách hàng, độ hài lòng và xu hướng mua hàng.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface CustomerModalProps {
  customer?: z.infer<typeof customerSchema>;
  mode: "add" | "edit";
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

function CustomerModal({
  customer,
  mode,
  trigger,
  onSuccess,
}: CustomerModalProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // tRPC mutations
  const createCustomerMutation = trpc.customers.createCustomer.useMutation({
    onSuccess: () => {
      toast.success("Tạo khách hàng thành công");
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Tạo khách hàng thất bại");
    },
  });

  const updateCustomerMutation = trpc.customers.updateCustomer.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật khách hàng thành công");
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Cập nhật khách hàng thất bại");
    },
  });

  const isLoading =
    createCustomerMutation.status === "pending" ||
    updateCustomerMutation.status === "pending";

  // Reset form when modal opens or mode/customer changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: customer?.name || "",
        phone: customer?.phone || "",
        email: customer?.email || "",
        address: customer?.address || "",
      });
    }
  }, [open, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    if (mode === "add") {
      createCustomerMutation.mutate({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
      });
    } else if (customer) {
      updateCustomerMutation.mutate({
        id: customer.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
      });
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
            {mode === "add" ? "Thêm khách hàng mới" : customer?.name}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "add"
              ? "Tạo khách hàng mới với thông tin bắt buộc."
              : "Chi tiết khách hàng và các tùy chọn quản lý"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Tên khách hàng *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên khách hàng"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Nhập số điện thoại"
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
                placeholder="Nhập địa chỉ email (tùy chọn)"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Nhập địa chỉ (tùy chọn)"
                rows={3}
              />
            </div>
            {mode === "edit" && customer && (
              <>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">
                        ID Khách hàng
                      </Label>
                      <div className="font-mono text-xs">{customer.id}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Ngày tạo</Label>
                      <div>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Cập nhật</Label>
                      <div>
                        {new Date(customer.updated_at).toLocaleDateString()}
                      </div>
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
                ? "Tạo khách hàng"
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

function AddSampleCustomersButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const createCustomerMutation = trpc.customers.createCustomer.useMutation({
    onSuccess: () => {
      // Success handled in batch operation
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi tạo khách hàng mẫu");
    },
  });

  // Vietnamese names data
  const lastNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
  ];
  const middleNames = [
    "Văn",
    "Thị",
    "Minh",
    "Hoàng",
    "Đức",
    "Anh",
    "Thu",
    "Hồng",
    "Quốc",
    "Thanh",
    "Tuấn",
    "Hải",
    "Mai",
    "Lan",
  ];
  const firstNames = [
    "An",
    "Bình",
    "Cường",
    "Dũng",
    "Hà",
    "Hùng",
    "Linh",
    "Long",
    "Mai",
    "Nam",
    "Phong",
    "Quân",
    "Tâm",
    "Thảo",
    "Tú",
    "Uyên",
    "Vân",
    "Xuân",
    "Yến",
  ];

  const streets = [
    "Nguyễn Huệ",
    "Lê Lợi",
    "Trần Hưng Đạo",
    "Hai Bà Trưng",
    "Lý Thường Kiệt",
    "Phan Bội Châu",
    "Điện Biên Phủ",
    "Võ Văn Tần",
    "Pasteur",
    "Cách Mạng Tháng 8",
  ];
  const districts = [
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 5",
    "Quận 7",
    "Quận 10",
    "Bình Thạnh",
    "Tân Bình",
    "Phú Nhuận",
    "Gò Vấp",
  ];
  const cities = [
    "TP. Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
  ];

  const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

  const normalizeVietnamese = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const generateSampleCustomers = () => {
    const customers = [];
    for (let i = 0; i < 500; i++) {
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const middleName =
        middleNames[Math.floor(Math.random() * middleNames.length)];
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const fullName = `${lastName} ${middleName} ${firstName}`;

      const phone = `0${Math.floor(Math.random() * 900000000) + 100000000}`;
      const hasEmail = Math.random() > 0.3; // 70% have email
      const email = hasEmail
        ? `${normalizeVietnamese(lastName)}${normalizeVietnamese(firstName)}${Math.floor(Math.random() * 1000)}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`
        : undefined;

      const hasAddress = Math.random() > 0.2; // 80% have address
      const address = hasAddress
        ? `${Math.floor(Math.random() * 500) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, ${districts[Math.floor(Math.random() * districts.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`
        : undefined;

      customers.push({
        name: fullName,
        phone,
        email,
        address,
      });
    }
    return customers;
  };

  const handleAddSampleCustomers = async () => {
    setIsLoading(true);

    try {
      const sampleCustomers = generateSampleCustomers();
      let successCount = 0;
      const totalCustomers = sampleCustomers.length;

      for (const customer of sampleCustomers) {
        try {
          await createCustomerMutation.mutateAsync(customer);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to create sample customer: ${customer.name}`,
            error,
          );
        }
      }

      if (successCount === totalCustomers) {
        toast.success(`Đã thêm thành công ${successCount} khách hàng mẫu`);
      } else if (successCount > 0) {
        toast.success(
          `Đã thêm thành công ${successCount}/${totalCustomers} khách hàng mẫu`,
        );
      } else {
        toast.error("Không thể thêm khách hàng mẫu nào");
      }

      if (successCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Lỗi khi thêm khách hàng mẫu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddSampleCustomers}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      <IconDatabase className="h-4 w-4" />
      <span className="hidden lg:inline">
        {isLoading ? "Đang thêm..." : "Thêm 500 mẫu"}
      </span>
    </Button>
  );
}
