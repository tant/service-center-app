"use client";

import {
  IconChevronDown,
  IconEdit,
  IconEye,
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
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { TablePagination } from "@/components/ui/table-pagination";
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
import Link from "next/link";

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

// Constants
const STATUS_MAP = {
  open: { label: "Mới", variant: "pending" as const },
  in_progress: { label: "Đang xử lý", variant: "processing" as const },
  resolved: { label: "Đã giải quyết", variant: "resolved" as const },
  closed: { label: "Đã đóng", variant: "closed" as const },
};

const PRIORITY_MAP = {
  low: { label: "Thấp", className: "bg-gray-100 text-gray-800" },
  medium: { label: "Trung bình", className: "bg-yellow-100 text-yellow-800" },
  high: { label: "Cao", className: "bg-orange-100 text-orange-800" },
  urgent: { label: "Khẩn cấp", className: "bg-red-100 text-red-800" },
};

const STATUS_ICONS = {
  pending: IconClock,
  in_progress: IconRefresh,
  completed: IconCheck,
  cancelled: IconX,
};

const STATUS_OPTIONS = [
  { value: "pending" as const, icon: "pending", label: "Chờ xử lý" },
  { value: "in_progress" as const, icon: "in_progress", label: "Đang xử lý" },
  { value: "completed" as const, icon: "completed", label: "Hoàn thành" },
  { value: "cancelled" as const, icon: "cancelled", label: "Đã hủy" },
];

// Status mappings
const STATUS_DB_TO_UI: Record<string, Ticket["status"]> = {
  pending: "open",
  in_progress: "in_progress",
  completed: "resolved",
  cancelled: "closed",
};

const STATUS_UI_TO_DB: Record<string, string> = {
  open: "pending",
  in_progress: "in_progress",
  resolved: "completed",
  closed: "cancelled",
};

// Column labels for visibility dropdown
const COLUMN_LABELS: Record<string, string> = {
  customer_name: "Khách hàng",
  title: "Tiêu đề",
  status: "Trạng thái",
  priority: "Độ ưu tiên",
  assigned_to_name: "Được phân công",
  estimated_total: "Ước tính",
  created_at: "Ngày tạo",
  actions: "Thao tác",
};

// Helper functions
function getStatusIcon(status: string) {
  const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
  return Icon ? <Icon className="h-4 w-4 mr-2" /> : null;
}

function getStatusBadge(status: string) {
  const statusConfig =
    STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.open;
  return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
}

function getPriorityBadge(priority: string) {
  const priorityConfig =
    PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP] || PRIORITY_MAP.medium;
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md ${priorityConfig.className}`}
    >
      {priorityConfig.label}
    </span>
  );
}

// Empty tab content component
function EmptyTabContent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
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
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [commentModalOpen, setCommentModalOpen] = React.useState(false);
  const [selectedTicketForComment, setSelectedTicketForComment] =
    React.useState<{ id: string; ticket_number: string } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [selectedTicketForUpload, setSelectedTicketForUpload] = React.useState<{
    id: string;
    ticket_number: string;
  } | null>(null);

  // Get current user and all users for assignment
  const { data: currentUser } = trpc.profile.getCurrentUser.useQuery();
  const { data: allUsers } = trpc.profile.getAllUsers.useQuery();

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const updateTicketMutation = trpc.tickets.updateTicket.useMutation({
    onSuccess: (_result, _variables) => {
      toast.success("Cập nhật phiếu dịch vụ thành công");

      // Refresh from server since the mutation and table use different schemas
      router.refresh();
    },
    onError: (error) => {
      console.error("[TicketTable] Update ticket error:", error);
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.tickets.updateTicketStatus.useMutation({
    onSuccess: (_result, _variables) => {
      toast.success("Cập nhật trạng thái thành công");

      // Refresh from server to get updated data
      router.refresh();
    },
    onError: (error) => {
      console.error("[TicketTable] Update status error:", {
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Helper to map database status back to UI status
  const _mapDatabaseStatusToUI = (
    dbStatus: string,
  ): "open" | "in_progress" | "resolved" | "closed" => {
    return STATUS_DB_TO_UI[dbStatus] || "open";
  };

  // Helper to map UI status to database status
  const mapUIStatusToDatabase = (
    uiStatus: string,
  ): "pending" | "in_progress" | "completed" | "cancelled" => {
    return (STATUS_UI_TO_DB[uiStatus] || "pending") as
      | "pending"
      | "in_progress"
      | "completed"
      | "cancelled";
  };

  // Get valid next statuses for a ticket
  const getValidNextStatuses = (
    currentStatus: string,
  ): Array<"pending" | "in_progress" | "completed" | "cancelled"> => {
    const dbStatus = mapUIStatusToDatabase(currentStatus);
    const statusFlow = STATUS_FLOW[dbStatus as keyof typeof STATUS_FLOW];
    return [...(statusFlow?.next || [])] as Array<
      "pending" | "in_progress" | "completed" | "cancelled"
    >;
  };

  /**
   * Renders the status options dropdown menu items based on the current ticket status
   * @param currentStatus - Current status of the ticket
   * @param ticketId - ID of the ticket
   * @param onStatusChange - Callback function when status is changed
   * @param getIcon - Function to get the icon component for a status
   * @returns JSX element containing the dropdown menu items or "no change possible" message
   */
  const renderStatusOptions = (
    currentStatus: string,
    ticketId: string,
    onStatusChange: (
      id: string,
      status: "pending" | "in_progress" | "completed" | "cancelled",
    ) => void,
    getIcon: (status: string) => React.ReactNode,
  ) => {
    const validNextStatuses = getValidNextStatuses(currentStatus);
    const filteredOptions = STATUS_OPTIONS.filter((option) =>
      validNextStatuses.includes(option.value),
    );

    if (filteredOptions.length === 0) {
      return (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          Không thể thay đổi trạng thái
        </div>
      );
    }

    return filteredOptions.map((option) => (
      <DropdownMenuItem
        key={option.value}
        onClick={() => onStatusChange(ticketId, option.value)}
        data-role={`change-status-${option.value}`}
      >
        {getIcon(option.icon)}
        {option.label}
      </DropdownMenuItem>
    ));
  };

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">
            Chưa có phiếu dịch vụ nào
          </h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Tạo phiếu dịch vụ đầu tiên để bắt đầu quản lý công việc.
          </p>
          <Button onClick={() => router.push("/operations/tickets/add")}>
            <IconPlus className="h-4 w-4" />
            Tạo phiếu dịch vụ
          </Button>
        </div>
      </div>
    );
  }

  const handleAssignToMe = (ticket: Ticket) => {
    if (!currentUser) {
      toast.error("Không thể xác định người dùng hiện tại");
      return;
    }

    updateTicketMutation.mutate({
      id: ticket.id,
      assigned_to: currentUser.user_id,
    });
  };

  const handleAssignTo = (ticket: Ticket, userId: string) => {
    updateTicketMutation.mutate({
      id: ticket.id,
      assigned_to: userId,
    });
  };

  const handleUnassign = (ticket: Ticket) => {
    updateTicketMutation.mutate({
      id: ticket.id,
      assigned_to: null,
    });
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

  const handleStatusChange = (
    ticketId: string,
    newStatus: "pending" | "in_progress" | "completed" | "cancelled",
  ) => {
    updateStatusMutation.mutate({
      id: ticketId,
      status: newStatus,
    });
  };

  const columns: ColumnDef<Ticket>[] = React.useMemo(
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
                onClick={() => router.push(`/operations/tickets/${ticket.id}`)}
                className="h-8 w-8 p-0"
                aria-label="Xem chi tiết"
                data-testid={`view-ticket-${ticket.id}`}
              >
                <IconEye className="h-5 w-5" />
                <span className="sr-only">Xem chi tiết</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/operations/tickets/${ticket.id}/edit`)}
                className="h-8 w-8 p-0"
                aria-label="Chỉnh sửa"
                data-testid={`edit-ticket-${ticket.id}`}
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
                    aria-label="Thao tác khác"
                    data-testid={`more-actions-${ticket.id}`}
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
                      {renderStatusOptions(
                        ticket.status,
                        ticket.id,
                        handleStatusChange,
                        getStatusIcon,
                      )}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleAssignToMe(ticket)}
                    disabled={
                      !currentUser ||
                      ticket.assigned_to === currentUser?.user_id
                    }
                    data-testid={`assign-to-me-${ticket.id}`}
                  >
                    <IconUserCheck className="h-4 w-4 mr-2" />
                    Phân công cho tôi
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <IconUserCheck className="h-4 w-4 mr-2" />
                      Phân công cho
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-[200px] overflow-y-auto">
                      {allUsers && allUsers.length > 0 ? (
                        <>
                          {allUsers.map((user) => (
                            <DropdownMenuItem
                              key={user.user_id}
                              onClick={() =>
                                handleAssignTo(ticket, user.user_id)
                              }
                              disabled={ticket.assigned_to === user.user_id}
                              data-testid={`assign-to-${user.user_id}`}
                            >
                              {user.full_name}
                              {ticket.assigned_to === user.user_id && " ✓"}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleUnassign(ticket)}
                            disabled={!ticket.assigned_to}
                          >
                            Hủy phân công
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Không có người dùng
                        </div>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      router,
      currentUser,
      allUsers,
      renderStatusOptions,
      handleStatusChange,
      handleComment,
      handleUploadImages,
      handleAssignToMe,
      handleAssignTo,
      handleUnassign,
    ],
  );

  const filteredData = React.useMemo(() => {
    // Lọc và cập nhật assigned_to_name từ assigned_to ID
    const dataWithAssignedNames = data.map((item) => {
      let assignedUserName = item.assigned_to_name;

      // Nếu có assigned_to nhưng chưa có assigned_to_name, tìm tên từ allUsers
      if (item.assigned_to && !assignedUserName && allUsers) {
        const assignedUser = allUsers.find(
          (user) => user.user_id === item.assigned_to,
        );
        assignedUserName = assignedUser?.full_name || null;
      }

      return {
        ...item,
        assigned_to_name: assignedUserName,
      };
    });

    // Áp dụng bộ lọc tìm kiếm
    return dataWithAssignedNames.filter((item) => {
      const ticketNumber = item.ticket_number?.toLowerCase() || "";
      const customerName = item.customer_name?.toLowerCase() || "";
      const search = searchValue.toLowerCase();

      return ticketNumber.includes(search) || customerName.includes(search);
    });
  }, [data, searchValue, allUsers]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tickets-list">Danh sách phiếu</SelectItem>
            <SelectItem value="workflow">Quy trình xử lý</SelectItem>
            <SelectItem value="analytics">Phân tích</SelectItem>
            <SelectItem value="reports">Báo cáo</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="tickets-list">Danh sách phiếu</TabsTrigger>
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
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {COLUMN_LABELS[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/operations/tickets/add">
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Tạo phiếu</span>
            </Button>
          </Link>
        </div>
      </div>
      <TabsContent
        value="tickets-list"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo số ticket hoặc khách hàng..."
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
                    Không tìm thấy phiếu dịch vụ.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} đã chọn{" "}
            {table.getFilteredRowModel().rows.length} phiếu.
          </div>
          <TablePagination table={table} labelId="rows-per-page-tickets" />
        </div>
      </TabsContent>
      <TabsContent
        value="workflow"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <EmptyTabContent
          title="Quy trình xử lý"
          description="Theo dõi quy trình xử lý ticket từ tiếp nhận đến hoàn thành."
        />
      </TabsContent>
      <TabsContent
        value="analytics"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <EmptyTabContent
          title="Phân tích"
          description="Phân tích hiệu suất xử lý, thời gian phản hồi và độ hài lòng khách hàng."
        />
      </TabsContent>
      <TabsContent
        value="reports"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <EmptyTabContent
          title="Báo cáo"
          description="Báo cáo chi tiết về hoạt động dịch vụ, doanh thu và xu hướng."
        />
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
