"use client";

import {
  IconBarcode,
  IconHistory,
  IconMapPin,
  IconPackage,
  IconShieldCheck,
  IconTicket,
} from "@tabler/icons-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRemainingDays, getWarrantyStatus } from "@/utils/warranty";

interface PhysicalProductDetailProps {
  productId: string;
}

const conditionLabels: Record<string, string> = {
  new: "Mới",
  refurbished: "Tân trang",
  used: "Đã qua sử dụng",
  faulty: "Lỗi",
  for_parts: "Tháo linh kiện",
};

const conditionVariants: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  new: "default",
  refurbished: "secondary",
  used: "secondary",
  faulty: "destructive",
  for_parts: "destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Nháp",
  active: "Hoạt động",
  issued: "Đã xuất",
  disposed: "Đã thanh lý",
};

const warrantyStatusLabels: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Còn bảo hành",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  expiring_soon: {
    label: "Sắp hết BH",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  expired: { label: "Hết bảo hành", className: "text-muted-foreground" },
  no_warranty: { label: "Không BH", className: "text-muted-foreground" },
};

const movementTypeLabels: Record<string, string> = {
  receipt: "Nhập kho",
  transfer: "Chuyển kho",
  assignment: "Gán cho phiếu",
  return: "Trả về",
  disposal: "Thanh lý",
  rma_out: "Xuất RMA",
  rma_return: "Trả từ RMA",
};

export function PhysicalProductDetail({
  productId,
}: PhysicalProductDetailProps) {
  // Determine if productId is UUID or serial number
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      productId,
    );

  const {
    data: product,
    isLoading,
    error,
  } = trpc.physicalProducts.getProduct.useQuery(
    isUuid ? { id: productId } : { serial_number: productId },
  );

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !product) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {error?.message || "Không tìm thấy sản phẩm vật lý"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const warrantyEndDate =
    product.user_warranty_end_date || product.manufacturer_warranty_end_date;
  const warrantyStatus = getWarrantyStatus(warrantyEndDate);
  const daysRemaining = warrantyEndDate
    ? getRemainingDays(warrantyEndDate)
    : null;
  const warrantyInfo =
    warrantyStatusLabels[warrantyStatus] || warrantyStatusLabels.no_warranty;
  const productInfo = product.product as any;
  const warehouse = product.virtual_warehouse as any;
  const currentTicket = product.current_ticket as any;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBarcode className="h-5 w-5" />
            {product.serial_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoField label="Sản phẩm" value={productInfo?.name || "—"} />
            <InfoField label="SKU" value={productInfo?.sku || "—"} mono />
            <InfoField
              label="Thương hiệu"
              value={productInfo?.brand?.name || "—"}
            />
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Tình trạng
              </p>
              <Badge
                variant={conditionVariants[product.condition] || "secondary"}
                className="mt-1"
              >
                {conditionLabels[product.condition] || product.condition}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Trạng thái
              </p>
              <Badge variant="outline" className="mt-1">
                {statusLabels[product.status] || product.status}
              </Badge>
            </div>
            {product.purchase_date && (
              <InfoField
                label="Ngày mua"
                value={new Date(product.purchase_date).toLocaleDateString(
                  "vi-VN",
                )}
              />
            )}
            {product.supplier_name && (
              <InfoField label="Nhà cung cấp" value={product.supplier_name} />
            )}
            {product.purchase_price != null && (
              <InfoField
                label="Giá mua"
                value={new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(product.purchase_price)}
              />
            )}
          </div>
          {product.notes && (
            <>
              <Separator />
              <InfoField label="Ghi chú" value={product.notes} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Warranty Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconShieldCheck className="h-5 w-5" />
            Bảo hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Trạng thái BH
              </p>
              <Badge
                variant="outline"
                className={`mt-1 ${warrantyInfo.className}`}
              >
                {warrantyInfo.label}
              </Badge>
            </div>
            {daysRemaining !== null && warrantyStatus !== "expired" && (
              <InfoField label="Còn lại" value={`${daysRemaining} ngày`} />
            )}
            <InfoField
              label="BH nhà sản xuất"
              value={
                product.manufacturer_warranty_end_date
                  ? new Date(
                      product.manufacturer_warranty_end_date,
                    ).toLocaleDateString("vi-VN")
                  : "—"
              }
            />
            <InfoField
              label="BH người dùng"
              value={
                product.user_warranty_end_date
                  ? new Date(product.user_warranty_end_date).toLocaleDateString(
                      "vi-VN",
                    )
                  : "—"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Location & Links Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconMapPin className="h-5 w-5" />
            Vị trí & Liên kết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Kho ảo
              </p>
              <Badge
                variant="outline"
                className="mt-1 bg-blue-50 text-blue-700 border-blue-200"
              >
                {warehouse?.name || "—"}
              </Badge>
            </div>
            <InfoField
              label="Kho vật lý"
              value={warehouse?.physical_warehouse?.name || "—"}
            />
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Phiếu sửa chữa
              </p>
              {currentTicket ? (
                <Link
                  href={`/operations/tickets/${currentTicket.id}`}
                  className="inline-flex items-center gap-1 mt-1 text-sm text-blue-600 hover:underline"
                >
                  <IconTicket className="h-4 w-4" />
                  {currentTicket.ticket_number}
                </Link>
              ) : (
                <p className="mt-1 text-sm">—</p>
              )}
            </div>
            {productInfo?.id && (
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Sản phẩm catalog
                </p>
                <Link
                  href={`/inventory/products/${productInfo.id}/stock`}
                  className="inline-flex items-center gap-1 mt-1 text-sm text-blue-600 hover:underline"
                >
                  <IconPackage className="h-4 w-4" />
                  Xem tồn kho
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movement History */}
      <MovementHistory physicalProductId={product.id} />
    </div>
  );
}

function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className={`mt-1 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function MovementHistory({ physicalProductId }: { physicalProductId: string }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = trpc.physicalProducts.getMovementHistory.useQuery(
    {
      product_id: physicalProductId,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
  );

  const movements = data?.movements || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconHistory className="h-5 w-5" />
          Lịch sử di chuyển
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có lịch sử di chuyển
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Từ</TableHead>
                    <TableHead>Đến</TableHead>
                    <TableHead>Phiếu</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {movementTypeLabels[m.movement_type] ||
                            m.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.from_physical?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.to_physical?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.ticket ? (
                          <Link
                            href={`/operations/tickets/${m.ticket.id || ""}`}
                            className="text-blue-600 hover:underline"
                          >
                            {m.ticket.ticket_number}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {m.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
