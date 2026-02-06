"use client";

/**
 * Inventory Stat Cards Component
 * Displays 3 key metrics: Total SKUs, Total Stock, and Alerts
 */

import { AlertTriangle, Package, TrendingUp } from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InventoryStatCards() {
  const { data: stats, isLoading } = trpc.inventory.stock.getStats.useQuery();

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang tải...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Tổng SKU",
      value: stats.total_skus.toLocaleString(),
      icon: Package,
      description: "Sản phẩm duy nhất",
      color: "text-blue-600",
    },
    {
      title: "Tổng Tồn Kho",
      value: stats.total_actual.toLocaleString(),
      icon: TrendingUp,
      description: `${stats.total_declared.toLocaleString()} đã khai báo`,
      color: "text-green-600",
      subtitle:
        stats.total_actual !== stats.total_declared
          ? `Chênh lệch: ${Math.abs(stats.total_declared - stats.total_actual)}`
          : undefined,
    },
    {
      title: "Cảnh Báo",
      value: (stats.critical_count + stats.warning_count).toLocaleString(),
      icon: AlertTriangle,
      description: `${stats.critical_count} nguy hiểm, ${stats.warning_count} cảnh báo`,
      color: stats.critical_count > 0 ? "text-red-600" : "text-yellow-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
