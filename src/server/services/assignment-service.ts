/**
 * Assignment Service
 * Smart task assignment suggestions based on workload
 */

import type { TRPCContext } from "../trpc";

export interface AssignmentSuggestion {
  userId: string;
  userName: string;
  email: string;
  reason: string;
  workload: number;
  avgCompletionTime: number | null;
}

export class AssignmentService {
  constructor(private ctx: TRPCContext) {}

  /**
   * Suggest best assignee for a task based on workload
   */
  async suggestAssignee(taskId: string): Promise<AssignmentSuggestion | null> {
    // Get task details
    const { data: task } = await this.ctx.supabaseAdmin
      .from("entity_tasks")
      .select("task_id, entity_type")
      .eq("id", taskId)
      .single();

    if (!task) {
      return null;
    }

    // Get all eligible users (technicians and managers)
    const { data: users } = await this.ctx.supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["technician", "manager", "admin"]);

    if (!users || users.length === 0) {
      return null;
    }

    // Calculate workload for each user
    const userWorkloads = await Promise.all(
      users.map(async (user) => {
        // Count active tasks
        const { count: activeCount } = await this.ctx.supabaseAdmin
          .from("entity_tasks")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to_id", user.id)
          .in("status", ["pending", "in_progress"]);

        // Get average completion time for this task type
        const { data: stats } = await this.ctx.supabaseAdmin
          .from("entity_tasks")
          .select("started_at, completed_at")
          .eq("assigned_to_id", user.id)
          .eq("task_id", task.task_id)
          .eq("status", "completed")
          .not("started_at", "is", null)
          .not("completed_at", "is", null)
          .limit(10);

        let avgHours: number | null = null;
        if (stats && stats.length > 0) {
          const durations = stats.map((s) => {
            const start = new Date(s.started_at!);
            const end = new Date(s.completed_at!);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          });
          avgHours = durations.reduce((a, b) => a + b, 0) / durations.length;
        }

        return {
          userId: user.id,
          userName: user.full_name,
          email: user.email,
          workload: activeCount || 0,
          avgCompletionTime: avgHours,
        };
      })
    );

    // Sort by workload (lowest first)
    userWorkloads.sort((a, b) => a.workload - b.workload);

    const best = userWorkloads[0];

    if (!best) {
      return null;
    }

    // Generate reason
    let reason = `${best.userName} có ${best.workload} công việc đang thực hiện`;
    if (best.workload === 0) {
      reason = `${best.userName} hiện không có công việc nào`;
    } else if (best.avgCompletionTime) {
      reason += ` và thường hoàn thành trong ${best.avgCompletionTime.toFixed(1)}h`;
    }

    return {
      ...best,
      reason,
    };
  }
}
