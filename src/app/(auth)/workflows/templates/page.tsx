"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { TemplateListTable } from "@/components/tables/template-list-table";
import { TemplateEditorModal } from "@/components/modals/template-editor-modal";
import { TemplatePreviewModal } from "@/components/modals/template-preview-modal";
import { useTaskTemplates, useTaskTemplate } from "@/hooks/use-workflow";

export default function TemplatesPage() {
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingTemplateId, setEditingTemplateId] = React.useState<
    string | undefined
  >();
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [previewTemplateId, setPreviewTemplateId] = React.useState<
    string | undefined
  >();

  const { templates, isLoading } = useTaskTemplates({ is_active: true });
  const { template: previewTemplate } = useTaskTemplate(previewTemplateId);

  const handleCreateNew = () => {
    setEditingTemplateId(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (templateId: string) => {
    setEditingTemplateId(templateId);
    setIsEditorOpen(true);
  };

  const handlePreview = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setIsPreviewOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingTemplateId(undefined);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTemplateId(undefined);
  };

  return (
    <>
      <PageHeader title="Task Templates" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TemplateListTable
              templates={templates}
              isLoading={isLoading}
              onEdit={handleEdit}
              onPreview={handlePreview}
              onCreateNew={handleCreateNew}
            />
          </div>
        </div>
      </div>

      <TemplateEditorModal
        open={isEditorOpen}
        onClose={handleCloseEditor}
        templateId={editingTemplateId}
      />

      <TemplatePreviewModal
        open={isPreviewOpen}
        onClose={handleClosePreview}
        template={previewTemplate || null}
      />
    </>
  );
}
