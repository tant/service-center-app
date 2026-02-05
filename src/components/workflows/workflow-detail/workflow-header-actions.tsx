"use client";

/**
 * Workflow header actions component
 * Contains badges and action buttons (toggle, edit, delete)
 */

import {
  IconEdit,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteTemplate, useToggleTemplate } from "@/hooks/use-workflow";
import { ENTITY_TYPE_LABELS } from "@/lib/constants/workflow";
import type { WorkflowDetailData } from "./types";

interface WorkflowHeaderActionsProps {
  workflow: WorkflowDetailData;
}

export function WorkflowHeaderActions({
  workflow,
}: WorkflowHeaderActionsProps) {
  const router = useRouter();
  const { deleteTemplate, isDeleting } = useDeleteTemplate();
  const { toggleTemplate, isToggling } = useToggleTemplate();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  const handleEdit = () => {
    router.push(`/workflows/${workflow.id}/edit`);
  };

  const handleDelete = () => {
    deleteTemplate(
      { template_id: workflow.id, soft_delete: true },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          router.push("/workflows");
        },
      },
    );
  };

  const handleToggleActive = () => {
    toggleTemplate(
      {
        template_id: workflow.id,
        is_active: !workflow.is_active,
      },
      {
        onSuccess: () => {
          setShowToggleDialog(false);
        },
      },
    );
  };

  const toggleAction = workflow.is_active ? "vô hiệu hóa" : "kích hoạt";

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={workflow.is_active ? "default" : "secondary"}>
            {workflow.is_active ? "Đang hoạt động" : "Không hoạt động"}
          </Badge>
          {workflow.entity_type && (
            <Badge variant="outline">
              {ENTITY_TYPE_LABELS[workflow.entity_type] || workflow.entity_type}
            </Badge>
          )}
          {workflow.enforce_sequence && (
            <Badge variant="outline">Thứ tự bắt buộc</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowToggleDialog(true)}
            disabled={isToggling}
          >
            {isToggling ? (
              <>Đang xử lý...</>
            ) : workflow.is_active ? (
              <>
                <IconToggleLeft className="h-4 w-4 mr-2" />
                Vô hiệu hóa
              </>
            ) : (
              <>
                <IconToggleRight className="h-4 w-4 mr-2" />
                Kích hoạt
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <IconEdit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <IconTrash className="h-4 w-4 mr-2" />
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Xóa mẫu quy trình"
        description="Bạn có chắc chắn muốn xóa mẫu quy trình này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        title={`${workflow.is_active ? "Vô hiệu hóa" : "Kích hoạt"} mẫu quy trình`}
        description={`Bạn có chắc chắn muốn ${toggleAction} mẫu quy trình này?`}
        confirmLabel={workflow.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
        onConfirm={handleToggleActive}
        isLoading={isToggling}
      />
    </>
  );
}
