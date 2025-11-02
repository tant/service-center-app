import { z } from "zod";

export const linkedTicketSchema = z
  .object({
    id: z.string(),
    ticket_number: z.string(),
    status: z.string(),
  })
  .nullable();

export const primaryItemSchema = z
  .object({
    product_brand: z.string().nullable(),
    product_model: z.string().nullable(),
    serial_number: z.string().nullable(),
  })
  .nullable();

export const serviceRequestRowSchema = z.object({
  id: z.string(),
  tracking_token: z.string(),
  customer_name: z.string(),
  customer_email: z.string().nullable(),
  customer_phone: z.string().nullable(),
  issue_description: z.string().nullable(),
  status: z.enum([
    "submitted",
    "received",
    "processing",
    "rejected",
    "converted",
  ]),
  created_at: z.string(),
  preferred_delivery_method: z.enum(["pickup", "delivery"]),
  delivery_address: z.string().nullable(),
  pickup_notes: z.string().nullable(),
  preferred_schedule: z.string().nullable(),
  items_count: z.number(),
  item_serial_numbers: z.array(z.string()),
  primary_item: primaryItemSchema,
  linked_ticket: linkedTicketSchema,
});

export type ServiceRequestRow = z.infer<typeof serviceRequestRowSchema>;
