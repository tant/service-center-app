/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Modal for registering and editing physical products
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { ProductPhotoUpload } from "./product-photo-upload";
import { trpc } from "@/components/providers/trpc-provider";
import {
  useCreatePhysicalProduct,
  useUpdatePhysicalProduct,
  usePhysicalWarehouses,
} from "@/hooks/use-warehouse";
import { WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";
import type { PhysicalProduct } from "@/types/warehouse";

interface ProductRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  product?: PhysicalProduct | null;
}

const CONDITION_LABELS = {
  new: "Mới",
  refurbished: "Tân trang",
  used: "Đã qua sử dụng",
  faulty: "Lỗi",
  for_parts: "Tháo linh kiện",
};

export function ProductRegistrationModal({
  open,
  onClose,
  product,
}: ProductRegistrationModalProps) {
  type WarehouseType = "warranty_stock" | "rma_staging" | "dead_stock" | "in_service" | "parts";
  type ProductCondition = "new" | "refurbished" | "used" | "faulty" | "for_parts";

  const [formData, setFormData] = useState<{
    serial_number: string;
    product_id: string;
    physical_warehouse_id: string;
    virtual_warehouse_type: WarehouseType;
    condition: ProductCondition;
    warranty_start_date: string;
    warranty_months: number;
    purchase_date: string;
    supplier_name: string;
    purchase_price: number;
    notes: string;
    photo_urls: string[];
  }>({
    serial_number: "",
    product_id: "",
    physical_warehouse_id: "",
    virtual_warehouse_type: "warranty_stock",
    condition: "new",
    warranty_start_date: "",
    warranty_months: 0,
    purchase_date: "",
    supplier_name: "",
    purchase_price: 0,
    notes: "",
    photo_urls: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createProductAsync, isCreating } = useCreatePhysicalProduct();
  const { updateProductAsync, isUpdating } = useUpdatePhysicalProduct();
  const { warehouses: physicalWarehouses } = usePhysicalWarehouses({ is_active: true });

  // Fetch products for selection
  const { data: products } = trpc.products.getProducts.useQuery();

  const isEditMode = !!product;
  const isSubmitting = isCreating || isUpdating;

  // Prepare products options for searchable select
  const productsOptions: SearchableSelectOption[] = useMemo(
    () =>
      products?.map((p) => {
        const brandText = p.brands?.name || "Không có thương hiệu";
        const modelText = p.model ? ` • ${p.model}` : "";
        const skuText = p.sku ? ` • SKU: ${p.sku}` : "";

        return {
          label: p.name,
          value: p.id,
          description: `${brandText} • ${p.type}${modelText}${skuText}`,
        };
      }) || [],
    [products]
  );

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        serial_number: product.serial_number,
        product_id: product.product_id,
        physical_warehouse_id: product.physical_warehouse_id || "",
        virtual_warehouse_type: product.virtual_warehouse_type,
        condition: product.condition,
        warranty_start_date: product.warranty_start_date || "",
        warranty_months: product.warranty_months || 0,
        purchase_date: product.purchase_date || "",
        supplier_name: product.supplier_name || "",
        purchase_price: product.purchase_price ? Number(product.purchase_price) : 0,
        notes: product.notes || "",
        photo_urls: product.photo_urls || [],
      });
    } else {
      // Reset form for new product
      setFormData({
        serial_number: "",
        product_id: "",
        physical_warehouse_id: "",
        virtual_warehouse_type: "warranty_stock",
        condition: "new",
        warranty_start_date: "",
        warranty_months: 0,
        purchase_date: "",
        supplier_name: "",
        purchase_price: 0,
        notes: "",
        photo_urls: [],
      });
    }
    setErrors({});
  }, [product, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Serial number validation
    if (!formData.serial_number.trim()) {
      newErrors.serial_number = "Số serial là bắt buộc";
    } else if (formData.serial_number.length < 5) {
      newErrors.serial_number = "Số serial phải có ít nhất 5 ký tự";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.serial_number)) {
      newErrors.serial_number = "Số serial chỉ được chứa chữ cái, số, gạch ngang và gạch dưới";
    }

    // Product selection validation
    if (!formData.product_id) {
      newErrors.product_id = "Vui lòng chọn sản phẩm";
    }

    // Warranty validation
    if (formData.warranty_start_date && formData.warranty_months < 0) {
      newErrors.warranty_months = "Số tháng bảo hành không được âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        serial_number: formData.serial_number.toUpperCase(),
        product_id: formData.product_id,
        physical_warehouse_id: formData.physical_warehouse_id || undefined,
        virtual_warehouse_type: formData.virtual_warehouse_type,
        condition: formData.condition,
        warranty_start_date: formData.warranty_start_date || undefined,
        warranty_months: formData.warranty_months > 0 ? formData.warranty_months : undefined,
        purchase_date: formData.purchase_date || undefined,
        supplier_name: formData.supplier_name || undefined,
        purchase_price: formData.purchase_price > 0 ? formData.purchase_price : undefined,
        notes: formData.notes || undefined,
        photo_urls: formData.photo_urls.length > 0 ? formData.photo_urls : undefined,
      };

      if (isEditMode && product) {
        await updateProductAsync({ id: product.id, ...data });
      } else {
        await createProductAsync(data);
      }

      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error("Error submitting product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh Sửa Sản Phẩm" : "Đăng Ký Sản Phẩm Mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin sản phẩm vật lý"
              : "Đăng ký sản phẩm vật lý mới với số serial"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Serial Number */}
          <div className="grid gap-2">
            <Label htmlFor="serial">
              Số Serial <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serial"
              placeholder="VD: ABC12345"
              value={formData.serial_number}
              onChange={(e) => {
                setFormData({ ...formData, serial_number: e.target.value.toUpperCase() });
                if (errors.serial_number) setErrors({ ...errors, serial_number: "" });
              }}
              className={errors.serial_number ? "border-destructive" : ""}
            />
            {errors.serial_number && (
              <p className="text-sm text-destructive">{errors.serial_number}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Chữ cái, số, gạch ngang và gạch dưới. Tối thiểu 5 ký tự
            </p>
          </div>

          {/* Product Selection */}
          <div className="grid gap-2">
            <Label htmlFor="product">
              Sản Phẩm <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              options={productsOptions}
              value={formData.product_id}
              onValueChange={(value) => {
                setFormData({ ...formData, product_id: value });
                if (errors.product_id) setErrors({ ...errors, product_id: "" });
              }}
              placeholder="Tìm kiếm sản phẩm..."
              emptyMessage="Không tìm thấy sản phẩm"
            />
            {errors.product_id && (
              <p className="text-sm text-destructive">{errors.product_id}</p>
            )}
          </div>

          {/* Warehouses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="virtual-warehouse">
                Kho Ảo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.virtual_warehouse_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, virtual_warehouse_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WAREHOUSE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="physical-warehouse">Kho Vật Lý</Label>
              <Select
                value={formData.physical_warehouse_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, physical_warehouse_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kho vật lý (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Không chọn --</SelectItem>
                  {physicalWarehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Condition */}
          <div className="grid gap-2">
            <Label htmlFor="condition">
              Tình Trạng <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.condition}
              onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warranty Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="warranty-start">Ngày Bắt Đầu Bảo Hành</Label>
              <Input
                type="date"
                id="warranty-start"
                value={formData.warranty_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, warranty_start_date: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warranty-months">Số Tháng Bảo Hành</Label>
              <Input
                type="number"
                id="warranty-months"
                min="0"
                value={formData.warranty_months}
                onChange={(e) =>
                  setFormData({ ...formData, warranty_months: parseInt(e.target.value) || 0 })
                }
                placeholder="VD: 12"
              />
              {errors.warranty_months && (
                <p className="text-sm text-destructive">{errors.warranty_months}</p>
              )}
            </div>
          </div>

          {/* Purchase Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="purchase-date">Ngày Mua</Label>
              <Input
                type="date"
                id="purchase-date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplier">Nhà Cung Cấp</Label>
              <Input
                id="supplier"
                placeholder="VD: ABC Tech"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Giá Mua</Label>
              <Input
                type="number"
                id="price"
                min="0"
                step="1000"
                value={formData.purchase_price}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })
                }
                placeholder="VD: 5000000"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú thêm về sản phẩm..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Photos */}
          <div className="grid gap-2">
            <Label>Ảnh Sản Phẩm</Label>
            <ProductPhotoUpload
              photoUrls={formData.photo_urls}
              onPhotosChange={(urls) => setFormData({ ...formData, photo_urls: urls })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Đang xử lý..."
              : isEditMode
                ? "Cập Nhật"
                : "Đăng Ký"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
