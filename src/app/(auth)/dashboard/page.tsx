import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SerialComplianceSection } from "@/components/dashboard/serial-compliance-section";
import { EmployeePerformanceTable } from "@/components/employee-performance-table";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { getEmployeePerformance } from "./actions";

export default async function Page() {
  const employeePerformance = await getEmployeePerformance();

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <SerialComplianceSection />
            <div className="px-4 lg:px-6">
              <EmployeePerformanceTable data={employeePerformance} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
