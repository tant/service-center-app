/**
 * Story 1.10: RMA Batch Operations
 * Dashboard page for managing RMA batches
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRMABatches, useCreateRMABatch } from "@/hooks/use-warehouse";
import { RMA_STATUS_LABELS, RMA_STATUS_COLORS } from "@/constants/warehouse";
import {
  IconPlus,
  IconPackage,
  IconTruck,
  IconCheck,
} from "@tabler/icons-react";

type RMAStatus = "draft" | "submitted" | "shipped" | "completed";

export default function RMAManagementPage() {
  const [activeStatus, setActiveStatus] = useState<RMAStatus | "all">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [shippingDate, setShippingDate] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  const filters = activeStatus !== "all" ? { status: activeStatus as RMAStatus } : {};
  const { batches, total, isLoading } = useRMABatches(filters);
  const { createBatch, isCreating } = useCreateRMABatch();

  const handleCreateBatch = () => {
    if (!supplierName) return;

    createBatch(
      {
        supplier_name: supplierName,
        shipping_date: shippingDate || undefined,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setSupplierName("");
          setShippingDate("");
          setTrackingNumber("");
          setNotes("");
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const color = RMA_STATUS_COLORS[status] || "#6B7280";
    const label = RMA_STATUS_LABELS[status] || status;

    return (
      <Badge
        style={{
          backgroundColor: `${color}20`,
          color: color,
          borderColor: `${color}40`,
        }}
      >
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý RMA</h1>
          <p className="text-muted-foreground">
            Quản lý lô hàng trả về nhà cung cấp
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Tạo lô RMA mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo lô RMA mới</DialogTitle>
              <DialogDescription>
                Tạo lô hàng mới để trả về nhà cung cấp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Tên nhà cung cấp *</Label>
                <Input
                  id="supplier"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-date">Ngày vận chuyển</Label>
                <Input
                  id="shipping-date"
                  type="date"
                  value={shippingDate}
                  onChange={(e) => setShippingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking">Mã vận đơn</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Nhập mã vận đơn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateBatch}
                disabled={isCreating || !supplierName}
              >
                {isCreating ? "Đang tạo..." : "Tạo lô RMA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng số lô</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nháp</CardDescription>
            <CardTitle className="text-3xl">
              {batches.filter((b: any) => b.status === "draft").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang vận chuyển</CardDescription>
            <CardTitle className="text-3xl">
              {batches.filter((b: any) => b.status === "shipped").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-3xl">
              {batches.filter((b: any) => b.status === "completed").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lô RMA</CardTitle>
          <CardDescription>
            Quản lý và theo dõi các lô hàng trả về nhà cung cấp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeStatus}
            onValueChange={(v) => setActiveStatus(v as RMAStatus | "all")}
          >
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="draft">Nháp</TabsTrigger>
              <TabsTrigger value="submitted">Đã gửi</TabsTrigger>
              <TabsTrigger value="shipped">Đã vận chuyển</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
            </TabsList>

            <TabsContent value={activeStatus} className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có lô RMA nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã lô</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead>Số sản phẩm</TableHead>
                      <TableHead>Ngày vận chuyển</TableHead>
                      <TableHead>Mã vận đơn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Người tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch: any) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          {batch.batch_number}
                        </TableCell>
                        <TableCell>{batch.supplier_name}</TableCell>
                        <TableCell>{batch.product_count || 0}</TableCell>
                        <TableCell>{formatDate(batch.shipping_date)}</TableCell>
                        <TableCell>{batch.tracking_number || "—"}</TableCell>
                        <TableCell>{getStatusBadge(batch.status)}</TableCell>
                        <TableCell>{batch.created_by?.full_name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
