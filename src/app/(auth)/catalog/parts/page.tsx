"use client";

import { PageHeader } from "@/components/page-header";
import { PartsTable } from "@/components/parts-table";
import { trpc } from "@/components/providers/trpc-provider";

export default function Page() {
  const { data: partsData = [] } = trpc.parts.getParts.useQuery();

  return (
    <>
      <PageHeader title="Linh kiện" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <PartsTable data={partsData} />
          </div>
        </div>
      </div>
    </>
  );
}
