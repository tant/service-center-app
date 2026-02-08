"use client";

import { EmployeePerformanceTable } from "@/components/employee-performance-table";
import { trpc } from "@/components/providers/trpc-provider";

export function EmployeePerformanceSection() {
  const { data, isLoading } = trpc.analytics.getEmployeePerformance.useQuery();

  return <EmployeePerformanceTable data={data || []} isLoading={isLoading} />;
}
