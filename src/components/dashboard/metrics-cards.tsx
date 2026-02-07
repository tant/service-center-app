"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
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
import { cn } from "@/lib/utils";

/**
 * MetricsCards - Display today's key metrics
 * Shows: Received today, Completed today, Average cycle time
 * Pattern: Reuses SectionCards styling, customized for dashboard metrics
 */
export function MetricsCards() {
  // Get today's metrics with 60s refresh (as per plan)
  const { data: metrics, isLoading } = trpc.dashboard.getTodayMetrics.useQuery(
    undefined,
    {
      refetchInterval: 60 * 1000, // 60s refresh
    },
  );

  // Calculate trends (compare with yesterday - mock for now, will need backend support)
  // For MVP, we'll show the raw numbers without comparison
  const receivedToday = metrics?.new_today ?? 0;
  const completedToday = metrics?.completed_today ?? 0;
  const cycleTime = metrics?.avg_cycle_time_days ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3">
      {/* Card 1: Received Today */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tiếp nhận hôm nay</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              receivedToday
            )}
          </CardTitle>
          <CardAction>
            <Badge className="bg-blue-100 text-blue-800">
              <span className="text-xs">phiếu</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Phiếu mới tiếp nhận trong ngày
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Completed Today */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Hoàn thành hôm nay</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              completedToday
            )}
          </CardTitle>
          <CardAction>
            <Badge className="bg-green-100 text-green-800">
              <span className="text-xs">phiếu</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {receivedToday > 0 && completedToday > 0 ? (
              completedToday >= receivedToday ? (
                <>
                  <span className="text-green-600">Hoàn thành tốt</span>
                  <IconTrendingUp className="size-4 text-green-600" />
                </>
              ) : (
                <>
                  <span className="text-orange-600">Backlog tăng</span>
                  <IconTrendingDown className="size-4 text-orange-600" />
                </>
              )
            ) : (
              <span className="text-muted-foreground">
                Phiếu hoàn thành trong ngày
              </span>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Cycle Time */}
      <Card className="@container/card col-span-2 @3xl/main:col-span-1">
        <CardHeader>
          <CardDescription>Cycle Time trung bình</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? (
              <span className="text-muted-foreground">-</span>
            ) : cycleTime > 0 ? (
              <>
                {cycleTime.toFixed(1)}{" "}
                <span className="text-lg text-muted-foreground">ngày</span>
              </>
            ) : (
              <span className="text-muted-foreground text-lg">
                Chưa có dữ liệu
              </span>
            )}
          </CardTitle>
          <CardAction>
            <Badge
              className={cn(
                cycleTime > 0 && cycleTime <= 4
                  ? "bg-green-100 text-green-800"
                  : cycleTime > 4 && cycleTime <= 7
                    ? "bg-yellow-100 text-yellow-800"
                    : cycleTime > 7
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800",
              )}
            >
              {cycleTime > 0 && cycleTime <= 4 ? (
                <>
                  <IconTrendingUp className="size-3" />
                  <span className="text-xs">Tốt</span>
                </>
              ) : cycleTime > 4 && cycleTime <= 7 ? (
                <span className="text-xs">TB</span>
              ) : cycleTime > 7 ? (
                <>
                  <IconTrendingDown className="size-3" />
                  <span className="text-xs">Chậm</span>
                </>
              ) : (
                <span className="text-xs">-</span>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Thời gian xử lý từ tiếp nhận đến hoàn thành
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
