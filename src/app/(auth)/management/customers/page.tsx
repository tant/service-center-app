import type { z } from "zod";
import {
  CustomerTable,
  type customerSchema,
} from "@/components/customer-table";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";

async function getCustomersData(): Promise<z.infer<typeof customerSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers data:", error);
    return [];
  }

  return data || [];
}

export default async function Page() {
  const customersData = await getCustomersData();

  return (
    <>
      <PageHeader title="Khách hàng" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <CustomerTable data={customersData} />
          </div>
        </div>
      </div>
    </>
  );
}
