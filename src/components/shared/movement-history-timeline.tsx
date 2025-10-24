/**
 * Story 1.8: Serial Number Verification and Stock Movements
 * Timeline component for displaying product movement history
 */

"use client";

import { useMovementHistory } from "@/hooks/use-warehouse";
import { IconArrowRight, IconPackage, IconUser, IconCalendar } from "@tabler/icons-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface MovementHistoryTimelineProps {
  productId: string;
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  receipt: "Nhập kho",
  transfer: "Di chuyển",
  assignment: "Gán vào phiếu",
  return: "Trả về kho",
  disposal: "Thanh lý",
};

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  receipt: "bg-green-100 text-green-800",
  transfer: "bg-blue-100 text-blue-800",
  assignment: "bg-purple-100 text-purple-800",
  return: "bg-yellow-100 text-yellow-800",
  disposal: "bg-red-100 text-red-800",
};

export function MovementHistoryTimeline({ productId }: MovementHistoryTimelineProps) {
  const { movements, isLoading, total } = useMovementHistory({ product_id: productId });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải lịch sử...</div>;
  }

  if (total === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có lịch sử di chuyển
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {movements.map((movement, index) => (
        <div key={movement.id} className="flex gap-4">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <IconPackage className="h-4 w-4 text-primary" />
            </div>
            {index < movements.length - 1 && (
              <div className="w-0.5 flex-1 bg-border mt-2 min-h-[40px]" />
            )}
          </div>

          {/* Movement details */}
          <div className="flex-1 pb-8">
            {/* Movement type and ticket reference */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant="outline"
                className={MOVEMENT_TYPE_COLORS[movement.movement_type] || ""}
              >
                {MOVEMENT_TYPE_LABELS[movement.movement_type] || movement.movement_type}
              </Badge>
              {movement.ticket && (
                <span className="text-sm text-muted-foreground">
                  Phiếu: {movement.ticket.ticket_number}
                </span>
              )}
            </div>

            {/* From → To locations */}
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="font-medium">
                {getLocationName(
                  movement.from_physical,
                  movement.from_virtual_warehouse
                )}
              </span>
              <IconArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {getLocationName(
                  movement.to_physical,
                  movement.to_virtual_warehouse
                )}
              </span>
            </div>

            {/* Notes */}
            {movement.notes && (
              <p className="text-sm text-muted-foreground mb-2">{movement.notes}</p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconCalendar className="h-3 w-3" />
                {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
              </div>
              {movement.moved_by && (
                <div className="flex items-center gap-1">
                  <IconUser className="h-3 w-3" />
                  {movement.moved_by.full_name || "Hệ thống"}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper to get location name from physical or virtual warehouse
function getLocationName(
  physicalWarehouse: any,
  virtualWarehouseType: string | null
): string {
  if (physicalWarehouse) {
    return `${physicalWarehouse.name} (${physicalWarehouse.code})`;
  }

  if (virtualWarehouseType) {
    const VIRTUAL_WAREHOUSE_LABELS: Record<string, string> = {
      warranty_stock: "Kho Bảo Hành",
      rma_staging: "Khu Vực RMA",
      dead_stock: "Kho Hàng Hỏng",
      in_service: "Đang Sử Dụng",
      parts: "Kho Linh Kiện",
    };
    return VIRTUAL_WAREHOUSE_LABELS[virtualWarehouseType] || virtualWarehouseType;
  }

  return "Không xác định";
}
