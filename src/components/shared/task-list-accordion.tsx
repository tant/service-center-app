/**
 * Task List Accordion
 *
 * Displays tasks in an accordion with real-time updates.
 * Integrates with tRPC for automatic task fetching and refresh.
 */

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TicketTaskCard } from '@/components/tickets/ticket-task-card';
import { useEntityTasks } from '@/hooks/use-entity-tasks';
import type { EntityType } from '@/server/services/entity-adapters/base-adapter';

interface TaskListAccordionProps {
  entityType: EntityType;
  entityId: string;
  allowActions?: boolean;
}

/**
 * Task list accordion with real-time updates
 *
 * Features:
 * - Auto-refresh every 30 seconds
 * - Simple loading state
 * - Task count display
 * - Empty state handling
 */
export function TaskListAccordion({
  entityType,
  entityId,
  allowActions = true,
}: TaskListAccordionProps) {
  const { tasks, progress, isLoading, error } = useEntityTasks(entityType, entityId);

  // Loading state
  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm p-4 border rounded-lg">
        Đang tải danh sách công việc...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-destructive text-sm p-4 border border-destructive rounded-lg">
        Lỗi khi tải danh sách công việc: {error.message}
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4 border rounded-lg bg-muted/50">
        Không có workflow nào được gán cho phiếu này.
      </div>
    );
  }

  // Calculate progress
  const completedCount = progress?.completed ?? 0;
  const totalCount = progress?.total ?? tasks.length;

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="tasks">
      <AccordionItem value="tasks">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Công việc quy trình</span>
            <span className="text-sm text-muted-foreground">
              ({completedCount}/{totalCount} hoàn thành)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-4">
            {tasks.map((task) => (
              <TicketTaskCard key={task.id} task={task} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
