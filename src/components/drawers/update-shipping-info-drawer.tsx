"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useFinalizeRMABatch } from "@/hooks/use-warehouse";

interface UpdateShippingInfoDrawerProps {
  batchId: string;
  currentShippingDate: string | null | undefined;
  currentTrackingNumber: string | null | undefined;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function UpdateShippingInfoDrawer({
  batchId,
  currentShippingDate,
  currentTrackingNumber,
  trigger,
  onSuccess,
}: UpdateShippingInfoDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [shippingDate, setShippingDate] = React.useState("");
  const [trackingNumber, setTrackingNumber] = React.useState("");

  const { finalizeBatch, isFinalizing } = useFinalizeRMABatch();

  // Initialize form with current values when drawer opens
  React.useEffect(() => {
    if (open) {
      // Convert date to YYYY-MM-DD format for DatePicker
      if (currentShippingDate) {
        const date = new Date(currentShippingDate);
        if (!isNaN(date.getTime())) {
          // DatePicker expects ISO date string (YYYY-MM-DD)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          setShippingDate(`${year}-${month}-${day}`);
        } else {
          setShippingDate("");
        }
      } else {
        setShippingDate("");
      }
      setTrackingNumber(currentTrackingNumber || "");
    }
  }, [open, currentShippingDate, currentTrackingNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // For now, we use finalizeBatch with the update flag
    // In a real scenario, you might want a separate updateBatch mutation
    finalizeBatch(
      {
        batch_id: batchId,
        shipping_date: shippingDate || undefined,
        tracking_number: trackingNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Cập nhật thông tin vận chuyển</DrawerTitle>
          <DrawerDescription>
            Cập nhật ngày vận chuyển dự kiến và mã vận đơn cho lô RMA này.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            {/* Shipping Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="shipping-date">Ngày vận chuyển dự kiến</Label>
              <DatePicker
                id="shipping-date"
                value={shippingDate}
                onChange={setShippingDate}
                placeholder="dd/mm/yyyy"
                disabled={isFinalizing}
              />
              <p className="text-xs text-muted-foreground">
                Ngày dự kiến gửi hàng trả về nhà cung cấp
              </p>
            </div>

            {/* Tracking Number */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tracking-number">Mã vận đơn</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="VD: VN123456789"
                disabled={isFinalizing}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Mã vận đơn từ đơn vị vận chuyển
              </p>
            </div>
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={isFinalizing}>
              {isFinalizing ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isFinalizing}>
                Hủy bỏ
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
