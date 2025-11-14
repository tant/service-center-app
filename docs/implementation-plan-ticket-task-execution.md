# Implementation Plan: Ticket Task Execution

**Date:** 2025-11-14
**Status:** Ready for Implementation
**Estimated Time:** 3.5 hours
**Complexity:** Medium

---

## 📋 OVERVIEW

### Objective
Enable full task execution functionality in service ticket detail page, allowing staff to Start/Complete/Block/Unblock tasks directly from the ticket view.

### Current State
- ✅ Backend API complete (`src/server/routers/tasks.ts`)
- ✅ UI components available (`TaskCard`, dialogs)
- ❌ TaskListAccordion is read-only (no actions)
- ❌ Task actions not integrated into ticket detail page

### Target State
- ✅ Full task execution in ticket detail
- ✅ Real-time task updates
- ✅ Clean code with maximum reuse (80%)
- ✅ Consistent patterns with existing codebase

---

## 🎯 STRATEGY: Maximum Code Reuse

### Reusable Assets
1. **`src/components/tasks/task-card.tsx`** ⭐⭐⭐
   - Complete UI with action buttons
   - Supports Start/Complete/Block/Unblock
   - Entity context display
   - **Reuse: 100%**

2. **`src/components/tasks/task-action-dialogs.tsx`** ✅
   - CompleteTaskDialog
   - BlockTaskDialog
   - **Reuse: 100%**

3. **`src/server/routers/tasks.ts`** ✅
   - All API endpoints ready
   - **Reuse: 100%**

4. **Pattern from `use-workflow.ts`** ✅
   - Hook patterns
   - Toast notifications
   - Query invalidation
   - **Reuse: Pattern consistency**

---

## 📝 IMPLEMENTATION PLAN

### PHASE 1: Custom Hooks (1 hour)

#### Create `src/hooks/use-entity-tasks.ts` (NEW)

**Purpose:** Wrapper hooks for tasks router, following `use-workflow.ts` pattern

**Hooks to implement:**
1. `useEntityTasks(entityType, entityId)` - Fetch tasks with auto-refresh
2. `useStartTask()` - Start a task
3. `useCompleteTask()` - Complete with notes
4. `useBlockTask()` - Block with reason
5. `useUnblockTask()` - Unblock task

**Code structure:**
```typescript
'use client';

import { toast } from 'sonner';
import { trpc } from '@/components/providers/trpc-provider';
import type { EntityType } from '@/server/services/entity-adapters/base-adapter';

/**
 * Hook for fetching tasks of a specific entity
 * Auto-refresh every 30s
 */
export function useEntityTasks(entityType: EntityType, entityId: string) {
  const { data, isLoading, error, refetch } = trpc.tasks.getEntityTasks.useQuery(
    { entityType, entityId },
    {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    }
  );

  return {
    tasks: data?.tasks ?? [],
    progress: data?.progress,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for starting a task
 */
export function useStartTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.startTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Đã bắt đầu công việc');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể bắt đầu công việc');
    },
  });

  return {
    startTask: mutation.mutate,
    isStarting: mutation.isPending,
  };
}

/**
 * Hook for completing a task
 */
export function useCompleteTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.completeTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Công việc đã hoàn thành');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể hoàn thành công việc');
    },
  });

  return {
    completeTask: mutation.mutate,
    isCompleting: mutation.isPending,
  };
}

/**
 * Hook for blocking a task
 */
export function useBlockTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.blockTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Công việc đã được đánh dấu chặn');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể chặn công việc');
    },
  });

  return {
    blockTask: mutation.mutate,
    isBlocking: mutation.isPending,
  };
}

/**
 * Hook for unblocking a task
 */
export function useUnblockTask() {
  const utils = trpc.useUtils();
  const mutation = trpc.tasks.unblockTask.useMutation({
    onSuccess: () => {
      utils.tasks.getEntityTasks.invalidate();
      toast.success('Công việc đã được bỏ chặn');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể bỏ chặn công việc');
    },
  });

  return {
    unblockTask: mutation.mutate,
    isUnblocking: mutation.isPending,
  };
}
```

**Checklist:**
- [ ] Create file `src/hooks/use-entity-tasks.ts`
- [ ] Implement all 5 hooks
- [ ] Add TypeScript types
- [ ] Test with React Query Devtools

---

### PHASE 2: Wrapper Component (30 minutes)

#### Create `src/components/tickets/ticket-task-card.tsx` (NEW)

**Purpose:** Wrapper for existing TaskCard, integrating hooks and dialogs

