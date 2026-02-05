import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { createAutoComment } from "../utils/auto-comment";
import { formatCurrency } from "../utils/format-currency";
import { PRIORITY_LABELS, WARRANTY_LABELS } from "../utils/label-helpers";
import { getProfileIdFromUserId } from "../utils/profile-helpers";
import {
  STATUS_FLOW,
  VALID_STATUS_TRANSITIONS,
} from "@/lib/constants/ticket-status";
import { getEmailTemplate, type EmailType } from "@/lib/email-templates";
import type { TRPCContext } from "../trpc";
import {
  requireAnyAuthenticated,
  requireOperationsStaff,
  requireManagerOrAbove,
  requireAdmin,
} from "../middleware/requireRole";
import { logAudit } from "../utils/auditLog";
import {
  createTasksFromWorkflow,
  getTicketTasksWithProgress,
} from "../utils/workflow-tasks";

/**
 * Helper function to send email notifications (Story 1.15)
 * Non-blocking - logs errors but doesn't throw
 */
async function sendEmailNotification(
  ctx: TRPCContext,
  emailType: EmailType,
  recipientEmail: string,
  recipientName: string,
  context: {
    trackingToken?: string;
    ticketNumber?: string;
    productName?: string;
    serialNumber?: string;
    rejectionReason?: string;
    completedDate?: string;
    deliveryDate?: string;
  },
  serviceRequestId?: string,
  serviceTicketId?: string,
) {
  try {
    // Check rate limiting (100 emails/day per customer)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await ctx.supabaseAdmin
      .from("email_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_email", recipientEmail)
      .gte("created_at", oneDayAgo);

    if (count && count >= 100) {
      console.log(`[EMAIL SKIPPED] Rate limit exceeded for ${recipientEmail}`);
      return { success: false, reason: "rate_limit" };
    }

    // Check email preferences
    const { data: customer } = await ctx.supabaseAdmin
      .from("customers")
      .select("email_preferences")
      .eq("email", recipientEmail)
      .single();

    if (customer?.email_preferences) {
      const preferences = customer.email_preferences as Record<string, boolean>;
      if (preferences[emailType] === false) {
        console.log(`[EMAIL SKIPPED] User unsubscribed from ${emailType}`);
        return { success: true, skipped: true };
      }
    }

    // Generate unsubscribe URL
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3025"}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=${emailType}`;

    // Generate email content
    const { html, text, subject } = getEmailTemplate(emailType, {
      customerName: recipientName,
      ...context,
      unsubscribeUrl,
    });

    // Log email to database
    const { data: emailLog, error: logError } = await ctx.supabaseAdmin
      .from("email_notifications")
      .insert({
        email_type: emailType,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
        html_body: html,
        text_body: text,
        context,
        status: "pending",
        service_request_id: serviceRequestId,
        service_ticket_id: serviceTicketId,
      })
      .select()
      .single();

    if (logError) {
      console.error("[EMAIL ERROR] Failed to log email:", logError);
      return { success: false, error: logError.message };
    }

    // Mock email sending (TODO: integrate with actual email service)
    try {
      // Simulate sending
      await ctx.supabaseAdmin
        .from("email_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailLog.id);

      console.log(
        `[EMAIL SENT] ${emailType} to ${recipientEmail} (${subject})`,
      );
      return { success: true, emailId: emailLog.id };
    } catch (error) {
      // Mark as failed
      await ctx.supabaseAdmin
        .from("email_notifications")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          retry_count: 1,
        })
        .eq("id", emailLog.id);

      console.error(`[EMAIL FAILED] ${emailType}:`, error);
      return { success: false, willRetry: true };
    }
  } catch (error) {
    console.error("[EMAIL ERROR] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper function to create a stock transfer
 * Used for warranty replacement flow to create proper transfer documents
 *
 * SIMPLIFIED WORKFLOW (no approval):
 * 1. Create transfer (status defaults to 'completed')
 * 2. Create transfer item
 * 3. Add serial → trigger_process_transfer_serial automatically:
 *    - Moves physical_product.virtual_warehouse_id
 *    - Updates stock counts at source and destination
 */
export async function createAutoTransfer(
  supabaseAdmin: TRPCContext["supabaseAdmin"],
  params: {
    fromWarehouseId: string;
    toWarehouseId: string;
    customerId: string;
    physicalProductId: string;
    serialNumber: string;
    productId: string;
    notes: string;
    createdById: string;
  },
): Promise<{ transferId: string; transferNumber: string }> {
  const {
    fromWarehouseId,
    toWarehouseId,
    customerId,
    physicalProductId,
    serialNumber,
    productId,
    notes,
    createdById,
  } = params;

  // 1. Create transfer (status defaults to 'completed' per simplified schema)
  const { data: transfer, error: transferError } = await supabaseAdmin
    .from("stock_transfers")
    .insert({
      from_virtual_warehouse_id: fromWarehouseId,
      to_virtual_warehouse_id: toWarehouseId,
      customer_id: customerId,
      // status defaults to 'completed' - no approval workflow
      notes,
      created_by_id: createdById,
    })
    .select("id, transfer_number")
    .single();

  if (transferError || !transfer) {
    throw new Error(`Lỗi tạo phiếu chuyển kho: ${transferError?.message}`);
  }

  // 2. Create transfer item
  const { data: transferItem, error: itemError } = await supabaseAdmin
    .from("stock_transfer_items")
    .insert({
      transfer_id: transfer.id,
      product_id: productId,
      quantity: 1,
    })
    .select("id")
    .single();

  if (itemError || !transferItem) {
    throw new Error(`Lỗi tạo item chuyển kho: ${itemError?.message}`);
  }

  // 3. Add serial to transfer
  // This triggers `trigger_process_transfer_serial` which automatically:
  // - Updates physical_product.virtual_warehouse_id to destination
  // - Sets physical_product.previous_virtual_warehouse_id
  // - Updates physical_product.last_known_customer_id (if customer_id set)
  // - Decrements stock at source warehouse
  // - Increments stock at destination warehouse
  const { error: serialError } = await supabaseAdmin
    .from("stock_transfer_serials")
    .insert({
      transfer_item_id: transferItem.id,
      physical_product_id: physicalProductId,
      serial_number: serialNumber,
    });

  if (serialError) {
    throw new Error(
      `Lỗi thêm serial vào phiếu chuyển kho: ${serialError.message}`,
    );
  }

  // No step 4 needed - trigger handles everything on serial insert

  return {
    transferId: transfer.id,
    transferNumber: transfer.transfer_number,
  };
}

/**
 * Helper function to create a stock receipt (Phiếu Nhập Kho)
 * Used when goods enter the service center from outside (e.g., customer returns defective product)
 *
 * SIMPLIFIED WORKFLOW (no approval):
 * 1. Create receipt (status defaults to 'completed')
 * 2. Create receipt item
 * 3. Add serial → trigger_create_physical_product_on_receipt_serial automatically:
 *    - Updates physical_product.virtual_warehouse_id to receipt warehouse
 *    - Updates stock counts (decrements old warehouse, increments new warehouse)
 */
export async function createAutoReceipt(
  supabaseAdmin: TRPCContext["supabaseAdmin"],
  params: {
    warehouseId: string;
    reason: "purchase" | "customer_return" | "rma_return";
    customerId?: string;
    physicalProductId: string;
    serialNumber: string;
    productId: string;
    notes: string;
    createdById: string;
  },
): Promise<{ receiptId: string; receiptNumber: string }> {
  const {
    warehouseId,
    reason,
    customerId,
    physicalProductId,
    serialNumber,
    productId,
    notes,
    createdById,
  } = params;

  // 1. Create receipt
  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from("stock_receipts")
    .insert({
      virtual_warehouse_id: warehouseId,
      reason,
      customer_id: customerId,
      notes,
      created_by_id: createdById,
    })
    .select("id, receipt_number")
    .single();

  if (receiptError || !receipt) {
    throw new Error(`Lỗi tạo phiếu nhập kho: ${receiptError?.message}`);
  }

  // 2. Create receipt item
  const { data: receiptItem, error: itemError } = await supabaseAdmin
    .from("stock_receipt_items")
    .insert({
      receipt_id: receipt.id,
      product_id: productId,
      declared_quantity: 1,
    })
    .select("id")
    .single();

  if (itemError || !receiptItem) {
    throw new Error(`Lỗi tạo item nhập kho: ${itemError?.message}`);
  }

  // 3. Add serial to receipt
  // This triggers `trigger_create_physical_product_on_receipt_serial` which automatically:
  // - For existing products (customer_return): updates virtual_warehouse_id, updates stock
  // - For new products (purchase): creates physical_product, increments stock
  const { error: serialError } = await supabaseAdmin
    .from("stock_receipt_serials")
    .insert({
      receipt_item_id: receiptItem.id,
      serial_number: serialNumber,
      physical_product_id: physicalProductId,
    });

  if (serialError) {
    throw new Error(
      `Lỗi thêm serial vào phiếu nhập kho: ${serialError.message}`,
    );
  }

  return {
    receiptId: receipt.id,
    receiptNumber: receipt.receipt_number,
  };
}

/**
 * Helper function to create a stock issue (Phiếu Xuất Kho)
 * Used when goods leave the service center to outside (e.g., return repaired product to customer)
 *
 * SIMPLIFIED WORKFLOW (no approval):
 * 1. Create issue (status defaults to 'completed')
 * 2. Create issue item
 * 3. Add serial → trigger_process_issue_serial automatically:
 *    - For sale/warranty_replacement/repair: moves product to customer_installed, decrements source
 *    - For return_to_supplier: moves product to rma_staging, decrements source
 *    - For others: marks as issued, decrements source
 */
export async function createAutoIssue(
  supabaseAdmin: TRPCContext["supabaseAdmin"],
  params: {
    warehouseId: string;
    issueReason: string;
    customerId?: string;
    ticketId?: string;
    physicalProductId: string;
    serialNumber: string;
    productId: string;
    notes: string;
    createdById: string;
  },
): Promise<{ issueId: string; issueNumber: string }> {
  const {
    warehouseId,
    issueReason,
    customerId,
    ticketId,
    physicalProductId,
    serialNumber,
    productId,
    notes,
    createdById,
  } = params;

  // 1. Create issue
  const { data: issue, error: issueError } = await supabaseAdmin
    .from("stock_issues")
    .insert({
      virtual_warehouse_id: warehouseId,
      issue_reason: issueReason,
      customer_id: customerId,
      ticket_id: ticketId,
      auto_generated: true,
      notes,
      created_by_id: createdById,
    })
    .select("id, issue_number")
    .single();

  if (issueError || !issue) {
    throw new Error(`Lỗi tạo phiếu xuất kho: ${issueError?.message}`);
  }

  // 2. Create issue item
  const { data: issueItem, error: itemError } = await supabaseAdmin
    .from("stock_issue_items")
    .insert({
      issue_id: issue.id,
      product_id: productId,
      quantity: 1,
    })
    .select("id")
    .single();

  if (itemError || !issueItem) {
    throw new Error(`Lỗi tạo item xuất kho: ${itemError?.message}`);
  }

  // 3. Add serial to issue
  // This triggers `trigger_process_issue_serial` which automatically:
  // - Moves physical_product to destination warehouse (based on issue_reason)
  // - Decrements stock at source warehouse
  const { error: serialError } = await supabaseAdmin
    .from("stock_issue_serials")
    .insert({
      issue_item_id: issueItem.id,
      physical_product_id: physicalProductId,
      serial_number: serialNumber,
    });

  if (serialError) {
    throw new Error(
      `Lỗi thêm serial vào phiếu xuất kho: ${serialError.message}`,
    );
  }

  return {
    issueId: issue.id,
    issueNumber: issue.issue_number,
  };
}

function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
): void {
  // If status hasn't changed, allow it
  if (currentStatus === newStatus) {
    return;
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    const statusInfo = STATUS_FLOW[currentStatus as keyof typeof STATUS_FLOW];
    const isTerminal = statusInfo?.terminal;

    if (isTerminal) {
      throw new Error(
        `Không thể thay đổi trạng thái từ "${statusInfo.label}" (trạng thái cuối). ` +
          `Vui lòng tạo phiếu dịch vụ mới nếu cần.`,
      );
    }

    const allowedLabels = allowedTransitions
      .map((s) => STATUS_FLOW[s as keyof typeof STATUS_FLOW]?.label)
      .join(", ");

    throw new Error(
      `Trạng thái không hợp lệ: Không thể chuyển từ "${statusInfo?.label}" sang "${STATUS_FLOW[newStatus as keyof typeof STATUS_FLOW]?.label}". ` +
        `Chỉ có thể chuyển sang: ${allowedLabels}`,
    );
  }
}

// Ticket schemas for validation
const createTicketSchema = z.object({
  customer_data: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Customer name is required"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 characters")
      .regex(
        /^[0-9+\-\s()]+$/,
        "Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign",
      ),
    email: z.string().email().or(z.literal("")).nullable().optional(),
    address: z.string().nullable().optional(),
  }),
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  workflow_id: z.string().uuid("Workflow ID must be a valid UUID").optional(),
  description: z.string().min(1, "Issue description is required"),
  priority_level: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  warranty_type: z.enum(["warranty", "paid", "goodwill"]).default("paid"),
  outcome: z
    .enum(["repaired", "warranty_replacement", "unrepairable"])
    .default("warranty_replacement"),
  service_fee: z.number().min(0, "Service fee must be non-negative"),
  diagnosis_fee: z
    .number()
    .min(0, "Diagnosis fee must be non-negative")
    .default(0),
  discount_amount: z
    .number()
    .min(0, "Discount amount must be non-negative")
    .default(0),
  parts: z
    .array(
      z.object({
        part_id: z.string().uuid(),
        quantity: z.number().int().min(1),
        unit_price: z.number().min(0),
      }),
    )
    .default([]),
});

