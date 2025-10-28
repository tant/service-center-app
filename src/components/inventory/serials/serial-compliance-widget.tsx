"use client";

/**
 * Serial Compliance Widget Component
 * Dashboard widget for managers showing serial entry compliance metrics
 * Features: completion rate, overdue tasks, team performance, trends
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ComplianceMetrics {
  totalReceipts: number;
  completedSerials: number;
  inProgressSerials: number;
  pendingSerials: number;
  overdueCount: number;
  complianceRate: number; // percentage
  trend?: {
    direction: "up" | "down" | "stable";
    value: number; // percentage change
  };
}

interface TeamMember {
  id: string;
  full_name: string;
  assignedTasks: number;
  completedTasks: number;
  overdueCount: number;
}

interface SerialComplianceWidgetProps {
  metrics: ComplianceMetrics;
  topPerformers?: TeamMember[];
  showTeamPerformance?: boolean;
  onViewAll?: () => void;
  viewAllHref?: string;
}

export function SerialComplianceWidget({
  metrics,
  topPerformers = [],
  showTeamPerformance = false,
  onViewAll,
  viewAllHref = "/tasks/serial-entry",
}: SerialComplianceWidgetProps) {
  // Determine overall status based on compliance rate and overdue count
  const getOverallStatus = () => {
    if (metrics.overdueCount > 5) {
      return {
        level: "critical" as const,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800",
        icon: <Flame className="h-5 w-5" />,
        label: "NGHIÊM TRỌNG",
      };
    }
    if (metrics.complianceRate < 70 || metrics.overdueCount > 0) {
      return {
        level: "warning" as const,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        icon: <AlertTriangle className="h-5 w-5" />,
        label: "CẦN THEO DÕI",
      };
    }
    return {
      level: "good" as const,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: "TỐT",
    };
  };

  const status = getOverallStatus();

  // Get trend icon
  const getTrendIcon = () => {
    if (!metrics.trend) return null;

    switch (metrics.trend.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`${status.borderColor} ${status.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={status.color}>{status.icon}</div>
            <CardTitle className="text-lg">Serial Entry Compliance</CardTitle>
          </div>
          <Badge
            variant={status.level === "critical" ? "destructive" : "secondary"}
            className={status.level === "good" ? "bg-green-600" : ""}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Compliance Rate */}
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {metrics.complianceRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <span>Tỷ lệ hoàn thành</span>
              {metrics.trend && (
                <span className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span
                    className={
                      metrics.trend.direction === "up"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {metrics.trend.value}%
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Overdue Count */}
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${metrics.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {metrics.overdueCount}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Task quá hạn</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Chi tiết trạng thái:
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                Hoàn thành
              </span>
              <span className="font-medium">
                {metrics.completedSerials}/{metrics.totalReceipts}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-600" />
                Đang tiến hành
              </span>
              <span className="font-medium">
                {metrics.inProgressSerials}/{metrics.totalReceipts}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                Chưa bắt đầu
              </span>
              <span className="font-medium">
                {metrics.pendingSerials}/{metrics.totalReceipts}
              </span>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        {showTeamPerformance && topPerformers.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top performers:
            </div>
            <div className="space-y-2">
              {topPerformers.slice(0, 3).map((member, index) => {
                const completionRate =
                  member.assignedTasks > 0
                    ? Math.round((member.completedTasks / member.assignedTasks) * 100)
                    : 0;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{member.full_name}</span>
                      {member.overdueCount > 0 && (
                        <Badge variant="destructive" className="h-5 text-xs">
                          {member.overdueCount} quá hạn
                        </Badge>
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        completionRate === 100
                          ? "text-green-600"
                          : completionRate > 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {completionRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alert for Critical Status */}
        {status.level === "critical" && (
          <div className="rounded-md bg-red-100 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            <p className="flex items-start gap-2">
              <Flame className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Cần hành động ngay!</strong> Có {metrics.overdueCount} task
                quá hạn cần được xử lý.
              </span>
            </p>
          </div>
        )}

        {/* View All Button */}
        {(onViewAll || viewAllHref) && (
          <div className="pt-2">
            {viewAllHref ? (
              <Link href={viewAllHref}>
                <Button variant="outline" className="w-full group">
                  <span>Xem tất cả task</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                className="w-full group"
                onClick={onViewAll}
              >
                <span>Xem tất cả task</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
