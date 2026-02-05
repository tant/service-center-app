"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

const StockDocumentsTable = dynamic(
  () =>
    import("@/components/inventory/documents/stock-documents-table").then(
      (mod) => mod.StockDocumentsTable,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    ),
  },
);

export default function StockDocumentsPage() {
  return (
    <>
      <PageHeader title="Phiếu Xuất Nhập Kho" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <StockDocumentsTable />
          </div>
        </div>
      </div>
    </>
  );
}
