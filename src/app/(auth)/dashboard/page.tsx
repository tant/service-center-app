import { AlertCards } from "@/components/dashboard/alert-cards";
import { FlowBoard } from "@/components/dashboard/flow-board";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { TeamStatus } from "@/components/dashboard/team-status";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/page-header";

export default async function Page() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Critical Alerts - Top Priority */}
            <AlertCards />

            {/* Flow Board - Kanban View */}
            <FlowBoard />

            {/* Team Status - Real-time */}
            <TeamStatus />

            {/* Today's Metrics - 3 Cards */}
            <MetricsCards />

            {/* Week Performance & Trend Chart */}
            <TrendChart />
          </div>
        </div>
      </div>
    </>
  );
}
