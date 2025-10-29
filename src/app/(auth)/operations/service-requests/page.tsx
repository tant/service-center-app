/**
 * Story 1.13: Service Requests Page
 * AC 2: Staff request queue with filters and search
 * Updated 2025-10-29: Add create request button for staff
 */

import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { ServiceRequestsTable, type serviceRequestSchema } from "@/components/tables/service-requests-table";
import { createClient } from "@/utils/supabase/server";

async function getServiceRequestsData(): Promise<z.infer<typeof serviceRequestSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching service requests data:", error);
    return [];
  }

  return data || [];
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
