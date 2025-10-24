/**
 * Story 1.11: Public Service Request Portal
 * Public tRPC router for service requests (no authentication required)
 */

import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getWarrantyStatus, getRemainingDays } from "@/utils/warranty";
import type { TRPCContext } from "../trpc";

/**
 * Helper function to get authenticated user with role
 * Used for staff-only procedures (Story 1.13)
 */
async function getAuthenticatedUserWithRole(ctx: TRPCContext) {
  const {
    data: { user },
    error: authError,
  } = await ctx.supabaseClient.auth.getUser();

  if (authError || !user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await ctx.supabaseClient
    .from("profiles")
    .select("role, id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user profile",
    });
  }

  return { user, profile };
}

/**
 * AC 11: Validation schemas for service requests
 */
const submitRequestSchema = z.object({
  serial_number: z
    .string()
    .min(5, "Serial number must be at least 5 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Serial number must be alphanumeric")
    .transform((val) => val.toUpperCase()),
  customer_name: z.string().min(2, "Name must be at least 2 characters"),
  customer_email: z.string().email("Invalid email format"),
  customer_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  problem_description: z.string().min(20, "Description must be at least 20 characters"),
  preferred_delivery_method: z.enum(["pickup", "delivery"]),
  delivery_address: z.string().optional(),
  honeypot: z.string().optional(), // AC 12: Spam protection
});

/**
 * Service request router
 * Public endpoints (no authentication) and staff endpoints (authenticated)
 */
