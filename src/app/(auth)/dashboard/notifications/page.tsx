/**
 * Story 1.15: Email Notification System
 * Admin page to view email notification log
 * AC 9: Create admin page to view email logs
 */

import { Suspense } from "react";
import { EmailStatsCards } from "@/components/email-stats-cards";
import { EmailNotificationsTable } from "@/components/tables/email-notifications-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Email Notifications
        </h1>
        <p className="text-muted-foreground">
          View and manage email notification logs
        </p>
      </div>

      {/* Email Statistics */}
      <Suspense fallback={<EmailStatsCardsSkeleton />}>
        <EmailStatsCards />
      </Suspense>

      {/* Email Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Log</CardTitle>
          <CardDescription>
            All email notifications sent to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<EmailTableSkeleton />}>
            <EmailNotificationsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmailTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded-lg">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-b last:border-0 p-4">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
