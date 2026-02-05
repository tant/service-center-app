"use client";

/**
 * Stock Trend Chart Component
 * Displays stock level trends over time using an area chart
 */

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { trpc } from "@/components/providers/trpc-provider";
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
import { Skeleton } from "@/components/ui/skeleton";

interface StockTrendChartProps {
  productId: string;
}

// Chart configuration for stock display
const chartConfig = {
  stock: {
    label: "Tồn kho",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function StockTrendChart({ productId }: StockTrendChartProps) {
  const [timeRange, setTimeRange] = React.useState<number>(30);

  const { data: trendData, isLoading } =
    trpc.inventory.stock.getStockTrend.useQuery({
      productId,
      days: timeRange,
    });

  // Format data for chart
  const chartData = React.useMemo(() => {
    return (
      trendData?.map((item) => ({
        date: item.date,
        stock: item.stock,
      })) || []
    );
  }, [trendData]);

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (chartData.length === 0) {
      return { current: 0, highest: 0, lowest: 0, average: 0 };
    }

    const stockValues = chartData.map((d) => d.stock);
    const current = stockValues[stockValues.length - 1] || 0;
    const highest = Math.max(...stockValues);
    const lowest = Math.min(...stockValues);
    const average = Math.round(
      stockValues.reduce((sum, val) => sum + val, 0) / stockValues.length,
    );

    return { current, highest, lowest, average };
  }, [chartData]);

  // Check if we have enough data for visualization
  const hasEnoughData = chartData.length >= 2;

  const getTimeRangeLabel = () => {
    if (timeRange === 7) return "7 ngày qua";
    if (timeRange === 30) return "30 ngày qua";
    if (timeRange === 90) return "90 ngày qua";
    if (timeRange === 180) return "6 tháng qua";
    return "1 năm qua";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Xu Hướng Tồn Kho Theo Thời Gian
        </CardTitle>
        <CardDescription>
          Biến động tồn kho trong {getTimeRangeLabel()}
        </CardDescription>
        <CardAction>
          <Select
            value={timeRange.toString()}
            onValueChange={(v) => setTimeRange(Number.parseInt(v))}
          >
            <SelectTrigger
              className="w-40"
              size="sm"
              aria-label="Chọn khoảng thời gian"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7" className="rounded-lg">
                7 ngày qua
              </SelectItem>
              <SelectItem value="30" className="rounded-lg">
                30 ngày qua
              </SelectItem>
              <SelectItem value="90" className="rounded-lg">
                90 ngày qua
              </SelectItem>
              <SelectItem value="180" className="rounded-lg">
                6 tháng qua
              </SelectItem>
              <SelectItem value="365" className="rounded-lg">
                1 năm qua
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
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillStock" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-stock)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-stock)"
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.toLocaleString("vi-VN")}
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
                  dataKey="stock"
                  type="natural"
                  fill="url(#fillStock)"
                  stroke="var(--color-stock)"
                  strokeWidth={2}
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t px-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Tồn kho hiện tại
                </span>
                <span className="text-xl md:text-2xl font-bold">
                  {stats.current.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Trung bình
                </span>
                <span className="text-xl md:text-2xl font-bold">
                  {stats.average.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Cao nhất
                </span>
                <span className="text-xl md:text-2xl font-bold text-green-600">
                  {stats.highest.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Thấp nhất
                </span>
                <span className="text-xl md:text-2xl font-bold text-orange-600">
                  {stats.lowest.toLocaleString("vi-VN")}
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
                {chartData.length === 0
                  ? "Chưa có dữ liệu xuất nhập kho trong khoảng thời gian này"
                  : `Chỉ có ${chartData.length} điểm dữ liệu. Cần ít nhất 2 điểm để hiển thị xu hướng.`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
