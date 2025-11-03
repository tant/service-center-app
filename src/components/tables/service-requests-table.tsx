/**
 * Story 1.13: Service Requests Table
 * AC 2, 3: Staff request queue with quick actions
 * Following FRONTEND_GUIDE.md standards
 */

"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEye,
  IconLayoutColumns,
  IconLoader,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import * as React from "react";
import { ConfirmIncomingModal } from "@/components/modals/confirm-incoming-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { usePendingIncomingRequests } from "@/hooks/use-service-request";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Schema
export const serviceRequestSchema = z.object({
  id: z.string(),
  tracking_token: z.string(),
  customer_name: z.string(),
  customer_email: z.string().nullable(),
  customer_phone: z.string(),
  product_brand: z.string().nullable(),
  product_model: z.string(),
  serial_number: z.string().nullable(),
  issue_description: z.string(),
  status: z.enum(["draft", "submitted", "pickingup", "received", "processing", "completed", "cancelled"]),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  linked_ticket_id: z.string().nullable(),
});

export type ServiceRequest = z.infer<typeof serviceRequestSchema>;

// Status mapping
const STATUS_MAP = {
  draft: { label: "Nháp", variant: "outline" as const },
  submitted: { label: "Đã gửi", variant: "secondary" as const },
  pickingup: { label: "Chờ lấy hàng", variant: "secondary" as const },
  received: { label: "Đã tiếp nhận", variant: "default" as const },
  processing: { label: "Đang xử lý", variant: "default" as const },
  completed: { label: "Hoàn thành", variant: "default" as const },
  cancelled: { label: "Đã hủy", variant: "destructive" as const },
};

const INTAKE_METHOD_MAP = {
  pickup: { label: "Khách mang tới", variant: "secondary" as const },
  delivery: { label: "Giao nhận", variant: "outline" as const },
};

// Column labels
const COLUMN_LABELS: Record<string, string> = {
  tracking_token: "Mã theo dõi",
  customer_name: "Khách hàng",
  items: "Sản phẩm",
  intake: "Tiếp nhận",
  status: "Trạng thái",
  created_at: "Đã gửi",
  linked_ticket: "Ticket",
};

interface ServiceRequestsTableProps {
  data: ServiceRequest[];
}

interface IncomingRequestSummary {
  id: string;
  tracking_token: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  status?: string;
  created_at: string;
  issue_description?: string | null;
  preferred_delivery_method?: "pickup" | "delivery" | null;
  delivery_address?: string | null;
  pickup_notes?: string | null;
  preferred_schedule?: string | null;
  items_count?: number | null;
  primary_item?: {
    product_brand?: string | null;
    product_model?: string | null;
    serial_number?: string | null;
  } | null;
}

