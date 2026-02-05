"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/components/templates/template-form";
import { useCreateTemplate, useTaskTypes } from "@/hooks/use-workflow";

export default function NewTemplatePage() {
  const router = useRouter();
  const { taskTypes: tasks } = useTaskTypes();
  const { createTemplate, isCreating } = useCreateTemplate();

  const handleSubmit = (workflowData: any) => {
    createTemplate(workflowData, {
      onSuccess: () => {
        router.push("/workflows");
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <PageHeader title="Tạo mẫu quy trình mới" backHref="/workflows" />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <TemplateForm
              mode="create"
              tasks={tasks}
              isSubmitting={isCreating}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </>
  );
}
