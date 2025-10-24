/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Table component for displaying and managing physical products inventory
 */

"use client";

import { useState } from "react";
import {
  IconPlus,
  IconEdit,
  IconSearch,
  IconFilter,
  IconFileDownload,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePhysicalProducts, usePhysicalWarehouses } from "@/hooks/use-warehouse";
import { ProductRegistrationModal } from "./product-registration-modal";
import { BulkImportModal } from "./bulk-import-modal";
import { WarrantyStatusBadge } from "./warranty-status-badge";
import { WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";
import type { PhysicalProduct } from "@/types/warehouse";

const CONDITION_LABELS = {
  new: "Mới",
  refurbished: "Tân trang",
  used: "Đã qua sử dụng",
  faulty: "Lỗi",
  for_parts: "Tháo linh kiện",
};

const CONDITION_COLORS = {
  new: "default",
  refurbished: "secondary",
  used: "outline",
  faulty: "destructive",
  for_parts: "destructive",
} as const;

export function ProductInventoryTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PhysicalProduct | null>(null);

  const { warehouses: physicalWarehouses } = usePhysicalWarehouses({ is_active: true });

  // Build filters object
  const filters: any = {};
  if (warehouseFilter) filters.virtual_warehouse_type = warehouseFilter;
  if (conditionFilter) filters.condition = conditionFilter;
  if (warrantyFilter) filters.warranty_status = warrantyFilter;
  if (searchQuery) filters.search = searchQuery;

  const { products, total, isLoading } = usePhysicalProducts(filters);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
  };

  const handleCloseModal = () => {
    setShowRegistrationModal(false);
    setEditingProduct(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kho Sản Phẩm Vật Lý</CardTitle>
              <CardDescription>
                Quản lý và theo dõi sản phẩm vật lý theo số serial
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkImportModal(true)}>
                <IconFileDownload className="mr-2 h-4 w-4" />
                Nhập Hàng Loạt
              </Button>
              <Button onClick={() => setShowRegistrationModal(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Đăng Ký Sản Phẩm
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo số serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả kho ảo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả kho ảo</SelectItem>
                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả tình trạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả tình trạng</SelectItem>
                {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả bảo hành" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả bảo hành</SelectItem>
                <SelectItem value="active">Còn bảo hành</SelectItem>
                <SelectItem value="expiring_soon">Sắp hết bảo hành</SelectItem>
                <SelectItem value="expired">Hết bảo hành</SelectItem>
                <SelectItem value="no_warranty">Không bảo hành</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mb-2 text-sm text-muted-foreground">
            Hiển thị {products.length} / {total} sản phẩm
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery || warehouseFilter || conditionFilter || warrantyFilter
                ? "Không tìm thấy sản phẩm phù hợp"
                : "Chưa có sản phẩm nào"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số Serial</TableHead>
                    <TableHead>Sản Phẩm</TableHead>
                    <TableHead>Kho</TableHead>
                    <TableHead>Tình Trạng</TableHead>
                    <TableHead>Bảo Hành</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono font-medium">
                        {product.serial_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.product?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.product?.sku
                              ? `SKU: ${product.product.sku}`
                              : product.product?.brand?.name || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {WAREHOUSE_TYPE_LABELS[product.virtual_warehouse_type as keyof typeof WAREHOUSE_TYPE_LABELS]}
                          </Badge>
                          {product.physical_warehouse && (
                            <div className="text-xs text-muted-foreground">
                              {product.physical_warehouse.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={CONDITION_COLORS[product.condition as keyof typeof CONDITION_COLORS]}>
                          {CONDITION_LABELS[product.condition as keyof typeof CONDITION_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <WarrantyStatusBadge warrantyEndDate={product.warranty_end_date} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProductRegistrationModal
        open={showRegistrationModal || !!editingProduct}
        onClose={handleCloseModal}
        product={editingProduct}
      />

      <BulkImportModal
        open={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
      />
    </>
  );
}
