/**
 * Task Filters Component
 *
 * Provides filtering options for task dashboard.
 */

"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TaskStatus, EntityType } from "@/server/services/entity-adapters/base-adapter";

export interface TaskFilterValues {
  status: TaskStatus | "all";
  entityType: EntityType | "all";
  assignedTo: "all" | "me";
  overdue: boolean;
  requiredOnly: boolean;
}

interface TaskFiltersProps {
  filters: TaskFilterValues;
  onChange: (filters: TaskFilterValues) => void;
}

const statusOptions: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "blocked", label: "Bị chặn" },
  { value: "completed", label: "Hoàn thành" },
  { value: "skipped", label: "Bỏ qua" },
];

const entityTypeOptions: Array<{ value: EntityType | "all"; label: string }> = [
  { value: "all", label: "Tất cả loại" },
  { value: "service_ticket", label: "Phiếu sửa chữa" },
  { value: "inventory_receipt", label: "Phiếu nhập kho" },
  { value: "inventory_issue", label: "Phiếu xuất kho" },
  { value: "inventory_transfer", label: "Phiếu chuyển kho" },
  { value: "service_request", label: "Yêu cầu dịch vụ" },
];

const assignedToOptions: Array<{ value: "all" | "me"; label: string }> = [
  { value: "all", label: "Tất cả công việc" },
  { value: "me", label: "Được giao cho tôi" },
];

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Assigned To Filter - Tabs (Desktop) / Select (Mobile) */}
      <div className="space-y-2">
        {/* Desktop: Tabs */}
        <div className="hidden sm:block">
          <Tabs
            value={filters.assignedTo}
            onValueChange={(value) =>
              onChange({ ...filters, assignedTo: value as "all" | "me" })
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              {assignedToOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile: Select */}
        <div className="sm:hidden">
          <Label htmlFor="assigned-to-filter">Phạm vi</Label>
          <Select
            value={filters.assignedTo}
            onValueChange={(value) =>
              onChange({ ...filters, assignedTo: value as "all" | "me" })
            }
          >
            <SelectTrigger id="assigned-to-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignedToOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Trạng thái</Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({ ...filters, status: value as TaskStatus | "all" })
            }
          >
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="entity-type-filter">Loại công việc</Label>
          <Select
            value={filters.entityType}
            onValueChange={(value) =>
              onChange({
                ...filters,
                entityType: value as EntityType | "all",
              })
            }
          >
            <SelectTrigger id="entity-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Checkbox Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="overdue-filter"
            checked={filters.overdue}
            onCheckedChange={(checked) =>
              onChange({ ...filters, overdue: checked === true })
            }
          />
          <Label
            htmlFor="overdue-filter"
            className="cursor-pointer text-sm font-normal"
          >
            Chỉ hiển thị công việc quá hạn
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="required-filter"
            checked={filters.requiredOnly}
            onCheckedChange={(checked) =>
              onChange({ ...filters, requiredOnly: checked === true })
            }
          />
          <Label
            htmlFor="required-filter"
            className="cursor-pointer text-sm font-normal"
          >
            Chỉ hiển thị công việc bắt buộc
          </Label>
        </div>
      </div>
    </div>
  );
}
