/**
 * Story 1.13: Service Requests Page
 * AC 2: Staff request queue with filters and search
 * Updated 2025-10-29: Add create request button for staff
 */

import { PageHeader } from "@/components/page-header";
import { ServiceRequestsTable } from "@/components/tables/service-requests-table";
import { createClient } from "@/utils/supabase/server";

async function getServiceRequestsData() {
  const supabase = await createClient();

  // Query service requests with items and product info
  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      items:service_request_items(
        id,
        serial_number,
        issue_description,
        ticket_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching service requests data:", error);
    return [];
  }

  if (!data) return [];

  // Collect all serial numbers to lookup product info
  const allSerials = data.flatMap(req =>
    (req.items || []).map((item: any) => item.serial_number)
  ).filter(Boolean);

  // Lookup product info for all serials in one query
  let productMap: Record<string, { product_name: string; brand_name: string | null }> = {};

  if (allSerials.length > 0) {
    const { data: physicalProducts } = await supabase
      .from("physical_products")
      .select(`
        serial_number,
        product:products(
          name,
          brand:brands(name)
        )
      `)
      .in("serial_number", allSerials);

    if (physicalProducts) {
      for (const pp of physicalProducts) {
        const product = pp.product as any;
        productMap[pp.serial_number] = {
          product_name: product?.name || "Không xác định",
          brand_name: product?.brand?.name || null,
        };
      }
    }
  }

  // Enrich items with product info
  return data.map(req => ({
    ...req,
    items: (req.items || []).map((item: any) => ({
      ...item,
      product_name: productMap[item.serial_number]?.product_name || null,
      brand_name: productMap[item.serial_number]?.brand_name || null,
    })),
  }));
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
