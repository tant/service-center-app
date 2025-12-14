/**
 * Workflow Preview Component
 *
 * Read-only visual preview of workflow with task flow diagram
 */

import { CheckCircle, Clock, AlertCircle, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface WorkflowTask {
  id: string;
  task_type_id: string;
  task_name?: string;
  sequence_order: number;
  is_required: boolean;
  custom_instructions?: string;
}

interface WorkflowPreviewProps {
  name: string;
  description?: string;
  entity_type?: "service_ticket" | "inventory_receipt" | "inventory_issue" | "inventory_transfer" | "service_request";
  enforce_sequence: boolean;
  tasks: WorkflowTask[];
  notes?: string;
  className?: string;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  service_ticket: "Phiếu sửa chữa",
  service_request: "Phiếu yêu cầu dịch vụ",
  inventory_receipt: "Phiếu nhập kho",
  inventory_issue: "Phiếu xuất kho",
  inventory_transfer: "Phiếu chuyển kho",
};

export function WorkflowPreview({
  name,
  description,
  entity_type,
  enforce_sequence,
  tasks,
  notes,
  className,
}: WorkflowPreviewProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{name || "Quy trình chưa có tên"}</CardTitle>
              {description && (
                <CardDescription className="text-base">{description}</CardDescription>
              )}
            </div>
            {entity_type && (
              <Badge variant="outline">
                {ENTITY_TYPE_LABELS[entity_type] || entity_type}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{tasks.length} công việc</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              {enforce_sequence ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Thực hiện theo thứ tự</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Thực hiện linh hoạt</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Luồng công việc</CardTitle>
          <CardDescription>
            Trình tự thực hiện các công việc trong quy trình
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có công việc nào trong quy trình
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task, index) => (
                <div key={task.id || index}>
                  <TaskPreviewCard
                    task={task}
                    index={index}
                    enforceSequence={enforce_sequence}
                  />
                  {index < sortedTasks.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes and Documentation */}
      {notes && (
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú và hướng dẫn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {notes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tổng số công việc</p>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Công việc bắt buộc</p>
              <p className="text-2xl font-bold">
                {tasks.filter(t => t.is_required).length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Công việc tùy chọn</p>
              <p className="text-2xl font-bold">
                {tasks.filter(t => !t.is_required).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Individual task preview card
 */
interface TaskPreviewCardProps {
  task: WorkflowTask;
  index: number;
  enforceSequence: boolean;
}

function TaskPreviewCard({ task, index, enforceSequence }: TaskPreviewCardProps) {
  return (
    <Card className={task.is_required ? 'border-blue-200 bg-blue-50/50' : ''}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Step number */}
          <div className="flex-shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                task.is_required
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              <span className="text-sm font-semibold">{index + 1}</span>
            </div>
          </div>

          {/* Task details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h4 className="font-medium">
                {task.task_name || `Task ${index + 1}`}
              </h4>
              <Badge variant={task.is_required ? 'default' : 'secondary'}>
                {task.is_required ? 'Bắt buộc' : 'Tùy chọn'}
              </Badge>
            </div>

            {task.custom_instructions && (
              <p className="text-sm text-muted-foreground">
                {task.custom_instructions}
              </p>
            )}

            {!enforceSequence && index > 0 && (
              <p className="text-xs text-yellow-600">
                ⚠️ Có thể thực hiện song song với các công việc khác
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
