"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";

export const description = "An interactive area chart";

// Import trpc provider
import { trpc } from "@/components/providers/trpc-provider";

// Chart configuration for revenue display
const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  // Get mobile state and set time range
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("7d");

  // Get chart data
  const { data: revenueData = [] } = trpc.tickets.getDailyRevenue.useQuery();

  const filteredData = React.useMemo(() => {
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return revenueData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [revenueData, timeRange]);

  // Check if we have enough data for the selected time range
  const hasEnoughData = React.useMemo(() => {
    if (filteredData.length === 0) return false;

    let requiredDays = 7;
    if (timeRange === "30d") {
      requiredDays = 7; // At least 7 days of data for 30 day view
    } else if (timeRange === "90d") {
      requiredDays = 7; // At least 7 days of data for 90 day view
    } else if (timeRange === "7d") {
      requiredDays = 3; // At least 3 days of data for 7 day view
    }

    return filteredData.length >= requiredDays;
  }, [filteredData, timeRange]);

  const getTimeRangeLabel = () => {
    if (timeRange === "7d") return "7 ngày gần nhất";
    if (timeRange === "30d") return "30 ngày gần nhất";
    return "3 tháng gần nhất";
  };

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (filteredData.length === 0) {
      return { total: 0, average: 0, highest: 0, lowest: 0 };
    }

    const revenues = filteredData.map((d) => d.revenue);
    const total = revenues.reduce((sum, val) => sum + val, 0);
    const average = total / revenues.length;
    const highest = Math.max(...revenues);
    const lowest = Math.min(...revenues);

    return { total, average, highest, lowest };
  }, [filteredData]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Doanh thu theo ngày</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Doanh thu trong {getTimeRangeLabel()}
          </span>
          <span className="@[540px]/card:hidden">{getTimeRangeLabel()}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90 ngày</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ngày</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 ngày</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="90 ngày gần nhất" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                90 ngày gần nhất
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ngày gần nhất
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 ngày gần nhất
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {hasEnoughData ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    return format(new Date(value), "dd/MM", { locale: vi });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return format(new Date(value), "dd/MM/yyyy", {
                          locale: vi,
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-primary)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t px-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Tổng doanh thu
                </span>
                <span className="text-xl md:text-2xl font-bold">
                  {stats.total.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Trung bình/ngày
                </span>
                <span className="text-xl md:text-2xl font-bold">
                  {Math.round(stats.average).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Cao nhất
                </span>
                <span className="text-xl md:text-2xl font-bold text-green-600">
                  {stats.highest.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Thấp nhất
                </span>
                <span className="text-xl md:text-2xl font-bold text-orange-600">
                  {stats.lowest.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Chưa có đủ dữ liệu để hiển thị biểu đồ
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {filteredData.length === 0
                  ? "Chưa có phiếu hoàn thành nào trong khoảng thời gian này"
                  : `Chỉ có ${filteredData.length} ngày dữ liệu. Vui lòng hoàn thành thêm phiếu để xem biểu đồ.`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
