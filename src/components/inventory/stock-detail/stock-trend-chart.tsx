"use client";

/**
 * Stock Trend Chart Component
 * Displays stock level trends over time using a line chart
 */

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface StockTrendChartProps {
  productId: string;
}

export function StockTrendChart({ productId }: StockTrendChartProps) {
  const [timeRange, setTimeRange] = useState<number>(30);

  const { data: trendData, isLoading } = trpc.inventory.stock.getStockTrend.useQuery({
    productId,
    days: timeRange,
  });

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

  // Format data for chart
  const chartData = trendData?.map((item) => ({
    date: format(new Date(item.date), "dd/MM", { locale: vi }),
    fullDate: format(new Date(item.date), "dd/MM/yyyy", { locale: vi }),
    stock: item.stock,
  })) || [];

  // Calculate min/max for better Y-axis scaling
  const stockValues = chartData.map((d) => d.stock);
  const minStock = Math.min(...stockValues, 0);
  const maxStock = Math.max(...stockValues, 0);
  const yAxisPadding = (maxStock - minStock) * 0.1 || 10;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5" />
          Xu Hướng Tồn Kho Theo Thời Gian
        </CardTitle>
        <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number.parseInt(v))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 ngày qua</SelectItem>
            <SelectItem value="30">30 ngày qua</SelectItem>
            <SelectItem value="90">90 ngày qua</SelectItem>
            <SelectItem value="180">6 tháng qua</SelectItem>
            <SelectItem value="365">1 năm qua</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!trendData || trendData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chưa có dữ liệu xuất nhập kho trong khoảng thời gian này
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  domain={[minStock - yAxisPadding, maxStock + yAxisPadding]}
                  label={{ value: 'Số lượng', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                  formatter={(value: number) => [value, 'Tồn kho']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="stock"
                  name="Tồn kho"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Tồn kho hiện tại</span>
                <span className="text-2xl font-bold">
                  {chartData[chartData.length - 1]?.stock.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Cao nhất</span>
                <span className="text-2xl font-bold text-green-600">
                  {maxStock.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Thấp nhất</span>
                <span className="text-2xl font-bold text-orange-600">
                  {minStock.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
