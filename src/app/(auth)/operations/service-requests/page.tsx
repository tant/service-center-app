/**
 * Story 1.13: Service Requests Page
 * AC 2: Staff request queue with filters and search
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceRequestsTable } from "@/components/tables/service-requests-table";
import { usePendingRequests } from "@/hooks/use-service-request";
import { useDebounce } from "@/hooks/use-debounce";
import { IconSearch, IconRefresh, IconFilter } from "@tabler/icons-react";

export default function ServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<"submitted" | "received" | "processing" | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data, isLoading, refetch } = usePendingRequests({
    status: statusFilter,
    search: debouncedSearch || undefined,
  });

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu dịch vụ</h1>
          <p className="text-muted-foreground">
            Xem xét và chuyển đổi yêu cầu dịch vụ từ khách hàng thành phiếu dịch vụ
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <IconRefresh className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng số yêu cầu</CardDescription>
            <CardTitle className="text-3xl">{data?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đã gửi</CardDescription>
            <CardTitle className="text-3xl">
              {data?.requests.filter((r) => r.status === "submitted").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đã tiếp nhận</CardDescription>
            <CardTitle className="text-3xl">
              {data?.requests.filter((r) => r.status === "received").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang xử lý</CardDescription>
            <CardTitle className="text-3xl">
              {data?.requests.filter((r) => r.status === "processing").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconFilter className="h-4 w-4" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã theo dõi, tên khách hàng, hoặc serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? undefined : (v as any))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="submitted">Đã gửi</SelectItem>
                <SelectItem value="received">Đã tiếp nhận</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(statusFilter || searchTerm) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <ServiceRequestsTable requests={data?.requests || []} isLoading={isLoading} />
    </div>
  );
}
