"use client";

import {
  IconAlertTriangle,
  IconArrowRight,
  IconClock,
  IconMail,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmailStats } from "@/hooks/use-notifications";
import { useTaskProgressSummary } from "@/hooks/use-task-progress";

export function DashboardQuickLinks() {
  const { data: taskSummary, isLoading: taskLoading } =
    useTaskProgressSummary();
  const { data: emailStats, isLoading: emailLoading } = useEmailStats();

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
      {/* Task Progress Card */}
      <Link href="/dashboard/task-progress">
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <IconClock className="size-5" />
            </div>
            <div className="flex-1">
              <CardDescription>Tiến độ công việc</CardDescription>
              <CardTitle className="text-lg">
                {taskLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <>
                    {taskSummary?.tasks_in_progress ?? 0} đang xử lý
                    {(taskSummary?.tasks_blocked ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-red-600">
                        <IconAlertTriangle className="size-4" />
                        {taskSummary?.tasks_blocked} bị chặn
                      </span>
                    )}
                  </>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            <span className="flex items-center gap-1 group-hover:text-primary">
              Xem chi tiết tiến độ & workload
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardFooter>
        </Card>
      </Link>

      {/* Email Notifications Card */}
      <Link href="/dashboard/notifications">
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <IconMail className="size-5" />
            </div>
            <div className="flex-1">
              <CardDescription>Email thông báo</CardDescription>
              <CardTitle className="text-lg">
                {emailLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <>
                    {emailStats?.total ?? 0} đã gửi
                    {(emailStats?.failed ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-red-600">
                        <IconAlertTriangle className="size-4" />
                        {emailStats?.failed} thất bại
                      </span>
                    )}
                  </>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            <span className="flex items-center gap-1 group-hover:text-primary">
              Xem log email & thống kê
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
