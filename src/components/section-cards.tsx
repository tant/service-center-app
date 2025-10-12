'use client'
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Format a date to a readable string
 */
const formatDateTime = (date: Date | undefined): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function SectionCards() {
  // Get monthly revenue data
  const { data: revenue } = trpc.revenue.getMonthlyRevenue.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Doanh thu tháng này</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {revenue?.currentMonthRevenue?.toLocaleString('vi-VN')} ₫
          </CardTitle>
          <CardAction>
            <Badge className={cn(
              revenue?.growthRate !== undefined && revenue.growthRate > 0 ? "bg-green-100 text-green-800" : 
              revenue?.growthRate !== undefined && revenue.growthRate < 0 ? "bg-red-100 text-red-800" : 
              "bg-gray-100 text-gray-800"
            )}>
              {revenue?.hasPreviousData && revenue?.growthRate !== undefined ? (
                <>
                  {revenue.growthRate > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {revenue.growthRate > 0 ? "+" : ""}{revenue.growthRate.toFixed(1)}%
                </>
              ) : (
                "-"
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenue?.hasPreviousData ? (
              <>
                {revenue.growthRate > 0 ? "Tăng" : "Giảm"} so với tháng trước
                {revenue.growthRate > 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
              </>
            ) : (
              "Không có dữ liệu tháng trước để so sánh"
            )}
          </div>
          <div className="text-muted-foreground">
            Cập nhật từ {formatDateTime(revenue?.latestUpdate ? new Date(revenue.latestUpdate) : undefined)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  );
}
