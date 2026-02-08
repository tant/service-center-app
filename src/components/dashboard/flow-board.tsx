"use client";

import { IconAlertCircle, IconClock } from "@tabler/icons-react";
import Link from "next/link";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Status display configuration
 */
const STATUS_CONFIG = {
  pending: {
    label: "Tiếp nhận",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950",
    order: 1,
  },
  in_progress: {
    label: "Kiểm tra & Sửa chữa",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950",
    order: 2,
  },
  ready_for_pickup: {
    label: "Trả hàng",
    color: "bg-green-100 text-green-800 dark:bg-green-950",
    order: 3,
  },
} as const;

type TicketStatus = keyof typeof STATUS_CONFIG;

/**
 * Get priority badge styling
 */
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "border-red-500 bg-red-50 dark:bg-red-950";
    case "high":
      return "border-orange-500 bg-orange-50 dark:bg-orange-950";
    case "normal":
      return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    default:
      return "border-gray-500 bg-gray-50 dark:bg-gray-900";
  }
};

/**
 * FlowBoard - Kanban-style quy trình visualization
 * Shows: Ticket flow across quy trình stages
 * Pattern: Simplified Kanban with top N tickets per column
 */
export function FlowBoard() {
  // Get flow board data with 30s refresh
  const { data: flowData, isLoading } = trpc.dashboard.getFlowBoard.useQuery(
    undefined,
    {
      refetchInterval: 30 * 1000, // 30s refresh
    },
  );

  // Sort statuses by configured order
  const sortedStatuses = Object.keys(STATUS_CONFIG).sort(
    (a, b) =>
      STATUS_CONFIG[a as TicketStatus].order -
      STATUS_CONFIG[b as TicketStatus].order,
  ) as TicketStatus[];

  if (isLoading) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <CardTitle>Luồng xử lý</CardTitle>
          <CardDescription>Đang tải dữ liệu quy trình...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Luồng xử lý</CardTitle>
        <CardDescription>
          Phiếu dịch vụ đang ở đâu trong quy trình • Cập nhật mỗi 30 giây
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {sortedStatuses.map((status) => {
            const statusData = flowData?.[status];
            const count = statusData?.count ?? 0;
            const tickets = statusData?.tickets ?? [];
            const config = STATUS_CONFIG[status];

            // Check if column has bottleneck (> 8 tickets for in_progress)
            const isBottleneck = status === "in_progress" && count > 8;

            return (
              <div
                key={status}
                className={cn(
                  "rounded-lg border-2 bg-card transition-all",
                  isBottleneck
                    ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                    : "border-border",
                )}
              >
                {/* Column Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{config.label}</h3>
                    <Badge
                      className={cn(
                        config.color,
                        "text-lg font-bold tabular-nums",
                      )}
                    >
                      {count}
                    </Badge>
                  </div>

                  {/* Bottleneck Warning */}
                  {isBottleneck && (
                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <IconAlertCircle className="size-3" />
                      <span>Ùn tắc! Cần xử lý gấp</span>
                    </div>
                  )}
                </div>

                {/* Tickets List */}
                <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                  {tickets.length > 0 ? (
                    <>
                      {tickets.slice(0, 5).map((ticket) => {
                        const daysInStatus = Math.floor(
                          ticket.days_in_status ?? 0,
                        );
                        const isOverdue = daysInStatus > 7;

                        return (
                          <Link
                            key={ticket.id}
                            href={`/operations/tickets/${ticket.id}`}
                            className={cn(
                              "block rounded-lg border-l-4 p-3 transition-all hover:shadow-md hover:scale-[1.02]",
                              getPriorityColor(ticket.priority_level),
                            )}
                          >
                            {/* Ticket Number */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm font-semibold">
                                {ticket.ticket_number}
                              </span>

                              {/* Days Badge */}
                              {daysInStatus > 0 && (
                                <Badge
                                  variant={
                                    isOverdue ? "destructive" : "outline"
                                  }
                                  className={cn(
                                    "text-xs flex items-center gap-1",
                                    isOverdue &&
                                      "bg-red-100 text-red-800 dark:bg-red-950",
                                  )}
                                >
                                  <IconClock className="size-3" />
                                  {daysInStatus}d
                                </Badge>
                              )}
                            </div>

                            {/* Overdue Warning */}
                            {isOverdue && (
                              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                <IconAlertCircle className="size-3" />
                                <span>Quá hạn {daysInStatus} ngày</span>
                              </div>
                            )}
                          </Link>
                        );
                      })}

                      {/* Show More Indicator */}
                      {count > 5 && (
                        <Link
                          href={`/operations/tickets?status=${status}`}
                          className="block text-center py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          +{count - 5} phiếu khác • Xem tất cả
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <p>Không có phiếu dịch vụ</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconClock className="size-3" />
            <span>Số ngày trong trạng thái hiện tại</span>
          </div>
          <div className="flex items-center gap-2">
            <IconAlertCircle className="size-3 text-red-600" />
            <span>Phiếu dịch vụ quá 7 ngày (cần xử lý gấp)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
