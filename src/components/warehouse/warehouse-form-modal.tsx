"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5.3: Warehouse form modal for creating/editing physical warehouses
 */

import { useState, useEffect } from "react";
import {
  useCreatePhysicalWarehouse,
  useUpdatePhysicalWarehouse,
} from "@/hooks/use-warehouse";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PhysicalWarehouse } from "@/types/warehouse";

interface WarehouseFormModalProps {
  open: boolean;
  onClose: () => void;
  warehouse?: PhysicalWarehouse | null;
}

export function WarehouseFormModal({
  open,
  onClose,
  warehouse,
}: WarehouseFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createWarehouse, isCreating } = useCreatePhysicalWarehouse();
  const { updateWarehouse, isUpdating } = useUpdatePhysicalWarehouse();

  const isEditMode = !!warehouse;
  const isSubmitting = isCreating || isUpdating;

  // Load warehouse data when editing
  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        location: warehouse.location || "",
        description: warehouse.description || "",
        is_active: warehouse.is_active,
      });
    } else {
      setFormData({
        name: "",
        location: "",
        description: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [warehouse]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên kho là bắt buộc";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Địa điểm là bắt buộc";
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
          location: formData.location.trim(),
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
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
          location: formData.location.trim(),
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh Sửa Kho" : "Thêm Kho Mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin kho vật lý"
              : "Tạo mới một kho vật lý trong hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Tên Kho <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Ví dụ: Kho Tầng 1, Kho Chính..."
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Location Field */}
          <div className="grid gap-2">
            <Label htmlFor="location">
              Địa Điểm <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                if (errors.location) setErrors({ ...errors, location: "" });
              }}
              placeholder="Ví dụ: Tầng 1 - Toà nhà A, Số 123 Đường XYZ..."
              className={errors.location ? "border-destructive" : ""}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
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
              placeholder="Mô tả về kho, mục đích sử dụng..."
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Trạng Thái Hoạt Động</Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_active
                  ? "Kho đang hoạt động và có thể sử dụng"
                  : "Kho tạm ngừng hoạt động"}
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Đang xử lý..."
              : isEditMode
                ? "Cập Nhật"
                : "Tạo Kho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
