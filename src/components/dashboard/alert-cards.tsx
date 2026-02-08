"use client";

import {
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconPackage,
  IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * AlertCards - Display critical alerts grid
 * Shows: Overdue tickets, Aging tickets, Low stock items, Workflow bottlenecks
 * Pattern: Reuses card layout with click-through navigation and info tooltips
 */
export function AlertCards() {
  // Get critical alerts with 30s refresh (as per plan)
  const { data: alerts, isLoading } = trpc.dashboard.getCriticalAlerts.useQuery(
    {
      agingThreshold: 7,
      lowStockThreshold: 5,
    },
    {
      refetchInterval: 30 * 1000, // 30s refresh
    },
  );

  const overdueCount = alerts?.agingTickets?.length ?? 0;
  const agingCount =
    alerts?.agingTickets?.filter((t) => t.days_since_update > 5)?.length ?? 0;
  const lowStockCount = alerts?.lowStockItems?.length ?? 0;
  const overloadedCount =
    alerts?.bottlenecks?.filter((b) => b.deviation_percent > 50)?.length ?? 0;

  // Get first low stock item name for subtitle
  const firstLowStockItem = alerts?.lowStockItems?.[0]?.product_name ?? "";

  // Get first overloaded person (mock - needs backend support)
  const overloadedPerson = overloadedCount > 0 ? "Xem chi tiết" : "";

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Card 1: Overdue Tickets (Critical) */}
      <Link
        href="/operations/tickets?filter=overdue"
        className="transition-all hover:scale-[1.02]"
      >
        <Card className="@container/card cursor-pointer border-red-200 bg-gradient-to-t from-red-50/50 to-card dark:from-red-950/10">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconAlertCircle className="size-4 text-red-600" />
              <span>Phiếu dịch vụ quá hạn</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Số phiếu dịch vụ đã quá 7 ngày chưa hoàn thành
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <span className="text-muted-foreground">-</span>
              ) : (
                <span
                  className={cn(
                    overdueCount > 0 ? "text-red-600" : "text-muted-foreground",
                  )}
                >
                  {overdueCount}
                </span>
              )}
            </CardTitle>
            <CardAction>
              <Badge
                variant={overdueCount > 0 ? "destructive" : "outline"}
                className={cn(
                  overdueCount > 0 &&
                    "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
                )}
              >
                {overdueCount > 0 ? "Cần xử lý" : "Ổn định"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {overdueCount > 0 ? (
                <span className="text-red-600">
                  Phiếu dịch vụ đã quá 7 ngày chưa hoàn thành
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Không có phiếu dịch vụ quá hạn
                </span>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* Card 2: Aging Tickets (Warning) */}
      <Link
        href="/operations/tickets?filter=aging"
        className="transition-all hover:scale-[1.02]"
      >
        <Card className="@container/card cursor-pointer border-yellow-200 bg-gradient-to-t from-yellow-50/50 to-card dark:from-yellow-950/10">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconAlertTriangle className="size-4 text-yellow-600" />
              <span>Phiếu dịch vụ đọng lâu</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Phiếu từ 5-7 ngày chưa cập nhật trạng thái
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <span className="text-muted-foreground">-</span>
              ) : (
                <span
                  className={cn(
                    agingCount > 0
                      ? "text-yellow-600"
                      : "text-muted-foreground",
                  )}
                >
                  {agingCount}
                </span>
              )}
            </CardTitle>
            <CardAction>
              <Badge
                className={cn(
                  agingCount > 0
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                    : "bg-gray-100 text-gray-800",
                )}
              >
                {agingCount > 0 ? (
                  <>
                    Avg:{" "}
                    {alerts?.agingTickets?.[0]?.days_since_update.toFixed(1) ??
                      "-"}
                    d
                  </>
                ) : (
                  "Ổn định"
                )}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {agingCount > 0 ? (
                <span className="text-yellow-600">
                  Phiếu dịch vụ từ 5-7 ngày chưa cập nhật
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Tất cả phiếu dịch vụ đang được xử lý
                </span>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* Card 3: Low Stock Items (Warning) */}
      <Link
        href="/inventory/overview?tab=alerts"
        className="transition-all hover:scale-[1.02]"
      >
        <Card className="@container/card cursor-pointer border-orange-200 bg-gradient-to-t from-orange-50/50 to-card dark:from-orange-950/10">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconPackage className="size-4 text-orange-600" />
              <span>Vật tư sắp hết</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Vật tư có tồn kho dưới mức tối thiểu
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <span className="text-muted-foreground">-</span>
              ) : (
                <span
                  className={cn(
                    lowStockCount > 0
                      ? "text-orange-600"
                      : "text-muted-foreground",
                  )}
                >
                  {lowStockCount}
                </span>
              )}
            </CardTitle>
            <CardAction>
              <Badge
                className={cn(
                  lowStockCount > 0
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
                    : "bg-gray-100 text-gray-800",
                )}
              >
                {lowStockCount > 0 ? "Cần nhập" : "Đủ hàng"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {lowStockCount > 0 && firstLowStockItem ? (
                <span className="text-orange-600 truncate">
                  {firstLowStockItem}
                  {lowStockCount > 1 && ` +${lowStockCount - 1}`}
                </span>
              ) : (
                <span className="text-muted-foreground">Tồn kho đầy đủ</span>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* Card 4: Workload Imbalance (Info) */}
      <Link href="/my-tasks" className="transition-all hover:scale-[1.02]">
        <Card className="@container/card cursor-pointer border-blue-200 bg-gradient-to-t from-blue-50/50 to-card dark:from-blue-950/10">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconUsersGroup className="size-4 text-blue-600" />
              <span>Tắc nghẽn quy trình</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Số giai đoạn xử lý có quá nhiều phiếu (trên 50% so với trung bình)
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? (
                <span className="text-muted-foreground">-</span>
              ) : (
                <span
                  className={cn(
                    overloadedCount > 0
                      ? "text-blue-600"
                      : "text-muted-foreground",
                  )}
                >
                  {overloadedCount}
                </span>
              )}
            </CardTitle>
            <CardAction>
              <Badge
                className={cn(
                  overloadedCount > 0
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800",
                )}
              >
                {overloadedCount > 0 ? "Cần xử lý" : "Trơn tru"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {overloadedCount > 0 ? (
                <span className="text-blue-600">
                  {overloadedCount === 1
                    ? "1 giai đoạn bị tắc nghẽn"
                    : `${overloadedCount} giai đoạn bị tắc nghẽn`}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Quy trình xử lý trơn tru
                </span>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
