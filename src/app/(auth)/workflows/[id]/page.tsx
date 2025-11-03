"use client";

import { useRouter, useParams } from "next/navigation";
import {
  IconEdit,
  IconTrash,
  IconCheck,
  IconArrowLeft,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useTaskTemplate, useDeleteTemplate, useToggleTemplate } from "@/hooks/use-workflow";

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const { template: workflow, isLoading } = useTaskTemplate(templateId);
  const { deleteTemplate, isDeleting } = useDeleteTemplate();
  const { toggleTemplate, isToggling } = useToggleTemplate();

  const serviceTypeLabels: Record<string, string> = {
    warranty: "Bảo hành",
    paid: "Trả phí",
    replacement: "Thay thế",
  };

  const handleEdit = () => {
    router.push(`/workflows/${templateId}/edit`);
  };

  const handleDelete = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu quy trình này?")) return;

    deleteTemplate(
      { template_id: templateId, soft_delete: true },
      {
        onSuccess: () => {
          router.push("/workflows");
        },
      }
    );
  };

  const handleToggleActive = () => {
    if (!workflow) return;

    const newStatus = !workflow.is_active;
    const action = newStatus ? "kích hoạt" : "vô hiệu hóa";

    if (!confirm(`Bạn có chắc chắn muốn ${action} mẫu quy trình này?`)) return;

    toggleTemplate({
      template_id: templateId,
      is_active: newStatus,
    });
  };

  if (isLoading) {
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
        title={workflow.name}
        backHref="/workflows"
      />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <div className="space-y-6">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.is_active ? "default" : "secondary"}>
                    {workflow.is_active ? "Đang hoạt động" : "Không hoạt động"}
                  </Badge>
                  <Badge variant="outline">
                    {serviceTypeLabels[workflow.service_type] || workflow.service_type}
                  </Badge>
                  {workflow.enforce_sequence && (
                    <Badge variant="outline">
                      Thứ tự bắt buộc
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <IconEdit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </div>

              {/* Template Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin mẫu</CardTitle>
                  <CardDescription>
                    Chi tiết về mẫu quy trình
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Tên mẫu
                      </h3>
                      <p className="text-base font-semibold">{workflow.name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Loại dịch vụ
                      </h3>
                      <Badge variant="outline">
                        {serviceTypeLabels[workflow.service_type] || workflow.service_type}
                      </Badge>
                    </div>
                  </div>

                  {workflow.description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Mô tả
                      </h3>
                      <p className="text-sm">{workflow.description}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Cấu hình thực hiện
                    </h3>
                    <div className="flex items-center gap-2">
                      {workflow.enforce_sequence ? (
                        <Badge variant="default" className="gap-1">
                          <IconCheck className="h-3 w-3" />
                          Thứ tự bắt buộc
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Linh hoạt
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {workflow.enforce_sequence
                          ? "Công việc phải hoàn thành theo đúng thứ tự"
                          : "Công việc có thể hoàn thành không theo thứ tự"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Ngày tạo
                    </h3>
                    <p className="text-sm">
                      {new Date(workflow.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Danh sách công việc ({workflow.tasks?.length || 0})</CardTitle>
                      <CardDescription>
                        Các bước thực hiện trong mẫu quy trình này
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!workflow.tasks || workflow.tasks.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                      Không có công việc nào
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workflow.tasks
                        .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                        .map((task: any, index: number) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 rounded-lg border bg-card p-4"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                              {index + 1}
                            </div>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{task.tasks?.name || "Unknown Task"}</h4>
                                {task.tasks?.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.tasks?.category}
                                  </Badge>
                                )}
                                {task.is_required && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs flex items-center gap-1"
                                  >
                                    <IconCheck className="h-3 w-3" />
                                    Bắt buộc
                                  </Badge>
                                )}
                              </div>

                              {task.custom_instructions && (
                                <p className="text-sm text-muted-foreground">
                                  {task.custom_instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {workflow.enforce_sequence && workflow.tasks && workflow.tasks.length > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Lưu ý:</strong> Mẫu này yêu cầu thực hiện công việc theo thứ tự nghiêm ngặt.
                    Các công việc phải được hoàn thành theo đúng trình tự từ 1 đến {workflow.tasks.length}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
