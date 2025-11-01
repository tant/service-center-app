/**
 * Story 1.13: Service Requests Page
 * AC 2: Staff request queue with filters and search
 * Updated 2025-10-29: Add create request button for staff
 */

import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { ServiceRequestsTable } from "@/components/tables/service-requests-table";
import { serviceRequestRowSchema } from "@/lib/schemas/service-request";
import type { Database } from "@/types/database.types";
import { createClient } from "@/utils/supabase/server";

type RawServiceRequest =
  Database["public"]["Tables"]["service_requests"]["Row"] & {
    items?: Array<
      Pick<
        Database["public"]["Tables"]["service_request_items"]["Row"],
        "product_brand" | "product_model" | "serial_number"
      >
    > | null;
    linked_ticket?:
      | Pick<
          Database["public"]["Tables"]["service_tickets"]["Row"],
          "id" | "ticket_number" | "status"
        >
      | Array<
          Pick<
            Database["public"]["Tables"]["service_tickets"]["Row"],
            "id" | "ticket_number" | "status"
          >
        >
      | null;
  };

async function getServiceRequestsData(): Promise<
  z.infer<typeof serviceRequestRowSchema>[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        tracking_token,
        customer_name,
        customer_email,
        customer_phone,
        issue_description,
        status,
        created_at,
        preferred_delivery_method,
        delivery_address,
        pickup_notes,
        preferred_schedule,
        items:service_request_items(
          product_brand,
          product_model,
          serial_number
        ),
        linked_ticket:service_tickets!service_tickets_request_id_fkey (
          id,
          ticket_number,
          status
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching service requests data:", error);
    return [];
  }

  const normalized =
    (data as RawServiceRequest[] | null | undefined)?.map((request) => {
      const items = Array.isArray(request.items) ? request.items : [];
      const primaryItem = items.length > 0 ? items[0] : null;
      const linkedTicketRaw = request.linked_ticket;
      const linkedTicket = Array.isArray(linkedTicketRaw)
        ? (linkedTicketRaw[0] ?? null)
        : (linkedTicketRaw ?? null);

      return {
        id: request.id,
        tracking_token: request.tracking_token,
        customer_name: request.customer_name,
        customer_email: request.customer_email ?? null,
        customer_phone: request.customer_phone ?? null,
        issue_description: request.issue_description ?? null,
        status: request.status,
        created_at: request.created_at,
        preferred_delivery_method: request.preferred_delivery_method,
        delivery_address: request.delivery_address ?? null,
        pickup_notes: request.pickup_notes ?? null,
        preferred_schedule: request.preferred_schedule ?? null,
        items_count: items.length,
        primary_item: primaryItem
          ? {
              product_brand: primaryItem.product_brand ?? null,
              product_model: primaryItem.product_model ?? null,
              serial_number: primaryItem.serial_number ?? null,
            }
          : null,
        linked_ticket: linkedTicket
          ? {
              id: linkedTicket.id,
              ticket_number: linkedTicket.ticket_number,
              status: linkedTicket.status,
            }
          : null,
      };
    }) ?? [];

  return serviceRequestRowSchema.array().parse(normalized);
}

export default async function Page() {
  const serviceRequestsData = await getServiceRequestsData();

  return (
    <>
      <PageHeader title="Yêu cầu dịch vụ" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ServiceRequestsTable data={serviceRequestsData} />
          </div>
        </div>
      </div>
    </>
  );
}
