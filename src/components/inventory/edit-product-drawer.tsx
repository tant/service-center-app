/**
 * Edit Product Drawer
 * Simple drawer for editing physical product serial number and warranty info
 * Follows UI_CODING_GUIDE.md Section 6 & 2.6.3 - Uses FormDrawer component
 */

"use client";

import * as React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePhysicalProduct } from "@/hooks/use-warehouse";
import type { ProductCondition } from "@/types/enums";
import type { PhysicalProduct } from "@/types/warehouse";

const CONDITION_OPTIONS: { value: ProductCondition; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "refurbished", label: "Tân trang" },
  { value: "used", label: "Đã qua sử dụng" },
  { value: "faulty", label: "Lỗi" },
  { value: "for_parts", label: "Tháo linh kiện" },
];

interface EditProductDrawerProps {
  open: boolean;
  onClose: () => void;
  product:
    | (PhysicalProduct & {
        product?: {
          id: string;
          name: string;
          sku: string | null;
        };
      })
    | null;
}

export function EditProductDrawer({
  open,
  onClose,
  product,
}: EditProductDrawerProps) {
  const [formData, setFormData] = React.useState({
    serial_number: "",
    condition: "" as ProductCondition | "",
    manufacturer_warranty_end_date: "",
    user_warranty_end_date: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { updateProduct, isUpdating } = useUpdatePhysicalProduct();

  // Populate form when product changes
  React.useEffect(() => {
    if (product) {
      // Helper to format date to ISO string (YYYY-MM-DD) for DatePicker
      const toISODate = (date: string | Date | null | undefined): string => {
        if (!date) return "";
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return "";
          return d.toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      setFormData({
        serial_number: product.serial_number || "",
        condition: product.condition || "",
        manufacturer_warranty_end_date: toISODate(
          product.manufacturer_warranty_end_date,
        ),
        user_warranty_end_date: toISODate(product.user_warranty_end_date),
      });
      setErrors({});
    }
  }, [product]);

  const handleSubmit = () => {
    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.serial_number.trim()) {
      newErrors.serial_number = "Vui lòng nhập số serial";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.serial_number)) {
      newErrors.serial_number =
        "Số serial chỉ được chứa chữ cái, số, gạch ngang và gạch dưới";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!product) return;

    // Submit update
    updateProduct(
      {
        id: product.id,
        serial_number: formData.serial_number.toUpperCase(),
        condition: formData.condition || undefined,
        manufacturer_warranty_end_date:
          formData.manufacturer_warranty_end_date || null,
        user_warranty_end_date: formData.user_warranty_end_date || null,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          // Handle duplicate serial error
          if (error.message.includes("already exists")) {
            setErrors({
              serial_number: `Số serial "${formData.serial_number.toUpperCase()}" đã tồn tại trong hệ thống`,
            });
          } else {
            setErrors({
              serial_number: error.message || "Lỗi khi cập nhật sản phẩm",
            });
          }
        },
      },
    );
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Don't render if no product
  if (!product) {
    return null;
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onClose}
      title="Sửa Sản Phẩm Vật Lý"
      description="Cập nhật số serial và thời hạn bảo hành"
      isSubmitting={isUpdating}
      onSubmit={handleSubmit}
      submitLabel={isUpdating ? "Đang lưu..." : "Lưu"}
      cancelLabel="Hủy"
      submitDisabled={Object.keys(errors).length > 0}
    >
      {/* Product Info (Read-only) */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{product.product?.name}</p>
          {product.product?.sku && (
            <p className="text-xs text-muted-foreground">
              SKU: {product.product.sku}
            </p>
          )}
        </div>
      </div>

      {/* Serial Number */}
      <div className="space-y-2">
        <Label htmlFor="serial_number">
          Số Serial <span className="text-destructive">*</span>
        </Label>
        <Input
          id="serial_number"
          value={formData.serial_number}
          onChange={(e) => handleChange("serial_number", e.target.value)}
          placeholder="VD: ZT4070-2025-001"
          className={errors.serial_number ? "border-destructive" : ""}
        />
        {errors.serial_number ? (
          <p className="text-xs text-destructive">{errors.serial_number}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Số serial phải unique trong toàn hệ thống
          </p>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label htmlFor="condition">Tình trạng</Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => handleChange("condition", value)}
        >
          <SelectTrigger id="condition">
            <SelectValue placeholder="Chọn tình trạng" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manufacturer Warranty End Date */}
      <div className="space-y-2">
        <Label htmlFor="manufacturer_warranty_end_date">
          Ngày Hết Hạn BH Nhà Máy{" "}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (VD: 311225)
          </span>
        </Label>
        <DatePicker
          id="manufacturer_warranty_end_date"
          value={formData.manufacturer_warranty_end_date}
          onChange={(value) =>
            handleChange("manufacturer_warranty_end_date", value)
          }
          placeholder="dd/mm/yyyy hoặc click lịch"
          disabled={isUpdating}
        />
      </div>

      {/* User Warranty End Date */}
      <div className="space-y-2">
        <Label htmlFor="user_warranty_end_date">
          Ngày Hết Hạn BH User{" "}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (VD: 311226)
          </span>
        </Label>
        <DatePicker
          id="user_warranty_end_date"
          value={formData.user_warranty_end_date}
          onChange={(value) => handleChange("user_warranty_end_date", value)}
          placeholder="dd/mm/yyyy hoặc click lịch"
          disabled={isUpdating}
        />
      </div>
    </FormDrawer>
  );
}
