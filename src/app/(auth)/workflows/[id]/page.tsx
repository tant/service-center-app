"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { LoadingState, EmptyState } from "@/components/common";
import { WorkflowDetail } from "@/components/workflows/workflow-detail";
import { useTaskTemplate } from "@/hooks/use-workflow";

export default function TemplateDetailPage() {
  const params = useParams();
  const templateId = params.id as string;

  const { template, isLoading } = useTaskTemplate(templateId);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Đang tải..." backHref="/workflows" />
        <LoadingState message="Đang tải mẫu quy trình..." />
      </>
    );
  }

  if (!template) {
    return (
      <>
        <PageHeader title="Không tìm thấy" backHref="/workflows" />
        <EmptyState
          title="Không tìm thấy mẫu quy trình"
          backHref="/workflows"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={template.name} backHref="/workflows" />
      <WorkflowDetail workflow={template} />
    </>
  );
}
