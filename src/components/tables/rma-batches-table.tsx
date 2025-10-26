"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRMABatches } from "@/hooks/use-warehouse";
import { RMA_STATUS_LABELS, RMA_STATUS_COLORS } from "@/constants/warehouse";
import { CreateRMABatchDrawer } from "@/components/drawers/create-rma-batch-drawer";

type RMAStatus = "draft" | "submitted" | "shipped" | "completed";

interface RMABatch {
  id: string;
  batch_number: string;
  supplier_name: string;
  product_count: number;
  shipping_date: string | null;
  tracking_number: string | null;
  status: RMAStatus;
  created_at: string;
  created_by: {
    full_name: string;
  } | null;
}

export function RMABatchesTable() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = React.useState<RMAStatus | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);

  const filters = React.useMemo(() => {
    const base: any = {
      limit: pageSize,
      offset: page * pageSize,
    };
    if (activeStatus !== "all") {
      base.status = activeStatus;
    }
    return base;
  }, [activeStatus, page, pageSize]);

  const { batches, total, isLoading } = useRMABatches(filters);

  // Client-side search filter
  const filteredBatches = React.useMemo(() => {
    if (!searchQuery) return batches;
    const query = searchQuery.toLowerCase();
    return batches.filter((batch: RMABatch) =>
      batch.batch_number?.toLowerCase().includes(query) ||
      batch.supplier_name?.toLowerCase().includes(query) ||
      batch.tracking_number?.toLowerCase().includes(query)
    );
  }, [batches, searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const color = RMA_STATUS_COLORS[status] || "#6B7280";
    const label = RMA_STATUS_LABELS[status] || status;

    return (
      <Badge
        variant="outline"
        style={{
          backgroundColor: `${color}15`,
          color: color,
          borderColor: `${color}40`,
        }}
      >
        {label}
      </Badge>
    );
  };

  const handleRowClick = (batchId: string) => {
    router.push(`/inventory/rma/${batchId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Tabs
      value={activeStatus}
      onValueChange={(v) => setActiveStatus(v as RMAStatus | "all")}
      className="w-full flex-col justify-start gap-6"
    >
      {/* Header Row: Tabs + Actions */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Mobile: Select Dropdown */}
        <Select
          value={activeStatus}
          onValueChange={(v) => setActiveStatus(v as RMAStatus | "all")}
        >
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
            <SelectItem value="submitted">Đã gửi</SelectItem>
            <SelectItem value="shipped">Đã vận chuyển</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>

        {/* Desktop: Tab List */}
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="draft">Nháp</TabsTrigger>
          <TabsTrigger value="submitted">Đã gửi</TabsTrigger>
          <TabsTrigger value="shipped">Đã vận chuyển</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
        </TabsList>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <CreateRMABatchDrawer
            trigger={
              <Button size="sm">
                <IconPlus className="mr-2 h-4 w-4" />
                Tạo lô RMA
              </Button>
            }
          />
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent
        value={activeStatus}
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã lô, nhà cung cấp, mã vận đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[120px]">Mã lô</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead className="text-center">Số SP</TableHead>
                <TableHead>Ngày vận chuyển</TableHead>
                <TableHead>Mã vận đơn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {searchQuery ? "Không tìm thấy lô RMA phù hợp" : "Chưa có lô RMA nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch: RMABatch) => (
                  <TableRow
                    key={batch.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(batch.id)}
                  >
                    <TableCell className="font-medium text-sm">
                      {batch.batch_number || `RMA-${batch.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="text-sm">{batch.supplier_name}</TableCell>
                    <TableCell className="text-center text-sm">
                      {batch.product_count || 0}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(batch.shipping_date)}</TableCell>
                    <TableCell className="text-sm">{batch.tracking_number || "—"}</TableCell>
                    <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    <TableCell className="text-sm">
                      {batch.created_by?.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRowClick(batch.id)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {batch.status === "draft" && (
                            <>
                              <DropdownMenuItem onClick={() => handleRowClick(batch.id)}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <IconTrash className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
          <div className="text-muted-foreground">
            Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} trong tổng số {total} lô
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[100px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="30">30 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(0)}
                disabled={page === 0}
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                Trước
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Tiếp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
              >
                Cuối
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
