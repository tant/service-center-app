"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { TemplateListTable } from "@/components/tables/template-list-table";
import { useTaskTemplates } from "@/hooks/use-workflow";

export default function TemplatesPage() {
  const router = useRouter();

  const { templates: workflows, isLoading } = useTaskTemplates({
    is_active: true,
  });

  const handleCreateNew = () => {
    router.push("/workflows/new");
  };

  const handleEdit = (workflowId: string) => {
    router.push(`/workflows/${workflowId}/edit`);
  };

  const handleView = (workflowId: string) => {
    router.push(`/workflows/${workflowId}`);
  };

  return (
    <>
      <PageHeader title="Mẫu quy trình" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TemplateListTable
              templates={workflows}
              isLoading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onCreateNew={handleCreateNew}
            />
          </div>
        </div>
      </div>
    </>
  );
}
