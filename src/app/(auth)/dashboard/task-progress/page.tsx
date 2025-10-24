/**
 * Story 1.16: Manager Task Progress Dashboard
 * Dashboard showing task-level progress across all active tickets
 * Access: Admin/Manager only
 */

"use client";

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  useTaskProgressSummary,
  useTicketsWithBlockedTasks,
  useTechnicianWorkload,
} from "@/hooks/use-task-progress";
import Link from "next/link";

// Metrics Cards Component
function MetricsCards() {
  const { data: summary, isLoading } = useTaskProgressSummary();

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Tickets",
      value: summary.active_tickets || 0,
      icon: Activity,
      description: "Tickets in progress",
      className: "text-blue-600",
    },
    {
      title: "Tasks In Progress",
      value: summary.tasks_in_progress || 0,
      icon: Clock,
      description: `${summary.tasks_pending || 0} pending`,
      className: "text-yellow-600",
    },
    {
      title: "Blocked Tasks",
      value: summary.tasks_blocked || 0,
      icon: AlertTriangle,
      description: summary.tasks_blocked > 0 ? "Requires attention" : "No blockers",
      className: summary.tasks_blocked > 0 ? "text-red-600" : "text-gray-400",
    },
    {
      title: "Avg Completion Time",
      value: summary.avg_completion_hours
        ? `${Math.round(summary.avg_completion_hours)}h`
        : "N/A",
      icon: TrendingUp,
      description: `${summary.tasks_completed || 0} completed`,
      className: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.className}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
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

// Blocked Tasks Alert Component
function BlockedTasksAlert() {
  const { data: blockedTickets, isLoading } = useTicketsWithBlockedTasks();

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!blockedTickets || blockedTickets.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">All Clear!</AlertTitle>
        <AlertDescription className="text-green-700">
          No blocked tasks at the moment. All workflows are progressing smoothly.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Blocked Tasks Require Attention</AlertTitle>
      <AlertDescription>
        {blockedTickets.length} ticket(s) have blocked tasks. Review and resolve blockers to
        keep workflows moving.
      </AlertDescription>
      <div className="mt-4 space-y-2">
        {blockedTickets.slice(0, 3).map((ticket) => (
          <div key={ticket.ticket_id} className="flex items-center justify-between text-sm border-t pt-2">
            <div>
              <Link href={`/tickets/${ticket.ticket_id}`} className="font-medium hover:underline">
                {ticket.ticket_number}
              </Link>
              <span className="text-muted-foreground ml-2">
                - {ticket.customer_name}
              </span>
            </div>
            <Badge variant="destructive">
              {ticket.blocked_tasks_count} blocked
            </Badge>
          </div>
        ))}
        {blockedTickets.length > 3 && (
          <div className="text-xs text-muted-foreground pt-2">
            +{blockedTickets.length - 3} more tickets with blocked tasks
          </div>
        )}
      </div>
    </Alert>
  );
}

// Technician Workload Table Component
function TechnicianWorkloadTable() {
  const { data: workload, isLoading } = useTechnicianWorkload();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!workload || workload.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No technician data available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Technician</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">In Progress</TableHead>
          <TableHead className="text-right">Pending</TableHead>
          <TableHead className="text-right">Completed</TableHead>
          <TableHead className="text-right">Blocked</TableHead>
          <TableHead className="text-right">Completion Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workload.map((tech) => (
          <TableRow key={tech.technician_id}>
            <TableCell className="font-medium">
              {tech.technician_name}
              <div className="text-xs text-muted-foreground">{tech.technician_email}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {tech.role}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="processing">{tech.tasks_in_progress}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="pending">{tech.tasks_pending}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="resolved">{tech.tasks_completed}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {tech.tasks_blocked > 0 ? (
                <Badge variant="destructive">{tech.tasks_blocked}</Badge>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {tech.completion_rate_percent?.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Main Page Component
export default function TaskProgressDashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Task Progress Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor task-level progress across all active tickets and identify bottlenecks
        </p>
      </div>

      {/* Metrics Cards */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <MetricsCards />
      </Suspense>

      {/* Blocked Tasks Alert */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <BlockedTasksAlert />
      </Suspense>

      {/* Technician Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Workload</CardTitle>
          <CardDescription>
            Task distribution and completion rates across all technicians
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <TechnicianWorkloadTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
