import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { PartsTable, type partSchema } from "@/components/parts-table";
import { createClient } from "@/utils/supabase/server";

async function getPartsData(): Promise<z.infer<typeof partSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("parts")
    .select(`
      *,
      product_parts(
        products(
          id,
          name,
          type,
          brand
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching parts data:", error);
    return [];
  }

  return data || [];
}

export default async function Page() {
  const partsData = await getPartsData();

  return (
    <>
      <PageHeader title="Parts" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <PartsTable data={partsData} />
          </div>
        </div>
      </div>
    </>
  );
}
