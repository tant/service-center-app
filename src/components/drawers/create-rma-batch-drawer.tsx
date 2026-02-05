"use client";

import * as React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRMABatch } from "@/hooks/use-warehouse";

interface CreateRMABatchDrawerProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateRMABatchDrawer({
  trigger,
  onSuccess,
}: CreateRMABatchDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [supplierName, setSupplierName] = React.useState("");
  const [shippingDate, setShippingDate] = React.useState("");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const { createBatch, isCreating } = useCreateRMABatch();

  const handleSubmit = () => {
    if (!supplierName.trim()) return;

    createBatch(
      {
        supplier_name: supplierName.trim(),
        shipping_date: shippingDate || undefined,
        tracking_number: trackingNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          // Reset form
          setSupplierName("");
          setShippingDate("");
          setTrackingNumber("");
          setNotes("");
          onSuccess?.();
        },
      },
    );
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Tạo lô RMA mới"
      description="Tạo lô hàng mới để trả về nhà cung cấp. Các sản phẩm sẽ được thêm vào sau."
      isSubmitting={isCreating}
      onSubmit={handleSubmit}
      submitLabel={isCreating ? "Đang tạo..." : "Tạo lô RMA"}
      submitDisabled={!supplierName.trim()}
      cancelLabel="Hủy bỏ"
    >
      <div className="flex flex-col gap-4">
        {/* Supplier Name (Required) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier-name">
            Tên nhà cung cấp <span className="text-destructive">*</span>
          </Label>
          <Input
            id="supplier-name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="VD: Công ty TNHH ABC"
            required
            disabled={isCreating}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Nhập tên nhà cung cấp mà bạn sẽ trả hàng về
          </p>
        </div>

        {/* Shipping Date (Optional) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="shipping-date">Ngày vận chuyển dự kiến</Label>
          <DatePicker
            id="shipping-date"
            value={shippingDate}
            onChange={setShippingDate}
            placeholder="dd/mm/yyyy"
            disabled={isCreating}
          />
          <p className="text-xs text-muted-foreground">
            Có thể bỏ trống và cập nhật sau
          </p>
        </div>

        {/* Tracking Number (Optional) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="tracking-number">Mã vận đơn</Label>
          <Input
            id="tracking-number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="VD: VN123456789"
            disabled={isCreating}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Có thể bỏ trống và cập nhật sau khi có mã vận đơn
          </p>
        </div>

        {/* Notes (Optional) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Ghi chú</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm về lô hàng này..."
            rows={4}
            disabled={isCreating}
          />
        </div>
      </div>
    </FormDrawer>
  );
}
