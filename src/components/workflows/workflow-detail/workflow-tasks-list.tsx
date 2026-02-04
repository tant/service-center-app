/**
 * Tasks list component for workflow detail
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkflowTaskItemCard } from "./workflow-task-item";
import type { WorkflowTaskItem } from "./types";

interface WorkflowTasksListProps {
  tasks: WorkflowTaskItem[];
  enforceSequence: boolean;
}

export function WorkflowTasksList({ tasks, enforceSequence }: WorkflowTasksListProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách công việc ({tasks.length})</CardTitle>
              <CardDescription>
                Các bước thực hiện trong mẫu quy trình này
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              Không có công việc nào
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task, index) => (
                <WorkflowTaskItemCard key={task.id} task={task} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {enforceSequence && tasks.length > 0 && (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Lưu ý:</strong> Mẫu này yêu cầu thực hiện công việc theo thứ tự
            nghiêm ngặt. Các công việc phải được hoàn thành theo đúng trình tự từ 1
            đến {tasks.length}.
          </p>
        </div>
      )}
    </>
  );
}
