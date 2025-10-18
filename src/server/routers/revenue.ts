import { router, publicProcedure } from "@/server/trpc";
import { z } from "zod";

// Define schema for revenue calculation
const revenueTicketSchema = z.object({
  total_cost: z.number().nullable(),
});

export const revenueRouter = router({
  /**
   * Get monthly revenue data including current month's total and comparison with previous month
   */
  getMonthlyRevenue: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get start and end dates for current and previous months
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth, 0);

    // Query current month revenue
    const currentMonthRes = await ctx.supabaseAdmin
      .from("service_tickets")
      .select("total_cost")
      .gte("updated_at", currentMonthStart.toISOString())
      .lte("updated_at", currentMonthEnd.toISOString())
      .eq("status", "completed");

    const parsedCurrentData = z
      .array(revenueTicketSchema)
      .safeParse(currentMonthRes.data);
    const currentMonthRevenue = parsedCurrentData.success
      ? parsedCurrentData.data.reduce(
          (sum, ticket) => sum + (ticket.total_cost || 0),
          0,
        )
      : 0;

    // Query previous month revenue
    const previousMonthRes = await ctx.supabaseAdmin
      .from("service_tickets")
      .select("actual_total")
      .gte("updated_at", previousMonthStart.toISOString())
      .lte("updated_at", previousMonthEnd.toISOString())
      .eq("status", "completed");

    const parsedPreviousData = z
      .array(revenueTicketSchema)
      .safeParse(previousMonthRes.data);
    const previousMonthRevenue = parsedPreviousData.success
      ? parsedPreviousData.data.reduce(
          (sum, ticket) => sum + (ticket.total_cost || 0),
          0,
        )
      : 0;

    // Calculate growth rate
    let growthRate = 0;
    if (previousMonthRevenue > 0) {
      growthRate =
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100;
    }

    return {
      currentMonthRevenue,
      previousMonthRevenue,
      growthRate,
      hasPreviousData: previousMonthRevenue > 0,
      latestUpdate: now.toISOString(),
    };
  }),
});
