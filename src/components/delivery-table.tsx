"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconDotsVertical,
  IconEye,
  IconLayoutColumns,
  IconPackage,
} from "@tabler/icons-react";
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
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { z } from "zod";
import { DeliveryConfirmationModal } from "@/components/modals/delivery-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";

// Schema for delivery ticket
export const deliveryTicketSchema = z.object({
  id: z.string(),
  ticket_number: z.string(),
  customer_id: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  product_name: z.string().nullable(),
  completed_at: z.string().nullable(),
  assigned_to: z.string().nullable(),
  assigned_to_name: z.string().nullable(),
});

export type DeliveryTicket = z.infer<typeof deliveryTicketSchema>;

// Column labels for visibility dropdown
const COLUMN_LABELS: Record<string, string> = {
  ticket_number: "Mã phiếu",
  customer_name: "Khách hàng",
  product_name: "Sản phẩm",
  completed_at: "Hoàn thành",
  assigned_to_name: "Người phụ trách",
  actions: "Thao tác",
};

interface DeliveryTableProps {
  data: DeliveryTicket[];
  total: number;
  onRefresh?: () => void;
}

export function DeliveryTable({
  data: initialData,
  total,
  onRefresh,
}: DeliveryTableProps) {
  const router = useRouter();
  const [data, setData] = React.useState(() => initialData);
  const [searchValue, setSearchValue] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Modal state
  const [selectedTicket, setSelectedTicket] =
    React.useState<DeliveryTicket | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleConfirmDelivery = React.useCallback((ticket: DeliveryTicket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  }, []);

  const handleModalClose = React.useCallback(() => {
    setShowModal(false);
    setSelectedTicket(null);
    onRefresh?.();
  }, [onRefresh]);

  const columns: ColumnDef<DeliveryTicket>[] = React.useMemo(
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
        header: "Mã phiếu",
        cell: ({ row }) => {
          const ticket = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/operations/tickets/${ticket.id}`}
                className="font-mono text-sm font-medium hover:underline"
              >
                {row.getValue("ticket_number")}
              </Link>
              <Badge variant="secondary" className="text-xs">
                <IconCheck className="h-3 w-3 mr-1" />
                Sẵn sàng
              </Badge>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "customer_name",
        header: "Khách hàng",
        cell: ({ row }) => {
          const ticket = row.original;
          return (
            <div>
              <div className="font-medium">{ticket.customer_name || "—"}</div>
              {ticket.customer_phone && (
                <div className="text-sm text-muted-foreground">
                  {ticket.customer_phone}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "product_name",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">
            {row.getValue("product_name") || "—"}
          </div>
        ),
      },
      {
        accessorKey: "completed_at",
        header: "Hoàn thành",
        cell: ({ row }) => {
          const completedAt = row.getValue("completed_at") as string | null;
          if (!completedAt) {
            return <span className="text-muted-foreground">—</span>;
          }

          return (
            <div className="text-sm">
              {formatDistanceToNow(new Date(completedAt), {
                addSuffix: true,
                locale: vi,
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "assigned_to_name",
        header: "Người phụ trách",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue("assigned_to_name") || (
              <span className="text-muted-foreground">Chưa phân công</span>
            )}
          </div>
        ),
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
              >
                <IconEye className="h-5 w-5" />
                <span className="sr-only">Xem chi tiết</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Thao tác khác"
                  >
                    <IconDotsVertical className="h-5 w-5" />
                    <span className="sr-only">Thao tác khác</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/operations/tickets/${ticket.id}`)
                    }
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleConfirmDelivery(ticket)}
                  >
                    <IconCheck className="h-4 w-4 mr-2" />
                    Xác nhận giao hàng
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, handleConfirmDelivery],
  );

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const ticketNumber = item.ticket_number?.toLowerCase() || "";
      const customerName = item.customer_name?.toLowerCase() || "";
      const customerPhone = item.customer_phone?.toLowerCase() || "";
      const search = searchValue.toLowerCase();

      return (
        ticketNumber.includes(search) ||
        customerName.includes(search) ||
        customerPhone.includes(search)
      );
    });
  }, [data, searchValue]);

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

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <IconAlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mt-4 text-lg font-semibold">
            Không có phiếu chờ giao hàng
          </h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Tất cả các phiếu dịch vụ đã hoàn thành đều đã được xác nhận giao
            hàng
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <IconPackage className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{total} phiếu chờ giao</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
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
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 lg:px-6">
        <Input
          placeholder="Tìm theo mã phiếu, tên hoặc SĐT khách hàng..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border mx-4 lg:mx-6">
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

      {/* Footer with selection info and pagination */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} đã chọn /{" "}
          {table.getFilteredRowModel().rows.length} phiếu
        </div>
        <TablePagination table={table} labelId="rows-per-page-deliveries" />
      </div>

      {/* Delivery Confirmation Modal */}
      {selectedTicket && (
        <DeliveryConfirmationModal
          open={showModal}
          onOpenChange={handleModalClose}
          ticket={{
            id: selectedTicket.id,
            ticket_number: selectedTicket.ticket_number,
            customer: {
              name: selectedTicket.customer_name || "Không có tên",
              phone: selectedTicket.customer_phone || "",
            },
            product: {
              name: selectedTicket.product_name || "Không có sản phẩm",
            },
          }}
        />
      )}
    </div>
  );
}
