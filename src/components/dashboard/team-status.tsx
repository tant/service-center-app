"use client";

import { IconClock, IconUserCircle } from "@tabler/icons-react";
import Link from "next/link";
import { trpc } from "@/components/providers/trpc-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Get initials from full name for avatar fallback
 */
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get role badge variant
 */
const getRoleBadge = (
  role: string,
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "pending"
  | "processing"
  | "resolved"
  | "closed"
  | "ready"
  | null
  | undefined => {
  switch (role) {
    case "admin":
      return "default";
    case "manager":
      return "secondary";
    case "technician":
      return "outline";
    case "reception":
      return "outline";
    default:
      return "outline";
  }
};

/**
 * Get role label in Vietnamese
 */
const getRoleLabel = (role: string): string => {
  switch (role) {
    case "admin":
      return "Quản trị viên";
    case "manager":
      return "Quản lý";
    case "technician":
      return "Kỹ thuật viên";
    case "reception":
      return "Lễ tân";
    default:
      return role;
  }
};

/**
 * TeamStatus - Display real-time team member status
 * Shows: Avatar, current task, workload, status indicator
 * Pattern: List view with avatar + badge composition
 */
export function TeamStatus() {
  // Get team status with 15s refresh (as per plan)
  const { data: teamMembers, isLoading } =
    trpc.dashboard.getTeamStatus.useQuery(undefined, {
      refetchInterval: 15 * 1000, // 15s refresh for real-time updates
    });

  // Determine member status
  const getMemberStatus = (member: {
    active_tasks: number;
    pending_tasks: number;
  }) => {
    const totalTasks = member.active_tasks + member.pending_tasks;
    if (member.active_tasks > 0) return "active"; // Has in-progress task
    if (totalTasks >= 6) return "overloaded"; // Too many tasks
    return "available"; // Ready for new work
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 dark:bg-green-950";
      case "overloaded":
        return "text-red-600 bg-red-100 dark:bg-red-950";
      case "available":
        return "text-gray-600 bg-gray-100 dark:bg-gray-800";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Đang làm việc";
      case "overloaded":
        return "Quá tải";
      case "available":
        return "Sẵn sàng";
      default:
        return "Không rõ";
    }
  };

  if (isLoading) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <CardTitle>Trạng thái Team</CardTitle>
          <CardDescription>Đang tải thông tin team members...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="size-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Trạng thái Team</CardTitle>
        <CardDescription>
          Ai đang làm gì ngay bây giờ • Cập nhật mỗi 15 giây
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member) => {
              const status = getMemberStatus(member);
              const totalTasks = member.active_tasks + member.pending_tasks;

              return (
                <Link
                  key={member.id}
                  href={`/my-tasks?assignee=${member.id}`}
                  className="flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-accent hover:shadow-sm"
                >
                  {/* Avatar */}
                  <Avatar className="size-10 ring-2 ring-offset-2 ring-offset-background ring-border">
                    <AvatarImage
                      src={member.avatar_url || undefined}
                      alt={member.full_name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {member.full_name}
                      </span>
                      <Badge
                        variant={getRoleBadge(member.role)}
                        className="text-xs"
                      >
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>

                    {/* Current Task or Status */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {member.current_task ? (
                        <>
                          <IconUserCircle className="size-4 flex-shrink-0" />
                          <span className="truncate">
                            {member.current_task.task_name} (
                            {member.current_task.ticket_number})
                          </span>
                        </>
                      ) : (
                        <>
                          <IconUserCircle className="size-4 flex-shrink-0" />
                          <span className="truncate">
                            {status === "available"
                              ? "Không có công việc đang thực hiện"
                              : "Đang chờ công việc mới"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Workload */}
                  <div className="flex items-center gap-2">
                    {/* Pending Tasks Badge */}
                    {totalTasks > 0 && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <IconClock className="size-3" />
                        <span className="tabular-nums">{totalTasks}</span>
                      </Badge>
                    )}

                    {/* Status Indicator */}
                    <div
                      className={cn(
                        "size-3 rounded-full ring-2 ring-background",
                        getStatusColor(status),
                      )}
                      title={getStatusLabel(status)}
                    />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <IconUserCircle className="size-12 mb-2 opacity-50" />
              <p className="text-sm">Không có thành viên nào trong team</p>
            </div>
          )}
        </div>

        {/* Legend */}
        {teamMembers && teamMembers.length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-600" />
              <span>Đang làm việc</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-gray-600" />
              <span>Sẵn sàng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-600" />
              <span>Quá tải (&gt;6 công việc)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
