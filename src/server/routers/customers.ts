import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Customer schemas for validation
const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[0-9+\-\s()]+$/, "Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign"),
  email: z.string().email("Invalid email format").nullable().optional(),
  address: z.string().nullable().optional(),
});

const updateCustomerSchema = z.object({
  id: z.string().uuid("Customer ID must be a valid UUID"),
  name: z.string().min(1, "Customer name is required").optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[0-9+\-\s()]+$/, "Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign")
    .optional(),
  email: z.string().email("Invalid email format").nullable().optional(),
  address: z.string().nullable().optional(),
});

export const customersRouter = router({
  // Get new customers count and growth rate for the current month
  getNewCustomers: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get current month's new customers
    const { data: currentMonthData, error: currentError } = await ctx.supabaseAdmin
      .from("customers")
      .select("count", { count: 'exact' })
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', now.toISOString());

    // Get previous month's new customers
    const { data: prevMonthData, error: prevError } = await ctx.supabaseAdmin
      .from("customers")
      .select("count", { count: 'exact' })
      .gte('created_at', startOfPrevMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    if (currentError || prevError) {
      throw new Error(currentError?.message || prevError?.message);
    }

    const currentCount = currentMonthData?.[0]?.count || 0;
    const prevCount = prevMonthData?.[0]?.count || 0;

    // Calculate growth rate
    const growthRate = prevCount > 0 
      ? ((currentCount - prevCount) / prevCount) * 100 
      : 0;

    return {
      currentMonthCount: currentCount,
      previousMonthCount: prevCount,
      growthRate,
      hasPreviousData: prevCount > 0,
      latestUpdate: now.toISOString(),
    };
  }),

  getCustomers: publicProcedure.query(async ({ ctx }) => {
    const { data: customers, error } = await ctx.supabaseAdmin
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return customers || [];
  }),

  createCustomer: publicProcedure
    .input(createCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: customerData, error: customerError } =
        await ctx.supabaseAdmin
          .from("customers")
          .insert({
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            address: input.address || null,
          })
          .select()
          .single();

      if (customerError) {
        throw new Error(`Failed to create customer: ${customerError.message}`);
      }

      return {
        success: true,
        customer: customerData,
      };
    }),

  updateCustomer: publicProcedure
    .input(updateCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      // Prepare update data (only include defined fields)
      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.address !== undefined) updateData.address = input.address;

      const { data: customerData, error: customerError } =
        await ctx.supabaseAdmin
          .from("customers")
          .update(updateData)
          .eq("id", input.id)
          .select()
          .single();

      if (customerError) {
        throw new Error(`Failed to update customer: ${customerError.message}`);
      }

      if (!customerData) {
        throw new Error("Customer not found");
      }

      return {
        success: true,
        customer: customerData,
      };
    }),

  deleteCustomer: publicProcedure
    .input(
      z.object({
        id: z.string().uuid("Customer ID must be a valid UUID"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { error: deleteError } = await ctx.supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", input.id);

      if (deleteError) {
        throw new Error(`Failed to delete customer: ${deleteError.message}`);
      }

      return {
        success: true,
      };
    }),
});

export type CustomersRouter = typeof customersRouter;
