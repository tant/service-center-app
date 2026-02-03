/**
 * Story 1.10: RMA Batch Operations - Detail Page
 * Detail page for a specific RMA batch with product management
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  IconArrowLeft,
  IconPlus,
  IconCheck,
  IconTruck,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRMABatchDetails, useFinalizeRMABatch, useCompleteRMABatch, useCancelRMABatch, useRemoveProductFromRMA } from "@/hooks/use-warehouse";
import { RMA_STATUS_LABELS, RMA_STATUS_COLORS } from "@/constants/warehouse";
import { AddProductsToRMADrawer } from "@/components/drawers/add-products-to-rma-drawer";
import { UpdateShippingInfoDrawer } from "@/components/drawers/update-shipping-info-drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RMABatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RMABatchDetailPage({ params }: RMABatchDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { batch, products, isLoading, error } = useRMABatchDetails(id);
  const { finalizeBatch, isFinalizing } = useFinalizeRMABatch();
  const { completeBatch, isCompleting } = useCompleteRMABatch();
  const { cancelBatch, isCancelling } = useCancelRMABatch();
  const { removeProduct, isRemoving } = useRemoveProductFromRMA();
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const handleFinalizeBatch = () => {
    if (!batch) return;

    finalizeBatch(
      {
        batch_id: batch.id,
        shipping_date: batch.shipping_date || undefined,
        tracking_number: batch.tracking_number || undefined,
      },
      {
        onSuccess: () => {
          // Optionally navigate back or show success
        },
      }
    );
  };

  const handleRemoveProduct = (productId: string) => {
    if (!batch) return;

    removeProduct(
      {
        batch_id: batch.id,
        product_id: productId,
      },
      {
        onSuccess: () => {
          setProductToDelete(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Đang tải..." backHref="/inventory/rma" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="text-center text-muted-foreground">Đang tải thông tin lô RMA...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !batch) {
    return (
      <>
        <PageHeader title="Lỗi" backHref="/inventory/rma" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-destructive">
                    Không tìm thấy lô RMA hoặc bạn không có quyền truy cập.
                  </p>
                  <div className="mt-4 text-center">
                    <Button onClick={() => router.push("/inventory/rma")}>
                      Quay lại danh sách
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isDraft = batch.status === "draft";
  const isSubmitted = batch.status === "submitted";
  const isCancelled = batch.status === "cancelled";
  const isCompleted = batch.status === "completed";
  const canEdit = isDraft;
  const canCancel = isDraft || isSubmitted;

  return (
    <>
      <PageHeader
        title={`Chi tiết lô RMA ${batch.batch_number || `#${batch.id.slice(0, 8)}`}`}
        backHref="/inventory/rma"
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            {/* Batch Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Thông tin lô RMA</CardTitle>
                    <CardDescription>Chi tiết về lô hàng trả về nhà cung cấp</CardDescription>
                  </div>
                  {getStatusBadge(batch.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Nhà cung cấp</div>
                    <div className="text-base font-semibold">{batch.supplier_name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Số sản phẩm</div>
                    <div className="text-base font-semibold">{products.length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Ngày vận chuyển</div>
                    <div className="text-sm">{formatDate(batch.shipping_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Mã vận đơn</div>
                    <div className="text-sm">{batch.tracking_number || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Người tạo</div>
                    <div className="text-sm">{batch.created_by?.full_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Ngày tạo</div>
                    <div className="text-sm">{formatDateTime(batch.created_at)}</div>
                  </div>
                </div>

                {batch.notes && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Ghi chú</div>
                      <div className="text-sm">{batch.notes}</div>
                    </div>
                  </>
                )}

                {/* Actions */}
                {/* Draft actions */}
                {canEdit && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <UpdateShippingInfoDrawer
                        batchId={batch.id}
                        currentShippingDate={batch.shipping_date}
                        currentTrackingNumber={batch.tracking_number}
                        trigger={
                          <Button variant="outline" size="sm">
                            <IconTruck className="h-4 w-4" />
                            Cập nhật thông tin vận chuyển
                          </Button>
                        }
                      />

                      {products.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" disabled={isFinalizing}>
                              <IconCheck className="h-4 w-4" />
                              {isFinalizing ? "Đang xử lý..." : "Chốt danh sách"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Xác nhận chốt danh sách</DialogTitle>
                              <DialogDescription>
                                Sau khi chốt, bạn sẽ không thể thêm hoặc xóa sản phẩm khỏi lô này nữa.
                                Lô sẽ chuyển sang trạng thái "Chờ gửi".
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Hủy</Button>
                              </DialogClose>
                              <Button onClick={handleFinalizeBatch}>
                                Xác nhận chốt
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Cancel button for draft */}
                      <Dialog open={showCancelDialog && isDraft} onOpenChange={(open) => !open && setShowCancelDialog(false)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => setShowCancelDialog(true)}
                          >
                            <IconX className="h-4 w-4" />
                            Hủy lô RMA
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Xác nhận hủy lô RMA</DialogTitle>
                            <DialogDescription>
                              Bạn có chắc muốn hủy lô RMA này? Tất cả sản phẩm sẽ được gỡ khỏi lô và
                              lô sẽ chuyển sang trạng thái "Đã hủy".
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                              Không
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={isCancelling}
                              onClick={() => cancelBatch({ batch_id: batch.id }, {
                                onSuccess: () => setShowCancelDialog(false),
                              })}
                            >
                              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}

                {/* Submitted → Completed */}
                {isSubmitted && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <UpdateShippingInfoDrawer
                        batchId={batch.id}
                        currentShippingDate={batch.shipping_date}
                        currentTrackingNumber={batch.tracking_number}
                        trigger={
                          <Button variant="outline" size="sm">
                            <IconTruck className="h-4 w-4" />
                            Cập nhật thông tin vận chuyển
                          </Button>
                        }
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={isCompleting}>
                            <IconCheck className="h-4 w-4" />
                            {isCompleting ? "Đang xử lý..." : "Hoàn thành & Xuất kho"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Xác nhận hoàn thành lô RMA</DialogTitle>
                            <DialogDescription>
                              Lô RMA sẽ được đánh dấu hoàn thành, hệ thống sẽ tự động:
                            </DialogDescription>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                              <li>Chuyển sản phẩm từ Kho Hàng Hỏng sang Kho RMA</li>
                              <li>Tạo phiếu xuất kho từ Kho RMA</li>
                            </ul>
                            {!batch.tracking_number && (
                              <p className="mt-2 text-sm text-yellow-600">
                                Lưu ý: Chưa có mã vận đơn, bạn có thể cập nhật trước khi xác nhận.
                              </p>
                            )}
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Hủy</Button>
                            </DialogClose>
                            <Button onClick={() => completeBatch({
                              batch_id: batch.id,
                              shipping_date: batch.shipping_date || new Date().toISOString().split("T")[0],
                              tracking_number: batch.tracking_number || undefined,
                            })}>
                              Xác nhận hoàn thành
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Cancel button for submitted */}
                      <Dialog open={showCancelDialog && isSubmitted} onOpenChange={(open) => !open && setShowCancelDialog(false)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => setShowCancelDialog(true)}
                          >
                            <IconX className="h-4 w-4" />
                            Hủy lô RMA
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Xác nhận hủy lô RMA</DialogTitle>
                            <DialogDescription>
                              Bạn có chắc muốn hủy lô RMA này? Tất cả sản phẩm sẽ được gỡ khỏi lô và
                              lô sẽ chuyển sang trạng thái "Đã hủy".
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                              Không
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={isCancelling}
                              onClick={() => cancelBatch({ batch_id: batch.id }, {
                                onSuccess: () => setShowCancelDialog(false),
                              })}
                            >
                              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Danh sách sản phẩm</CardTitle>
                    <CardDescription>
                      {products.length} sản phẩm trong lô RMA này
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <AddProductsToRMADrawer
                      batchId={batch.id}
                      trigger={
                        <Button size="sm">
                          <IconPlus className="h-4 w-4" />
                          Thêm sản phẩm
                        </Button>
                      }
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có sản phẩm nào trong lô này. {canEdit && "Nhấn nút 'Thêm sản phẩm' để bắt đầu."}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Loại</TableHead>
                          {canEdit && <TableHead className="text-right">Thao tác</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm font-medium">
                              {item.product?.name || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.serial_number || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.product?.sku || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.product?.type || "—"}
                            </TableCell>
                            {canEdit && (
                              <TableCell className="text-right">
                                <Dialog open={productToDelete === item.id} onOpenChange={(open) => !open && setProductToDelete(null)}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      title="Xóa khỏi lô"
                                      onClick={() => setProductToDelete(item.id)}
                                      disabled={isRemoving}
                                    >
                                      <IconTrash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
                                      <DialogDescription>
                                        Bạn có chắc muốn xóa sản phẩm <strong>{item.serial_number}</strong> khỏi lô RMA này?
                                        Sản phẩm sẽ vẫn ở Kho Hàng Hỏng và có thể được thêm vào lô RMA khác.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setProductToDelete(null)}
                                        disabled={isRemoving}
                                      >
                                        Hủy
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleRemoveProduct(item.id)}
                                        disabled={isRemoving}
                                      >
                                        {isRemoving ? "Đang xóa..." : "Xóa"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
