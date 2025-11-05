import { z } from "zod";

export const serviceRequestRowSchema = z.object({
  id: z.string(),
  tracking_token: z.string(),
  customer_name: z.string(),
  customer_email: z.string().nullable(),
  customer_phone: z.string(),
  issue_description: z.string().nullable(),
  status: z.enum([
    "draft",
    "submitted",
    "pickingup",
    "received",
    "processing",
    "completed",
    "cancelled",
  ]),
  created_at: z.string(),
  preferred_delivery_method: z.enum(["pickup", "delivery"]),
  delivery_address: z.string().nullable(),
  pickup_notes: z.string().nullable(),
  preferred_schedule: z.string().nullable(),
  linked_ticket_id: z.string().nullable(),
});

export type ServiceRequestRow = z.infer<typeof serviceRequestRowSchema>;

export type ServiceRequestTableRow = ServiceRequestRow & {
  primary_serial: string | null;
  primary_product: {
    brand: string | null;
    model: string | null;
  } | null;
};