const updateTicketStatusSchema = z.object({
  id: z.string().uuid("Ticket ID must be a valid UUID"),
  status: z.enum([
    "pending",
    "in_progress",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ]),
});

const updateTicketSchema = z.object({
  id: z.string().uuid("Ticket ID must be a valid UUID"),
  issue_description: z
    .string()
    .min(1, "Issue description is required")
    .optional(),
  priority_level: z.enum(["low", "normal", "high", "urgent"]).optional(),
  warranty_type: z.enum(["warranty", "paid", "goodwill"]).optional(),
  status: z
    .enum([
      "pending",
      "in_progress",
      "ready_for_pickup",
      "completed",
      "cancelled",
    ])
    .optional(),
  service_fee: z.number().min(0, "Service fee must be non-negative").optional(),
  diagnosis_fee: z
    .number()
    .min(0, "Diagnosis fee must be non-negative")
    .optional(),
  discount_amount: z
    .number()
    .min(0, "Discount amount must be non-negative")
    .optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  outcome: z
    .enum(["repaired", "warranty_replacement", "unrepairable"])
    .optional(),
});

// Story 01.22: Complete ticket with outcome
const completeTicketSchema = z
  .object({
    ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
    outcome: z.enum(["repaired", "warranty_replacement", "unrepairable"]),
    replacement_product_id: z
      .string()
      .uuid("Replacement product ID must be a valid UUID")
      .optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // If outcome = warranty_replacement, replacement_product_id is required
      if (data.outcome === "warranty_replacement") {
        return !!data.replacement_product_id;
      }
      return true;
    },
    {
      message: "Phải chọn sản phẩm thay thế khi đổi bảo hành",
      path: ["replacement_product_id"],
    },
  );

