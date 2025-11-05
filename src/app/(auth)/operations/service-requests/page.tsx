/**
 * Story 1.13: Service Requests Page
 * AC 2: Staff request queue with filters and search
 * Updated 2025-10-29: Add create request button for staff
 */

import { PageHeader } from "@/components/page-header";
import { ServiceRequestsTable } from "@/components/tables/service-requests-table";
import {
  serviceRequestRowSchema,
  type ServiceRequestTableRow,
} from "@/lib/schemas/service-request";
import type { Database } from "@/types/database.types";
import { createClient } from "@/utils/supabase/server";

type RawServiceRequest =
  Database["public"]["Tables"]["service_requests"]["Row"] & {
    items?:
      | Array<
          Pick<
            Database["public"]["Tables"]["service_request_items"]["Row"],
            "serial_number" | "linked_ticket_id"
          >
        >
      | null;
  };

async function getServiceRequestsData(): Promise<
  ServiceRequestTableRow[]
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
          serial_number,
          linked_ticket_id
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching service requests data:", error);
    return [];
  }

  const rawRequests = (data as RawServiceRequest[] | null | undefined) ?? [];

  const primarySerialByRequest = new Map<string, string>();
  const serialsNeeded = new Set<string>();

  const baseRows = rawRequests.map((request) => {
    const items = Array.isArray(request.items) ? request.items : [];
    const serials = items
      .map((item) => item?.serial_number?.trim())
      .filter((serial): serial is string => Boolean(serial));
    const primarySerial = serials[0] ?? null;
    const linkedTicketId =
      items.find((item) => item?.linked_ticket_id)?.linked_ticket_id ?? null;

    if (primarySerial) {
      primarySerialByRequest.set(request.id, primarySerial);
      serialsNeeded.add(primarySerial);
    }

    return {
      id: request.id,
      tracking_token: request.tracking_token,
      customer_name: request.customer_name,
      customer_email: request.customer_email ?? null,
      customer_phone: request.customer_phone ?? "",
      issue_description: request.issue_description ?? "",
      status: request.status,
      created_at: request.created_at,
      preferred_delivery_method: request.preferred_delivery_method,
      delivery_address: request.delivery_address ?? null,
      pickup_notes: request.pickup_notes ?? null,
      preferred_schedule: request.preferred_schedule ?? null,
      linked_ticket_id: linkedTicketId,
    };
  });

  const parsedRows = serviceRequestRowSchema.array().parse(baseRows);

  let productLookup = new Map<
    string,
    {
      brand: string | null;
      model: string | null;
    }
  >();

  if (serialsNeeded.size > 0) {
    const { data: productData, error: productError } = await supabase
      .from("physical_products")
      .select(
        `
          serial_number,
          product:products(
            model,
            brand:brands(name)
          )
        `,
      )
      .in("serial_number", Array.from(serialsNeeded));

    if (productError) {
      console.error(
        "Error fetching product info for service requests:",
        productError,
      );
    } else {
      const entries = (productData ?? []) as Array<Record<string, unknown>>;
      for (const entry of entries) {
        const serial = typeof entry.serial_number === "string" ? entry.serial_number : null;
        if (!serial) continue;

        const productField = entry["product"];
        const productRaw = Array.isArray(productField)
          ? (productField[0] as Record<string, unknown> | undefined)
          : (productField as Record<string, unknown> | undefined);
        const brandField = productRaw?.["brand"];
        const brandObj = Array.isArray(brandField)
          ? (brandField[0] as Record<string, unknown> | undefined)
          : (brandField as Record<string, unknown> | undefined);

        const brandNameValue =
          typeof brandObj?.["name"] === "string" ? brandObj["name"] : null;
        const modelNameValue =
          typeof productRaw?.["model"] === "string" ? productRaw["model"] : null;

        productLookup.set(serial, {
          brand: brandNameValue,
          model: modelNameValue,
        });
      }
    }
  }

  return parsedRows.map<ServiceRequestTableRow>((row) => {
    const primarySerial = primarySerialByRequest.get(row.id) ?? null;
    const productInfo =
      primarySerial != null ? productLookup.get(primarySerial) ?? null : null;

    return {
      ...row,
      primary_serial: primarySerial,
      primary_product: productInfo,
    };
  });
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
