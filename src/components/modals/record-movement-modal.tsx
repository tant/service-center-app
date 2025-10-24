/**
 * Story 1.8: Serial Number Verification and Stock Movements
 * Modal for recording product movements between warehouses
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordMovement, usePhysicalWarehouses } from "@/hooks/use-warehouse";
import type { PhysicalProduct } from "@/types/warehouse";
import { WAREHOUSE_TYPE_LABELS } from "@/constants/warehouse";

interface RecordMovementModalProps {
  open: boolean;
  onClose: () => void;
  product: PhysicalProduct | null;
}

type MovementType = "receipt" | "transfer" | "assignment" | "return" | "disposal";
type WarehouseType = "warranty_stock" | "rma_staging" | "dead_stock" | "in_service" | "parts";

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  receipt: "Nhập kho",
  transfer: "Di chuyển",
  assignment: "Gán vào phiếu",
  return: "Trả về kho",
  disposal: "Thanh lý",
};

export function RecordMovementModal({ open, onClose, product }: RecordMovementModalProps) {
  const [movementType, setMovementType] = useState<MovementType>("transfer");
  const [toPhysicalWarehouseId, setToPhysicalWarehouseId] = useState<string>("");
  const [toVirtualWarehouseType, setToVirtualWarehouseType] = useState<WarehouseType | "">("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { recordMovement, isRecording } = useRecordMovement();
  const { warehouses: physicalWarehouses } = usePhysicalWarehouses({ is_active: true });

  // Reset form when modal opens
  useEffect(() => {
    if (open && product) {
      setMovementType("transfer");
      setToPhysicalWarehouseId("");
      setToVirtualWarehouseType("");
      setNotes("");
      setErrors({});
    }
  }, [open, product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // At least one destination must be specified
    if (!toPhysicalWarehouseId && !toVirtualWarehouseType) {
      newErrors.destination = "Vui lòng chọn kho đích (vật lý hoặc ảo)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!product || !validateForm()) return;

    const movementData: any = {
      product_id: product.id,
      movement_type: movementType,
      from_physical_warehouse_id: product.physical_warehouse_id || undefined,
      from_virtual_warehouse_type: product.virtual_warehouse_type,
      notes: notes || undefined,
      force: false,
    };

    if (toPhysicalWarehouseId) {
      movementData.to_physical_warehouse_id = toPhysicalWarehouseId;
    }

    if (toVirtualWarehouseType) {
      movementData.to_virtual_warehouse_type = toVirtualWarehouseType;
    }

    recordMovement(movementData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ghi Nhận Di Chuyển Sản Phẩm</DialogTitle>
          <DialogDescription>
            Serial: {product.serial_number}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Current Location */}
          <div className="grid gap-2">
            <Label>Vị trí hiện tại</Label>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Kho ảo: </span>
                {WAREHOUSE_TYPE_LABELS[product.virtual_warehouse_type]}
              </p>
              {product.physical_warehouse_id && (
                <p>
                  <span className="text-muted-foreground">Kho vật lý: </span>
                  {product.physical_warehouse_id}
                </p>
              )}
            </div>
          </div>

          {/* Movement Type */}
          <div className="grid gap-2">
            <Label htmlFor="movement-type">
              Loại di chuyển <span className="text-destructive">*</span>
            </Label>
            <Select
              value={movementType}
              onValueChange={(value: MovementType) => setMovementType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOVEMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination: Virtual Warehouse */}
          <div className="grid gap-2">
            <Label htmlFor="to-virtual-warehouse">Kho ảo đích</Label>
            <Select
              value={toVirtualWarehouseType}
              onValueChange={(value: any) => {
                setToVirtualWarehouseType(value);
                if (errors.destination) setErrors({ ...errors, destination: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kho ảo (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Không thay đổi --</SelectItem>
                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination: Physical Warehouse */}
          <div className="grid gap-2">
            <Label htmlFor="to-physical-warehouse">Kho vật lý đích</Label>
            <Select
              value={toPhysicalWarehouseId}
              onValueChange={(value) => {
                setToPhysicalWarehouseId(value);
                if (errors.destination) setErrors({ ...errors, destination: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kho vật lý (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Không thay đổi --</SelectItem>
                {physicalWarehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination && (
              <p className="text-sm text-destructive">{errors.destination}</p>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Lý do di chuyển, ghi chú..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRecording}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isRecording}>
            {isRecording ? "Đang xử lý..." : "Ghi Nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