**Code structure:**
```typescript
'use client';

import { useState } from 'react';
import { TaskCard } from '@/components/tasks/task-card';
import {
  CompleteTaskDialog,
  BlockTaskDialog
} from '@/components/tasks/task-action-dialogs';
import {
  useStartTask,
  useCompleteTask,
  useBlockTask,
  useUnblockTask
} from '@/hooks/use-entity-tasks';
import type { TaskWithContext } from '@/server/services/task-service';

interface TicketTaskCardProps {
  task: TaskWithContext;
}

export function TicketTaskCard({ task }: TicketTaskCardProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const { startTask, isStarting } = useStartTask();
  const { completeTask, isCompleting } = useCompleteTask();
  const { blockTask, isBlocking } = useBlockTask();
  const { unblockTask, isUnblocking } = useUnblockTask();

  const isLoading = isStarting || isCompleting || isBlocking || isUnblocking;

  const handleStartTask = () => {
    startTask({ taskId: task.id });
  };

  const handleCompleteTask = () => {
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = (notes: string) => {
    completeTask({
      taskId: task.id,
      completionNotes: notes,
    });
    setShowCompleteDialog(false);
  };

  const handleBlockTask = () => {
    setShowBlockDialog(true);
  };

  const handleConfirmBlock = (reason: string) => {
    blockTask({
      taskId: task.id,
      blockedReason: reason,
    });
    setShowBlockDialog(false);
  };

  const handleUnblockTask = () => {
    unblockTask({ taskId: task.id });
  };

  return (
    <>
      <TaskCard
        task={task}
        onStartTask={handleStartTask}
        onCompleteTask={handleCompleteTask}
        onBlockTask={handleBlockTask}
        onUnblockTask={handleUnblockTask}
        isLoading={isLoading}
      />

      <CompleteTaskDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={handleConfirmComplete}
        taskName={task.name}
        isLoading={isCompleting}
      />

      <BlockTaskDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        onConfirm={handleConfirmBlock}
        taskName={task.name}
        isLoading={isBlocking}
      />
    </>
  );
}
```

**Benefits:**
- ✅ 100% reuse of TaskCard UI
- ✅ 100% reuse of dialogs
- ✅ Clean separation of concerns
- ✅ Easy to test

**Checklist:**
- [ ] Create file `src/components/tickets/ticket-task-card.tsx`
- [ ] Wire up all hooks
- [ ] Wire up dialogs
- [ ] Handle loading states
- [ ] Test component standalone

---

### PHASE 3: Upgrade TaskListAccordion (1 hour)

#### Modify `src/components/shared/task-list-accordion.tsx`

**Changes:**
1. Add tRPC integration with `useEntityTasks`
2. Use `TicketTaskCard` instead of static div
3. Add progress bar
4. Add loading skeleton
5. Add error handling

**New code:**
```typescript
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TicketTaskCard } from '@/components/tickets/ticket-task-card';
import { useEntityTasks } from '@/hooks/use-entity-tasks';
import { Skeleton } from '@/components/ui/skeleton';
import type { EntityType } from '@/server/services/entity-adapters/base-adapter';

interface TaskListAccordionProps {
  entityType: EntityType;
  entityId: string;
  allowActions?: boolean;
}

export function TaskListAccordion({
  entityType,
  entityId,
  allowActions = true,
}: TaskListAccordionProps) {
  const { tasks, progress, isLoading, error } = useEntityTasks(entityType, entityId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-sm p-4 border border-destructive rounded-lg">
        Lỗi khi tải danh sách công việc: {error.message}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4 border rounded-lg bg-muted/50">
        Không có workflow nào được gán cho phiếu này.
      </div>
    );
  }

  const completedCount = progress?.completed_count ?? 0;
  const totalCount = progress?.total_count ?? tasks.length;
  const percentage = progress?.completion_percentage ?? 0;

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="tasks">
      <AccordionItem value="tasks">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex flex-col items-start gap-2 w-full">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Công việc quy trình</span>
              <span className="text-sm text-muted-foreground">
                ({completedCount}/{totalCount} hoàn thành)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
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
```

**Checklist:**
- [ ] Backup original file
- [ ] Rewrite with tRPC integration
- [ ] Add progress bar
- [ ] Add loading skeleton
- [ ] Add error handling
- [ ] Test auto-refresh (30s)

---

### PHASE 4: Integration (15 minutes)

#### Modify `src/app/(auth)/operations/tickets/[id]/page.tsx`

**Changes:**
1. Remove manual task fetch (lines 177-195)
2. Remove `tasks: tasks || []` from return object (line 199)
3. Update TaskListAccordion props

**Code changes:**

