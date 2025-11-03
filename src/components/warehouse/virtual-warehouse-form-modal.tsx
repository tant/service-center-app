"use client";

/**
 * Virtual Warehouse Form Drawer
 * Drawer for creating/editing virtual warehouses linked to physical warehouses
 */

import { useState, useEffect } from "react";
import {
  useCreateVirtualWarehouse,
  useUpdateVirtualWarehouse,
  usePhysicalWarehouses,
} from "@/hooks/use-warehouse";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VirtualWarehouse } from "@/types/warehouse";
import type { WarehouseType } from "@/types/enums";
import { WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";

// Extended type to include new fields from migration
type VirtualWarehouseWithPhysical = VirtualWarehouse & {
  name?: string | null;
  physical_warehouse_id?: string | null;
  physical_warehouse?: {
    id: string;
    name: string;
    code: string;
    location: string | null;
  } | null;
};

interface VirtualWarehouseFormModalProps {
  open: boolean;
  onClose: () => void;
  warehouse?: VirtualWarehouseWithPhysical | null;
}

export function VirtualWarehouseFormModal({
  open,
  onClose,
  warehouse,
}: VirtualWarehouseFormModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    physical_warehouse_id: string;
    warehouse_type: WarehouseType;
    description: string;
  }>({
    name: "",
    physical_warehouse_id: "",
    warehouse_type: "main",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { warehouses: physicalWarehouses, isLoading: isLoadingPhysical } =
    usePhysicalWarehouses({ is_active: true });
  const { createWarehouse, isCreating } = useCreateVirtualWarehouse();
  const { updateWarehouse, isUpdating } = useUpdateVirtualWarehouse();

  const isEditMode = !!warehouse;
  const isSubmitting = isCreating || isUpdating;

  // Load warehouse data when editing
  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        physical_warehouse_id: warehouse.physical_warehouse_id || "",
        warehouse_type: warehouse.warehouse_type,
        description: warehouse.description || "",
      });
    } else {
      setFormData({
        name: "",
        physical_warehouse_id: "",
        warehouse_type: "warranty_stock",
        description: "",
      });
    }
    setErrors({});
  }, [warehouse]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên kho ảo là bắt buộc";
    }

    if (!formData.physical_warehouse_id) {
      newErrors.physical_warehouse_id = "Phải chọn kho vật lý";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (isEditMode && warehouse) {
      updateWarehouse(
        {
          id: warehouse.id,
          name: formData.name.trim(),
          warehouse_type: formData.warehouse_type,
          description: formData.description.trim() || undefined,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createWarehouse(
        {
          name: formData.name.trim(),
          physical_warehouse_id: formData.physical_warehouse_id,
          warehouse_type: formData.warehouse_type,
          description: formData.description.trim() || undefined,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // All 7 warehouse types from system
  const warehouseTypeOptions: { value: WarehouseType; label: string }[] = [
    { value: "main", label: WAREHOUSE_TYPE_LABELS.main },
    { value: "warranty_stock", label: WAREHOUSE_TYPE_LABELS.warranty_stock },
    { value: "rma_staging", label: WAREHOUSE_TYPE_LABELS.rma_staging },
    { value: "dead_stock", label: WAREHOUSE_TYPE_LABELS.dead_stock },
    { value: "in_service", label: WAREHOUSE_TYPE_LABELS.in_service },
    { value: "parts", label: WAREHOUSE_TYPE_LABELS.parts },
    { value: "customer_installed", label: WAREHOUSE_TYPE_LABELS.customer_installed },
  ];

  return (
    <FormDrawer
      open={open}
      onOpenChange={onClose}
      title={isEditMode ? "Chỉnh Sửa Kho Ảo" : "Thêm Kho Ảo Mới"}
      description={
        isEditMode
          ? "Cập nhật thông tin kho ảo"
          : "Tạo mới một kho ảo trong hệ thống"
      }
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel={
        isSubmitting
          ? "Đang xử lý..."
          : isEditMode
            ? "Cập Nhật"
            : "Tạo Kho"
      }
      cancelLabel="Hủy"
    >
      <div className="flex flex-col gap-4">
          {/* Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Tên Kho Ảo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Ví dụ: Kho Bảo Hành A, Kho RMA Tầng 1..."
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Physical Warehouse Selection */}
          <div className="grid gap-2">
            <Label htmlFor="physical_warehouse_id">
              Kho Vật Lý <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.physical_warehouse_id}
              onValueChange={(value) => {
                setFormData({ ...formData, physical_warehouse_id: value });
                if (errors.physical_warehouse_id)
                  setErrors({ ...errors, physical_warehouse_id: "" });
              }}
              disabled={isEditMode || isLoadingPhysical}
            >
              <SelectTrigger
                className={
                  errors.physical_warehouse_id ? "border-destructive" : ""
                }
              >
                <SelectValue placeholder="Chọn kho vật lý..." />
              </SelectTrigger>
              <SelectContent>
                {physicalWarehouses.map((pw) => (
                  <SelectItem key={pw.id} value={pw.id}>
                    {pw.name} ({pw.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.physical_warehouse_id && (
              <p className="text-sm text-destructive">
                {errors.physical_warehouse_id}
              </p>
            )}
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Không thể thay đổi kho vật lý sau khi tạo
              </p>
            )}
          </div>

          {/* Warehouse Type */}
          <div className="grid gap-2">
            <Label htmlFor="warehouse_type">
              Loại Kho <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.warehouse_type}
              onValueChange={(value: WarehouseType) => {
                setFormData({ ...formData, warehouse_type: value });
              }}
              disabled={isEditMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warehouseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode ? (
              <p className="text-xs text-muted-foreground">
                Loại kho không thể thay đổi sau khi tạo vì ảnh hưởng đến dữ liệu
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Loại kho xác định mục đích sử dụng
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="grid gap-2">
            <Label htmlFor="description">Mô Tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả về kho ảo, mục đích sử dụng..."
              rows={3}
            />
          </div>
        </div>
    </FormDrawer>
  );
}