export const ticketsRouter = router({
  getPendingCount: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      const { count, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");

      if (error) {
        throw new Error(
          `Failed to fetch pending tickets count: ${error.message}`,
        );
      }

      return count || 0;
    }),

  getDailyRevenue: publicProcedure
    .use(requireManagerOrAbove)
    .query(async ({ ctx }) => {
      const { data: tickets, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("created_at, total_cost")
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch tickets revenue: ${error.message}`);
      }

      // Group by date and calculate total revenue
      const dailyRevenue =
        tickets?.reduce((acc: Record<string, number>, ticket) => {
          const date = new Date(ticket.created_at).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + (ticket.total_cost || 0);
          return acc;
        }, {}) || {};

      // Convert to array format for chart
      return Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue,
      }));
    }),

  createTicket: publicProcedure
    .use(requireOperationsStaff)
    .input(createTicketSchema)
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      // Note: Ticket number is now auto-generated by database trigger
      // No need to manually generate it here

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
          const { data: newCustomer, error: customerError } =
            await ctx.supabaseAdmin
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
            throw new Error(
              `Failed to create customer: ${customerError.message}`,
            );
          }

          customerId = newCustomer.id;
        }
      }

      // Calculate parts total
      const partsTotal = input.parts.reduce(
        (sum, part) => sum + part.unit_price * part.quantity,
        0,
      );

      // Create the ticket
      const { data: ticketData, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .insert({
          // ticket_number will be auto-generated by database trigger
          customer_id: customerId,
          product_id: input.product_id,
          workflow_id: input.workflow_id || null,
          issue_description: input.description,
          priority_level: input.priority_level,
          warranty_type: input.warranty_type,
          status: "pending",
          service_fee: input.service_fee,
          diagnosis_fee: input.diagnosis_fee,
          discount_amount: input.discount_amount,
          outcome: input.outcome,
          parts_total: partsTotal,
          // total_cost will be calculated automatically by generated column
        })
        .select()
        .single();

      if (ticketError) {
        throw new Error(`Failed to create ticket: ${ticketError.message}`);
      }

      // Create tasks from workflow template if workflow_id is provided
      let tasksCount = 0;
      if (input.workflow_id) {
        try {
          tasksCount = await createTasksFromWorkflow(
            ctx,
            ticketData.id,
            input.workflow_id,
          );
        } catch (error) {
          console.error(`Failed to create tasks from workflow: ${error}`);
          // Don't fail ticket creation if task creation fails
          // The workflow can be applied later or tasks can be created manually
        }
      }

      // Add ticket parts if any
      if (input.parts.length > 0) {
        const ticketParts = input.parts.map((part) => ({
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
          await ctx.supabaseAdmin
            .from("service_tickets")
            .delete()
            .eq("id", ticketData.id);
          throw new Error(`Failed to add ticket parts: ${partsError.message}`);
        }

        // Update stock quantities
        for (const part of input.parts) {
          try {
            const { error: stockError } = await ctx.supabaseAdmin.rpc(
              "decrease_part_stock",
              {
                part_id: part.part_id,
                quantity_to_decrease: part.quantity,
              },
            );

            if (stockError) {
              // Fallback to manual stock update if RPC function doesn't exist
              const { data: currentPart, error: fetchError } =
                await ctx.supabaseAdmin
                  .from("parts")
                  .select("stock_quantity")
                  .eq("id", part.part_id)
                  .single();

              if (!fetchError && currentPart) {
                const newStock = Math.max(
                  0,
                  currentPart.stock_quantity - part.quantity,
                );
                await ctx.supabaseAdmin
                  .from("parts")
                  .update({ stock_quantity: newStock })
                  .eq("id", part.part_id);
              }
            }
          } catch (error) {
            console.error(
              `Failed to update stock for part ${part.part_id}:`,
              error,
            );
            // Don't fail the entire operation for stock update errors
          }
        }
      }

      // Fetch customer and product information for auto-comment
      const { data: customerData } = await ctx.supabaseAdmin
        .from("customers")
        .select("name, phone")
        .eq("id", customerId)
        .single();

      const { data: productData } = await ctx.supabaseAdmin
        .from("products")
        .select("name, type, brands(name)")
        .eq("id", input.product_id)
        .single();

      // Create auto-comment for ticket creation
      const priorityLabel =
        PRIORITY_LABELS[input.priority_level as keyof typeof PRIORITY_LABELS];
      const warrantyLabel =
        WARRANTY_LABELS[input.warranty_type as keyof typeof WARRANTY_LABELS];
      const productName = productData?.name || "Sản phẩm";
      const productBrand = (productData?.brands as any)?.name || "";
      const productType = productData?.type || "";
      const customerName = customerData?.name || "Khách hàng";
      const customerPhone = customerData?.phone || "";

      await createAutoComment({
        ticketId: ticketData.id,
        profileId: profileId,
        comment: `🎫 Phiếu dịch vụ mới được tạo
📱 Sản phẩm: ${productName} (${productBrand} ${productType})
👤 Khách hàng: ${customerName} - ${customerPhone}
📋 Loại: ${warrantyLabel} | Ưu tiên: ${priorityLabel}
💰 Ước tính chi phí: ${formatCurrency(ticketData.total_cost)}`,
        isInternal: false, // Customer should see this initial ticket creation
        supabaseAdmin: ctx.supabaseAdmin,
      });

      // Fetch generated tasks (created from workflow template)
      const { data: tasks } = await ctx.supabaseAdmin
        .from("service_ticket_tasks")
        .select(`
          *,
          task_type:tasks(*)
        `)
        .eq("ticket_id", ticketData.id)
        .order("sequence_order", { ascending: true });

      return {
        success: true,
        ticket: ticketData,
        tasks: tasks || [],
        tasksCount,
      };
    }),

  getTickets: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
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
          brands (
            id,
            name
          )
        )
      `)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch tickets: ${error.message}`);
      }

      return tickets || [];
    }),

  getTicket: publicProcedure
    .use(requireAnyAuthenticated)
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
            model,
            brands (
              id,
              name
            )
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
          profiles:created_by (
            id,
            full_name,
            role
          )
        `)
        .eq("ticket_id", input.id)
        .order("created_at", { ascending: true });

      if (commentsError) {
        throw new Error(
          `Failed to fetch ticket comments: ${commentsError.message}`,
        );
      }

      return {
        ...ticket,
        parts: ticketParts || [],
        comments: comments || [],
      };
    }),

  getTasks: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({ ticketId: z.string().uuid("Ticket ID must be a valid UUID") }),
    )
    .query(async ({ input, ctx }) => {
      const result = await getTicketTasksWithProgress(ctx, input.ticketId);
      return result;
    }),

  updateTicketStatus: publicProcedure
    .use(requireAnyAuthenticated)
    .input(updateTicketStatusSchema)
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Fetch current ticket to validate status transition
      const { data: currentTicket, error: fetchError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("status")
        .eq("id", input.id)
        .single();

      if (fetchError || !currentTicket) {
        throw new Error("Ticket not found");
      }

      const oldStatus = currentTicket.status;

      // Validate status transition
      validateStatusTransition(oldStatus, input.status);

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      const { data: ticketData, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .update({
          status: input.status,
          updated_by: profileId,
          ...(input.status === "in_progress" && {
            started_at: new Date().toISOString(),
          }),
          ...(input.status === "completed" && {
            completed_at: new Date().toISOString(),
          }),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (ticketError) {
        throw new Error(
          `Failed to update ticket status: ${ticketError.message}`,
        );
      }

      if (!ticketData) {
        throw new Error("Ticket not found");
      }

      // Note: Status change comments are now automatically created by database trigger
      // No need to create manual comment here

      // Story 1.15: Send email notification when service is completed
      if (input.status === "completed") {
        // Fetch customer and product info for email
        const { data: fullTicket } = await ctx.supabaseAdmin
          .from("service_tickets")
          .select(`
            ticket_number,
            serial_number,
            completed_at,
            customer:customers(email, name),
            product:products(name)
          `)
          .eq("id", input.id)
          .single();

        if (fullTicket && fullTicket.customer && fullTicket.product) {
          const customer = Array.isArray(fullTicket.customer)
            ? fullTicket.customer[0]
            : fullTicket.customer;
          const product = Array.isArray(fullTicket.product)
            ? fullTicket.product[0]
            : fullTicket.product;

          sendEmailNotification(
            ctx,
            "service_completed",
            customer.email,
            customer.name,
            {
              ticketNumber: fullTicket.ticket_number,
              productName: product.name,
              serialNumber: fullTicket.serial_number,
              completedDate:
                fullTicket.completed_at || new Date().toISOString(),
            },
            undefined,
            input.id,
          ).catch((err) => {
            console.error("[EMAIL ERROR] service_completed failed:", err);
          });
        }
      }

      return {
        success: true,
        ticket: ticketData,
      };
    }),

  updateTicket: publicProcedure
    .use(requireAnyAuthenticated)
    .input(updateTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Fetch current ticket data for comparison
      const { data: currentTicket, error: fetchError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select(`
          status,
          priority_level,
          warranty_type,
          service_fee,
          diagnosis_fee,
          discount_amount,
          assigned_to,
          total_cost,
          issue_description,
          notes,
          outcome
        `)
        .eq("id", id)
        .single();

      if (fetchError || !currentTicket) {
        throw new Error("Ticket not found");
      }

      // Fetch assigned technician name if needed (for assignment change comments)
      let assignedTechnicianName: string | null = null;
      if (currentTicket.assigned_to) {
        const { data: techProfile } = await ctx.supabaseAdmin
          .from("profiles")
          .select("name")
          .eq("user_id", currentTicket.assigned_to)
          .single();
        assignedTechnicianName = techProfile?.name || null;
      }

      const oldStatus = currentTicket.status;

      // If status is being updated, validate the transition
      if (updateData.status !== undefined) {
        validateStatusTransition(oldStatus, updateData.status);
      }

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      // Build update object with only provided fields
      const updateObject: any = {
        updated_by: profileId,
      };

      if (updateData.issue_description !== undefined)
        updateObject.issue_description = updateData.issue_description;
      if (updateData.priority_level !== undefined)
        updateObject.priority_level = updateData.priority_level;
      if (updateData.warranty_type !== undefined)
        updateObject.warranty_type = updateData.warranty_type;
      if (updateData.status !== undefined) {
        updateObject.status = updateData.status;
        if (updateData.status === "in_progress")
          updateObject.started_at = new Date().toISOString();
        if (updateData.status === "completed")
          updateObject.completed_at = new Date().toISOString();
      }
      if (updateData.service_fee !== undefined)
        updateObject.service_fee = updateData.service_fee;
      if (updateData.diagnosis_fee !== undefined)
        updateObject.diagnosis_fee = updateData.diagnosis_fee;
      if (updateData.discount_amount !== undefined)
        updateObject.discount_amount = updateData.discount_amount;
      if (updateData.notes !== undefined) updateObject.notes = updateData.notes;
      if (updateData.assigned_to !== undefined)
        updateObject.assigned_to = updateData.assigned_to;
      if (updateData.outcome !== undefined) {
        updateObject.outcome = updateData.outcome;
        // Clear replacement_product_id if outcome changes away from warranty_replacement
        if (updateData.outcome !== "warranty_replacement") {
          updateObject.replacement_product_id = null;
        }
      }

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

      // Create auto-comments for various changes
      // Note: Status change comments are now automatically created by database trigger

      // 1. Service fee change
      if (
        updateData.service_fee !== undefined &&
        updateData.service_fee !== currentTicket.service_fee
      ) {
        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `💵 Phí dịch vụ đã thay đổi: ${formatCurrency(currentTicket.service_fee)} → ${formatCurrency(updateData.service_fee)}
💰 Tổng hóa đơn mới: ${formatCurrency(ticketData.total_cost)}`,
          isInternal: true,
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 3. Diagnosis fee change
      if (
        updateData.diagnosis_fee !== undefined &&
        updateData.diagnosis_fee !== currentTicket.diagnosis_fee
      ) {
        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `🔍 Phí kiểm tra đã thay đổi: ${formatCurrency(currentTicket.diagnosis_fee)} → ${formatCurrency(updateData.diagnosis_fee)}
💰 Tổng hóa đơn mới: ${formatCurrency(ticketData.total_cost)}`,
          isInternal: true,
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 4. Discount change
      if (
        updateData.discount_amount !== undefined &&
        updateData.discount_amount !== currentTicket.discount_amount
      ) {
        let discountComment = "";
        if (
          currentTicket.discount_amount === 0 &&
          updateData.discount_amount > 0
        ) {
          // New discount
          discountComment = `🎁 Đã áp dụng giảm giá: ${formatCurrency(updateData.discount_amount)}`;
        } else if (
          updateData.discount_amount === 0 &&
          currentTicket.discount_amount > 0
        ) {
          // Remove discount
          discountComment = `🎁 Đã hủy giảm giá: ${formatCurrency(currentTicket.discount_amount)}`;
        } else {
          // Change discount
          discountComment = `🎁 Giảm giá đã thay đổi: ${formatCurrency(currentTicket.discount_amount)} → ${formatCurrency(updateData.discount_amount)}`;
        }

        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `${discountComment}
💰 Tổng hóa đơn sau giảm giá: ${formatCurrency(ticketData.total_cost)}`,
          isInternal: false, // Customer should know about discounts
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 5. Priority change
      if (
        updateData.priority_level !== undefined &&
        updateData.priority_level !== currentTicket.priority_level
      ) {
        const oldPriorityLabel =
          PRIORITY_LABELS[
            currentTicket.priority_level as keyof typeof PRIORITY_LABELS
          ];
        const newPriorityLabel =
          PRIORITY_LABELS[
            updateData.priority_level as keyof typeof PRIORITY_LABELS
          ];

        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `⚠️ Độ ưu tiên đã thay đổi: ${oldPriorityLabel} → ${newPriorityLabel}`,
          isInternal: false, // Customer should know about priority changes
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 6. Warranty type change
      if (
        updateData.warranty_type !== undefined &&
        updateData.warranty_type !== currentTicket.warranty_type
      ) {
        const oldWarrantyLabel =
          WARRANTY_LABELS[
            currentTicket.warranty_type as keyof typeof WARRANTY_LABELS
          ];
        const newWarrantyLabel =
          WARRANTY_LABELS[
            updateData.warranty_type as keyof typeof WARRANTY_LABELS
          ];

        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `📋 Loại bảo hành đã thay đổi: ${oldWarrantyLabel} → ${newWarrantyLabel}`,
          isInternal: false, // Customer should know about warranty changes
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 7. Assignment change
      if (
        updateData.assigned_to !== undefined &&
        updateData.assigned_to !== currentTicket.assigned_to
      ) {
        let assignmentComment = "";

        if (
          currentTicket.assigned_to === null &&
          updateData.assigned_to !== null
        ) {
          // New assignment
          const { data: newTechnician } = await ctx.supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", updateData.assigned_to)
            .single();
          assignmentComment = `👤 Đã phân công cho: ${newTechnician?.full_name || "Kỹ thuật viên"}`;
        } else if (
          updateData.assigned_to === null &&
          currentTicket.assigned_to !== null
        ) {
          // Remove assignment
          assignmentComment = `👤 Đã hủy phân công cho ${assignedTechnicianName || "Kỹ thuật viên"}`;
        } else {
          // Change assignment
          const { data: newTechnician } = await ctx.supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", updateData.assigned_to)
            .single();
          assignmentComment = `👤 Chuyển giao từ ${assignedTechnicianName || "Kỹ thuật viên"} sang ${newTechnician?.full_name || "Kỹ thuật viên"}`;
        }

        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: assignmentComment,
          commentType: "assignment",
          isInternal: true,
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 8. Issue description update
      if (
        updateData.issue_description !== undefined &&
        updateData.issue_description !== currentTicket.issue_description
      ) {
        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `📝 Mô tả vấn đề đã được cập nhật`,
          isInternal: true,
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      // 9. Notes update
      if (
        updateData.notes !== undefined &&
        updateData.notes !== currentTicket.notes
      ) {
        await createAutoComment({
          ticketId: id,
          profileId: profileId,
          comment: `📌 Ghi chú đã được cập nhật`,
          isInternal: true,
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      return {
        success: true,
        ticket: ticketData,
      };
    }),

  addTicketPart: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
        part_id: z.string().uuid("Part ID must be a valid UUID"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        unit_price: z.number().min(0, "Unit price must be non-negative"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      // Get part information for the comment
      const { data: partInfo, error: partInfoError } = await ctx.supabaseAdmin
        .from("parts")
        .select("name, sku, part_number")
        .eq("id", input.part_id)
        .single();

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

      // Get updated ticket totals
      const { data: ticketData } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("parts_total, total_cost")
        .eq("id", input.ticket_id)
        .single();

      // Update stock quantity (decrease)
      try {
        const { error: stockError } = await ctx.supabaseAdmin.rpc(
          "decrease_part_stock",
          {
            part_id: input.part_id,
            quantity_to_decrease: input.quantity,
          },
        );

        if (stockError) {
          // Fallback to manual stock update if RPC function doesn't exist
          const { data: currentPart, error: fetchError } =
            await ctx.supabaseAdmin
              .from("parts")
              .select("stock_quantity")
              .eq("id", input.part_id)
              .single();

          if (!fetchError && currentPart) {
            const newStock = Math.max(
              0,
              currentPart.stock_quantity - input.quantity,
            );
            await ctx.supabaseAdmin
              .from("parts")
              .update({ stock_quantity: newStock })
              .eq("id", input.part_id);
          }
        }
      } catch (error) {
        console.error(
          `Failed to update stock for part ${input.part_id}:`,
          error,
        );
        // Don't fail the entire operation for stock update errors
      }

      // Create auto-comment for adding part
      const totalPrice = input.quantity * input.unit_price;
      const partName = partInfo?.name || "Linh kiện";
      const partSKU = partInfo?.sku || partInfo?.part_number || "N/A";

      await createAutoComment({
        ticketId: input.ticket_id,
        profileId: profileId,
        comment: `➕ Đã thêm linh kiện: ${partName} (SKU: ${partSKU}) - SL: ${input.quantity} × ${formatCurrency(input.unit_price)} = ${formatCurrency(totalPrice)}
💰 Tổng chi phí linh kiện: ${formatCurrency(ticketData?.parts_total || 0)} | Tổng hóa đơn: ${formatCurrency(ticketData?.total_cost || 0)}`,
        isInternal: true,
        supabaseAdmin: ctx.supabaseAdmin,
      });

      return {
        success: true,
        part: partData,
      };
    }),

  updateTicketPart: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string().uuid("Part ID must be a valid UUID"),
        quantity: z
          .number()
          .int()
          .min(1, "Quantity must be at least 1")
          .optional(),
        unit_price: z
          .number()
          .min(0, "Unit price must be non-negative")
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      // Get current part data for comparison
      const { data: currentPart, error: currentPartError } =
        await ctx.supabaseAdmin
          .from("service_ticket_parts")
          .select(
            "ticket_id, part_id, quantity, unit_price, total_price, parts(name, sku, part_number)",
          )
          .eq("id", id)
          .single();

      if (currentPartError || !currentPart) {
        throw new Error("Part not found");
      }

      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to update part: ${partError.message}`);
      }

      // Update stock quantity if quantity changed
      if (
        updateData.quantity !== undefined &&
        updateData.quantity !== currentPart.quantity
      ) {
        const quantityDiff = updateData.quantity - currentPart.quantity;

        try {
          if (quantityDiff > 0) {
            // Quantity increased - need MORE parts from stock (decrease stock)
            const { error: stockError } = await ctx.supabaseAdmin.rpc(
              "decrease_part_stock",
              {
                part_id: currentPart.part_id,
                quantity_to_decrease: quantityDiff,
              },
            );

            if (stockError) {
              // Fallback to manual update
              const { data: part, error: fetchError } = await ctx.supabaseAdmin
                .from("parts")
                .select("stock_quantity")
                .eq("id", currentPart.part_id)
                .single();

              if (!fetchError && part) {
                const newStock = Math.max(
                  0,
                  part.stock_quantity - quantityDiff,
                );
                await ctx.supabaseAdmin
                  .from("parts")
                  .update({ stock_quantity: newStock })
                  .eq("id", currentPart.part_id);
              }
            }
          } else if (quantityDiff < 0) {
            // Quantity decreased - return parts to stock (increase stock)
            const { error: stockError } = await ctx.supabaseAdmin.rpc(
              "increase_part_stock",
              {
                part_id: currentPart.part_id,
                quantity_to_increase: Math.abs(quantityDiff),
              },
            );

            if (stockError) {
              // Fallback to manual update
              const { data: part, error: fetchError } = await ctx.supabaseAdmin
                .from("parts")
                .select("stock_quantity")
                .eq("id", currentPart.part_id)
                .single();

              if (!fetchError && part) {
                const newStock = part.stock_quantity + Math.abs(quantityDiff);
                await ctx.supabaseAdmin
                  .from("parts")
                  .update({ stock_quantity: newStock })
                  .eq("id", currentPart.part_id);
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to update stock for part ${currentPart.part_id}:`,
            error,
          );
          // Don't fail the entire operation for stock update errors
        }
      }

      // Get updated ticket totals
      const { data: ticketData } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("parts_total, total_cost")
        .eq("id", currentPart.ticket_id)
        .single();

      // Create auto-comment for updating part
      const partName = (currentPart.parts as any)?.name || "Linh kiện";
      const changes: string[] = [];

      if (
        updateData.quantity !== undefined &&
        updateData.quantity !== currentPart.quantity
      ) {
        changes.push(
          `  • Số lượng: ${currentPart.quantity} → ${updateData.quantity}`,
        );
      }

      if (
        updateData.unit_price !== undefined &&
        updateData.unit_price !== currentPart.unit_price
      ) {
        changes.push(
          `  • Đơn giá: ${formatCurrency(currentPart.unit_price)} → ${formatCurrency(updateData.unit_price)}`,
        );
      }

      const oldTotal = currentPart.total_price;
      const newTotal = partData.total_price;
      if (oldTotal !== newTotal) {
        changes.push(
          `  • Thành tiền: ${formatCurrency(oldTotal)} → ${formatCurrency(newTotal)}`,
        );
      }

      if (changes.length > 0) {
        await createAutoComment({
          ticketId: currentPart.ticket_id,
          profileId: profileId,
          comment: `✏️ Đã cập nhật linh kiện: ${partName}
${changes.join("\n")}
💰 Tổng chi phí linh kiện: ${formatCurrency(ticketData?.parts_total || 0)} | Tổng hóa đơn: ${formatCurrency(ticketData?.total_cost || 0)}`,
          isInternal: true,
          supabaseAdmin: ctx.supabaseAdmin,
        });
      }

      return {
        success: true,
        part: partData,
      };
    }),

  deleteTicketPart: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string().uuid("Part ID must be a valid UUID"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      // Get part data before deletion for the auto-comment
      const { data: partData, error: fetchError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .select(
          "ticket_id, part_id, quantity, unit_price, total_price, parts(name, sku, part_number)",
        )
        .eq("id", input.id)
        .single();

      if (fetchError || !partData) {
        throw new Error("Part not found");
      }

      const { error: partError } = await ctx.supabaseAdmin
        .from("service_ticket_parts")
        .delete()
        .eq("id", input.id);

      if (partError) {
        throw new Error(`Failed to delete part: ${partError.message}`);
      }

      // Return parts to stock (increase)
      try {
        const { error: stockError } = await ctx.supabaseAdmin.rpc(
          "increase_part_stock",
          {
            part_id: partData.part_id,
            quantity_to_increase: partData.quantity,
          },
        );

        if (stockError) {
          // Fallback to manual stock update
          const { data: currentPart, error: fetchError } =
            await ctx.supabaseAdmin
              .from("parts")
              .select("stock_quantity")
              .eq("id", partData.part_id)
              .single();

          if (!fetchError && currentPart) {
            const newStock = currentPart.stock_quantity + partData.quantity;
            await ctx.supabaseAdmin
              .from("parts")
              .update({ stock_quantity: newStock })
              .eq("id", partData.part_id);
          }
        }
      } catch (error) {
        console.error(
          `Failed to update stock for part ${partData.part_id}:`,
          error,
        );
        // Don't fail the entire operation for stock update errors
      }

      // Get updated ticket totals
      const { data: ticketData } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("parts_total, total_cost")
        .eq("id", partData.ticket_id)
        .single();

      // Create auto-comment for deleting part
      const partName = (partData.parts as any)?.name || "Linh kiện";
      const partSKU =
        (partData.parts as any)?.sku ||
        (partData.parts as any)?.part_number ||
        "N/A";

      await createAutoComment({
        ticketId: partData.ticket_id,
        profileId: profileId,
        comment: `➖ Đã xóa linh kiện: ${partName} (SKU: ${partSKU}) - SL: ${partData.quantity} × ${formatCurrency(partData.unit_price)} = ${formatCurrency(partData.total_price)}
💰 Tổng chi phí linh kiện: ${formatCurrency(ticketData?.parts_total || 0)} | Tổng hóa đơn: ${formatCurrency(ticketData?.total_cost || 0)}`,
        isInternal: true,
        supabaseAdmin: ctx.supabaseAdmin,
      });

      return {
        success: true,
      };
    }),

  addComment: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
        comment: z.string().min(1, "Comment cannot be empty"),
        is_internal: z.boolean().default(false),
        comment_type: z
          .enum(["note", "status_change", "assignment", "system"])
          .default("note"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      const { data: commentData, error: commentError } = await ctx.supabaseAdmin
        .from("service_ticket_comments")
        .insert({
          ticket_id: input.ticket_id,
          comment: input.comment,
          comment_type: input.comment_type,
          is_internal: input.is_internal,
          created_by: profileId,
        })
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
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

  addAttachment: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
        file_name: z.string().min(1, "File name is required"),
        file_path: z.string().min(1, "File path is required"),
        file_type: z.string().min(1, "File type is required"),
        file_size: z.number().min(0, "File size must be non-negative"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }
      const user = ctx.user;

      // Lookup profile ID from auth user ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        user.id,
      );

      const { data: attachmentData, error: attachmentError } =
        await ctx.supabaseAdmin
          .from("service_ticket_attachments")
          .insert({
            ticket_id: input.ticket_id,
            file_name: input.file_name,
            file_path: input.file_path,
            file_type: input.file_type,
            file_size: input.file_size,
            description: input.description,
            created_by: profileId,
          })
          .select()
          .single();

      if (attachmentError) {
        throw new Error(`Failed to add attachment: ${attachmentError.message}`);
      }

      return {
        success: true,
        attachment: attachmentData,
      };
    }),

  getAttachments: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { data: attachments, error } = await ctx.supabaseAdmin
        .from("service_ticket_attachments")
        .select("*")
        .eq("ticket_id", input.ticket_id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch attachments: ${error.message}`);
      }

      return attachments || [];
    }),

  deleteAttachment: publicProcedure
    .use(requireAdmin)
    .input(
      z.object({ id: z.string().uuid("Attachment ID must be a valid UUID") }),
    )
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed by middleware (admin only)
      if (!ctx.user) {
        throw new Error("User context not available");
      }

      const { error: deleteError } = await ctx.supabaseAdmin
        .from("service_ticket_attachments")
        .delete()
        .eq("id", input.id);

      if (deleteError) {
        throw new Error(`Failed to delete attachment: ${deleteError.message}`);
      }

      return {
        success: true,
      };
    }),

  // ========================================
  // DELIVERY TRACKING (Story 1.14)
  // ========================================

  /**
   * Story 1.14: Get list of completed tickets pending delivery confirmation
   * AC 4, 5: List view of tickets awaiting delivery confirmation
   */
  getPendingDeliveries: publicProcedure
    .use(requireOperationsStaff)
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }

      // Query tickets ready for pickup/delivery (not yet confirmed)
      const {
        data: tickets,
        error: ticketsError,
        count,
      } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select(
          `
          *,
          customer:customers(id, name, phone, email),
          product:products(id, name, sku),
          assigned:profiles!service_tickets_assigned_to_fkey(id, full_name)
        `,
          { count: "exact" },
        )
        .eq("status", "ready_for_pickup")
        .order("completed_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (ticketsError) {
        throw new Error(
          `Failed to fetch pending deliveries: ${ticketsError.message}`,
        );
      }

      return {
        tickets: tickets || [],
        total: count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Story 1.14: Get count of pending deliveries for badge
   */
  getPendingDeliveriesCount: publicProcedure
    .use(requireOperationsStaff)
    .query(async ({ ctx }) => {
      // User is guaranteed by middleware
      if (!ctx.user) {
        return 0;
      }

      const { count, error } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "ready_for_pickup");

      if (error) {
        console.error("Failed to get pending deliveries count:", error);
        return 0;
      }

      return count || 0;
    }),

  /**
   * Story 01.22: Get available replacement products for warranty ticket
   * Returns physical products from warranty_stock that match the ticket's product_id
   */
  getAvailableReplacements: publicProcedure
    .use(requireOperationsStaff)
    .input(
      z.object({
        ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Get ticket's product_id
      const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("product_id, warranty_type")
        .eq("id", input.ticket_id)
        .single();

      if (ticketError || !ticket) {
        throw new Error("Ticket not found");
      }

      // Only warranty tickets can have replacements
      if (ticket.warranty_type !== "warranty") {
        return [];
      }

      // Get warranty_stock virtual warehouse
      const { data: warrantyWarehouse, error: warehouseError } =
        await ctx.supabaseAdmin
          .from("virtual_warehouses")
          .select("id")
          .eq("warehouse_type", "warranty_stock")
          .limit(1)
          .single();

      if (warehouseError || !warrantyWarehouse) {
        console.error("No warranty_stock warehouse found");
        return [];
      }

      // Get available products from warranty_stock (any product type)
      const { data: products, error: productsError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(`
          id,
          serial_number,
          condition,
          manufacturer_warranty_end_date,
          user_warranty_end_date,
          product:products (
            id,
            name,
            model,
            brand:brands (
              name
            )
          )
        `)
        .eq("virtual_warehouse_id", warrantyWarehouse.id)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      if (productsError) {
        console.error("Failed to get replacement products:", productsError);
        throw new Error("Không thể lấy danh sách sản phẩm thay thế");
      }

      return products || [];
    }),

  /**
   * Set outcome for ticket and transition to ready_for_pickup
   * Requires all tasks to be completed (if ticket has tasks)
   * Handles inventory movements for warranty_replacement outcome
   */
  setOutcome: publicProcedure
    .use(requireOperationsStaff)
    .input(completeTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const { ticket_id, outcome, replacement_product_id, notes } = input;

      // User is guaranteed by middleware
      if (!ctx.user) {
        throw new Error("User context not available");
      }

      // 1. Validate ticket exists and check current status
      const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select(`
          id,
          status,
          warranty_type,
          customer_id,
          product_id,
          ticket_number,
          serial_number,
          tasks_completed_at,
          customer:customers (
            email,
            name
          ),
          product:products (
            name
          )
        `)
        .eq("id", ticket_id)
        .single();

      if (ticketError || !ticket) {
        throw new Error("Phiếu không tồn tại");
      }

      // Only allow from in_progress status
      if (ticket.status !== "in_progress") {
        throw new Error(
          `Chỉ có thể chọn kết quả cho phiếu đang xử lý. Trạng thái hiện tại: ${ticket.status}`,
        );
      }

      // Check if ticket has tasks - if so, they must be completed
      const { count: taskCount } = await ctx.supabaseAdmin
        .from("entity_tasks")
        .select("id", { count: "exact", head: true })
        .eq("entity_type", "service_ticket")
        .eq("entity_id", ticket_id);

      if (taskCount && taskCount > 0 && !ticket.tasks_completed_at) {
        throw new Error(
          "Phải hoàn thành tất cả công việc trước khi chọn kết quả xử lý",
        );
      }

      // 2. If warranty_replacement, validate replacement product
      let warrantyWarehouseId: string | null = null;
      let customerInstalledWarehouseId: string | null = null;
      let inServiceWarehouseId: string | null = null;
      let deadStockWarehouseId: string | null = null;
      let replacementProductInfo: {
        id: string;
        serial_number: string;
        product_id: string;
      } | null = null;

      if (outcome === "warranty_replacement") {
        // Only warranty tickets can have warranty_replacement outcome
        if (ticket.warranty_type !== "warranty") {
          throw new Error("Chỉ phiếu bảo hành mới được đổi sản phẩm");
        }

        // Get all required warehouses
        const { data: warehouses } = await ctx.supabaseAdmin
          .from("virtual_warehouses")
          .select("id, warehouse_type")
          .in("warehouse_type", [
            "warranty_stock",
            "customer_installed",
            "in_service",
            "dead_stock",
          ]);

        const warrantyWarehouse = warehouses?.find(
          (w) => w.warehouse_type === "warranty_stock",
        );
        const customerWarehouse = warehouses?.find(
          (w) => w.warehouse_type === "customer_installed",
        );
        const inServiceWarehouse = warehouses?.find(
          (w) => w.warehouse_type === "in_service",
        );
        const deadStockWarehouse = warehouses?.find(
          (w) => w.warehouse_type === "dead_stock",
        );

        if (!warrantyWarehouse || !customerWarehouse || !inServiceWarehouse || !deadStockWarehouse) {
          throw new Error(
            "Không tìm thấy đủ cấu hình kho ảo (warranty_stock, customer_installed, in_service, dead_stock)",
          );
        }

        warrantyWarehouseId = warrantyWarehouse.id;
        customerInstalledWarehouseId = customerWarehouse.id;
        inServiceWarehouseId = inServiceWarehouse.id;
        deadStockWarehouseId = deadStockWarehouse.id;

        // Validate replacement product
        const { data: replacementProduct, error: rpError } =
          await ctx.supabaseAdmin
            .from("physical_products")
            .select(
              "id, serial_number, product_id, virtual_warehouse_id, status",
            )
            .eq("id", replacement_product_id)
            .single();

        if (rpError || !replacementProduct) {
          throw new Error("Sản phẩm thay thế không tồn tại");
        }

        if (replacementProduct.virtual_warehouse_id !== warrantyWarehouse.id) {
          throw new Error("Sản phẩm phải ở kho bảo hành (warranty_stock)");
        }

        if (replacementProduct.status !== "active") {
          throw new Error(
            `Sản phẩm không khả dụng. Trạng thái: ${replacementProduct.status}`,
          );
        }

        // Check same product type
        if (replacementProduct.product_id !== ticket.product_id) {
          throw new Error(
            "Sản phẩm thay thế phải cùng loại với sản phẩm trong phiếu",
          );
        }

        // Store for later use
        replacementProductInfo = {
          id: replacementProduct.id,
          serial_number: replacementProduct.serial_number,
          product_id: replacementProduct.product_id,
        };
      }

      // 3. Get profile ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        ctx.user.id,
      );

      // 4. Update ticket - transition to ready_for_pickup (NOT completed)
      const { data: updatedTicket, error: updateError } =
        await ctx.supabaseAdmin
          .from("service_tickets")
          .update({
            status: "ready_for_pickup",
            outcome,
            replacement_product_id:
              outcome === "warranty_replacement"
                ? replacement_product_id
                : null,
            updated_by: profileId,
            ...(notes && { notes }),
          })
          .eq("id", ticket_id)
          .select()
          .single();

      if (updateError) {
        throw new Error(`Lỗi cập nhật phiếu: ${updateError.message}`);
      }

      // 5. If warranty_replacement, create stock issue + transfer
      if (
        outcome === "warranty_replacement" &&
        replacement_product_id &&
        replacementProductInfo &&
        warrantyWarehouseId &&
        inServiceWarehouseId
      ) {
        // [PHIẾU XUẤT KHO] Xuất sản phẩm thay thế từ kho bảo hành cho khách
        const outboundIssue = await createAutoIssue(ctx.supabaseAdmin, {
          warehouseId: warrantyWarehouseId,
          issueReason: "warranty_replacement",
          customerId: ticket.customer_id,
          ticketId: ticket_id,
          physicalProductId: replacementProductInfo.id,
          serialNumber: replacementProductInfo.serial_number,
          productId: replacementProductInfo.product_id,
          notes: `Auto: Xuất sản phẩm đổi bảo hành - Phiếu ${ticket.ticket_number}`,
          createdById: profileId,
        });

        console.log(
          `[WARRANTY] Created outbound issue: ${outboundIssue.issueNumber}`,
        );

        // [PHIẾU CHUYỂN KHO] Chuyển sản phẩm hỏng: in_service → dead_stock (nội bộ)
        // Only if ticket has serial_number (old product from customer)
        if (ticket.serial_number && deadStockWarehouseId) {
          const { data: oldProduct } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id, serial_number, product_id, virtual_warehouse_id")
            .eq("serial_number", ticket.serial_number)
            .single();

          if (
            oldProduct &&
            oldProduct.virtual_warehouse_id === inServiceWarehouseId
          ) {
            const deadStockTransfer = await createAutoTransfer(
              ctx.supabaseAdmin,
              {
                fromWarehouseId: inServiceWarehouseId,
                toWarehouseId: deadStockWarehouseId,
                customerId: ticket.customer_id,
                physicalProductId: oldProduct.id,
                serialNumber: oldProduct.serial_number,
                productId: oldProduct.product_id,
                notes: `Auto: Chuyển sản phẩm hỏng sang Kho Hàng Hỏng - Phiếu ${ticket.ticket_number}`,
                createdById: profileId,
              },
            );

            console.log(
              `[WARRANTY] Created dead_stock transfer: ${deadStockTransfer.transferNumber}`,
            );
          }
        }
      }

      // 5b. If repaired or unrepairable, issue product back to customer (Phiếu Xuất Kho)
      if (
        (outcome === "repaired" || outcome === "unrepairable") &&
        ticket.serial_number
      ) {
        const { data: inServiceWh } = await ctx.supabaseAdmin
          .from("virtual_warehouses")
          .select("id")
          .eq("warehouse_type", "in_service")
          .single();

        if (inServiceWh) {
          const { data: product } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id, serial_number, product_id, virtual_warehouse_id")
            .eq("serial_number", ticket.serial_number)
            .single();

          if (product && product.virtual_warehouse_id === inServiceWh.id) {
            const returnIssue = await createAutoIssue(ctx.supabaseAdmin, {
              warehouseId: inServiceWh.id,
              issueReason: "repair",
              customerId: ticket.customer_id,
              ticketId: ticket_id,
              physicalProductId: product.id,
              serialNumber: product.serial_number,
              productId: product.product_id,
              notes: `Auto: Trả sản phẩm cho khách (${outcome}) - Phiếu ${ticket.ticket_number}`,
              createdById: profileId,
            });

            console.log(
              `[${outcome.toUpperCase()}] Created return issue: ${returnIssue.issueNumber}`,
            );
          }
        }
      }

      // 6. Create auto-comment with outcome details
      const outcomeLabels: Record<string, string> = {
        repaired: "Sửa chữa thành công",
        warranty_replacement: "Đổi sản phẩm bảo hành",
        unrepairable: "Không thể sửa chữa",
      };

      let commentText = `Kết quả xử lý: ${outcomeLabels[outcome]}. Sẵn sàng bàn giao cho khách.`;

      if (outcome === "warranty_replacement" && replacement_product_id) {
        // Get replacement product serial
        const { data: rp } = await ctx.supabaseAdmin
          .from("physical_products")
          .select("serial_number")
          .eq("id", replacement_product_id)
          .single();

        if (rp) {
          commentText += `\nSerial mới: ${rp.serial_number}`;
        }
      }

      if (notes) {
        commentText += `\nGhi chú: ${notes}`;
      }

      await createAutoComment({
        ticketId: ticket_id,
        profileId,
        comment: commentText,
        isInternal: false,
        supabaseAdmin: ctx.supabaseAdmin,
      });

      // 7. Send email notification
      if (ticket.customer && ticket.product) {
        const customer = Array.isArray(ticket.customer)
          ? ticket.customer[0]
          : ticket.customer;
        const product = Array.isArray(ticket.product)
          ? ticket.product[0]
          : ticket.product;

        if (customer?.email && customer?.name) {
          sendEmailNotification(
            ctx,
            "service_completed",
            customer.email,
            customer.name,
            {
              ticketNumber: ticket.ticket_number,
              productName: product?.name,
              serialNumber: ticket.serial_number || undefined,
              completedDate: new Date().toISOString(),
            },
            undefined,
            ticket_id,
          ).catch((err) => {
            console.error("[EMAIL ERROR] service_completed failed:", err);
          });
        }
      }

      // 8. Audit log
      await logAudit(ctx.supabaseAdmin, ctx.user.id, {
        action: "status_change",
        resourceType: "ticket",
        resourceId: ticket_id,
        oldValues: { status: ticket.status },
        newValues: {
          status: "ready_for_pickup",
          outcome,
          replacement_product_id,
        },
        metadata: { operation: "set_outcome" },
      });

      return {
        success: true,
        ticket: updatedTicket,
      };
    }),

  /**
   * Confirm delivery to customer - transitions ticket from ready_for_pickup to completed
   * This is the final step in the ticket lifecycle
   */
  confirmDelivery: publicProcedure
    .use(requireOperationsStaff)
    .input(
      z.object({
        ticket_id: z.string().uuid("Ticket ID must be a valid UUID"),
        delivery_notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { ticket_id, delivery_notes } = input;

      if (!ctx.user) {
        throw new Error("User context not available");
      }

      // 1. Validate ticket
      const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id, status, outcome, ticket_number")
        .eq("id", ticket_id)
        .single();

      if (ticketError || !ticket) {
        throw new Error("Phiếu không tồn tại");
      }

      if (ticket.status !== "ready_for_pickup") {
        throw new Error(
          `Chỉ có thể xác nhận bàn giao cho phiếu sẵn sàng bàn giao. Trạng thái hiện tại: ${ticket.status}`,
        );
      }

      if (!ticket.outcome) {
        throw new Error("Phiếu chưa có kết quả xử lý");
      }

      // 2. Get profile ID
      const profileId = await getProfileIdFromUserId(
        ctx.supabaseAdmin,
        ctx.user.id,
      );

      // 3. Update ticket to completed
      const { data: updatedTicket, error: updateError } =
        await ctx.supabaseAdmin
          .from("service_tickets")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            delivery_confirmed_at: new Date().toISOString(),
            delivery_confirmed_by_id: profileId,
            updated_by: profileId,
          })
          .eq("id", ticket_id)
          .select()
          .single();

      if (updateError) {
        throw new Error(`Lỗi cập nhật phiếu: ${updateError.message}`);
      }

      // 4. Create auto-comment
      let commentText = "Khách hàng đã nhận sản phẩm. Phiếu hoàn thành.";
      if (delivery_notes) {
        commentText += `\nGhi chú bàn giao: ${delivery_notes}`;
      }

      await createAutoComment({
        ticketId: ticket_id,
        profileId,
        comment: commentText,
        isInternal: false,
        supabaseAdmin: ctx.supabaseAdmin,
      });

      // 5. Audit log
      await logAudit(ctx.supabaseAdmin, ctx.user.id, {
        action: "status_change",
        resourceType: "ticket",
        resourceId: ticket_id,
        oldValues: { status: "ready_for_pickup" },
        newValues: { status: "completed" },
        metadata: { operation: "confirm_delivery", delivery_notes },
      });

      // 6. Send delivery confirmation email (Story 1.15)
      const { data: fullTicket } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select(`
          ticket_number,
          serial_number,
          delivery_confirmed_at,
          customer:customers(email, name),
          product:products(name)
        `)
        .eq("id", ticket_id)
        .single();

      if (fullTicket?.customer && fullTicket?.product) {
        const customer = Array.isArray(fullTicket.customer)
          ? fullTicket.customer[0]
          : fullTicket.customer;
        const product = Array.isArray(fullTicket.product)
          ? fullTicket.product[0]
          : fullTicket.product;

        sendEmailNotification(
          ctx,
          "delivery_confirmed",
          customer.email,
          customer.name,
          {
            ticketNumber: fullTicket.ticket_number,
            productName: product.name,
            serialNumber: fullTicket.serial_number,
            deliveryDate:
              fullTicket.delivery_confirmed_at || new Date().toISOString(),
          },
          undefined,
          ticket_id,
        ).catch((err) => {
          console.error("[EMAIL ERROR] delivery_confirmed failed:", err);
        });
      }

      return {
        success: true,
        ticket: updatedTicket,
      };
    }),
});

export type TicketsRouter = typeof ticketsRouter;
