import type { z } from "zod";
import { BrandsTable, type brandSchema } from "@/components/brands-table";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";

async function getBrandsData(): Promise<z.infer<typeof brandSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching brands data:", error);
    return [];
  }

  return data || [];
}

export default async function Page() {
  const brandsData = await getBrandsData();

  return (
    <>
      <PageHeader title="Thương hiệu" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <BrandsTable data={brandsData} />
          </div>
        </div>
      </div>
    </>
  );
}
