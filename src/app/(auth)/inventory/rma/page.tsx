/**
 * Story 1.10: RMA Batch Operations
 * Page for managing RMA batches - follows UI_CODING_GUIDE.md
 */

import { PageHeader } from "@/components/page-header";
import { RMABatchesTable } from "@/components/tables/rma-batches-table";

export default function RMAManagementPage() {
  return (
    <>
      <PageHeader title="Quản lý RMA" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <RMABatchesTable />
          </div>
        </div>
      </div>
    </>
  );
}
