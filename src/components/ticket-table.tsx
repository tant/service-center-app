"use client";

import {
  IconChevronDown,
  IconEdit,
  IconEye,
  IconLayoutColumns,
  IconPlus,
  IconDatabase,
  IconUserCheck,
  IconDotsVertical,
  IconRefresh,
  IconCheck,
  IconClock,
  IconX,
  IconMessageCircle,
  IconPhoto,
  IconChevronRight,
  IconChevronsRight,
  IconChevronLeft,
  IconChevronsLeft,
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


interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  searchValue,
}: DataTableProps<TData, TValue> & {
  searchValue: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data,
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

  return (
    <><div className="overflow-hidden rounded-lg border">
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
    </>
    
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
  const [isGeneratingSampleTickets, setIsGeneratingSampleTickets] = React.useState(false);

  // Get current user and all users for assignment
  const { data: currentUser } = trpc.profile.getCurrentUser.useQuery();
  const { data: allUsers } = trpc.profile.getAllUsers.useQuery();

  // Get data for sample ticket generation
  const { data: customers } = trpc.customers.getCustomers.useQuery();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: parts } = trpc.parts.getParts.useQuery();

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const createTicketMutation = trpc.tickets.createTicket.useMutation({
    onSuccess: (data) => {
      console.log("[TicketTable] Create sample ticket success:", {
        ticketId: data.ticket.id,
        ticketNumber: data.ticket.ticket_number,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      console.error("[TicketTable] Create sample ticket error:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi tạo mẫu ticket: ${error.message}`);
    },
  });

  const updateTicketMutation = trpc.tickets.updateTicket.useMutation({
    onSuccess: (result, variables) => {
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
    onSuccess: (result, variables) => {
      console.log("[TicketTable] Update status success:", {
        ticketId: variables.id,
        oldStatus: data.find(t => t.id === variables.id)?.status,
        newStatus: variables.status,
        mappedStatus: mapDatabaseStatusToUI(variables.status),
        timestamp: new Date().toISOString(),
      });
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
      console.error("[TicketTable] Update status error:", {
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
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
    onStatusChange: (id: string, status: "pending" | "in_progress" | "completed" | "cancelled") => void,
    getIcon: (status: string) => React.ReactNode
  ) => {
    const validNextStatuses = getValidNextStatuses(currentStatus);
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
        onClick={() => onStatusChange(ticketId, option.value)}
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

  const handleAddSampleTicket = async () => {
    if (isGeneratingSampleTickets) {
      return; // Prevent multiple executions
    }

    if (!customers || !products || !parts) {
      toast.error("Dữ liệu chưa tải xong, vui lòng thử lại");
      return;
    }

    if (customers.length === 0 || products.length === 0) {
      toast.error("Cần có ít nhất 1 khách hàng và 1 sản phẩm để tạo mẫu ticket");
      return;
    }

    setIsGeneratingSampleTickets(true);

    const priorityLevels = ["low", "normal", "high", "urgent"] as const;
    const warrantyTypes = ["warranty", "paid", "goodwill"] as const;
    
    const sampleDescriptions = [
      "Máy tính không khởi động được, đèn nguồn không sáng",
      "Card đồ họa bị lỗi hiển thị, xuất hiện artifacts trên màn hình", 
      "SSD bị lỗi không nhận dạng được, cần kiểm tra và thay thế",
      "RAM gặp vấn đề gây BSOD, cần test và khắc phục",
      "Mainboard có vấn đề về nguồn, cần kiểm tra kỹ thuật",
      "Quạt tản nhiệt CPU hoạt động ồn ào bất thường",
      "Nguồn máy tính bị hỏng, cần thay thế linh kiện mới",
      "Ổ cứng HDD phát ra tiếng kêu lạ, nghi ngờ bad sector",
      "USB port không hoạt động, cần kiểm tra kết nối",
      "Audio jack bị lỗi, không có tiếng ra loa hoặc tai nghe"
    ];

    console.log("[TicketTable] Starting sample ticket generation:", {
      customersCount: customers.length,
      productsCount: products.length,
      partsCount: parts.length,
      timestamp: new Date().toISOString(),
    });

    const startMessage = "Đang tạo 100 mẫu ticket...";
    toast.loading(startMessage, { id: "sample-tickets" });

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < 100; i++) {
        try {
          // Random customer
          const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
          
          // Random product
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          
          // Random priority and warranty type
          const priorityLevel = priorityLevels[Math.floor(Math.random() * priorityLevels.length)];
          const warrantyType = warrantyTypes[Math.floor(Math.random() * warrantyTypes.length)];
          
          // Random description
          const description = sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)];
          
          // Random fees (0-1000000)
          const serviceFee = Math.floor(Math.random() * 1000000);
          const diagnosisFee = Math.floor(Math.random() * 500000);
          const discountAmount = Math.floor(Math.random() * 200000);
          
          // Random parts (0-3 parts)
          const numParts = Math.floor(Math.random() * 4);
          const selectedParts: any[] = [];
          
          if (numParts > 0 && parts.length > 0) {
            const shuffledParts = [...parts].sort(() => Math.random() - 0.5);
            for (let j = 0; j < Math.min(numParts, shuffledParts.length); j++) {
              const part = shuffledParts[j];
              selectedParts.push({
                part_id: part.id,
                quantity: Math.floor(Math.random() * 5) + 1, // 1-5 quantity
                unit_price: part.price || Math.floor(Math.random() * 500000),
              });
            }
          }

          await createTicketMutation.mutateAsync({
            customer_data: {
              id: randomCustomer.id,
              name: randomCustomer.name,
              phone: randomCustomer.phone,
              email: randomCustomer.email || null,
              address: randomCustomer.address || null,
            },
            product_id: randomProduct.id,
            description: description,
            priority_level: priorityLevel,
            warranty_type: warrantyType,
            service_fee: serviceFee,
            diagnosis_fee: diagnosisFee,
            discount_amount: discountAmount,
            parts: selectedParts,
          });
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`[TicketTable] Error creating sample ticket ${i + 1}:`, error);
        }
      }

      toast.success(`Tạo thành công ${successCount} mẫu ticket${errorCount > 0 ? `, ${errorCount} lỗi` : ""}`, 
        { id: "sample-tickets" });
      
      console.log("[TicketTable] Sample ticket generation completed:", {
        successCount,
        errorCount,
        timestamp: new Date().toISOString(),
      });

      // Refresh the page to show new tickets
      router.refresh();
      
    } catch (error) {
      console.error("[TicketTable] Sample ticket generation failed:", error);
      toast.error("Lỗi khi tạo mẫu ticket", { id: "sample-tickets" });
    } finally {
      setIsGeneratingSampleTickets(false);
    }
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
      open: { label: "Mới", variant: "pending" as const },
      in_progress: { label: "Đang xử lý", variant: "processing" as const },
      resolved: { label: "Đã giải quyết", variant: "resolved" as const },
      closed: { label: "Đã đóng", variant: "closed" as const },
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
        className={`px-2 py-1 text-xs font-medium rounded-md ${priorityConfig.className}`}
      >
        {priorityConfig.label}
      </span>
    );
  };

  const columns: ColumnDef<Ticket>[] = [
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
                    {renderStatusOptions(ticket.status, ticket.id, handleStatusChange, getStatusIcon)}
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
                  disabled={!currentUser || ticket.assigned_to === currentUser?.user_id}
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
                            onClick={() => handleAssignTo(ticket, user.user_id)}
                            disabled={ticket.assigned_to === user.user_id}
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
  ];

  const filteredData = React.useMemo(() => {
    // Lọc và cập nhật assigned_to_name từ assigned_to ID
    const dataWithAssignedNames = data.map((item) => {
      let assignedUserName = item.assigned_to_name;

      // Nếu có assigned_to nhưng chưa có assigned_to_name, tìm tên từ allUsers
      if (item.assigned_to && !assignedUserName && allUsers) {
        const assignedUser = allUsers.find(user => user.user_id === item.assigned_to);
        assignedUserName = assignedUser?.full_name || null;
      }

      return {
        ...item,
        assigned_to_name: assignedUserName
      };
    });

    // Áp dụng bộ lọc tìm kiếm
    return dataWithAssignedNames.filter((item) => {
      const ticketNumber = item.ticket_number?.toLowerCase() || "";
      const customerName = item.customer_name?.toLowerCase() || "";
      const search = searchValue.toLowerCase();

      return (
        ticketNumber.includes(search) ||
        customerName.includes(search)
      );
    });
  }, [data, searchValue, allUsers]);

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
          <Link href="/tickets/add">
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Tạo phiếu</span>
            </Button>
          </Link>
            <Button 
              onClick={handleAddSampleTicket} 
              variant="outline" 
              size="sm"
              disabled={isGeneratingSampleTickets}
            >
              <IconDatabase />
              <span className="hidden lg:inline">
                {isGeneratingSampleTickets ? "Đang tạo..." : "Thêm mẫu"}
              </span>
            </Button>
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
        <DataTable
          columns={columns}
          data={filteredData}
          searchValue={searchValue}
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
