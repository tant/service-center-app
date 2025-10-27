"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TemplateListTable } from "@/components/tables/template-list-table";
import { useTaskTemplates } from "@/hooks/use-workflow";

export default function TemplatesPage() {
  const router = useRouter();

  const { templates, isLoading } = useTaskTemplates({ is_active: true });

  const handleCreateNew = () => {
    router.push("/workflows/templates/new");
  };

  const handleEdit = (templateId: string) => {
    router.push(`/workflows/templates/${templateId}/edit`);
  };

  const handleView = (templateId: string) => {
    router.push(`/workflows/templates/${templateId}`);
  };

  return (
    <>
      <PageHeader title="Mẫu quy trình" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TemplateListTable
              templates={templates}
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
