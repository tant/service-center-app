"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconCheck, IconClock, IconClipboardList, IconLoader, IconTrendingUp } from "@tabler/icons-react";

interface EmployeePerformance {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  totalAssigned: number;
  inProgress: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export function EmployeePerformanceTable({
  data,
  isLoading = false,
}: {
  data: EmployeePerformance[];
  isLoading?: boolean;
}) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      case "technician":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Quản trị",
      manager: "Quản lý",
      technician: "Kỹ thuật viên",
      reception: "Lễ tân",
    };
    return roleMap[role.toLowerCase()] || role;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClipboardList className="size-5" />
            Hiệu suất nhân viên
          </CardTitle>
          <CardDescription>
            Thống kê công việc và hiệu suất của từng nhân viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <IconLoader className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClipboardList className="size-5" />
            Hiệu suất nhân viên
          </CardTitle>
          <CardDescription>
            Thống kê công việc và hiệu suất của từng nhân viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Không có dữ liệu nhân viên
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by completion rate descending
  const sortedData = [...data].sort((a, b) => b.completionRate - a.completionRate);
  const topPerformer = sortedData[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClipboardList className="size-5" />
          Hiệu suất nhân viên
        </CardTitle>
        <CardDescription>
          Thống kê công việc và hiệu suất của từng nhân viên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Nhân viên</TableHead>
                <TableHead className="text-center w-[120px]">Vai trò</TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <IconClipboardList className="size-4" />
                    <span>Tổng số</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <IconLoader className="size-4" />
                    <span>Đang xử lý</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <IconCheck className="size-4" />
                    <span>Hoàn thành</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <IconClock className="size-4" />
                    <span>Chờ xử lý</span>
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-1">
                    <IconTrendingUp className="size-4" />
                    <span>Tỷ lệ hoàn thành</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((employee) => {
                const isTopPerformer = employee.id === topPerformer?.id && employee.completionRate > 0;

                return (
                  <TableRow key={employee.id} className={isTopPerformer ? "bg-primary/5" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage
                            src={employee.avatarUrl || ""}
                            alt={employee.fullName}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-sm">
                            {getInitials(employee.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">
                            {employee.fullName}
                            {isTopPerformer && (
                              <Badge variant="default" className="ml-2 text-xs py-0 px-1.5">
                                Top
                              </Badge>
                            )}
                          </span>
                          <span className="text-muted-foreground text-xs mt-1">
                            {employee.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getRoleBadgeVariant(employee.role)}>
                        {getRoleDisplay(employee.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-lg">
                        {employee.totalAssigned}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-semibold">
                        {employee.inProgress}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold text-green-600 border-green-600">
                        {employee.completed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold text-orange-600 border-orange-600">
                        {employee.pending}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={employee.completionRate}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm font-medium w-12 text-right">
                          {employee.completionRate.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {sortedData.length > 0 && topPerformer && topPerformer.completionRate > 0 && (
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <IconTrendingUp className="size-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">{topPerformer.fullName}</span>
              {" "}đang dẫn đầu với tỷ lệ hoàn thành {topPerformer.completionRate.toFixed(0)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
