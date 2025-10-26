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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
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
import { useIsMobile } from "@/hooks/use-mobile";
import type { VirtualWarehouse } from "@/types/warehouse";

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
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<{
    name: string;
    physical_warehouse_id: string;
    warehouse_type: "main" | "warranty_stock" | "rma_staging" | "dead_stock" | "in_service" | "parts";
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

  const warehouseTypeOptions = [
    { value: "warranty_stock", label: "Kho Bảo Hành" },
    { value: "rma_staging", label: "Kho RMA" },
    { value: "dead_stock", label: "Kho Hỏng" },
    { value: "in_service", label: "Đang Sửa Chữa" },
    { value: "parts", label: "Kho Linh Kiện" },
  ];

  return (
    <Drawer open={open} onOpenChange={onClose} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEditMode ? "Chỉnh Sửa Kho Ảo" : "Thêm Kho Ảo Mới"}
          </DrawerTitle>
          <DrawerDescription>
            {isEditMode
              ? "Cập nhật thông tin kho ảo"
              : "Tạo mới một kho ảo trong hệ thống"}
          </DrawerDescription>
        </DrawerHeader>

        {/* Form Content - Scrollable */}
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
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
            <Label htmlFor="warehouse_type">Loại Kho</Label>
            <Select
              value={formData.warehouse_type}
              onValueChange={(
                value: "warranty_stock" | "rma_staging" | "dead_stock" | "in_service" | "parts"
              ) => {
                setFormData({ ...formData, warehouse_type: value });
              }}
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
            <p className="text-xs text-muted-foreground">
              Loại kho xác định mục đích sử dụng
            </p>
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

        <DrawerFooter>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Đang xử lý..."
              : isEditMode
                ? "Cập Nhật"
                : "Tạo Kho"}
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