```typescript
// ❌ DELETE: Lines 175-199
// Remove this entire section:
/*
  const { data: tasks } = await supabase
    .from("entity_tasks")
    .select(`
      *,
      task_type:tasks!task_id(
        id,
        name,
        category,
        description
      ),
      assigned_to:profiles!assigned_to_id(
        id,
        full_name,
        role
      )
    `)
    .eq("entity_type", "service_ticket")
    .eq("entity_id", ticketId)
    .order("sequence_order", { ascending: true });

  return { ...ticket, tasks: tasks || [] };
*/

// ✅ REPLACE with:
return ticket;
```

```tsx
// ✅ UPDATE: Around line 440-453
// Replace:
<CardContent>
  <TaskListAccordion tasks={ticket.tasks || []} />
</CardContent>

// With:
<CardContent>
  <TaskListAccordion
    entityType="service_ticket"
    entityId={ticketId}
    allowActions={ticket.status !== 'completed' && ticket.status !== 'cancelled'}
  />
</CardContent>
```

**Checklist:**
- [ ] Remove manual task fetch
- [ ] Update return statement
- [ ] Update TaskListAccordion props
- [ ] Test on ticket detail page

---

## 📂 FILE SUMMARY

### New Files (2 files)
1. **`src/hooks/use-entity-tasks.ts`** (NEW)
   - ~150 lines
   - 5 custom hooks
   - Pattern: Similar to use-workflow.ts

2. **`src/components/tickets/ticket-task-card.tsx`** (NEW)
   - ~80 lines
   - Wrapper component
   - Integrates hooks + dialogs

### Modified Files (2 files)
3. **`src/components/shared/task-list-accordion.tsx`** (MODIFY)
   - ~100 lines (rewrite)
   - Add tRPC integration
   - Add progress bar

4. **`src/app/(auth)/operations/tickets/[id]/page.tsx`** (MODIFY - Minor)
   - Delete ~20 lines (manual fetch)
   - Update 3 lines (props)
   - Total: ~15 lines changed

### Reused Files (NO changes)
- ✅ `src/components/tasks/task-card.tsx` (Reuse 100%)
- ✅ `src/components/tasks/task-action-dialogs.tsx` (Reuse 100%)
- ✅ `src/components/shared/task-status-badge.tsx` (Reuse 100%)
- ✅ `src/server/routers/tasks.ts` (Reuse 100%)
- ✅ `src/server/services/task-service.ts` (Reuse 100%)

---

## ⏱️ TIME ESTIMATE

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| **Phase 1** | Create custom hooks | 1 hour | Medium |
| **Phase 2** | Create wrapper component | 30 min | Easy |
| **Phase 3** | Upgrade TaskListAccordion | 1 hour | Medium |
| **Phase 4** | Integration | 15 min | Easy |
| **Testing** | Manual testing | 45 min | Easy |
| **TOTAL** | | **3.5 hours** | Medium |

---

## ✅ TESTING CHECKLIST

### Functional Testing
- [ ] **Start Task**
  - [ ] Pending task → In progress
  - [ ] Button changes to "Hoàn thành" + "Báo chặn"
  - [ ] Toast notification appears
  - [ ] Task list refreshes

- [ ] **Complete Task**
  - [ ] Dialog opens when clicked
  - [ ] Validation: notes required
  - [ ] Task status → Completed
  - [ ] Task list refreshes
  - [ ] Toast notification appears

- [ ] **Block Task**
  - [ ] Dialog opens when clicked
  - [ ] Validation: reason required
  - [ ] Task status → Blocked
  - [ ] Button changes to "Bỏ chặn"
  - [ ] Toast notification appears

- [ ] **Unblock Task**
  - [ ] Blocked task → Pending
  - [ ] Can start again
  - [ ] Toast notification appears

### Integration Testing
- [ ] Auto-refresh every 30s works
- [ ] Refresh on window focus works
- [ ] Progress bar updates correctly
- [ ] Loading skeleton shows during fetch
- [ ] Error handling displays properly

### Edge Cases
- [ ] Completed ticket → No action buttons
- [ ] Cancelled ticket → No action buttons
- [ ] No tasks → Empty state message
- [ ] API error → Error message displays

### Cross-role Testing
- [ ] Admin can see/do all actions
- [ ] Manager can see/do all actions
- [ ] Technician can only act on assigned tasks
- [ ] Reception can view but not act (if applicable)

---

## 🎯 SUCCESS CRITERIA

### Must Have
- ✅ All task actions work (Start/Complete/Block/Unblock)
- ✅ Real-time updates (30s auto-refresh)
- ✅ Dialogs show and validate input
- ✅ Toast notifications on success/error
- ✅ Progress bar shows completion percentage
- ✅ No console errors
- ✅ TypeScript types correct

