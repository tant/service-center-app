/**
 * Edit Product Drawer
 * Simple drawer for editing physical product serial number and warranty info
 * Follows UI_CODING_GUIDE.md Section 6 & 2.6.3 - Uses FormDrawer component
 */

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/ui/form-drawer";
import { useUpdatePhysicalProduct } from "@/hooks/use-warehouse";
import type { PhysicalProduct } from "@/types/warehouse";

interface EditProductDrawerProps {
  open: boolean;
  onClose: () => void;
  product: (PhysicalProduct & {
    product?: {
      id: string;
      name: string;
      sku: string | null;
    };
  }) | null;
}

export function EditProductDrawer({ open, onClose, product }: EditProductDrawerProps) {
  const [formData, setFormData] = React.useState({
    serial_number: "",
    manufacturer_warranty_end_date: "",
    user_warranty_end_date: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { updateProduct, isUpdating } = useUpdatePhysicalProduct();

  // Helper function to format date for input[type="date"]
  const formatDateForInput = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      // Format as YYYY-MM-DD
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // Populate form when product changes
  React.useEffect(() => {
    if (product) {
      setFormData({
        serial_number: product.serial_number || "",
        manufacturer_warranty_end_date: formatDateForInput(product.manufacturer_warranty_end_date),
        user_warranty_end_date: formatDateForInput(product.user_warranty_end_date),
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
      newErrors.serial_number = "Số serial chỉ được chứa chữ cái, số, gạch ngang và gạch dưới";
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
        manufacturer_warranty_end_date: formData.manufacturer_warranty_end_date || null,
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
      }
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
            <p className="text-xs text-muted-foreground">SKU: {product.product.sku}</p>
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

      {/* Manufacturer Warranty End Date */}
      <div className="space-y-2">
        <Label htmlFor="manufacturer_warranty_end_date">Ngày Hết Hạn BH Nhà Máy</Label>
        <div className="relative">
          <Input
            id="manufacturer_warranty_end_date"
            type="date"
            value={formData.manufacturer_warranty_end_date}
            onChange={(e) => handleChange("manufacturer_warranty_end_date", e.target.value)}
            className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
            onClick={(e) => {
              // Ensure date picker opens on click
              const input = e.currentTarget;
              if (input.showPicker) {
                try {
                  input.showPicker();
                } catch (error) {
                  // Fallback: let browser handle it
                  console.log("showPicker not supported");
                }
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Format: YYYY-MM-DD (VD: 2025-12-31)
        </p>
      </div>

      {/* User Warranty End Date */}
      <div className="space-y-2">
        <Label htmlFor="user_warranty_end_date">Ngày Hết Hạn BH User</Label>
        <div className="relative">
          <Input
            id="user_warranty_end_date"
            type="date"
            value={formData.user_warranty_end_date}
            onChange={(e) => handleChange("user_warranty_end_date", e.target.value)}
            className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
            onClick={(e) => {
              // Ensure date picker opens on click
              const input = e.currentTarget;
              if (input.showPicker) {
                try {
                  input.showPicker();
                } catch (error) {
                  // Fallback: let browser handle it
                  console.log("showPicker not supported");
                }
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Format: YYYY-MM-DD (VD: 2026-12-31)
        </p>
      </div>
    </FormDrawer>
  );
}