export function ServiceRequestsTable({ data }: ServiceRequestsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Incoming requests tab state (status = submitted, items being shipped to center)
  const {
    data: incomingData,
    isLoading: isLoadingIncoming,
    refetch: refetchIncoming,
  } = usePendingIncomingRequests();
  const [selectedIncomingRequest, setSelectedIncomingRequest] =
    React.useState<IncomingRequestSummary | null>(null);
  const [showConfirmIncomingModal, setShowConfirmIncomingModal] =
    React.useState(false);

  const handleConfirmIncoming = (request: IncomingRequestSummary) => {
    setSelectedIncomingRequest(request);
    setShowConfirmIncomingModal(true);
  };

  const handleIncomingModalClose = () => {
    setShowConfirmIncomingModal(false);
    setSelectedIncomingRequest(null);
    refetchIncoming();
  };

  // Define columns
  const columns: ColumnDef<ServiceRequest>[] = [
    {
      accessorKey: "tracking_token",
      header: "Mã theo dõi",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("tracking_token")}</span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue("customer_name")}</p>
          {row.original.customer_email ? (
            <p className="text-xs text-muted-foreground">
              {row.original.customer_email}
            </p>
          ) : null}
          {row.original.customer_phone ? (
            <p className="text-xs text-muted-foreground">
              {row.original.customer_phone}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "items",
      accessorFn: (row) => row.item_serial_numbers[0] ?? "",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const primarySerial = row.original.primary_item?.serial_number;
        const totalItems = row.original.items_count;
        const extraCount = totalItems > 0 ? totalItems - 1 : 0;

        if (!primarySerial) {
          return (
            <span className="text-xs text-muted-foreground">
              Chưa có serial
            </span>
          );
        }

        return (
          <div className="">
            <p className="font-mono text-xs font-medium">{primarySerial}</p>
            {extraCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                +{extraCount} sản phẩm khác
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "intake",
      accessorFn: (row) => row.preferred_delivery_method,
      header: "Tiếp nhận",
      cell: ({ row }) => {
        const method = row.original.preferred_delivery_method;
        const config = INTAKE_METHOD_MAP[method] ?? INTAKE_METHOD_MAP.pickup;

        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof STATUS_MAP;
        const config = STATUS_MAP[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Đã gửi",
      cell: ({ row }) => {
        const createdValue = row.getValue("created_at");
        const date = new Date(createdValue as string);

        if (Number.isNaN(date.getTime())) {
          return (
            <span className="text-sm text-muted-foreground">
              {String(createdValue)}
            </span>
          );
        }

        return (
          <span className="text-sm text-muted-foreground">
            {format(date, "dd/MM/yyyy")}
          </span>
        );
      },
    },
    {
      id: "linked_ticket",
      accessorFn: (row) => row.linked_ticket?.ticket_number ?? "",
      header: "Ticket",
      cell: ({ row }) => {
        const ticket = row.original.linked_ticket;
        if (!ticket) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="space-y-1">
            <p className="font-medium">#{ticket.ticket_number}</p>
            <Badge variant="secondary">{ticket.status}</Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/operations/service-requests/${request.id}`}>
                <IconEye className="h-4 w-4 mr-1" />
                Xem
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Calculate stats
  const stats = {
    total: data.length,
    draft: data.filter((r) => r.status === "draft").length,
    pickingup: data.filter((r) => r.status === "pickingup").length,
    received: data.filter((r) => r.status === "received").length,
    processing: data.filter((r) => r.status === "processing").length,
    completed: data.filter((r) => r.status === "completed").length,
  };

  return (
    <Tabs
      defaultValue="service-requests"
      className="w-full flex-col justify-start gap-6"
    >
      {/* Tabs Header with Mobile Select + Desktop TabsList */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        {/* Mobile: Select Dropdown */}
        <Select defaultValue="service-requests">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service-requests">Yêu cầu dịch vụ</SelectItem>
            <SelectItem value="pending-deliveries">
              Chờ nhận hàng{" "}
              {incomingData?.total ? `(${incomingData.total})` : ""}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Desktop: Tab List */}
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="service-requests">Yêu cầu dịch vụ</TabsTrigger>
          <TabsTrigger value="pending-deliveries">
            Chờ nhận hàng
            {incomingData?.total ? (
              <Badge variant="secondary" className="ml-2">
                {incomingData.total}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Action buttons */}
        <Button variant="outline" size="sm" asChild>
          <Link href="/operations/service-requests/new">
            <IconPlus className="h-4 w-4" />
            <span className="ml-2">Tạo phiếu yêu cầu</span>
          </Link>
        </Button>
      </div>

      {/* Tab 1: Service Requests */}
      <TabsContent
        value="service-requests"
        className="relative flex flex-col gap-4"
      >
        {/* Stats Cards - Following section-cards.tsx pattern */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Tổng số yêu cầu</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.total}
              </CardTitle>
              <CardAction>
                <Badge className="bg-blue-100 text-blue-800">
                  <IconTrendingUp />
                  Tất cả
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Đã tiếp nhận</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.received}
              </CardTitle>
              <CardAction>
                <Badge className="bg-green-100 text-green-800">
                  Đã xác nhận
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Đang xử lý</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.processing}
              </CardTitle>
              <CardAction>
                <Badge className="bg-orange-100 text-orange-800">
                  Đang chuyển đổi
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.completed}
            </CardTitle>
            <CardAction>
              <Badge className="bg-green-100 text-green-800">
                Đã chuyển ticket
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

        {/* Table Section with proper padding */}
        <div className="px-4 lg:px-6">
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                {/* Search */}
                <Input
                  placeholder="Tìm kiếm yêu cầu..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="max-w-sm"
                />

                {/* Status Filter */}
                <Select
                  value={
                    (table.getColumn("status")?.getFilterValue() as string) ??
                    "all"
                  }
                  onValueChange={(value) => {
                    table
                      .getColumn("status")
                      ?.setFilterValue(value === "all" ? undefined : value);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Lọc trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="submitted">Đã gửi</SelectItem>
                    <SelectItem value="received">Đã tiếp nhận</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="rejected">Đã từ chối</SelectItem>
                    <SelectItem value="converted">Đã chuyển</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(globalFilter || columnFilters.length > 0) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setGlobalFilter("");
                      table.resetColumnFilters();
                    }}
                    size="sm"
                  >
                    Xóa bộ lọc
                    <IconX className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconLayoutColumns className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">Tùy chỉnh cột</span>
                    <span className="lg:hidden">Cột</span>
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
                          {COLUMN_LABELS[column.id] || column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Table - Following FRONTEND_GUIDE.md standards */}
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
                        Không có yêu cầu nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} đến{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              trong tổng số {table.getFilteredRowModel().rows.length} yêu cầu
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-6 lg:space-x-8">
              <div className="ml-8 flex items-center space-x-2">
                <p className="text-sm font-medium">Số dòng mỗi trang</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
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
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Trang đầu</span>
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Trang trước</span>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Trang sau</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Trang cuối</span>
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </TabsContent>

      {/* Tab 2: Pending Incoming Items */}
      <TabsContent
        value="pending-deliveries"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconPackage className="h-5 w-5 text-primary" />
              <CardTitle>Tổng quan</CardTitle>
            </div>
            <CardDescription>Hàng đang được gửi đến trung tâm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold">
                  {incomingData?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Kiện hàng chờ nhận
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incoming Requests Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Yêu cầu chờ nhận hàng</CardTitle>
              <CardDescription>
                Khách hàng đã gửi yêu cầu và đang gửi hàng đến trung tâm
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchIncoming()}
              disabled={isLoadingIncoming}
            >
              <IconRefresh
                className={cn("h-4 w-4", isLoadingIncoming && "animate-spin")}
              />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingIncoming ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Đang tải...</span>
              </div>
            ) : incomingData?.requests && incomingData.requests.length > 0 ? (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Mã theo dõi</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Địa chỉ gửi</TableHead>
                      <TableHead>Đã gửi</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomingData.requests.map((rawRequest) => {
                      const request = rawRequest as IncomingRequestSummary;
                      const primaryItem = request.primary_item ?? null;
                      const productModel =
                        primaryItem?.product_model ??
                        (request as { product_model?: string | null })
                          .product_model ??
                        "Chưa có sản phẩm";
                      const productBrand =
                        primaryItem?.product_brand ??
                        (request as { product_brand?: string | null })
                          .product_brand ??
                        null;
                      const serialNumber =
                        primaryItem?.serial_number ??
                        (request as { serial_number?: string | null })
                          .serial_number ??
                        null;
                      const itemsCount =
                        request.items_count ??
                        (request as { items_count?: number | null })
                          .items_count ??
                        (primaryItem ? 1 : 0);
                      const extraItems =
                        itemsCount && itemsCount > 1 ? itemsCount - 1 : 0;
                      const method =
                        request.preferred_delivery_method ?? "pickup";
                      const isDelivery = method === "delivery";
                      const methodLabel = isDelivery
                        ? "Giao nhận"
                        : "Khách mang tới";
                      const schedule = request.preferred_schedule ?? null;
                      const scheduleLabel = (() => {
                        if (!schedule) {
                          return null;
                        }
                        const date = new Date(schedule);
                        if (Number.isNaN(date.getTime())) {
                          return schedule;
                        }
                        return format(date, "dd/MM/yyyy");
                      })();

                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                {request.tracking_token}
                              </span>
                              <Badge variant="outline">
                                <IconPackage className="h-3 w-3 mr-1" />
                                Đang gửi
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {request.customer_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {request.customer_phone}
                              </div>
                              {request.customer_email && (
                                <div className="text-xs text-muted-foreground">
                                  {request.customer_email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{productModel}</div>
                              {productBrand ? (
                                <div className="text-sm text-muted-foreground">
                                  {productBrand}
                                </div>
                              ) : null}
                              {serialNumber ? (
                                <div className="text-xs font-mono text-muted-foreground">
                                  {serialNumber}
                                </div>
                              ) : null}
                              {extraItems > 0 ? (
                                <div className="text-xs text-muted-foreground">
                                  +{extraItems} sản phẩm khác
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{methodLabel}</p>
                              {isDelivery && request.delivery_address ? (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {request.delivery_address}
                                </p>
                              ) : null}
                              {!isDelivery && request.pickup_notes ? (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {request.pickup_notes}
                                </p>
                              ) : null}
                              {scheduleLabel ? (
                                <p className="text-xs text-muted-foreground">
                                  Ưu tiên: {scheduleLabel}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.created_at ? (
                              <div className="text-sm">
                                {formatDistanceToNow(
                                  new Date(request.created_at),
                                  {
                                    addSuffix: true,
                                    locale: vi,
                                  }
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/operations/service-requests/${request.id}`}
                                >
                                  <IconEye className="h-4 w-4 mr-1" />
                                  Xem
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmIncoming(request)}
                              >
                                <IconCheck className="h-4 w-4 mr-1" />
                                Xác nhận nhận
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconAlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Không có kiện hàng nào đang chờ
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Tất cả các yêu cầu đã được xác nhận nhận hàng hoặc chưa có yêu
                  cầu mới nào có hàng đang gửi đến
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Modals */}
      {/* Confirm Incoming Modal */}
      <ConfirmIncomingModal
        request={selectedIncomingRequest}
        open={showConfirmIncomingModal}
        onOpenChange={setShowConfirmIncomingModal}
        onSuccess={handleIncomingModalClose}
      />
    </Tabs>
  );
}
