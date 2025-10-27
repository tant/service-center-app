/**
 * Task Type Form Component
 * Form for creating and editing task types
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTaskType, useUpdateTaskType } from "@/hooks/use-workflow";
import type { TaskType } from "@/types/workflow";

// Schema for form validation
const taskTypeSchema = z.object({
  name: z.string().min(3, "Tên phải có ít nhất 3 ký tự").max(255, "Tên tối đa 255 ký tự"),
  description: z.string().optional(),
  category: z.string().optional(),
  estimated_duration_minutes: z.string().optional().transform((val) => {
    if (!val || val === "") return null;
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num)) return null;
    return num;
  }),
  requires_notes: z.boolean(),
  requires_photo: z.boolean(),
  is_active: z.boolean(),
});

type TaskTypeFormData = z.infer<typeof taskTypeSchema>;

interface TaskTypeFormProps {
  taskType?: TaskType;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Kiểm tra",
  "Sửa chữa",
  "Thay thế",
  "Vệ sinh",
  "Cài đặt",
  "Kiểm tra cuối",
  "Khác",
];

export function TaskTypeForm({ taskType, onSuccess }: TaskTypeFormProps) {
  const isEdit = !!taskType;
  const { createTaskType, isCreating } = useCreateTaskType();
  const { updateTaskType, isUpdating } = useUpdateTaskType();
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(taskTypeSchema),
    defaultValues: isEdit
      ? {
          name: taskType.name,
          description: taskType.description || "",
          category: taskType.category || "",
          estimated_duration_minutes: taskType.estimated_duration_minutes?.toString() || "",
          requires_notes: taskType.requires_notes,
          requires_photo: taskType.requires_photo,
          is_active: taskType.is_active,
        }
      : {
          name: "",
          description: "",
          category: "",
          estimated_duration_minutes: "",
          requires_notes: false,
          requires_photo: false,
          is_active: true,
        },
  });

  const onSubmit = (data: any) => {
    if (isEdit) {
      updateTaskType(
        { id: taskType.id, ...data } as any,
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    } else {
      createTaskType(data as any, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    }
  };

  const requiresNotes = watch("requires_notes");
  const requiresPhoto = watch("requires_photo");
  const isActive = watch("is_active");

  return (
    <form id="task-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Tên loại công việc <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ví dụ: Kiểm tra màn hình"
          {...register("name")}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Danh mục</Label>
        <Select
          value={watch("category") || ""}
          onValueChange={(value) => setValue("category", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Chọn danh mục" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Mô tả chi tiết về loại công việc này..."
          rows={3}
          {...register("description")}
          disabled={isSubmitting}
        />
      </div>

      {/* Estimated Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">Thời gian ước tính (phút)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="Ví dụ: 30"
          {...register("estimated_duration_minutes")}
          disabled={isSubmitting}
        />
        {errors.estimated_duration_minutes && (
          <p className="text-sm text-destructive">
            {errors.estimated_duration_minutes.message}
          </p>
        )}
      </div>

      {/* Requires Notes */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="requires_notes">Yêu cầu ghi chú</Label>
          <p className="text-sm text-muted-foreground">
            Bắt buộc người thực hiện nhập ghi chú khi hoàn thành
          </p>
        </div>
        <Switch
          id="requires_notes"
          checked={requiresNotes}
          onCheckedChange={(checked) => setValue("requires_notes", checked)}
          disabled={isSubmitting}
        />
      </div>

      {/* Requires Photo */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="requires_photo">Yêu cầu ảnh</Label>
          <p className="text-sm text-muted-foreground">
            Bắt buộc người thực hiện chụp ảnh khi hoàn thành
          </p>
        </div>
        <Switch
          id="requires_photo"
          checked={requiresPhoto}
          onCheckedChange={(checked) => setValue("requires_photo", checked)}
          disabled={isSubmitting}
        />
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Trạng thái</Label>
          <p className="text-sm text-muted-foreground">
            Chỉ loại công việc đang hoạt động mới có thể sử dụng trong template
          </p>
        </div>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked)}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}
