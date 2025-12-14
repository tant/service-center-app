/**
 * Analytics Router
 * Provides task statistics and performance metrics
 */

import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { requireManagerOrAbove } from "../middleware/requireRole";

export const analyticsRouter = router({
  // Get task type statistics
  getTaskTypeStats: publicProcedure
    .use(requireManagerOrAbove)
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("task_statistics")
        .select("*")
        .order("total_executions", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch task statistics: ${error.message}`);
      }

      return data || [];
    }),

  // Get user performance metrics
  getUserPerformance: publicProcedure
    .use(requireManagerOrAbove)
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      let query = ctx.supabaseAdmin
        .from("entity_tasks")
        .select(`
          assigned_to_id,
          started_at,
          completed_at,
          status,
          profiles:assigned_to_id(full_name, email)
        `)
        .not("assigned_to_id", "is", null)
        .eq("status", "completed")
        .not("started_at", "is", null)
        .not("completed_at", "is", null);

      if (input?.dateFrom) {
        query = query.gte("completed_at", input.dateFrom);
      }

      if (input?.dateTo) {
        query = query.lte("completed_at", input.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch user performance: ${error.message}`);
      }

      // Aggregate by user
      const userStats = (data || []).reduce((acc: any, task: any) => {
        const userId = task.assigned_to_id;
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: task.profiles?.full_name || "Unknown",
            email: task.profiles?.email,
            tasksCompleted: 0,
            totalHours: 0,
          };
        }

        acc[userId].tasksCompleted++;

        const duration = (new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / (1000 * 60 * 60);
        acc[userId].totalHours += duration;

        return acc;
      }, {});

      return Object.values(userStats).map((stat: any) => ({
        ...stat,
        avgHours: stat.tasksCompleted > 0 ? (stat.totalHours / stat.tasksCompleted).toFixed(2) : 0,
      }));
    }),
});
