import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Customer schemas for validation
const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone must be at least 10 characters").regex(/^[0-9+\-\s()]+$/, "Invalid phone format"),
  email: z.string().email("Invalid email format").nullable().optional(),
  address: z.string().nullable().optional(),
});

const updateCustomerSchema = z.object({
  id: z.string().uuid("Customer ID must be a valid UUID"),
  name: z.string().min(1, "Customer name is required").optional(),
  phone: z.string().min(10, "Phone must be at least 10 characters").regex(/^[0-9+\-\s()]+$/, "Invalid phone format").optional(),
  email: z.string().email("Invalid email format").nullable().optional(),
  address: z.string().nullable().optional(),
});

export const customersRouter = router({
  getCustomers: publicProcedure
    .query(async ({ ctx }) => {
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
      const { data: customerData, error: customerError } = await ctx.supabaseAdmin
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

      const { data: customerData, error: customerError } = await ctx.supabaseAdmin
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
    .input(z.object({
      id: z.string().uuid("Customer ID must be a valid UUID"),
    }))
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