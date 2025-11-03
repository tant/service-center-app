/**
 * Task Types Management Page
 * Manage task type definitions used in workflow templates
 */

"use client";

import { PageHeader } from "@/components/page-header";
import { TaskTypesTable } from "@/components/tables/task-types-table";

export default function TaskTypesPage() {
  return (
    <>
      <PageHeader title="Loại Công Việc" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <TaskTypesTable />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

