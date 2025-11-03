"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5.3: Warehouse form drawer for creating/editing physical warehouses
 */

import { useState, useEffect } from "react";
import {
  useCreatePhysicalWarehouse,
  useUpdatePhysicalWarehouse,
} from "@/hooks/use-warehouse";
import { FormDrawer } from "@/components/ui/form-drawer";
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
    code: "",
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
        code: warehouse.code,
        location: warehouse.location || "",
        description: warehouse.description || "",
        is_active: warehouse.is_active,
      });
    } else {
      setFormData({
        name: "",
        code: "",
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

    if (!formData.code.trim()) {
      newErrors.code = "Mã kho là bắt buộc";
    } else if (formData.code.trim().length > 20) {
      newErrors.code = "Mã kho không được quá 20 ký tự";
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
          code: formData.code.trim().toUpperCase(),
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
          code: formData.code.trim().toUpperCase(),
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

  const _handleCancel = () => {
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onClose}
      title={isEditMode ? "Chỉnh Sửa Kho" : "Thêm Kho Mới"}
      description={
        isEditMode
          ? "Cập nhật thông tin kho vật lý"
          : "Tạo mới một kho vật lý trong hệ thống"
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

          {/* Code Field */}
          <div className="grid gap-2">
            <Label htmlFor="code">
              Mã Kho <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                if (errors.code) setErrors({ ...errors, code: "" });
              }}
              placeholder="Ví dụ: WH-01, MAIN, T1..."
              maxLength={20}
              className={errors.code ? "border-destructive" : ""}
              disabled={isEditMode}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Mã kho không thể thay đổi sau khi tạo
              </p>
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
    </FormDrawer>
  );
}
