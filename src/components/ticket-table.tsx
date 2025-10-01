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
  IconEdit,
  IconEye,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconUserCheck,
  IconDotsVertical,
  IconRefresh,
  IconCheck,
  IconClock,
  IconX,
  IconMessageCircle,
  IconPhoto,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { STATUS_FLOW } from "@/lib/constants/ticket-status";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { QuickCommentModal } from "@/components/quick-comment-modal";
import { QuickUploadImagesModal } from "@/components/quick-upload-images-modal";

const ticketStatusEnum = z.enum(["open", "in_progress", "resolved", "closed"]);
const ticketPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const ticketSchema = z.object({
  id: z.string(),
  ticket_number: z.string(),
  customer_id: z.string(),
  customer_name: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  assigned_to: z.string().nullable(),
  assigned_to_name: z.string().nullable(),
  estimated_total: z.number().nullable(),
  actual_total: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
});

export type Ticket = z.infer<typeof ticketSchema>;

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
      <span className="sr-only">Drag to reorder</span>
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}

interface TicketTableProps {
  data: Ticket[];
}

export function TicketTable({ data: initialData }: TicketTableProps) {
  const router = useRouter();
  const [data, setData] = React.useState(() => initialData);
  const [searchValue, setSearchValue] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [commentModalOpen, setCommentModalOpen] = React.useState(false);
  const [selectedTicketForComment, setSelectedTicketForComment] = React.useState<{ id: string; ticket_number: string } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [selectedTicketForUpload, setSelectedTicketForUpload] = React.useState<{ id: string; ticket_number: string } | null>(null);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const updateStatusMutation = trpc.tickets.updateTicketStatus.useMutation({
    onSuccess: (result, variables) => {
      toast.success("Cập nhật trạng thái thành công");

      // Optimistically update the UI
      setData((prevData) =>
        prevData.map((ticket) =>
          ticket.id === variables.id
            ? {
                ...ticket,
                status: mapDatabaseStatusToUI(variables.status),
              }
            : ticket
        )
      );

      // Also refresh from server
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Helper to map database status back to UI status
  const mapDatabaseStatusToUI = (dbStatus: string): "open" | "in_progress" | "resolved" | "closed" => {
    switch (dbStatus) {
      case "pending":
        return "open";
      case "in_progress":
        return "in_progress";
      case "completed":
        return "resolved";
      case "cancelled":
        return "closed";
      default:
        return "open";
    }
  };

  // Helper to map UI status to database status
  const mapUIStatusToDatabase = (uiStatus: string): "pending" | "in_progress" | "completed" | "cancelled" => {
    switch (uiStatus) {
      case "open":
        return "pending";
      case "in_progress":
        return "in_progress";
      case "resolved":
        return "completed";
      case "closed":
        return "cancelled";
      default:
        return "pending";
    }
  };

  // Get valid next statuses for a ticket
  const getValidNextStatuses = (currentStatus: string): Array<"pending" | "in_progress" | "completed" | "cancelled"> => {
    const dbStatus = mapUIStatusToDatabase(currentStatus);
    const statusFlow = STATUS_FLOW[dbStatus as keyof typeof STATUS_FLOW];
    return [...(statusFlow?.next || [])] as Array<"pending" | "in_progress" | "completed" | "cancelled">;
  };

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Chưa có phiếu dịch vụ nào</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Tạo phiếu dịch vụ đầu tiên để bắt đầu quản lý công việc.
          </p>
          <Button onClick={() => router.push('/tickets/add')}>
            <IconPlus className="h-4 w-4" />
            Tạo phiếu dịch vụ
          </Button>
        </div>
      </div>
    );
  }

  const handleView = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleEdit = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}/edit`);
  };

  const handleAssign = (ticket: Ticket) => {
    toast.success(`Phân công phiếu dịch vụ: ${ticket.ticket_number}`);
    // TODO: Implement reassign dialog
  };

  const handleComment = (ticket: Ticket) => {
    setSelectedTicketForComment({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
    });
    setCommentModalOpen(true);
  };

  const handleUploadImages = (ticket: Ticket) => {
    setSelectedTicketForUpload({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
    });
    setUploadModalOpen(true);
  };

  const handleStatusChange = (ticketId: string, newStatus: "pending" | "in_progress" | "completed" | "cancelled") => {
    updateStatusMutation.mutate({
      id: ticketId,
      status: newStatus,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IconClock className="h-4 w-4 mr-2" />;
      case "in_progress":
        return <IconRefresh className="h-4 w-4 mr-2" />;
      case "completed":
        return <IconCheck className="h-4 w-4 mr-2" />;
      case "cancelled":
        return <IconX className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: "Mới", variant: "destructive" as const },
      in_progress: { label: "Đang xử lý", variant: "default" as const },
      resolved: { label: "Đã giải quyết", variant: "secondary" as const },
      closed: { label: "Đã đóng", variant: "outline" as const },
    };
    const statusConfig =
      statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: "Thấp", className: "bg-gray-100 text-gray-800" },
      medium: {
        label: "Trung bình",
        className: "bg-yellow-100 text-yellow-800",
      },
      high: { label: "Cao", className: "bg-orange-100 text-orange-800" },
      urgent: { label: "Khẩn cấp", className: "bg-red-100 text-red-800" },
    };
    const priorityConfig =
      priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${priorityConfig.className}`}
      >
        {priorityConfig.label}
      </span>
    );
  };

  const columns: ColumnDef<Ticket>[] = [
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
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "ticket_number",
      header: "Số ticket",
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.getValue("ticket_number")}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "customer_name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("customer_name")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "priority",
      header: "Độ ưu tiên",
      cell: ({ row }) => getPriorityBadge(row.getValue("priority")),
    },
    {
      accessorKey: "assigned_to_name",
      header: "Được phân công",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue("assigned_to_name") || "Chưa phân công"}
        </div>
      ),
    },
    {
      accessorKey: "estimated_total",
      header: "Ước tính",
      cell: ({ row }) => {
        const total = row.getValue("estimated_total") as number | null;
        return (
          <div className="text-sm">
            {total ? `${total.toLocaleString("vi-VN")} ₫` : "—"}
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
        const ticket = row.original;

        return (
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(ticket)}
              className="h-8 w-8 p-0"
            >
              <IconEye className="h-5 w-5" />
              <span className="sr-only">Xem chi tiết</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(ticket)}
              className="h-8 w-8 p-0"
            >
              <IconEdit className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <IconDotsVertical className="h-5 w-5" />
                  <span className="sr-only">Thao tác khác</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <IconRefresh className="h-4 w-4 mr-2" />
                    Đổi trạng thái
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(() => {
                      const validNextStatuses = getValidNextStatuses(ticket.status);
                      const statusOptions: Array<{ value: "pending" | "in_progress" | "completed" | "cancelled", icon: string, label: string }> = [
                        { value: "pending", icon: "pending", label: "Chờ xử lý" },
                        { value: "in_progress", icon: "in_progress", label: "Đang xử lý" },
                        { value: "completed", icon: "completed", label: "Hoàn thành" },
                        { value: "cancelled", icon: "cancelled", label: "Đã hủy" },
                      ];

                      const filteredOptions = statusOptions.filter(option =>
                        validNextStatuses.includes(option.value)
                      );

                      if (filteredOptions.length === 0) {
                        return (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Không thể thay đổi trạng thái
                          </div>
                        );
                      }

                      return filteredOptions.map(option => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleStatusChange(ticket.id, option.value)}
                        >
                          {getStatusIcon(option.icon)}
                          {option.label}
                        </DropdownMenuItem>
                      ));
                    })()}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleComment(ticket)}>
                  <IconMessageCircle className="h-4 w-4 mr-2" />
                  Thêm bình luận
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUploadImages(ticket)}>
                  <IconPhoto className="h-4 w-4 mr-2" />
                  Tải ảnh lên
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAssign(ticket)}>
                  <IconUserCheck className="h-4 w-4 mr-2" />
                  Phân công lại
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleView(ticket)}>
                  <IconEye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(ticket)}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const ticketNumber = item.ticket_number?.toLowerCase() || "";
      const customerName = item.customer_name?.toLowerCase() || "";
      const title = item.title?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      const search = searchValue.toLowerCase();

      return (
        ticketNumber.includes(search) ||
        customerName.includes(search) ||
        title.includes(search) ||
        description.includes(search)
      );
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
      defaultValue="tickets-list"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="tickets-list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tickets-list">Danh sách ticket</SelectItem>
            <SelectItem value="workflow">Quy trình xử lý</SelectItem>
            <SelectItem value="analytics">Phân tích</SelectItem>
            <SelectItem value="reports">Báo cáo</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="tickets-list">Danh sách ticket</TabsTrigger>
          <TabsTrigger value="workflow">
            Quy trình xử lý <Badge variant="secondary">6</Badge>
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Phân tích <Badge variant="secondary">15</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
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
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Tạo ticket</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="tickets-list"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo số ticket, khách hàng, tiêu đề hoặc mô tả..."
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
        value="workflow"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Quy trình xử lý</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Theo dõi quy trình xử lý ticket từ tiếp nhận đến hoàn thành.
            </p>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="analytics"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Phân tích</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Phân tích hiệu suất xử lý, thời gian phản hồi và độ hài lòng khách
              hàng.
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
              Báo cáo chi tiết về hoạt động dịch vụ, doanh thu và xu hướng.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Quick Comment Modal */}
      {selectedTicketForComment && (
        <QuickCommentModal
          open={commentModalOpen}
          onOpenChange={setCommentModalOpen}
          ticketId={selectedTicketForComment.id}
          ticketNumber={selectedTicketForComment.ticket_number}
        />
      )}

      {/* Quick Upload Images Modal */}
      {selectedTicketForUpload && (
        <QuickUploadImagesModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          ticketId={selectedTicketForUpload.id}
          ticketNumber={selectedTicketForUpload.ticket_number}
        />
      )}
    </Tabs>
  );
}
