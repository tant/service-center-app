import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Ticket schemas for validation
const createTicketSchema = z.object({
  customer_data: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").regex(/^[0-9+\-\s()]+$/, "Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign"),
    email: z.string().email().or(z.literal("")).nullable().optional(),
    address: z.string().nullable().optional(),
  }),
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  description: z.string().min(1, "Issue description is required"),
  priority_level: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  warranty_type: z.enum(["warranty", "paid", "goodwill"]).default("paid"),
  service_fee: z.number().min(0, "Service fee must be non-negative"),
  diagnosis_fee: z.number().min(0, "Diagnosis fee must be non-negative").default(0),
  discount_amount: z.number().min(0, "Discount amount must be non-negative").default(0),
  parts: z.array(z.object({
    part_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).default([]),
});

const updateTicketStatusSchema = z.object({
  id: z.string().uuid("Ticket ID must be a valid UUID"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
});

const updateTicketSchema = z.object({
  id: z.string().uuid("Ticket ID must be a valid UUID"),
  issue_description: z.string().min(1, "Issue description is required").optional(),
  priority_level: z.enum(["low", "normal", "high", "urgent"]).optional(),
  warranty_type: z.enum(["warranty", "paid", "goodwill"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  service_fee: z.number().min(0, "Service fee must be non-negative").optional(),
  diagnosis_fee: z.number().min(0, "Diagnosis fee must be non-negative").optional(),
  discount_amount: z.number().min(0, "Discount amount must be non-negative").optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export const ticketsRouter = router({
  createTicket: publicProcedure
    .input(createTicketSchema)
    .mutation(async ({ input, ctx }) => {
      // Generate ticket number
      const currentYear = new Date().getFullYear();
      const { data: ticketCount } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id")
        .like("ticket_number", `SV-${currentYear}-%`);

      const nextNumber = (ticketCount?.length || 0) + 1;
      const ticketNumber = `SV-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

      // Check if customer exists or create new one
      let customerId = input.customer_data.id;

      if (!customerId) {
        // Try to find existing customer by phone
        const { data: existingCustomer } = await ctx.supabaseAdmin
          .from("customers")
          .select("id")
          .eq("phone", input.customer_data.phone)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await ctx.supabaseAdmin
            .from("customers")
            .insert({
              name: input.customer_data.name,
              phone: input.customer_data.phone,
              email: input.customer_data.email || null,
              address: input.customer_data.address || null,
            })
            .select("id")
            .single();

          if (customerError) {
            throw new Error(`Failed to create customer: ${customerError.message}`);
          }

          customerId = newCustomer.id;
        }
      }

      // Calculate parts total
      const partsTotal = input.parts.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0);

      // Create the ticket
      const { data: ticketData, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .insert({
          ticket_number: ticketNumber,
          customer_id: customerId,
          product_id: input.product_id,
          issue_description: input.description,
          priority_level: input.priority_level,
          warranty_type: input.warranty_type,
          status: "pending",
          service_fee: input.service_fee,
          diagnosis_fee: input.diagnosis_fee,
          discount_amount: input.discount_amount,
          parts_total: partsTotal,
          // total_cost will be calculated automatically by trigger
        })
        .select()
        .single();

      if (ticketError) {
        throw new Error(`Failed to create ticket: ${ticketError.message}`);
      }

      // Add ticket parts if any
      if (input.parts.length > 0) {
        const ticketParts = input.parts.map(part => ({
          ticket_id: ticketData.id,
          part_id: part.part_id,
          quantity: part.quantity,
          unit_price: part.unit_price,
          // Note: total_price is automatically calculated by the database as (quantity * unit_price)
        }));

        const { error: partsError } = await ctx.supabaseAdmin
          .from("service_ticket_parts")
          .insert(ticketParts);

        if (partsError) {
          // Cleanup ticket if parts insertion fails
          await ctx.supabaseAdmin.from("service_tickets").delete().eq("id", ticketData.id);
          throw new Error(`Failed to add ticket parts: ${partsError.message}`);
        }

        // Update stock quantities
        for (const part of input.parts) {
          try {
            const { error: stockError } = await ctx.supabaseAdmin
              .rpc('decrease_part_stock', {
                part_id: part.part_id,
                quantity_to_decrease: part.quantity
              });

            if (stockError) {
              // Fallback to manual stock update if RPC function doesn't exist
              const { data: currentPart, error: fetchError } = await ctx.supabaseAdmin
                .from('parts')
                .select('stock_quantity')
                .eq('id', part.part_id)
                .single();

              if (!fetchError && currentPart) {
                const newStock = Math.max(0, currentPart.stock_quantity - part.quantity);
                await ctx.supabaseAdmin
                  .from('parts')
                  .update({ stock_quantity: newStock })
                  .eq('id', part.part_id);
              }
            }
          } catch (error) {
            console.error(`Failed to update stock for part ${part.part_id}:`, error);
            // Don't fail the entire operation for stock update errors
          }
        }
      }

      return {
        success: true,
        ticket: ticketData,
      };
    }),

  getTickets: publicProcedure.query(async ({ ctx }) => {
    const { data: tickets, error } = await ctx.supabaseAdmin
      .from("service_tickets")
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          email
        ),
        products (
          id,
          name,
          type,
          brand
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }

    return tickets || [];
  }),

  getTicket: publicProcedure
    .input(z.object({ id: z.string().uuid("Ticket ID must be a valid UUID") }))
    .query(async ({ input, ctx }) => {
      const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email,
            address
          ),
          products (
            id,
            name,
            type,
            brand,
            model
          )
        `)
        .eq("id", input.id)
        .single();

      if (ticketError) {
        throw new Error(`Failed to fetch ticket: ${ticketError.message}`);
      }

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      // Get ticket parts
      const { data: ticketParts, error: partsError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .select(`
          *,
          parts (
            id,
            name,
            part_number,
            sku
          )
        `)
        .eq("ticket_id", input.id);

      if (partsError) {
        throw new Error(`Failed to fetch ticket parts: ${partsError.message}`);
      }

      // Get ticket comments
      const { data: comments, error: commentsError } = await ctx.supabaseAdmin
        .from("service_ticket_comments")
        .select(`
          *,
          profiles (
            id,
            name,
            role
          )
        `)
        .eq("ticket_id", input.id)
        .order("created_at", { ascending: true });

      if (commentsError) {
        throw new Error(`Failed to fetch ticket comments: ${commentsError.message}`);
      }

      return {
        ...ticket,
        parts: ticketParts || [],
        comments: comments || [],
      };
    }),

  updateTicketStatus: publicProcedure
    .input(updateTicketStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: ticketData, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .update({
          status: input.status,
          ...(input.status === "in_progress" && { started_at: new Date().toISOString() }),
          ...(input.status === "completed" && { completed_at: new Date().toISOString() }),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (ticketError) {
        throw new Error(`Failed to update ticket status: ${ticketError.message}`);
      }

      if (!ticketData) {
        throw new Error("Ticket not found");
      }

      return {
        success: true,
        ticket: ticketData,
      };
    }),

  updateTicket: publicProcedure
    .input(updateTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      // Build update object with only provided fields
      const updateObject: any = {};

      if (updateData.issue_description !== undefined) updateObject.issue_description = updateData.issue_description;
      if (updateData.priority_level !== undefined) updateObject.priority_level = updateData.priority_level;
      if (updateData.warranty_type !== undefined) updateObject.warranty_type = updateData.warranty_type;
      if (updateData.status !== undefined) {
        updateObject.status = updateData.status;
        if (updateData.status === "in_progress") updateObject.started_at = new Date().toISOString();
        if (updateData.status === "completed") updateObject.completed_at = new Date().toISOString();
      }
      if (updateData.service_fee !== undefined) updateObject.service_fee = updateData.service_fee;
      if (updateData.diagnosis_fee !== undefined) updateObject.diagnosis_fee = updateData.diagnosis_fee;
      if (updateData.discount_amount !== undefined) updateObject.discount_amount = updateData.discount_amount;
      if (updateData.notes !== undefined) updateObject.notes = updateData.notes;
      if (updateData.assigned_to !== undefined) updateObject.assigned_to = updateData.assigned_to;

      const { data: ticketData, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .update(updateObject)
        .eq("id", id)
        .select()
        .single();

      if (ticketError) {
        throw new Error(`Failed to update ticket: ${ticketError.message}`);
      }

      if (!ticketData) {
        throw new Error("Ticket not found");
      }

      return {
        success: true,
        ticket: ticketData,
      };
    }),

  addTicketPart: publicProcedure
    .input(z.object({
      ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
      part_id: z.string().uuid("Part ID must be a valid UUID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0, "Unit price must be non-negative"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .insert({
          ticket_id: input.ticket_id,
          part_id: input.part_id,
          quantity: input.quantity,
          unit_price: input.unit_price,
        })
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to add part to ticket: ${partError.message}`);
      }

      return {
        success: true,
        part: partData,
      };
    }),

  updateTicketPart: publicProcedure
    .input(z.object({
      id: z.string().uuid("Part ID must be a valid UUID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
      unit_price: z.number().min(0, "Unit price must be non-negative").optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to update part: ${partError.message}`);
      }

      return {
        success: true,
        part: partData,
      };
    }),

  deleteTicketPart: publicProcedure
    .input(z.object({
      id: z.string().uuid("Part ID must be a valid UUID"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { error: partError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .delete()
        .eq("id", input.id);

      if (partError) {
        throw new Error(`Failed to delete part: ${partError.message}`);
      }

      return {
        success: true,
      };
    }),

  addComment: publicProcedure
    .input(z.object({
      ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
      comment: z.string().min(1, "Comment cannot be empty"),
      is_internal: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data: commentData, error: commentError } = await ctx.supabaseAdmin
        .from("service_ticket_comments")
        .insert({
          ticket_id: input.ticket_id,
          comment: input.comment,
          is_internal: input.is_internal,
          // TODO: Get current user ID from context
          created_by: "system", // Placeholder
        })
        .select(`
          *,
          profiles (
            id,
            name,
            role
          )
        `)
        .single();

      if (commentError) {
        throw new Error(`Failed to add comment: ${commentError.message}`);
      }

      return {
        success: true,
        comment: commentData,
      };
    }),
});

export type TicketsRouter = typeof ticketsRouter;