"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/components/templates/template-form";
import {
  useTaskTypes,
  useTaskTemplate,
  useUpdateTemplate,
} from "@/hooks/use-workflow";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const { taskTypes: tasks } = useTaskTypes();
  const { template: workflow, isLoading: isLoadingTemplate } = useTaskTemplate(templateId);
  const { updateTemplate, isUpdating } = useUpdateTemplate();

  const handleSubmit = (workflowData: any) => {
    updateTemplate(
      {
        template_id: templateId,
        ...workflowData,
      },
      {
        onSuccess: () => {
          router.push("/workflows");
        },
      }
    );
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingTemplate) {
    return (
      <>
        <PageHeader
          title="Đang tải..."
          backHref="/workflows"
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Đang tải mẫu quy trình...</p>
          </div>
        </div>
      </>
    );
  }

  if (!workflow) {
    return (
      <>
        <PageHeader
          title="Không tìm thấy"
          backHref="/workflows"
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Không tìm thấy mẫu quy trình</p>
            <Button onClick={() => router.back()}>
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Chỉnh sửa: ${workflow.name || "Mẫu quy trình"}`}
        backHref="/workflows"
      />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <TemplateForm
              mode="edit"
              initialData={{
                name: workflow.name || "",
                description: workflow.description || "",
                service_type: workflow.service_type || "warranty",
                enforce_sequence: workflow.enforce_sequence ?? true,
              }}
              initialTasks={workflow.tasks || []}
              tasks={tasks}
              isSubmitting={isUpdating}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </>
  );
}
