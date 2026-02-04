/**
 * Workflow information card component
 */

import { IconCheck } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ENTITY_TYPE_LABELS } from "@/lib/constants/workflow";
import type { WorkflowDetailData } from "./types";

interface WorkflowInfoCardProps {
  workflow: WorkflowDetailData;
}

export function WorkflowInfoCard({ workflow }: WorkflowInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin mẫu</CardTitle>
        <CardDescription>Chi tiết về mẫu quy trình</CardDescription>
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
              Loại tài liệu áp dụng
            </h3>
            <Badge variant="outline">
              {workflow.entity_type
                ? ENTITY_TYPE_LABELS[workflow.entity_type] || workflow.entity_type
                : "Chưa xác định"}
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
              <Badge variant="secondary">Linh hoạt</Badge>
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
  );
}
