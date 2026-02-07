/**
 * Dashboard Router
 *
 * Provides real-time metrics and insights for Manager Dashboard
 * - Flow board visualization (tickets by status)
 * - Team status and workload monitoring
 * - Critical alerts (aging tickets, low stock, bottlenecks)
 * - Daily/weekly metrics and trends
 */

import { z } from "zod";
import {
  requireAnyAuthenticated,
  requireManagerOrAbove,
} from "../middleware/requireRole";
import { publicProcedure, router } from "../trpc";

/**
 * 1. Flow Board API
 * Returns tickets grouped by status with top 5 tickets per status
 */
export const dashboardRouter = router({
  /**
   * Get flow board data - Kanban-style ticket distribution
   *
   * Returns tickets grouped by status with:
   * - Total count per status
   * - Top 5 tickets (oldest first)
   * - Days in current status
   *
   * @auth Required (any authenticated user)
   */
  getFlowBoard: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      // Get all active tickets grouped by status
      const { data: tickets, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id, ticket_number, status, priority_level, updated_at")
        .not("status", "in", '("completed","cancelled")')
        .order("updated_at", { ascending: true });

      if (error) {
        console.error("Failed to get flow board:", error);
        throw new Error(`Failed to get flow board: ${error.message}`);
      }

      // Group tickets by status
      const statusGroups = new Map<
        string,
        Array<{
          id: string;
          ticket_number: string;
          days_in_status: number;
          priority_level: string;
        }>
      >();

      (tickets || []).forEach((ticket) => {
        const daysInStatus = Math.floor(
          (Date.now() - new Date(ticket.updated_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const ticketInfo = {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          days_in_status: daysInStatus,
          priority_level: ticket.priority_level,
        };

        if (!statusGroups.has(ticket.status)) {
          statusGroups.set(ticket.status, []);
        }
        statusGroups.get(ticket.status)?.push(ticketInfo);
      });

      // Build response with count and top 5 tickets per status
      const flowBoard: Record<
        string,
        {
          count: number;
          tickets: Array<{
            id: string;
            ticket_number: string;
            days_in_status: number;
            priority_level: string;
          }>;
        }
      > = {};

      statusGroups.forEach((ticketList, status) => {
        flowBoard[status] = {
          count: ticketList.length,
          tickets: ticketList.slice(0, 5), // Top 5 oldest
        };
      });

      return flowBoard;
    }),

  /**
   * Get team real-time status
   *
   * Returns all active team members with:
   * - Current task (if any)
   * - Active tasks count
   * - Pending tasks count
   * - Status indicator (active/available/overloaded)
   *
   * @auth Required (any authenticated user)
   */
  getTeamStatus: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      // Get all active team members
      const { data: profiles, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("role", ["technician", "reception", "manager"])
        .eq("is_active", true)
        .order("full_name");

      if (profileError) {
        console.error("Failed to get profiles:", profileError);
        throw new Error(`Failed to get team status: ${profileError.message}`);
      }

      // Get all tasks for these members
      const profileIds = (profiles || []).map((p) => p.id);

      const { data: tasks, error: tasksError } = await ctx.supabaseAdmin
        .from("entity_tasks")
        .select(`
          id,
          name,
          status,
          assigned_to_id,
          started_at,
          entity_type,
          entity_id,
          service_tickets!inner(ticket_number)
        `)
        .in("assigned_to_id", profileIds)
        .in("status", ["pending", "in_progress"])
        .eq("entity_type", "service_ticket");

      if (tasksError) {
        console.error("Failed to get tasks:", tasksError);
      }

      // Type for task with joined service_tickets
      type TaskWithTicket = {
        id: string;
        name: string;
        status: string;
        assigned_to_id: string;
        started_at: string | null;
        entity_type: string;
        entity_id: string;
        service_tickets: { ticket_number: string } | null;
      };

      // Build team status
      const teamStatus = (profiles || []).map((profile) => {
        const userTasks = ((tasks as TaskWithTicket[] | null) || []).filter(
          (t) => t.assigned_to_id === profile.id,
        );

        const activeTasks = userTasks.filter((t) => t.status === "in_progress");
        const pendingTasks = userTasks.filter((t) => t.status === "pending");

        // Get most recent active task
        const currentTask =
          activeTasks.length > 0
            ? {
                task_id: activeTasks[0].id,
                task_name: activeTasks[0].name,
                ticket_number:
                  activeTasks[0].service_tickets?.ticket_number || null,
                ticket_id: activeTasks[0].entity_id,
              }
            : null;

        return {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role,
          active_tasks: activeTasks.length,
          pending_tasks: pendingTasks.length,
          current_task: currentTask,
        };
      });

      return teamStatus;
    }),

  /**
   * Get critical alerts
   *
   * Aggregates all critical issues requiring attention:
   * - Aging tickets (> threshold days)
   * - Blocked tickets
   * - Low stock items
   * - Bottlenecks (optional)
   *
   * @auth Required (any authenticated user)
   */
  getCriticalAlerts: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z
        .object({
          agingThreshold: z.number().int().positive().default(7),
          lowStockThreshold: z.number().int().positive().default(5),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const agingThreshold = input?.agingThreshold || 7;
      const _lowStockThreshold = input?.lowStockThreshold || 5;

      // 1. Get aging tickets (tickets older than threshold)
      const { data: agingTickets, error: agingError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select(
          "id, ticket_number, status, customer_id, created_at, updated_at",
        )
        .not("status", "in", '("completed","cancelled")')
        .lt(
          "created_at",
          new Date(
            Date.now() - agingThreshold * 24 * 60 * 60 * 1000,
          ).toISOString(),
        )
        .order("created_at", { ascending: true })
        .limit(20);

      if (agingError) {
        console.error("Failed to get aging tickets:", agingError);
      }

      // Calculate age and days since update
      const agingTicketsWithAge = (agingTickets || []).map((ticket) => {
        const ageMs = Date.now() - new Date(ticket.created_at).getTime();
        const updateMs = Date.now() - new Date(ticket.updated_at).getTime();
        return {
          ...ticket,
          age_days: Math.floor(ageMs / (1000 * 60 * 60 * 24)),
          days_since_update: Math.floor(updateMs / (1000 * 60 * 60 * 24)),
        };
      });

      // 2. Get blocked tickets
      const { data: blockedTasks, error: blockedError } =
        await ctx.supabaseAdmin
          .from("entity_tasks")
          .select(`
            id,
            name,
            blocked_reason,
            entity_id,
            entity_type,
            service_tickets!inner(ticket_number)
          `)
          .eq("status", "blocked")
          .eq("entity_type", "service_ticket")
          .limit(20);

      if (blockedError) {
        console.error("Failed to get blocked tickets:", blockedError);
      }

      type BlockedTaskWithTicket = {
        id: string;
        name: string;
        blocked_reason: string | null;
        entity_id: string;
        entity_type: string;
        service_tickets: { ticket_number: string } | null;
      };

      const blockedTickets = (
        (blockedTasks as BlockedTaskWithTicket[] | null) || []
      ).map((task) => ({
        id: task.entity_id,
        ticket_number: task.service_tickets?.ticket_number,
        blocked_reason: task.blocked_reason,
        task_name: task.name,
      }));

      // 3. Get low stock items from view
      const { data: lowStockItems, error: stockError } = await ctx.supabaseAdmin
        .from("v_low_stock_alerts")
        .select("*")
        .eq("alert_enabled", true)
        .order("quantity_below_minimum", { ascending: false })
        .limit(10);

      if (stockError) {
        console.error("Failed to get low stock items:", stockError);
      }

      // 4. Bottlenecks - simplified version (no statistical analysis yet)
      // Count tickets by status to identify abnormal distribution
      const { data: statusCounts, error: statusError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("status")
        .not("status", "in", '("completed","cancelled")');

      if (statusError) {
        console.error("Failed to get status counts:", statusError);
      }

      const bottlenecks: Array<{
        status: string;
        count: number;
        avg_count: number;
        deviation_percent: number;
      }> = [];

      if (statusCounts && statusCounts.length > 0) {
        // Group by status
        const statusMap = new Map<string, number>();
        statusCounts.forEach((ticket) => {
          statusMap.set(ticket.status, (statusMap.get(ticket.status) || 0) + 1);
        });

        // Calculate average
        const avgCount = statusCounts.length / statusMap.size;

        // Find statuses significantly above average (>50% deviation)
        statusMap.forEach((count, status) => {
          const deviationPercent = ((count - avgCount) / avgCount) * 100;
          if (deviationPercent > 50) {
            bottlenecks.push({
              status,
              count,
              avg_count: Math.round(avgCount),
              deviation_percent: Math.round(deviationPercent),
            });
          }
        });
      }

      return {
        agingTickets: agingTicketsWithAge,
        blockedTickets,
        lowStockItems: lowStockItems || [],
        bottlenecks,
      };
    }),

  /**
   * Get today's metrics
   *
   * Returns daily performance metrics:
   * - New tickets received today
   * - Tickets completed today
   * - Work in progress count
   * - Average cycle time (7-day rolling)
   *
   * @auth Required (any authenticated user)
   */
  getTodayMetrics: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Get all tickets for calculations
      const { data: allTickets, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id, created_at, completed_at, status");

      if (error) {
        console.error("Failed to get tickets for metrics:", error);
        throw new Error(`Failed to get today metrics: ${error.message}`);
      }

      const tickets = allTickets || [];

      // Calculate metrics
      const newToday = tickets.filter((t) =>
        t.created_at.startsWith(today),
      ).length;

      const completedToday = tickets.filter((t) =>
        t.completed_at?.startsWith(today),
      ).length;

      const wipCount = tickets.filter(
        (t) => t.status !== "completed" && t.status !== "cancelled",
      ).length;

      // Calculate avg cycle time for completed tickets in last 7 days
      const recentCompleted = tickets.filter(
        (t) => t.completed_at && t.completed_at >= sevenDaysAgo && t.created_at,
      );

      let avgCycleTimeDays: number | null = null;
      if (recentCompleted.length > 0) {
        const totalCycleTimeMs = recentCompleted.reduce((sum, t) => {
          // completed_at is guaranteed to exist due to filter above
          const completedAt = t.completed_at || "";
          const cycleMs =
            new Date(completedAt).getTime() - new Date(t.created_at).getTime();
          return sum + cycleMs;
        }, 0);

        avgCycleTimeDays =
          Math.round(
            (totalCycleTimeMs /
              recentCompleted.length /
              (1000 * 60 * 60 * 24)) *
              10,
          ) / 10; // Round to 1 decimal
      }

      return {
        new_today: newToday,
        completed_today: completedToday,
        wip_count: wipCount,
        avg_cycle_time_days: avgCycleTimeDays,
      };
    }),

  /**
   * Get week performance
   *
   * Returns weekly performance metrics:
   * - Tickets received this week
   * - Tickets completed this week
   * - Throughput (tickets/day)
   *
   * @auth Required (any authenticated user)
   */
  getWeekPerformance: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartISO = weekStart.toISOString();

      const { data: tickets, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id, created_at, completed_at");

      if (error) {
        console.error("Failed to get week performance:", error);
        throw new Error(`Failed to get week performance: ${error.message}`);
      }

      const allTickets = tickets || [];

      const receivedThisWeek = allTickets.filter(
        (t) => t.created_at >= weekStartISO,
      ).length;

      const completedThisWeek = allTickets.filter(
        (t) => t.completed_at && t.completed_at >= weekStartISO,
      ).length;

      // Calculate days elapsed in current week
      const daysElapsed = Math.max(
        1,
        Math.ceil(
          (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const throughput =
        Math.round((completedThisWeek / daysElapsed) * 10) / 10;

      return {
        received_this_week: receivedThisWeek,
        completed_this_week: completedThisWeek,
        throughput,
      };
    }),

  /**
   * Get trend data
   *
   * Returns time-series data showing ticket trends:
   * - Daily received count
   * - Daily completed count
   * - Date range: last N days
   *
   * @auth Required (any authenticated user)
   */
  getTrendData: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z
        .object({
          days: z.number().int().min(7).max(90).default(7),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days || 7;

      // Generate date range
      const dateRange: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateRange.push(date.toISOString().split("T")[0]); // YYYY-MM-DD
      }

      // Get all tickets
      const { data: tickets, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id, created_at, completed_at");

      if (error) {
        console.error("Failed to get trend data:", error);
        throw new Error(`Failed to get trend data: ${error.message}`);
      }

      // Build trend data
      const trendData = dateRange.map((date) => {
        const received = (tickets || []).filter((t) =>
          t.created_at.startsWith(date),
        ).length;

        const completed = (tickets || []).filter((t) =>
          t.completed_at?.startsWith(date),
        ).length;

        return {
          date,
          received,
          completed,
        };
      });

      return trendData;
    }),

  /**
   * Get bottleneck analysis (Manager only)
   *
   * Advanced statistical analysis of workflow bottlenecks:
   * - Identifies stages with abnormal ticket accumulation
   * - Compares current vs historical averages
   * - Highlights deviations requiring intervention
   *
   * @auth Required (Manager or above)
   */
  getBottlenecks: publicProcedure
    .use(requireManagerOrAbove)
    .query(async ({ ctx }) => {
      // Get current status distribution
      const { data: currentStatus, error: currentError } =
        await ctx.supabaseAdmin
          .from("service_tickets")
          .select("status")
          .not("status", "in", '("completed","cancelled")');

      if (currentError) {
        console.error("Failed to get current status:", currentError);
        throw new Error(
          `Failed to analyze bottlenecks: ${currentError.message}`,
        );
      }

      // Group by status
      const statusMap = new Map<string, number>();
      (currentStatus || []).forEach((ticket) => {
        statusMap.set(ticket.status, (statusMap.get(ticket.status) || 0) + 1);
      });

      // Calculate statistics
      const totalTickets = currentStatus?.length || 0;
      const avgCount = totalTickets / Math.max(statusMap.size, 1);

      const bottlenecks = Array.from(statusMap.entries()).map(
        ([status, count]) => {
          const deviationPercent = ((count - avgCount) / avgCount) * 100;
          return {
            status,
            count,
            avg_count: Math.round(avgCount),
            deviation_percent: Math.round(deviationPercent),
            is_bottleneck: deviationPercent > 50, // More than 50% above average
          };
        },
      );

      // Sort by deviation (highest first)
      bottlenecks.sort((a, b) => b.deviation_percent - a.deviation_percent);

      return bottlenecks;
    }),
});