### Nice to Have
- ✅ Loading states smooth
- ✅ Animations pleasant
- ✅ Error messages helpful
- ✅ Mobile responsive

---

## 📊 METRICS

### Code Quality
- **Code Reuse:** 80% (vs 40% in original plan)
- **Lines of Code:** ~350 lines (vs ~600 in original plan)
- **TypeScript Coverage:** 100%
- **Component Complexity:** Low-Medium

### Performance
- **Initial Load:** <500ms (cached)
- **Action Response:** <200ms
- **Auto-refresh:** Every 30s
- **Bundle Size Impact:** +8KB (minimal)

---

## 🚨 RISKS & MITIGATION

### Risk 1: API Performance
**Issue:** Fetching tasks every 30s may impact performance

**Mitigation:**
- Use React Query caching
- Only fetch if page is visible (refetchOnWindowFocus)
- Backend has proper indexes on entity_tasks table

### Risk 2: User Confusion
**Issue:** Users may not understand task workflow

**Mitigation:**
- Clear button labels
- Toast notifications for feedback
- Progress bar shows completion
- Empty state messages helpful

### Risk 3: Permission Issues
**Issue:** Wrong users might see/do actions

**Mitigation:**
- Backend validates permissions (already implemented)
- Frontend shows only allowed actions
- Test with all roles

---

## 📚 REFERENCES

### Related Documentation
- **Original Analysis:** Initial plan document (this file, previous version)
- **API Documentation:** `src/server/routers/tasks.ts` (comments)
- **User Guide:** `docs/USER-GUIDE-TASK-MANAGEMENT.md`
- **Architecture:** `docs/ARCHITECTURE-MASTER.md` (Polymorphic Task System section)

### Key Files
- Backend: `src/server/routers/tasks.ts`
- Backend: `src/server/services/task-service.ts`
- Hooks: `src/hooks/use-workflow.ts` (pattern reference)
- Components: `src/components/tasks/task-card.tsx`
- Dialogs: `src/components/tasks/task-action-dialogs.tsx`

---

## 🔄 ROLLBACK PLAN

If issues occur during implementation:

### Phase 1-2 Issues
- **Action:** Simply don't use the new files
- **Impact:** Zero (nothing integrated yet)

### Phase 3 Issues
- **Action:** Restore TaskListAccordion from backup
- **Impact:** Return to read-only view

### Phase 4 Issues
- **Action:** Git revert ticket detail page changes
- **Impact:** Return to manual fetch (still works)

### Complete Rollback
```bash
git checkout HEAD -- src/components/shared/task-list-accordion.tsx
git checkout HEAD -- src/app/(auth)/operations/tickets/[id]/page.tsx
rm src/hooks/use-entity-tasks.ts
rm src/components/tickets/ticket-task-card.tsx
```

---

## 📝 NOTES

### Design Decisions

**Q: Why create new hooks instead of using existing use-workflow.ts?**
A: `use-workflow.ts` is tied to old workflow router. New `tasks` router has different endpoints and response shapes. Clean separation prevents confusion.

**Q: Why wrapper component (TicketTaskCard) instead of using TaskCard directly?**
A: TaskCard is generic and used in multiple places. TicketTaskCard encapsulates ticket-specific logic (hooks, dialogs) without polluting TaskCard.

**Q: Why not use task-execution-card.tsx instead?**
A: `task-execution-card.tsx` uses old hooks and patterns. `TaskCard` is newer, cleaner, and more complete.

### Future Enhancements
- [ ] Add task attachments upload
- [ ] Add task comments
- [ ] Add task reassignment UI
- [ ] Add keyboard shortcuts (e.g., Ctrl+Enter to complete)
- [ ] Add bulk actions (complete multiple tasks)
- [ ] Add task time tracking visualization

---

## ✅ COMPLETION CHECKLIST

### Before Implementation
- [ ] Read through entire plan
- [ ] Understand all phases
- [ ] Check all dependencies are available
- [ ] Create git branch: `feature/ticket-task-execution`

### During Implementation
- [ ] Follow phases in order
- [ ] Test each phase before moving to next
- [ ] Commit after each phase
- [ ] Keep backup of modified files

### After Implementation
- [ ] Run all tests in checklist
- [ ] Test with different roles
- [ ] Check console for errors
- [ ] Check network tab for API calls
- [ ] Verify auto-refresh works
- [ ] Get team member to review

### Deployment
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor for errors

---

**Status:** ✅ Ready for Implementation
**Owner:** Development Team
**Last Updated:** 2025-11-14

---

*End of Implementation Plan*
