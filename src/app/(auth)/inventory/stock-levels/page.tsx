/**
 * Story 1.9: Warehouse Stock Levels and Low Stock Alerts
 * Dashboard page for monitoring warehouse stock levels
 */

"use client";

import { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StockStatusBadge } from "@/components/shared/stock-status-badge";
import { useStockLevels, useLowStockAlerts, useExportStockReport } from "@/hooks/use-warehouse";
import { WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";
import {
  IconSearch,
  IconDownload,
  IconAlertTriangle,
  IconAlertCircle,
} from "@tabler/icons-react";

export default function StockLevelsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filters: any = {};
  if (warehouseFilter !== "all") filters.warehouse_type = warehouseFilter;
  if (statusFilter !== "all") filters.status = statusFilter;
  if (searchQuery) filters.search = searchQuery;

  const { stockLevels, total, isLoading } = useStockLevels(filters);
  const { alerts, criticalCount, warningCount } = useLowStockAlerts();
  const { exportReport, isExporting } = useExportStockReport();

  const handleExport = () => {
    exportReport(filters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mức Tồn Kho</h1>
        <p className="text-muted-foreground">
          Giám sát mức tồn kho và cảnh báo sắp hết hàng
        </p>
      </div>

      {/* Low Stock Alerts */}
      {(criticalCount > 0 || warningCount > 0) && (
        <Alert variant={criticalCount > 0 ? "destructive" : "default"} className="border-2">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertTitle>Cảnh báo tồn kho thấp</AlertTitle>
          <AlertDescription>
            {criticalCount > 0 && (
              <span className="font-semibold text-destructive">
                {criticalCount} sản phẩm hết hàng
              </span>
            )}
            {criticalCount > 0 && warningCount > 0 && " • "}
            {warningCount > 0 && (
              <span className="font-semibold text-yellow-600">
                {warningCount} sản phẩm sắp hết
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng sản phẩm</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sắp hết hàng</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{warningCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hết hàng</CardDescription>
            <CardTitle className="text-3xl text-destructive">{criticalCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <IconSearch className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho</SelectItem>
                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="critical">Hết hàng</SelectItem>
                <SelectItem value="warning">Sắp hết</SelectItem>
                <SelectItem value="ok">Đủ hàng</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} disabled={isExporting} variant="outline">
              <IconDownload className="mr-2 h-4 w-4" />
              {isExporting ? "Đang xuất..." : "Xuất CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mức tồn kho</CardTitle>
          <CardDescription>
            Hiển thị {stockLevels.length} / {total} sản phẩm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : stockLevels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy sản phẩm
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Ngưỡng</TableHead>
                  <TableHead>Số lượng đặt lại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.map((level) => (
                  <TableRow key={`${level.product_id}-${level.virtual_warehouse_type}`}>
                    <TableCell className="font-medium">
                      {level.product_name}
                      <div className="text-xs text-muted-foreground">{level.product_type}</div>
                    </TableCell>
                    <TableCell>{level.sku || "—"}</TableCell>
                    <TableCell>
                      {WAREHOUSE_TYPE_LABELS[level.virtual_warehouse_type as keyof typeof WAREHOUSE_TYPE_LABELS]}
                    </TableCell>
                    <TableCell className="font-semibold">{level.current_stock}</TableCell>
                    <TableCell>{level.threshold}</TableCell>
                    <TableCell>{level.reorder_quantity || "—"}</TableCell>
                    <TableCell>
                      <StockStatusBadge
                        status={level.status as "ok" | "warning" | "critical"}
                        currentStock={level.current_stock}
                        threshold={level.threshold}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
