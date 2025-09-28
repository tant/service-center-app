import { PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <p className="text-muted-foreground">Reports and analytics interface coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}