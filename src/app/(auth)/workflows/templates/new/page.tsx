"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/components/templates/template-form";
import {
  useTaskTypes,
  useCreateTemplate,
} from "@/hooks/use-workflow";

export default function NewTemplatePage() {
  const router = useRouter();
  const { taskTypes } = useTaskTypes();
  const { createTemplate, isCreating } = useCreateTemplate();

  const handleSubmit = (templateData: any) => {
    createTemplate(templateData, {
      onSuccess: () => {
        router.push("/workflows/templates");
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <PageHeader
        title="Tạo mẫu quy trình mới"
        backHref="/workflows/templates"
      />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <TemplateForm
              mode="create"
              taskTypes={taskTypes}
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
