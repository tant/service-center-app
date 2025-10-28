"use client";

/**
 * Serial Compliance Section for Dashboard
 * Displays serial entry compliance metrics for managers
 */

import { SerialComplianceWidget } from "@/components/inventory/serials";
import { trpc } from "@/components/providers/trpc-provider";

export function SerialComplianceSection() {
  // TODO: Replace with actual tRPC query when backend is implemented
  // const { data: metrics, isLoading } = trpc.inventory.serials.getComplianceMetrics.useQuery();

  // Mock data for now
  const mockMetrics = {
    totalReceipts: 45,
    completedSerials: 32,
    inProgressSerials: 8,
    pendingSerials: 5,
    overdueCount: 3,
    complianceRate: 71.1, // (32 / 45) * 100
    trend: {
      direction: "up" as const,
      value: 5.2, // percentage change from last period
    },
  };

  const mockTopPerformers = [
    {
      id: "user-1",
      full_name: "Nguyễn Văn A",
      assignedTasks: 10,
      completedTasks: 9,
      overdueCount: 0,
    },
    {
      id: "user-2",
      full_name: "Trần Thị B",
      assignedTasks: 8,
      completedTasks: 6,
      overdueCount: 1,
    },
    {
      id: "user-3",
      full_name: "Lê Văn C",
      assignedTasks: 12,
      completedTasks: 8,
      overdueCount: 2,
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <SerialComplianceWidget
        metrics={mockMetrics}
        topPerformers={mockTopPerformers}
        showTeamPerformance={true}
        viewAllHref="/my-tasks/serial-entry"
      />
    </div>
  );
}
