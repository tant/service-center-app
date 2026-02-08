"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { trpc } from "@/components/providers/trpc-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Chart configuration for trend data
const chartConfig = {
  received: {
    label: "Tiếp nhận",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Hoàn thành",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

/**
 * TrendChart - Display week performance + 7-day trend
 * Left: Week stats card
 * Right: Area chart with 2 series (received vs completed)
 * Pattern: Based on ChartAreaInteractive, customized for dashboard
 */
export function TrendChart() {
  // Get week performance with 5min refresh
  const { data: weekPerformance, isLoading: weekLoading } =
    trpc.dashboard.getWeekPerformance.useQuery(undefined, {
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    });

  // Get 7-day trend data
  const { data: trendData = [], isLoading: trendLoading } =
    trpc.dashboard.getTrendData.useQuery(
      { days: 7 },
      {
        refetchInterval: 5 * 60 * 1000, // 5 minutes
      },
    );

  const isLoading = weekLoading || trendLoading;

  // Calculate net change (backlog growing/shrinking)
  const netChange =
    (weekPerformance?.received_this_week ?? 0) -
    (weekPerformance?.completed_this_week ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2">
      {/* Left: Week Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất tuần</CardTitle>
          <CardDescription>Tổng quan tuần này</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <>
              {/* Received This Week */}
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-chart-1" />
                  <span className="text-sm font-medium">
                    Tiếp nhận tuần này
                  </span>
                </div>
                <span className="text-xl font-bold tabular-nums">
                  {weekPerformance?.received_this_week ?? 0}
                </span>
              </div>

              {/* Completed This Week */}
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-chart-2" />
                  <span className="text-sm font-medium">
                    Hoàn thành tuần này
                  </span>
                </div>
                <span className="text-xl font-bold tabular-nums">
                  {weekPerformance?.completed_this_week ?? 0}
                </span>
              </div>

              {/* Throughput */}
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Năng suất (phiếu/ngày)
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {weekPerformance?.throughput?.toFixed(1) ?? "0.0"}
                </span>
              </div>

              {/* Net Change */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Thay đổi ròng
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-bold tabular-nums ${
                      netChange > 0
                        ? "text-orange-600"
                        : netChange < 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {netChange > 0 ? "+" : ""}
                    {netChange}
                  </span>
                  {netChange !== 0 && (
                    <span
                      className={`text-xs ${
                        netChange > 0 ? "text-orange-600" : "text-green-600"
                      }`}
                    >
                      {netChange > 0 ? "(Tồn đọng tăng)" : "(Tồn đọng giảm)"}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right: 7-Day Trend Chart */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Xu hướng 7 ngày</CardTitle>
          <CardDescription>Xu hướng tiếp nhận & hoàn thành</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {isLoading ? (
            <div className="flex h-[250px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Đang tải dữ liệu...
                </p>
              </div>
            </div>
          ) : trendData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-received)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-received)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillCompleted"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-completed)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-completed)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    return format(new Date(value), "E", {
                      locale: vi,
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return format(new Date(value), "EEEE, dd/MM/yyyy", {
                          locale: vi,
                        });
                      }}
                      indicator="line"
                    />
                  }
                />
                <Area
                  dataKey="received"
                  type="monotone"
                  fill="url(#fillReceived)"
                  stroke="var(--color-received)"
                  strokeWidth={2}
                  stackId="a"
                />
                <Area
                  dataKey="completed"
                  type="monotone"
                  fill="url(#fillCompleted)"
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Chưa có dữ liệu để hiển thị
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dữ liệu sẽ xuất hiện khi có phiếu được tạo và hoàn thành
                </p>
              </div>
            </div>
          )}

          {/* Insight Message */}
          {!isLoading && trendData.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                {netChange > 0 ? (
                  <span className="text-orange-600 font-medium">
                    ⚠️ Tồn đọng đang tăng - Cần tăng tốc độ hoàn thành
                  </span>
                ) : netChange < 0 ? (
                  <span className="text-green-600 font-medium">
                    ✓ Tồn đọng đang giảm - Team đang làm việc hiệu quả
                  </span>
                ) : (
                  <span>Số lượng tiếp nhận và hoàn thành cân bằng</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
