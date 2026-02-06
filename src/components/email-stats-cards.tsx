/**
 * Story 1.15: Email Notification System
 * Email statistics dashboard cards
 */

"use client";

import { CheckCircle, Clock, Mail, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmailStats } from "@/hooks/use-notifications";

export function EmailStatsCards() {
  const { data: stats, isLoading } = useEmailStats();

  if (isLoading || !stats) {
    return null;
  }

  const cards = [
    {
      title: "Total Emails",
      value: stats.total,
      icon: Mail,
      description: "All time",
    },
    {
      title: "Sent Successfully",
      value: stats.sent,
      icon: CheckCircle,
      description: `${stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}% success rate`,
      className: "text-green-600",
    },
    {
      title: "Failed",
      value: stats.failed,
      icon: XCircle,
      description: stats.failed > 0 ? "Requires attention" : "No failures",
      className: stats.failed > 0 ? "text-red-600" : "text-gray-400",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      description: stats.pending > 0 ? "In queue" : "All processed",
      className: "text-yellow-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon
                className={`h-4 w-4 ${card.className || "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