export const serviceRequestRouter = router({
  // ========================================
  // PUBLIC ENDPOINTS (Story 1.11, 1.12)
  // ========================================
  /**
   * AC 2: Verify warranty status by serial number (public, read-only)
   * AC 8: Show warranty status and days remaining
   */
  verifyWarranty: publicProcedure
    .input(
      z.object({
        serial_number: z.string().min(1, "Serial number is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // AC: IV3 - Read-only query, no modifications
      const { data: product, error } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          serial_number,
          warranty_start_date,
          warranty_months,
          condition,
          product:products(
            id,
            name,
            sku,
            brand:brands(name)
          )
        `
        )
        .eq("serial_number", input.serial_number.toUpperCase())
        .single();

      if (error || !product) {
        return {
          found: false,
          eligible: false,
          message: "Serial number not found. Please check and try again.",
        };
      }

      // Calculate warranty end date
      const warrantyEndDate = product.warranty_start_date && product.warranty_months
        ? new Date(new Date(product.warranty_start_date).setMonth(
            new Date(product.warranty_start_date).getMonth() + product.warranty_months
          ))
        : null;

      const warrantyStatus = warrantyEndDate
        ? getWarrantyStatus(warrantyEndDate.toISOString())
        : "no_warranty";

      const daysRemaining = warrantyEndDate
        ? getRemainingDays(warrantyEndDate.toISOString())
        : null;

      // AC 8: Warranty verification - eligible if active or expiring soon
      const eligible =
        warrantyStatus === "active" || warrantyStatus === "expiring_soon";

      // Extract product data (Supabase returns array for foreign key relations)
      const productData = Array.isArray(product.product) ? product.product[0] : product.product;
      const brandData = productData?.brand ? (Array.isArray(productData.brand) ? productData.brand[0] : productData.brand) : null;

      return {
        found: true,
        eligible,
        product: {
          id: productData?.id,
          name: productData?.name,
          brand: brandData?.name || "Unknown",
          sku: productData?.sku,
          serial: product.serial_number,
        },
        warranty: {
          status: warrantyStatus,
          daysRemaining,
          startDate: product.warranty_start_date,
          endDate: warrantyEndDate?.toISOString() || null,
        },
        message: eligible
          ? "Your product is eligible for warranty service."
          : warrantyStatus === "expired"
          ? "Your warranty has expired. Paid service options available."
          : "No warranty information available for this product.",
      };
    }),

  /**
   * AC 2, 3: Submit public service request
   * AC 5: Generate tracking token (via database trigger)
   * AC 6: Set initial status to 'submitted'
   */
  submit: publicProcedure
    .input(submitRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // AC 12: Spam protection - check honeypot field
      if (input.honeypot && input.honeypot.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid submission detected",
        });
      }

      // AC 3: Validate delivery address if delivery method selected
      if (input.preferred_delivery_method === "delivery" && !input.delivery_address) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delivery address is required for delivery method",
        });
      }

      // Verify serial number exists and get product details
      const { data: physicalProduct } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          id,
          serial_number,
          product:products(
            id,
            name,
            brand:brands(name)
          )
        `
        )
        .eq("serial_number", input.serial_number)
        .single();

      if (!physicalProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Serial number not found in system",
        });
      }

      // Extract product data (Supabase returns array for foreign key relations)
      const submitProductData = Array.isArray(physicalProduct.product) ? physicalProduct.product[0] : physicalProduct.product;
      const submitBrandData = submitProductData?.brand ? (Array.isArray(submitProductData.brand) ? submitProductData.brand[0] : submitProductData.brand) : null;

      // AC 2, 3: Create service request
      // AC 5: Tracking token auto-generated by database trigger
      // AC 6: Status defaults to 'submitted'
      const { data: request, error } = await ctx.supabaseAdmin
        .from("service_requests")
        .insert({
          customer_name: input.customer_name,
          customer_email: input.customer_email,
          customer_phone: input.customer_phone,
          product_brand: submitBrandData?.name || "Unknown",
          product_model: submitProductData?.name || "Unknown",
          serial_number: input.serial_number,
          issue_description: input.problem_description,
          service_type: "warranty",
          delivery_method: input.preferred_delivery_method,
          delivery_address:
            input.preferred_delivery_method === "delivery"
              ? input.delivery_address
              : null,
          status: "submitted", // AC 6: Initial status
        })
        .select("id, tracking_token")
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create service request: ${error.message}`,
        });
      }

      // AC 9: Return tracking token
      return {
        success: true,
        tracking_token: request.tracking_token,
        request_id: request.id,
      };
    }),

  /**
   * Story 1.12: Track service request by tracking token (public)
   * AC 1: Public tracking procedure, no authentication required
   * AC 6: Mask customer email and phone for privacy
   */
  track: publicProcedure
    .input(
      z.object({
        tracking_token: z.string().min(1, "Tracking token is required"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: request, error } = await ctx.supabaseAdmin
        .from("service_requests")
        .select(
          `
          *,
          ticket:service_tickets(id, ticket_number, status)
        `
        )
        .eq("tracking_token", input.tracking_token.toUpperCase())
        .single();

      if (error || !request) {
        return {
          found: false,
          message: "Request not found. Please check your tracking token and try again.",
        };
      }

      // AC 6: Mask customer email for privacy (show first 3 chars + ***@domain)
      const maskedEmail = request.customer_email.replace(
        /^(.{3})(.*)(@.*)$/,
        (_: string, p1: string, p2: string, p3: string) => p1 + "*".repeat(Math.min(p2.length, 10)) + p3
      );

      // AC 6: Mask customer phone for privacy (show last 4 digits only)
      const maskedPhone = request.customer_phone
        ? request.customer_phone.replace(/^(.*)(.{4})$/, (_: string, p1: string, p2: string) => "*".repeat(p1.length) + p2)
        : null;

      // AC 5: Build status timeline
      const timeline = [
        {
          status: "submitted",
          label: "Submitted",
          timestamp: request.created_at,
          completed: true,
        },
        {
          status: "received",
          label: "Received",
          timestamp: request.reviewed_at,
          completed: !!request.reviewed_at || request.status !== "submitted",
        },
        {
          status: "processing",
          label: "Processing",
          timestamp: request.converted_at,
          completed: !!request.converted_at || ["processing", "completed"].includes(request.status),
        },
        {
          status: "completed",
          label: "Completed",
          timestamp: request.status === "completed" ? request.updated_at : null,
          completed: request.status === "completed",
        },
      ];

      // AC 7: Extract linked ticket data (Supabase returns array for foreign key)
      const ticketData = request.ticket
        ? Array.isArray(request.ticket)
          ? request.ticket[0]
          : request.ticket
        : null;

      return {
        found: true,
        request: {
          tracking_token: request.tracking_token,
          status: request.status,
          customer_name: request.customer_name,
          customer_email: maskedEmail,
          customer_phone: maskedPhone,
          issue_description: request.issue_description,
          delivery_method: request.delivery_method,
          delivery_address: request.delivery_method === "delivery" ? request.delivery_address : null,
          submitted_at: request.created_at,
          product: {
            brand: request.product_brand,
            model: request.product_model,
            serial: request.serial_number,
          },
          linked_ticket: ticketData
            ? {
                ticket_number: ticketData.ticket_number,
                status: ticketData.status,
              }
            : null,
          timeline,
        },
      };
    }),

  // ========================================
  // STAFF ENDPOINTS (Story 1.13) - Authenticated
  // ========================================

  /**
   * Story 1.13: List pending service requests
   * AC 1: Staff procedure with pagination, filters, and search
   */
  listPending: publicProcedure
    .input(
      z.object({
        status: z.enum(["submitted", "received", "processing"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Role-based access control
      const { profile } = await getAuthenticatedUserWithRole(ctx);

      if (!["admin", "manager", "reception"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin, manager, or reception role required.",
        });
      }

      let query = ctx.supabaseAdmin
        .from("service_requests")
        .select(
          `
          *,
          linked_ticket:service_tickets(id, ticket_number, status)
        `,
          { count: "exact" }
        );

      // Status filter
      if (input.status) {
        query = query.eq("status", input.status);
      } else {
        // By default, show active requests (not completed/rejected)
        query = query.in("status", ["submitted", "received", "processing"]);
      }

      // Search across tracking token, customer name, and serial number
      if (input.search) {
        const searchPattern = `%${input.search}%`;
        query = query.or(
          `tracking_token.ilike.${searchPattern},customer_name.ilike.${searchPattern},serial_number.ilike.${searchPattern}`
        );
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch requests: ${error.message}`,
        });
      }

      return {
        requests: data || [],
        total: count || 0,
      };
    }),

  /**
   * Story 1.13: Get full request details
   * AC 1: Staff procedure for viewing complete request information
   */
  getDetails: publicProcedure
    .input(z.object({ request_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Role-based access control
      const { profile } = await getAuthenticatedUserWithRole(ctx);

      if (!["admin", "manager", "reception"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin, manager, or reception role required.",
        });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("service_requests")
        .select(
          `
          *,
          linked_ticket:service_tickets(id, ticket_number, status)
        `
        )
        .eq("id", input.request_id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service request not found",
        });
      }

      return data;
    }),

  /**
   * Story 1.13: Update request status
   * AC 3: Staff procedure to update status (received/processing)
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        request_id: z.string().uuid(),
        status: z.enum(["received", "processing"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Role-based access control
      const { profile } = await getAuthenticatedUserWithRole(ctx);

      if (!["admin", "manager", "reception"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin, manager, or reception role required.",
        });
      }

      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      // Set timestamp based on status
      if (input.status === "received") {
        updateData.reviewed_at = new Date().toISOString();
      } else if (input.status === "processing") {
        updateData.converted_at = new Date().toISOString();
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("service_requests")
        .update(updateData)
        .eq("id", input.request_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update status: ${error.message}`,
        });
      }

      return data;
    }),

  /**
   * Story 1.13: Convert service request to service ticket
   * AC 4, 6, 7: Create ticket from request, pre-populate data, auto-link
   */
  convertToTicket: publicProcedure
    .input(
      z.object({
        request_id: z.string().uuid(),
        customer_id: z.string().uuid().optional(), // Allow staff to override
        service_type: z.enum(["warranty", "paid"]),
        priority: z.enum(["low", "normal", "high"]).default("normal"),
        additional_notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Role-based access control
      const { user, profile } = await getAuthenticatedUserWithRole(ctx);

      if (!["admin", "manager", "reception"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin, manager, or reception role required.",
        });
      }

      // Get request details
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .from("service_requests")
        .select("*")
        .eq("id", input.request_id)
        .single();

      if (requestError || !request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service request not found",
        });
      }

      // Get physical product to find product_id
      const { data: physicalProduct } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("product_id")
        .eq("serial_number", request.serial_number)
        .single();

      if (!physicalProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Physical product not found for serial number",
        });
      }

      // Find or create customer
      let customerId = input.customer_id;

      if (!customerId) {
        // Try to find existing customer by email
        const { data: existingCustomer } = await ctx.supabaseAdmin
          .from("customers")
          .select("id")
          .eq("email", request.customer_email)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await ctx.supabaseAdmin
            .from("customers")
            .insert({
              name: request.customer_name,
              email: request.customer_email,
              phone: request.customer_phone,
              created_by_id: profile.id,
            })
            .select()
            .single();

          if (customerError || !newCustomer) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to create customer: ${customerError?.message}`,
            });
          }

          customerId = newCustomer.id;
        }
      }

      // Create service ticket
      const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .insert({
          customer_id: customerId,
          product_id: physicalProduct.product_id,
          serial_number: request.serial_number,
          service_type: input.service_type,
          priority: input.priority,
          status: "pending",
          problem_description: request.issue_description,
          preferred_delivery_method: request.delivery_method,
          delivery_address: request.delivery_address,
          created_by_id: profile.id,
        })
        .select("*")
        .single();

      if (ticketError || !ticket) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create service ticket: ${ticketError?.message}`,
        });
      }

      // Add initial comment with request details
      const commentText = `Converted from service request ${request.tracking_token}\n\nCustomer's problem description:\n${request.issue_description}${input.additional_notes ? `\n\nStaff notes:\n${input.additional_notes}` : ""}`;

      await ctx.supabaseAdmin.from("service_ticket_comments").insert({
        ticket_id: ticket.id,
        comment: commentText,
        created_by_id: profile.id,
      });

      // Update request with ticket link and status
      await ctx.supabaseAdmin
        .from("service_requests")
        .update({
          ticket_id: ticket.id,
          status: "processing",
          converted_at: new Date().toISOString(),
        })
        .eq("id", input.request_id);

      return {
        success: true,
        ticket,
      };
    }),

  /**
   * Story 1.13: Reject service request
   * AC 5, 8: Reject request with reason
   */
  reject: publicProcedure
    .input(
      z.object({
        request_id: z.string().uuid(),
        rejection_reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Role-based access control
      const { user, profile } = await getAuthenticatedUserWithRole(ctx);

      if (!["admin", "manager", "reception"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin, manager, or reception role required.",
        });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("service_requests")
        .update({
          status: "rejected",
          rejection_reason: input.rejection_reason,
          rejected_at: new Date().toISOString(),
          rejected_by_id: profile.id,
        })
        .eq("id", input.request_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to reject request: ${error.message}`,
        });
      }

      // Email notification will be handled by Story 1.15

      return data;
    }),

  /**
   * Story 1.13: Get count of pending requests
   * AC 11: Badge counter for navigation
   */
  getPendingCount: publicProcedure.query(async ({ ctx }) => {
    // Require authentication but allow all authenticated users
    await getAuthenticatedUserWithRole(ctx);

    const { count, error } = await ctx.supabaseAdmin
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "received"]);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get pending count: ${error.message}`,
      });
    }

    return count || 0;
  }),
});
