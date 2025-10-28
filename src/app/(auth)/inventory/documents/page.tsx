import { PageHeader } from "@/components/page-header";
import { StockDocumentsTable } from "@/components/inventory/documents/stock-documents-table";

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
