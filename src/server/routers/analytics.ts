/**
 * Analytics Router
 * Provides task statistics and performance metrics
 */

import { z } from "zod";
import {
  requireAnyAuthenticated,
  requireManagerOrAbove,
} from "../middleware/requireRole";
import { publicProcedure, router } from "../trpc";

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
    .input(
      z
        .object({
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .optional(),
    )
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

        const duration =
          (new Date(task.completed_at).getTime() -
            new Date(task.started_at).getTime()) /
          (1000 * 60 * 60);
        acc[userId].totalHours += duration;

        return acc;
      }, {});

      return Object.values(userStats).map((stat: any) => ({
        ...stat,
        avgHours:
          stat.tasksCompleted > 0
            ? (stat.totalHours / stat.tasksCompleted).toFixed(2)
            : 0,
      }));
    }),

  /**
   * Get employee performance metrics for dashboard
   * Shows ticket statistics per technician/manager
   */
  getEmployeePerformance: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      // Get all technical staff profiles
      const { data: profiles, error: profilesError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, role")
        .in("role", ["technician", "manager"]);

      if (profilesError) {
        throw new Error(
          `Failed to fetch profiles: ${profilesError.message}`,
        );
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      const userIds = profiles.map((p) => p.user_id);

      // Get all tickets assigned to these employees
      const { data: tickets, error: ticketsError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("assigned_to, status")
        .in("assigned_to", userIds);

      if (ticketsError) {
        throw new Error(
          `Failed to fetch tickets: ${ticketsError.message}`,
        );
      }

      // Group ticket counts by employee in memory
      const statsMap = new Map<
        string,
        {
          total: number;
          in_progress: number;
          completed: number;
          pending: number;
        }
      >();

      for (const ticket of tickets || []) {
        if (!ticket.assigned_to) continue;
        const stats = statsMap.get(ticket.assigned_to) ?? {
          total: 0,
          in_progress: 0,
          completed: 0,
          pending: 0,
        };
        stats.total++;
        if (ticket.status === "in_progress") stats.in_progress++;
        else if (ticket.status === "completed") stats.completed++;
        else if (ticket.status === "pending") stats.pending++;
        statsMap.set(ticket.assigned_to, stats);
      }

      return profiles.map((profile) => {
        const stats = statsMap.get(profile.user_id);
        const total = stats?.total ?? 0;
        const completed = stats?.completed ?? 0;
        return {
          id: profile.user_id,
          fullName: profile.full_name,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          totalAssigned: total,
          inProgress: stats?.in_progress ?? 0,
          completed,
          pending: stats?.pending ?? 0,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
        };
      });
    }),
});
